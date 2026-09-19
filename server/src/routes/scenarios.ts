import { Router } from "express";

import type {
  ScenarioEvaluateInput,
  ScenarioEvaluateResult,
  ScenarioGraph,
  ScenarioNode,
  ScenarioOption,
} from "@be-native/shared";
import { scenarioGraphDraftForSpot } from "@be-native/shared";

import { getDb } from "../db.js";
import { callLLMWithFallback } from "../services/providerService.js";

/** Strict 3s budget per provider attempt (spec: LLM fail/timeout ⇒ DB fallback). */
const EVALUATE_TIMEOUT_MS = 3_000;
const EVALUATE_MAX_ATTEMPTS = 2;

// -------------------------------------------------------------- helpers

/** Baghdadi-light normalizer: strips diacritics/hamza/تاء مربوطة + lowercases. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[\u0621\u0622\u0623\u0625\u0671]/g, "\u0627")
    .replace(/\u0629/g, "\u0647")
    .replace(/[^a-z0-9\u0600-\u06ff]/g, " ")
    .trim();
}

const EVALUATE_SYSTEM_PROMPT = `You are the "Be Native" Slang Tightness Cop.
A learner typed an English line to an NPC in a Baghdad scene. Grade its
American-slang REGISTER for the situation, then give the tightest, most natural
US street-English version of it plus one short Iraqi-Arabic equivalent.

Rules:
- Reply with a STRICT JSON object only — no markdown, no prose.
- Output schema: {"text_en_slang":"...","text_ar_equivalent":"..."}
- "text_en_slang" = short, native American slang phrase.
- "text_ar_equivalent" = the one-line Iraqi/Baghdadi equivalent.`;

/** Lenient JSON parse for the mapper response. */
function parseMapped(raw: string): { text_en_slang: string; text_ar_equivalent: string } | null {
  try {
    const block = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(block) as { text_en_slang?: unknown; text_ar_equivalent?: unknown };
    if (typeof parsed.text_en_slang !== "string" || typeof parsed.text_ar_equivalent !== "string") {
      return null;
    }
    return {
      text_en_slang: parsed.text_en_slang.slice(0, 240),
      text_ar_equivalent: parsed.text_ar_equivalent.slice(0, 140),
    };
  } catch {
    return null;
  }
}

function buildPrompt(input: ScenarioEvaluateInput, graph: ScenarioGraph, node: ScenarioNode): string {
  const character = graph.characters.find((c) => c.id === node.character);
  return [
    `SCENE — ${graph.title} (${graph.location})`,
    `CHARACTER: ${character?.name_ar ?? node.character}`,
    `NPC LINE (american slang): ${node.text_en_slang}`,
    `CANDIDATE USER REPLIES (american slang):`,
    ...node.options.map((o) => `- ${o.text_en_slang}`),
    ``,
    `Learner's own words: "${input.text}"`,
    `Tighten the register + give the Arabic equivalent, strictly as JSON.`,
  ].join("\n");
}

/** Token-overlap score: fraction of `target` words present in the option. */
function wordOverlap(target: string, candidate: string): number {
  const tw = new Set(target.split(/\s+/).filter(Boolean));
  const cw = new Set(candidate.split(/\s+/).filter(Boolean));
  if (tw.size === 0) return 0;
  let hit = 0;
  for (const w of tw) if (cw.has(w)) hit += 1;
  const a = hit / tw.size;
  if (cw.size === 0) return a;
  let hitB = 0;
  for (const w of cw) if (tw.has(w)) hitB += 1;
  const b = hitB / cw.size;
  return Math.max(a, b);
}

/** Score a candidate option against a normalized learner phrase. */
function matchOption(
  phrase: string,
  options: ScenarioOption[]
): { option: ScenarioOption; score: number } | null {
  const target = normalize(phrase);
  if (!target) return null;

  let best: { option: ScenarioOption; score: number } | null = null;
  for (const option of options) {
    const en = normalize(option.text_en_slang);
    const ar = normalize(option.text_ar_equivalent);
    let score = 0;
    if (target === en || target === ar) score = 3;
    else if (en.length > 0 && (en.includes(target) || target.includes(en))) score = 2;
    else {
      const enOverlap = wordOverlap(target, en);
      const arOverlap = wordOverlap(target, ar);
      const overlap = Math.max(enOverlap, arOverlap);
      if (overlap >= 0.6) score = enOverlap > arOverlap ? 2 : 1;
    }
    if (score > 0 && (!best || score > best.score)) best = { option, score };
  }
  return best;
}

const NEUTRAL_MAP: { text_en_slang: string; text_ar_equivalent: string } = {
  text_en_slang: "Say it slangy — even a street poet'll get you.",
  text_ar_equivalent: "خلّها أمريكية عامية!",
};

function resultFor(
  phrase: string,
  node: ScenarioNode,
  mapped: { text_en_slang: string; text_ar_equivalent: string } | null,
  source: "llm" | "graph"
): ScenarioEvaluateResult {
  // LLM-tightened phrase is canonical slang — prefer it, then raw learner text.
  const hit =
    matchOption(mapped?.text_en_slang ?? "", node.options) ?? matchOption(phrase, node.options);
  // Pre-computed DB options win (spec fallback): their strings ARE the mapping.
  if (hit) {
    return {
      node_id: node.id,
      text_en_slang: hit.option.text_en_slang,
      text_ar_equivalent: hit.option.text_ar_equivalent,
      is_correct: hit.option.is_correct,
      xp_reward: hit.option.xp_reward,
      next_node_id: hit.option.next_node_id ?? null,
      matched: true,
      source,
    };
  }
  return {
    node_id: node.id,
    text_en_slang: mapped?.text_en_slang ?? NEUTRAL_MAP.text_en_slang,
    text_ar_equivalent: mapped?.text_ar_equivalent ?? NEUTRAL_MAP.text_ar_equivalent,
    is_correct: false,
    xp_reward: 0,
    next_node_id: null,
    matched: false,
    source,
  };
}

// --------------------------------------------------------------- router

export function createScenariosRouter(): Router {
  const router = Router();
  const db = getDb();

  // Active graph for a spot (used by the viewer right after transit unlock).
  router.get("/spot/:spotId", async (req, res, next) => {
    try {
      const { data, error } = await db
        .from("scenario_graphs")
        .select("*")
        .eq("spot_id", req.params.spotId)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw new Error(`scenario graph query failed: ${error.message}`);

      if (!data) {
        // No authored graph yet — never let the viewer hang on a blank screen.
        // Plant a fallback graph so the spot always has playable content the
        // moment someone taps it on the map (editable later in the Studio).
        const starter = scenarioGraphDraftForSpot(req.params.spotId);
        const { data: created, error: insertErr } = await db
          .from("scenario_graphs")
          .insert({
            id: starter.id,
            spot_id: starter.spot_id,
            title: starter.title,
            location: starter.location,
            characters: starter.characters,
            nodes: starter.nodes,
            is_active: true,
          } as never)
          .select("*")
          .single();

        if (!insertErr && created) {
          res.json(created);
          return;
        }
        res.status(200).json(starter as unknown as ScenarioGraph);
        return;
      }
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  // Fetch by graph id, strict spec contract.
  router.get("/:id", async (req, res, next) => {
    try {
      const { data, error } = await db
        .from("scenario_graphs")
        .select("*")
        .eq("id", req.params.id)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw new Error(`scenario graph query failed: ${error.message}`);
      if (!data) {
        res.status(404).json({ error: "SCENARIO_GRAPH_NOT_FOUND" });
        return;
      }
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  // Evaluate a free-text learner response: LLM (3s budget) → DB graph fallback.
  router.post("/evaluate", async (req, res, next) => {
    try {
      const input = (req.body ?? {}) as Partial<ScenarioEvaluateInput>;
      const text = typeof input.text === "string" ? input.text.trim() : "";
      if (!input.scenario_id || !input.node_id || !text) {
        res.status(422).json({ error: "scenario_id, node_id and a non-empty text are required" });
        return;
      }

      const { data, error } = await db
        .from("scenario_graphs")
        .select("*")
        .eq("id", input.scenario_id)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw new Error(`scenario graph query failed: ${error.message}`);
      if (!data) {
        res.status(404).json({ error: "SCENARIO_GRAPH_NOT_FOUND" });
        return;
      }
      const graph = data as unknown as ScenarioGraph;
      const node = graph.nodes.find((n) => n.id === input.node_id);
      if (!node) {
        res.status(404).json({ error: "SCENARIO_NODE_NOT_FOUND" });
        return;
      }

      // 1) try the connected LLM under a strict 3s budget…
      try {
        const result = await callLLMWithFallback(
          buildPrompt({ scenario_id: input.scenario_id, node_id: input.node_id, text }, graph, node),
          EVALUATE_SYSTEM_PROMPT,
          { timeoutMs: EVALUATE_TIMEOUT_MS, maxAttempts: EVALUATE_MAX_ATTEMPTS }
        );
        const mapped = parseMapped(result.content);
        if (mapped) {
          res.json(resultFor(text, node, mapped, "llm"));
          return;
        }
      } catch {
        // timeout or provider outage → fall through to the pre-computed graph
      }

      // 2) …otherwise evaluate against the node's pre-computed options.
      res.json(resultFor(text, node, null, "graph"));
    } catch (err) {
      next(err);
    }
  });

  // Charge a fixed energy cost for answering correctly (spend_credits RPC).
  router.post("/energy/consume", async (req, res, next) => {
    try {
      const b = (req.body ?? {}) as { user_id?: string; amount?: number };
      const amount = Math.round(Number(b.amount));
      if (!b.user_id || !Number.isFinite(amount) || amount <= 0) {
        res.status(422).json({ error: "user_id and a positive amount are required" });
        return;
      }
      const { data, error } = await db.rpc("spend_credits", {
        p_user_id: String(b.user_id),
        p_amount: amount,
      });
      if (error) throw new Error(`spend_credits failed: ${error.message}`);
      if (data === null) {
        res.status(402).json({ error: "INSUFFICIENT_CREDITS", cost: amount });
        return;
      }
      res.json({ user_id: String(b.user_id), amount, balance: Number(data) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}