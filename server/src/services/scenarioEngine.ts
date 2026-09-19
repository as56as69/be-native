import type {
  DialogueLine,
  Scenario,
  ScenarioPayload,
  ScenarioPayloadResult,
  ScenarioRenderMode,
  Spot,
} from "@be-native/shared";

import { getDb } from "../db.js";
import { callLLMWithFallback, type LlmCallOptions } from "./providerService.js";

// ------------------------------------------------------------------ types

export interface ScenarioEngineOptions extends LlmCallOptions {
  /** User context injected into the prompt (tier, credits, progress). */
  userContext?: Record<string, string | number | boolean>;
}

const SYSTEM_PROMPT = `You are the "Be Native" Scenario Director.
You write a single interactive situation for a non-native Arabic speaker
practicing Iraqi Arabic as a tourist in Baghdad.

Rules:
- Reply with a STRICT JSON object, no markdown, no commentary.
- "dialogue" is 2-3 short spoken lines: a Native-American local voice
  (speaker "Local") and optionally a second NPC (speaker e.g. "Baba Amin").
  Every line must use simple Iraqi Arabic + transliterated English slang.
- "cultural_bridge" = one crisp translation of the feel: Iraqi slang ↔ US slang.
- "render_mode" is ONLY one of: "TIKTOK_REELS" | "COMIC_MEME" | "CARD_MODE".
- "hints" = 2-3 tiny retrieval cards: {id:"h1", title, text} — they nudge the
  learner without giving away the answer. Titles short, English ok.

Output schema:
{"dialogue":[{"speaker":"Local","line":"..."}],"cultural_bridge":"...","render_mode":"...","hints":[{"id":"h1","title":"...","text":"..."}]}`;

// ------------------------------------------------------------ constructors

/** Pick the payload shape straight from the scenario row if it's pre-baked. */
export function scenarioToPayload(scenario: Scenario): ScenarioPayload | null {
  const rules = scenario.graph_rules as {
    prebaked?: ScenarioPayload;
  } | null;
  if (rules?.prebaked && Array.isArray(rules.prebaked.dialogue)) {
    return rules.prebaked;
  }
  return null;
}

/** Build the user-facing prompt from a known (spot, scenario) pair. */
export function buildScenarioPrompt(spot: Spot, scenario: Scenario): string {
  const rules = scenario.graph_rules as { nodes?: Array<{ label_ar?: string }> } | null;
  const breakdown = (rules?.nodes ?? [])
    .map((node, idx) => `${idx + 1}. ${node.label_ar ?? "خطوة"}`)
    .join("\n");

  return [
    `SITUATION — ${scenario.title}`,
    `LOCATION: ${spot.title_ar} / ${spot.title_en} (${spot.category})`,
    `VIBE: ${spot.vibe_description ?? "-"}`,
    `KEY STEPS:` + (breakdown ? `\n${breakdown}` : " (free-form)"),
    ``,
    `Write the dialogue + cultural bridge + hints for exactly this spot.`,
    `Keep each line SHORT, playful, street-Iraqi with transliterated slang.`,
  ].join("\n");
}

// ------------------------------------------------------------- synthesis

/** Deterministic fallback when no provider is reachable. */
export function synthesizeScenarioPayload(spot: Spot, scenario: Scenario): ScenarioPayload {
  const rules = scenario.graph_rules as { nodes?: Array<{ label_ar?: string }> } | null;
  const steps: DialogueLine[] = [
    {
      speaker: "Local",
      line: `يا أهلاً بيك في ${spot.title_ar}! شنو أگدر گِلك اليوم؟`,
    },
  ];

  for (const node of rules?.nodes ?? []) {
    steps.push({
      speaker: node.label_ar ? node.label_ar : "Local",
      line: "چونّي… شويّة شويّة، كل خطوة تحچي الوَقت.",
    });
  }

  return {
    dialogue: steps.slice(0, 3),
    cultural_bridge: `"Say hi like a local" → "طگّة تحية كحلّة: سلام عليكم، شلونك عيني!"`,
    render_mode: "CARD_MODE" as ScenarioRenderMode,
    hints: [
      {
        id: "h1",
        title: "التسلسل",
        text: "الزم الترتيب: التحية ⇒ الطلب ⇒ الشكر.",
      },
      {
        id: "h2",
        title: "الجملة الواحدة",
        text: "إذا تعثّرت، قُل: شگد هاي؟ ولا تضيع بالشرح.",
      },
    ],
  };
}

/** Lenient parser + shape guard for LLM output. */
export function parseScenarioPayload(raw: string): ScenarioPayload | null {
  try {
    const block = raw
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(block) as ScenarioPayload;

    if (!Array.isArray(parsed.dialogue) || parsed.dialogue.length === 0) return null;
    if (typeof parsed.cultural_bridge !== "string") return null;
    if (!["TIKTOK_REELS", "COMIC_MEME", "CARD_MODE"].includes(parsed.render_mode)) return null;
    if (!Array.isArray(parsed.hints) || parsed.hints.length < 1 || parsed.hints.length > 3) {
      return null;
    }

    return {
      dialogue: parsed.dialogue
        .slice(0, 3)
        .map((d) => ({ speaker: d.speaker ?? "Local", line: String(d.line ?? "") }))
        .filter((d) => d.line.length > 0),
      cultural_bridge: parsed.cultural_bridge,
      render_mode: parsed.render_mode,
      hints: parsed.hints.slice(0, 3).map((h, i) => ({
        id: String(h.id ?? `h${i + 1}`),
        title: String(h.title ?? ""),
        text: String(h.text ?? ""),
      })),
    };
  } catch {
    return null;
  }
}

// --------------------------------------------------------------- engine

export interface ScenarioEngineResult {
  payload: ScenarioPayload;
  source: "llm" | "synthesis";
}

/**
 * Generate a structured ScenarioPayload from an explicit (spot, scenario)
 * pair. Used by the admin sandbox so unsaved edits can be tested live, and
 * by the public flow internally.
 */
export async function generateScenarioPayloadFor(
  spot: Spot,
  scenario: Scenario,
  options: ScenarioEngineOptions = {}
): Promise<ScenarioPayloadResult> {
  const prebaked = scenarioToPayload(scenario);
  if (prebaked) {
    return { payload: prebaked, source: "synthesis" };
  }

  const prompt = buildScenarioPrompt(spot, scenario);
  try {
    const result = await callLLMWithFallback(prompt, SYSTEM_PROMPT, options);
    const payload = parseScenarioPayload(result.content);
    if (payload) {
      return { payload, source: "llm" };
    }
  } catch {
    // fall through to synthesis so a provider outage never breaks playtesting
  }

  return { payload: synthesizeScenarioPayload(spot, scenario), source: "synthesis" };
}

/**
 * Generate a structured ScenarioPayload for a given spot:
 *   1. Try the live switchboard (primary LLM + fallback, with secrets).
 *   2. If every attempt fails → deterministic synthesis so the client is
 *      never empty-handed.
 * Returns `{ payload, source }` so the transit route can report provenance.
 */
export async function generateScenarioPayload(
  spotId: string,
  options: ScenarioEngineOptions = {}
): Promise<ScenarioPayloadResult> {
  const db = getDb();

  const { data: spot } = await db.from("spots").select("*").eq("id", spotId).single();
  if (!spot) {
    throw new Error(`SCENARIO_SPOT_NOT_FOUND:${spotId}`);
  }
  const spotRow = spot as unknown as Spot;

  const { data: scenario } = await db
    .from("scenarios")
    .select("*")
    .eq("spot_id", spotId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!scenario) {
    throw new Error(`SCENARIO_NOT_SEEDED:${spotId}`);
  }
  const scenarioRow = scenario as unknown as Scenario;

  return generateScenarioPayloadFor(spotRow, scenarioRow, options);
}