import { useState } from "react";

/** «جي سلانك» — ورقة صغيرة يحول فيها المستخدم الكلام الرسمي الإنجليزي
 *  إلى سلانك أمريكي بقواعد جويسم الأمريكي (عبر نفس مزود LLM للخادم). */
export default function GSlangSheet() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ slang: string; sticker: string; source: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        {loading ? "جويسم گاعد يفكّر…" : "عوفها جويسم — ترجملك سلانك"}
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
          <div className="mt-1 text-[10px] text-amber-900/50">
            {result.source === "llm" ? "جويسم (LLM)" : "جويسم (بدون نت)"}
          </div>
        </div>
      )}
    </div>
  );
}
