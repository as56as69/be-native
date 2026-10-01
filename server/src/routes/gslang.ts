import { Router } from "express";

import { callLLMWithFallback } from "../services/providerService.js";

/** جي سلانك — يحول الكلام الرسمي الإنجليزي (مال المدارس) إلى سلانك أمريكي
 *  بقواعد جويسم الأمريكي: فونيتك عربي، عبارات شارع قصيرة، بلا شرح.
 *  نفس مزود الخدمة (switchboard + callLLMWithFallback). */
const GSLANG_TIMEOUT_MS = 60_000;
const GSLANG_MAX_ATTEMPTS = 3;

const GSLANG_SYSTEM_PROMPT = `You are "Jweysim the American" — a Baghdad-born street dude pretending to be 100% American.
Convert formal school English into AMERICAN STREET SLANG, written exactly how Jweysim speaks:

Rules (Jweysim canon — MUST follow all):
1. Output the slang phrase in ARABIC SCRIPT transliteration (فونيتك عربي) — no Latin letters at all.
2. Use short fixed street-slang phrases: برو (bro), هوميي (homey), نو كاپ (no cap = no lie), فور ريل (for real), واز لايك (was like), شو أب (show up), گيم مي (give me), هيت (hit), ڤايب (vibe), بريود (period).
3. Keep it SHORT — one concise street line, no explanation, no full-sentence translation.
4. NO literal word-for-word translation — capture the VIBE, not the dictionary.
5. Never explain the meaning inside the output — just the slang itself.
6. No Arabic words, no formal English.

Reply with a STRICT JSON object only — no markdown, no prose:
{"slang":"...", "sticker":"..."}
- "slang" = the converted phrase in Arabic-script phonetics (فونيتك عربي)
- "sticker" = a short ENGLISH slang sticker (2-5 words) — the vibe in English`;

function parseSlang(raw: string): { slang: string; sticker: string } | null {
  try {
    const block = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(block) as { slang?: unknown; sticker?: unknown };
    if (typeof parsed.slang !== "string" || typeof parsed.sticker !== "string") return null;
    return {
      slang: parsed.slang.slice(0, 300),
      sticker: parsed.sticker.slice(0, 80),
    };
  } catch {
    return null;
  }
}

function fallbackSlang(input: string): { slang: string; sticker: string } {
  const sample = input.trim().slice(0, 80) || "Say it";
  return {
    slang: `سلانك، برو: «${sample}»... نو كاپ`,
    sticker: "No cap",
  };
}

export function createGSlangRouter(): Router {
  const router = Router();

  router.post("/", async (req, res, next) => {
    try {
      const b = (req.body ?? {}) as { text?: string };
      const text = (b.text ?? "").trim();
      if (!text) {
        res.status(422).json({ error: "text is required" });
        return;
      }
      if (text.length > 2000) {
        res.status(422).json({ error: "text too long (max 2000)" });
        return;
      }

      try {
        const result = await callLLMWithFallback(
          `Convert this formal English into Jweysim-style slang:\n"${text}"`,
          GSLANG_SYSTEM_PROMPT,
          { timeoutMs: GSLANG_TIMEOUT_MS, maxAttempts: GSLANG_MAX_ATTEMPTS }
        );
        const parsed = parseSlang(result.content);
        if (parsed) {
          res.json({ ...parsed, source: "llm", provider: result.provider.name });
          return;
        }
      } catch {
        // fall through to local fallback (server offline / all providers down)
      }

      res.json({ ...fallbackSlang(text), source: "local", provider: "local-fallback" });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
