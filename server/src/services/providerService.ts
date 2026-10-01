import { getDb } from "../db.js";

// ------------------------------------------------------------------ types

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** A decodable provider row (api_providers) as used by the switcher. */
export interface ActiveLlmProvider {
  id: string;
  name: string;
  api_key_encrypted: string | null;
  is_active: boolean;
  priority: number;
  cost_per_token: number;
  created_at: string;
}

export interface LlmCallOptions {
  /** Per-attempt timeout before considering the provider dead. */
  timeoutMs?: number;
  /** How many providers to chain through. Default 2 (primary + fallback). */
  maxAttempts?: number;
  /** Explicit provider list — skips the DB lookup (used by tests). */
  providers?: ActiveLlmProvider[];
}

export interface LlmCallResult {
  content: string;
  provider: { id: string; name: string; priority: number };
  attempts: number;
  durationMs: number;
  failures: string[];
}

const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_ATTEMPTS = 2;

// -------------------------------------------------------------- helpers

function withTimeout<T>(task: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("PROVIDER_TIMEOUT")), ms);
    task.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    );
  });
}

function envKeyFor(name: string): string | undefined {
  const map: Record<string, string> = {
    openai: "OPENAI_API_KEY",
    openrouter: "OPENROUTER_API_KEY",
    abacus: "ABACUS_API_KEY",
    anthropic: "ANTHROPIC_API_KEY",
    grok: "GROK_API_KEY",
    elevenlabs: "ELEVENLABS_API_KEY",
  };
  const varName = map[name.toLowerCase()];
  return varName ? process.env[varName] : undefined;
}

// ------------------------------------------------------- provider calls

async function callOpenAiCompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: LlmMessage[]
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4000,
      stream: false,
    }),
  });
  if (!res.ok) {
    throw new Error(`OPENAI_COMPAT_HTTP_${res.status}`);
  }
  const body = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = body?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("OPENAI_COMPAT_EMPTY_RESPONSE");
  return content;
}

async function callAnthropic(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: LlmMessage[]
): Promise<string> {
  const system = messages.find((m) => m.role === "system")?.content;
  const chat = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));

  const res = await fetch(`${baseUrl}/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: system ?? "You are a helpful assistant.",
      messages: chat,
      temperature: 0.7,
    }),
  });
  if (!res.ok) {
    throw new Error(`ANTHROPIC_HTTP_${res.status}`);
  }
  const body = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const content = (body?.content ?? [])
    .filter((c) => c.type === "text")
    .map((c) => c.text ?? "")
    .join("\n")
    .trim();
  if (!content) throw new Error("ANTHROPIC_EMPTY_RESPONSE");
  return content;
}

/**
 * MOCK provider: deterministic, network-free content.
 * Sentinels in `api_key_encrypted`:
 *   - "MOCK-FAIL"  → throws immediately (fallback smoke test).
 *   - "MOCK-SLOW"  → sleeps well past the timeout (timeout fallback test).
 *   - otherwise    → returns a canned JSON envelope.
 */
function callMock(provider: ActiveLlmProvider, messages: LlmMessage[]): Promise<string> {
  const key = provider.api_key_encrypted ?? "";
  if (key === "MOCK-FAIL") {
    return Promise.reject(new Error("MOCK_DELIBERATE_FAILURE"));
  }
  if (key === "MOCK-SLOW") {
    return new Promise<string>((resolve) => {
      setTimeout(() => resolve(mockContent(messages)), 30_000);
    });
  }
  return Promise.resolve().then(() => mockContent(messages));
}

function mockContent(messages: LlmMessage[]): string {
  const promptHint = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const scene = promptHint.slice(0, 60);

  // Scenario-mapper slot: return the strict evaluate envelope so the LLM
  // branch of POST /api/scenarios/evaluate is exercisable in dev too.
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  if (system.includes("Slang Tightness Cop")) {
    const marker = 'Learner\'s own words: "';
    const idx = promptHint.lastIndexOf(marker);
    const learner = (() => {
      if (idx < 0) return promptHint.slice(0, 80);
      const start = idx + marker.length;
      const end = promptHint.indexOf('"', start);
      return promptHint.slice(start, end >= 0 ? end : start + 80).trim();
    })();
    return JSON.stringify(
      {
        text_en_slang: learner,
        text_ar_equivalent: "يعني: على البغدادي هالمعنى!",
      },
      null,
      2
    );
  }

  return JSON.stringify(
    {
      dialogue: [
        { speaker: "MockVoice", line: `Anda lee! The trail opens — ${scene}…` },
        { speaker: "MockLocal", line: "Cornerman grins: …zhwaya zhwaya, the walk remembers you." },
      ],
      cultural_bridge: "\"Stay grounded!\" → \"لا تطير فيالة!\"",
      render_mode: "CARD_MODE",
      hints: [
        { id: "h1", title: "الإشارة المحلية", text: "راقب لغة الجسد قبل الإجابة." },
        { id: "h2", title: "الرصيد", text: "كل خطوة تبدّل نبرة الحوار." },
      ],
    },
    null,
    2
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function callGemini(
  apiKey: string,
  model: string,
  messages: LlmMessage[],
  providerName = "gemini"
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const chat = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const contents = system
    ? [{ role: "user", parts: [{ text: `${system}\n\n${chat[0]?.parts?.[0]?.text ?? ""}` }] }, ...chat.slice(1)]
    : chat;

  const doFetch = () =>
    fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

  // مداراة الكوتا (free tier: 5 req/min) — نحاول حتى 4 مرات نومةً بينها
  const QUOTA_WAIT_MS = 16_000;
  let res: Response | null = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await doFetch();
    if (r.ok || (r.status !== 429 && r.status !== 503)) {
      res = r;
      break;
    }
    const errBody = await r.text().catch(() => "");
    const wait =
      errBody.includes("quota") || r.status === 429
        ? QUOTA_WAIT_MS
        : 2_000 * (attempt + 1);
    await delay(wait);
  }
  if (!res) throw new Error("GEMINI_BUSY_503");
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    const hint = res.status === 429 || errBody.includes("quota")
      ? "GEMINI_QUOTA/429"
      : res.status === 503
        ? "GEMINI_BUSY_503"
        : `GEMINI_HTTP_${res.status}`;
    throw new Error(hint);
  }
  const body = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const content = (body?.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!content) throw new Error("GEMINI_EMPTY_RESPONSE");
  return content;
}

async function callProvider(provider: ActiveLlmProvider, messages: LlmMessage[]): Promise<string> {
  const name = provider.name.toLowerCase();
  const apiKey = provider.api_key_encrypted ?? envKeyFor(name) ?? "";

  switch (name) {
    case "mock":
      return callMock(provider, messages);
    case "openai": {
      if (!apiKey) throw new Error("PROVIDER_NO_KEY");
      return callOpenAiCompatible(
        process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
        apiKey,
        process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        messages
      );
    }
    case "grok": {
      if (!apiKey) throw new Error("PROVIDER_NO_KEY");
      return callOpenAiCompatible(
        process.env.GROK_BASE_URL ?? "https://api.x.ai/v1",
        apiKey,
        process.env.GROK_MODEL ?? "grok-beta",
        messages
      );
    }
    case "openrouter": {
      if (!apiKey) throw new Error("PROVIDER_NO_KEY");
      return callOpenAiCompatible(
        process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
        apiKey,
        process.env.OPENROUTER_MODEL ?? "z-ai/glm-5.3-flash",
        messages
      );
    }
    case "abacus": {
      if (!apiKey) throw new Error("PROVIDER_NO_KEY");
      const model = process.env.ABACUS_MODEL ?? "abacusai/smaug-flash";
      return callOpenAiCompatible(
        process.env.ABACUS_BASE_URL ?? "https://routellm.abacus.ai/v1",
        apiKey,
        model,
        messages
      );
    }
    case "anthropic": {
      if (!apiKey) throw new Error("PROVIDER_NO_KEY");
      return callAnthropic(
        process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com/v1",
        apiKey,
        process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-latest",
        messages
      );
    }
    case "gemini": {
      if (!apiKey) throw new Error("PROVIDER_NO_KEY");
      return callGemini(
        apiKey,
        process.env.GEMINI_MODEL ?? "gemini-flash-latest",
        messages,
        provider.name
      );
    }
    case "elevenlabs":
      throw new Error("PROVIDER_IS_TTS_ONLY");
    default:
      throw new Error(`UNSUPPORTED_PROVIDER:${provider.name}`);
  }
}

// ------------------------------------------------------------ public API

/** Active providers ordered by priority (lower priority number first). */
export async function fetchActiveProviders(): Promise<ActiveLlmProvider[]> {
  const db = getDb();
  const { data, error } = await db
    .from("api_providers")
    .select("*")
    .eq("is_active", true)
    .order("priority", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(`fetchActiveProviders failed: ${error.message}`);
  return (data ?? []) as unknown as ActiveLlmProvider[];
}

/**
 * Calls the first provider; on failure/timeout seamlessly falls back to the
 * next one, up to `maxAttempts` providers. Throws only when all fail.
 */
export async function callLLMWithFallback(
  prompt: string,
  systemPrompt: string,
  options: LlmCallOptions = {}
): Promise<LlmCallResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  // Explicit test/slot providers keep caller order; DB-backed lists are
  // already priority-sorted by fetchActiveProviders().
  const providers = options.providers !== undefined ? [...options.providers] : await fetchActiveProviders();

  const messages: LlmMessage[] = [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }];
  const started = Date.now();
  const failures: string[] = [];
  const candidates = providers.slice(0, Math.max(1, maxAttempts));

  for (const provider of candidates) {
    try {
      const content = await withTimeout(callProvider(provider, messages), timeoutMs);
      return {
        content,
        provider: { id: provider.id, name: provider.name, priority: provider.priority },
        attempts: failures.length + 1,
        durationMs: Date.now() - started,
        failures,
      };
    } catch (err) {
      failures.push(
        `${provider.name} (p${provider.priority}): ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  throw new Error(`All providers failed: ${failures.join(" | ")}`);
}