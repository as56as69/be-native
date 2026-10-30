import { useState } from "react";

/** «جي سلانك» — ورقة صغيرة يحول فيها المستخدم الكلام الرسمي الإنجليزي
 *  إلى سلانك أمريكي بقواعد جويسم الأمريكي (عبر نفس مزود LLM للخادم).
 *  النتيجة لها ثلاثة حقول: slang (يظهر)، sticker (يظهر)، spoken_en
 *  (مخفي — يُقرأ فقط بالصوت عبر Web Speech API عند الضغط على «سماع»). */
export default function GSlangSheet() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ slang: string; sticker: string; spoken_en?: string; source: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);

  const convert = async () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/gslang", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
      setResult(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  /** قراءة spoken_en بالصوت عبر Web Speech API — بلا إنترنت، بلا تكلفة. */
  const playSpoken = () => {
    if (!result?.spoken_en) return;
    if (!("speechSynthesis" in window)) {
      setError("متصفحك ما يدعم الصوت");
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(result.spoken_en);
    utter.lang = "en-US";
    utter.rate = 1;
    // فضّل صوتاً أمريكياً إنجليزياً إن وُجد
    const voices = window.speechSynthesis.getVoices();
    const us = voices.find((v) => /en[-_]/i.test(v.lang) && /US/i.test(v.lang));
    if (us) utter.voice = us;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utter);
  };

  return (
    <div className="gslang-sheet font-arabic">
      <p className="mb-2 text-xs text-amber-900/70">
        اكتب الكلام الرسمي الإنجليزي (مال المدارس) — جويسم يحوله سلانك بقواعده.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder='مثلاً: "I would like a cup of tea, please."'
        aria-label="النص الإنجليزي الرسمي"
        className="w-full resize-none rounded border border-[#8B5A2B]/40 bg-[#FFFDF7] p-2 text-sm text-amber-950 outline-none focus:border-[#8B5A2B]"
        dir="ltr"
      />
      <button
        type="button"
        onClick={convert}
        disabled={loading || !text.trim()}
        className="mt-2 w-full rounded border border-[#8B5A2B]/50 bg-[#F5E7CE] px-3 py-2 text-sm font-bold text-amber-950 transition-colors hover:bg-[#F0DBB8] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "جويسم گاعد يفكّر…" : "جويسم الأمريكي يكول يمي هالشغلة"}
      </button>

      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}

      {result && (
        <div className="mt-3 rounded border-2 border-[#5B8C5A] bg-[#FEFAE0] p-3" dir="rtl">
          <div className="text-base font-bold text-amber-950">{result.slang}</div>
          {result.sticker && (
            <div className="mt-1 inline-block rounded bg-[#5B8C5A]/10 px-2 py-0.5 font-[Caveat,cursive] text-sm font-bold text-[#B4572E]">
              {result.sticker}
            </div>
          )}
          {result.spoken_en && (
            <div className="mt-2 flex items-center gap-2 border-t border-[#5B8C5A]/20 pt-2">
              <button
                type="button"
                onClick={playSpoken}
                disabled={speaking}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded border border-[#8B5A2B]/40 bg-[#FFFDF7] px-3 py-2 text-sm font-bold text-amber-950 shadow-sm transition-colors hover:bg-[#F5E7CE] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="grid size-6 place-items-center rounded-full bg-[#5B8C5A]/15">
                  <span aria-hidden className="text-sm leading-none">{speaking ? "■" : "🔊"}</span>
                </span>
                {speaking ? "جويسم گاعد يگولها…" : "سماع · جويسم يگولها"}
              </button>
            </div>
          )}
          <div className="mt-1 text-[10px] text-amber-900/50">
            {result.source === "llm" ? "جويسم (LLM)" : "جويسم (بدون نت)"}
          </div>
        </div>
      )}
    </div>
  );
}
