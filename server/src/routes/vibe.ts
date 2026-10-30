import { Router } from "express";

import { callLLMWithFallback } from "../services/providerService.js";

/** الفايب فولت — يحلل العبارة البغدادية ويفهم معناها الحقيقي حسب القالب،
 *  يولّد بطاقة المعنى الحسي (نفس مزوّد جي سلانك abacus). */
const VIBE_TIMEOUT_MS = 60_000;
const VIBE_MAX_ATTEMPTS = 3;

const VIBE_SYSTEM_PROMPT = `You are a Baghdad-to-Gen-Z cultural translator (الفايب فولت).
You UNDERSTAND the real meaning of an Iraqi/Baghdadi phrase and express its vibe in American Gen-Z slang.

The user gives a Baghdadi phrase (عبارة/مثل بغدادي) and a TEMPLATE (القالب) that only sets the TONE/context (e.g. عمل وتفوق، تحشيش وسخرية، زعل وعتاب، هيبة وثقل).

RULES:
1. UNDERSTAND the ACTUAL meaning of the Baghdadi phrase — do NOT just copy generic template filler.
2. Generate each field from the real meaning of the phrase, fitted to the template's tone.
3. Return STRICT JSON only — no markdown, no prose:
{"literalMeaning":"...", "culturalVibe":"...", "genZSlang":"...", "usageExample":"...", "auraImpact":"...", "contextTag":"...", "category":"...", "socialDynamics":"...", "toneIntensity":"...", "vibeIntent":"..."}
- literalMeaning = الترجمة الحرفية للعبارة البغدادية (بالعربي الفصيح)
- culturalVibe = الشرح الحسي بالبغدادي: متى وكيف تُقال والعاطفة
- genZSlang = السلانغ الأمريكي الجيل الجديد المقابل بالمعنى الفعلي
- usageExample = مثال استخدام إنجليزي بالسلانغ (بأسلوب أمريكي)
- auraImpact = التأثير على الهالة (مثل "+300 Aura")
- contextTag = اسم القالب بتنويع
- category = تصنيف: MASTERY | BANTER | DRAMA | AURA | RESPECT | CONFLICT
- socialDynamics / toneIntensity / vibeIntent = بالعربي محدد حسب المعنى الفعلي
- category must be one of MASTERY | BANTER | DRAMA | AURA | RESPECT | CONFLICT`;

export function createVibeRouter(): Router {
  const router = Router();

  router.post("/", async (req, res, next) => {
    try {
      const b = (req.body ?? {}) as { phrase?: string; template?: string };
      const phrase = (b.phrase ?? "").trim();
      const template = (b.template ?? "").trim();
      if (!phrase) {
        res.status(422).json({ error: "phrase is required" });
        return;
      }
      if (phrase.length > 2000) {
        res.status(422).json({ error: "phrase too long (max 2000)" });
        return;
      }

      try {
        const result = await callLLMWithFallback(
          `Baghdadi phrase: "${phrase}"\nTemplate (tone only): ${template || "general"}`,
          VIBE_SYSTEM_PROMPT,
          { timeoutMs: VIBE_TIMEOUT_MS, maxAttempts: VIBE_MAX_ATTEMPTS }
        );
        const parsed = parseVibe(result.content);
        if (!parsed) {
          res.status(502).json({ error: "INVALID_LLM_RESPONSE" });
          return;
        }
        res.json({
          ...parsed,
          baghdadiPhrase: phrase,
          provider: result.provider.name,
        });
      } catch (err) {
        res.status(503).json({
          error: "PROVIDER_UNAVAILABLE",
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    } catch (err) {
      next(err);
    }
  });

  return router;
}

function parseVibe(raw: string): Record<string, string> | null {
  try {
    const block = raw.replace(/```json/gi, "").replace(/```/g, "").replace(/```/g, "").trim();
    const obj = JSON.parse(block) as Record<string, unknown>;
    const s = (k: string) =>
      typeof obj[k] === "string" ? (obj[k] as string).slice(0, 500) : "";
    const parsed = {
      literalMeaning: s("literalMeaning"),
      culturalVibe: s("culturalVibe"),
      genZSlang: s("genZSlang"),
      usageExample: s("usageExample"),
      auraImpact: s("auraImpact"),
      contextTag: s("contextTag"),
      category: s("category"),
      socialDynamics: s("socialDynamics"),
      toneIntensity: s("toneIntensity"),
      vibeIntent: s("vibeIntent"),
    };
    if (!parsed.literalMeaning || !parsed.genZSlang) return null;
    const validCats = new Set(["MASTERY", "BANTER", "DRAMA", "AURA", "RESPECT", "CONFLICT"]);
    if (!validCats.has(parsed.category.toUpperCase())) parsed.category = "BANTER";
    return parsed;
  } catch {
    return null;
  }
}
