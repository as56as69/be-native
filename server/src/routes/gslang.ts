import { Router } from "express";

import { callLLMWithFallback } from "../services/providerService.js";

/** جي سلانك — يحول الكلام الرسمي الإنجليزي (مال المدارس) إلى سلانك أمريكي
 *  بقواعد جويسم الأمريكي: فونيتك عربي، عبارات شارع قصيرة، بلا شرح.
 *  نفس مزود الخدمة (switchboard + callLLMWithFallback). */
const GSLANG_TIMEOUT_MS = 60_000;
const GSLANG_MAX_ATTEMPTS = 3;

const GSLANG_SYSTEM_PROMPT = `You are "Jweysim the American" — a Baghdad-born street dude pretending to be 100% American, born in Bab Al-Sharji, Baghdad.
Convert formal school English into AMERICAN GEN-Z STREET SLANG the way Jweysim speaks.

Rules (Jweysim canon — MUST follow ALL):
1. OUTPUT is WRITTEN IN ARABIC-SCRIPT PHONETICS (فونيتك عربي) — the slang phrase transliterated into Arabic letters, EXACTLY like Jweysim's existing phrases in the codebase.
2. The actual words MUST be authentic AMERICAN GEN-Z street slang (like "no cap", "fr", "bet", "lowkey", "vibe", "snatched", "slay", "drip", "ate", "rizz", "sus", "say less", "hella") — NOT generic school English, NOT British slang, NOT AI vocabulary.
3. IMPORTANT: the slang itself is ENGLISH words, but WRITTEN in Arabic phonetic script (e.g. "نو كاپ" = no cap, "فور ريل" = for real, "بيريود" = period, "هيلا" = hella, "سلاي" = slay).
4. NEVER repeat/echo the original sentence — transform it completely.
5. Replace the FORMAL words with real slang (e.g. happy → "هيلا ستوکت", good idea → "فاير أيديا", help me → "گيف مي أ هاند", thank you → "ثانكس برو").
6. NO actual Arabic words (only Arabic SCRIPT as phonetics). NO formal English.
7. Keep it SHORT — one concise street line wid its vibe, no explanation, no full dictionary translation.
8. Do NOT stuff too many slang terms — one or two slang flavor words per line, natural.
9. HARSH GUARD: every Arabic letter you write MUST be a phonetic spelling of an ENGLISH slang word. A word like "أنا", "ضايع", "شوية", "يا رجل", "تقدر" is a REAL Arabic word — FORBIDDEN. If you would ever translate it as a real Arabic word, instead transliterate the English word (e.g. "أنا" → "آي" (I), "ضايع" → "لوست" (lost), "شوية" → "أ بَيت" (a bit), "يا رجل" → "دود" (dude), "تقدر" → "كان يو" (can you)). When in doubt, write the ENGLISH word in Arabic letters — NEVER a real Arabic word.

Reply with a STRICT JSON object only — no markdown, no prose:
{"slang":"...", "sticker":"...", "spoken_en":"..."}
- "slang" = the converted phrase in Arabic-script phonetics (فونيتك عربي) of American Gen-Z slang
- "sticker" = a short ENGLISH Gen-Z slang sticker (2-4 words) — the vibe in English
- "spoken_en" = the SAME slang phrase written in REAL AMERICAN English original Latin letters (for text-to-speech reading) — a full natural-sounding American slang line, e.g. "Yo, gimme that hydration, fr". spoken_en is HIDDEN — never shown in UI, only used to be read aloud. It MUST match the exact same meaning and vibe of "slang".`;

function parseSlang(raw: string): { slang: string; sticker: string; spoken_en: string } | null {
  try {
    const block = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(block) as { slang?: unknown; sticker?: unknown; spoken_en?: unknown };
    if (typeof parsed.slang !== "string" || typeof parsed.sticker !== "string" || typeof parsed.spoken_en !== "string") return null;
    return {
      slang: parsed.slang.slice(0, 300),
      sticker: parsed.sticker.slice(0, 80),
      spoken_en: parsed.spoken_en.slice(0, 200),
    };
  } catch {
    return null;
  }
}

/* ───── Offline (بدون نت) fallback — قواعد محلية بلا مزود LLM ────────────────
   الهدف: لما ما يكون مُزود (لا نت / كل المزوّدين طاحوا)، يرد الجيم عبارة فونيتك عربي
   بسلانك جويسم الأمريكي — مو «سلانك، برو: ...». 
   النمط: ناخد كلمة من الجملة الأصلية (ما أول كلمة رسمية زي "I"/"Could" — نختار
   فعل/اسم يحمل المعنى) ونكّدها بكلمات سلانك ثابتة. 

   هل هذا ترجمة حقيقية؟ لأ — بس عبارة «طافية» ما قعدت اليد خالية: ترد سلانك
   جويسم بصيغة ثابتة، والمستخدم يگدر يترجم بس مكو نت. الباقي (سلانك مخصوص
   للجملة) بيجي من المزود لما يرجع. */

/** كلمات سلانك ثابتة بفونيتك عربي (قواعد جويسم) — للرد البسيط بلا مزود. */
const BASE_SLANG = ["برو", "هوميي", "نو كاپ", "فور ريل", "واز لايك", "شو أب", "گيم مي", "بريود"];

/** كلمات إنجليزية رسمية نستثنيها (مو أحسن ممثل للجملة) وأول مقطع فونيتك لها. */
const FUNCTION_WORDS: Record<string, string> = {
  i: "", would: "", like: "", could: "", you: "", tell: "", me: "", the: "", a: "", an: "",
  please: "", excuse: "", what: "", time: "", does: "", do: "", this: "", that: "", is: "",
  are: "", am: "", my: "", your: "", it: "", we: "", they: "", he: "", she: "", to: "", from: "",
  for: "", with: "", very: "", really: "", just: "", and: "", but: "", or: "", so: "", get: "",
};

/** خريطة أشهر الأفعال/الأسماء إلى فونيتك عربي قصير — يتحسّن مع الوقت. */
const WORD_PHONETICS: Record<string, string> = {
  help: "هيلب", thank: "ثانكس", thanks: "ثانكس", happy: "هاپي", hungry: "هانگري",
  thirsty: "ثيرستي", tired: "تايرد", eat: "إيت", drink: "درينك",
  walk: "واك", run: "ران", go: "گو", come: "كام", wait: "ويت", stop: "ستوب",
  give: "گيف", pass: "پاس", salt: "سلت", water: "ووتر", food: "فود", tea: "تي",
  coffee: "قهوة", station: "ستايشن", money: "ماني", friend: "فرند", bro: "برو",
  home: "هوم", house: "هاوس", love: "لاف", ride: "رايد", talk: "طوك", say: "سي",
  big: "بگ", small: "سمول", fast: "فاست", slow: "سلو", good: "گود", great: "گريت",
  nice: "نايس", fire: "فاير", plan: "پلان", idea: "ايديا", shop: "شوپ", store: "ستور",
  market: "ماركت", bus: "باص", taxi: "تكسي", car: "كار", door: "دور", open: "اوپن",
  closed: "كلوز", close: "كلوز", meet: "ميت", warm: "ورّم", cold: "كولد", hot: "هوت",
};

/** يختار أحسن كلمة ممثّلة من النص (أول كلمة ذات معنى محفوظة فونيتك). */
function pickMeaningWord(input: string): { word: string; phonetic: string } {
  const tokens = input.toLowerCase().replace(/[^a-z\s'-]/g, " ").split(/\s+/).filter(Boolean);
  for (const t of tokens) {
    const clean = t.replace(/^'|'$/g, "");
    // فعل/اسم ذكي المعنى (فونيتك معروف) أولاً
    if (WORD_PHONETICS[clean] && !FUNCTION_WORDS[clean]) {
      return { word: clean, phonetic: WORD_PHONETICS[clean] };
    }
  }
  // شيّاف فعل/اسم معروف؟ خذ أول كلمة غير وظيفية وقدّمها للسياق
  for (const t of tokens) {
    const clean = t.replace(/^'|'$/g, "");
    if (!FUNCTION_WORDS[clean]) return { word: clean, phonetic: clean.slice(0, 4) };
  }
  return { word: "shay", phonetic: "شَي" };
}

function fallbackSlang(input: string): { slang: string; sticker: string; spoken_en: string } {
  const { word, phonetic } = pickMeaningWord(input);
  const cap = BASE_SLANG[Math.floor(Math.random() * BASE_SLANG.length)];

  // رد بسيط ثابت بصيغة جويسم: فونيتك الكلمة المعنية + كلمة سلانك ثابتة.
  // صيغ متنوعة حتى ما ينملّ المستخدم.
  const replies = [
    `${cap}، هاي الـ${phonetic} شي گدام اليد، بس ماكو مزود هسه.`,
    `${cap}... هالشغلة (${phonetic}) محتاجة مزود، بس أني گاتك: نو كاپ، ارجع بعدين.`,
    `وايت... گيم مي مزود وماكو. هالشغلة ${phonetic}، فور ريل.`,
    `${cap}، ${phonetic}؟ هاي شغلة المزوّد — هسه كله سلانك جويسم: واز لايك، شو أب.`,
  ];
  const slang = replies[Math.floor(Math.random() * replies.length)];

  // ستيكر إنجليزي ثابت — سلانك قصير (2-4 كلمات)
  const stickers = ["No cap", "Hold up, bro", "Gimme a sec", "Say less", "For real"];
  const sticker = stickers[Math.floor(Math.random() * stickers.length)];

  // spoken_en للقراءة الصوتية — سلانك أمريكي حقيقي، مخفي عن الـ UI
  const spokenE = [
    "Yo bro, this ain't got a provider right now — come back in a bit.",
    "Hold up homey, I need that provider for this one. No cap, check back later.",
    "Wait up, gimme a sec — the provider's down. For real, come back soon.",
    "Yo, that's a provider thing bro. Right now it's all Jweysim slang — was like, show up.",
  ];

  return { slang, sticker, spoken_en: spokenE[Math.floor(Math.random() * spokenE.length)] };
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
