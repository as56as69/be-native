import { useEffect, useState } from "react";

import type { OpeningQuote } from "@be-native/shared";

import { api } from "../lib/api";
import { StatusChip } from "./StatusChip";

/** Neutral offline fallback — never a placeholder phrase, only used when the API is unreachable. */
const FALLBACK: OpeningQuote = {
  id: "fallback",
  text_ar: "بغداد… قصة تنتظرك",
  text_en: "Baghdad is a story waiting for you",
  is_active: true,
  sort_order: 0,
  created_at: "",
};

export function OpeningStory({ onDone, apiConnected }: { onDone: () => void; apiConnected?: boolean }) {
  const [quote, setQuote] = useState<OpeningQuote | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 120);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void api
      .quotes()
      .then((quotes) => {
        if (cancelled || quotes.length === 0) return;
        const pick = quotes[Math.floor(Math.random() * quotes.length)];
        if (pick) setQuote(pick);
      })
      .catch(() => {
        /* offline — the neutral fallback above is used */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const shown = quote ?? FALLBACK;

  return (
    <button
      type="button"
      onClick={onDone}
      className="notebook-paper group flex min-h-dvh w-full cursor-pointer select-none flex-col items-center justify-center px-6 text-center outline-none"
      aria-label="شغّل القصة"
    >
      {/* punched holes make it feel like a real notebook page */}
      <div className="pointer-events-none fixed inset-x-0 top-0 flex justify-center gap-4 pt-4">
        <span className="paper-hole" />
        <span className="paper-hole" />
        <span className="paper-hole" />
      </div>

      <span className="stamp mb-8 rotate-2">Be Native • دليل بغداد الورقي</span>

      {/* dynamic Arabic quote — modern Tajawal, generous leading, no overlap */}
      <div
        className={`max-w-2xl transition-all duration-700 ease-out ${
          visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <h1 className="font-sans text-4xl font-semibold leading-[1.85] tracking-tight text-ink-900 sm:text-5xl sm:leading-[1.8]">
          “{shown.text_ar}”
        </h1>
        <p className="font-display mt-5 text-xl leading-relaxed tracking-wide text-kraft-600 sm:text-2xl">
          “{shown.text_en}”
        </p>
      </div>

      {/* divider squiggle */}
      <div className="mt-8 mb-2 flex items-center gap-3 text-kraft-400" aria-hidden>
        <span className="block h-px w-16 bg-kraft-400/60" />
        <svg viewBox="0 0 40 12" width="40" height="12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
          <path d="M2 6.5q4 2.6 8 .2t8-.2q4-2.6 8-.2t8-.2" />
        </svg>
        <span className="block h-px w-16 bg-kraft-400/60" />
      </div>

      <div className="mt-8 flex items-center gap-3">
        <StatusChip tone={apiConnected ? "ok" : "warn"}>
          {apiConnected ? "الخريطة حاضرة" : "وضع الأوفلاين"}
        </StatusChip>
        <span className="font-sans text-sm leading-relaxed text-ink-500">
          اضغط في أي مكان لتفتح الدفتر <span className="inline-block transition-transform group-hover:translate-y-0.5">↓</span>
        </span>
      </div>
    </button>
  );
}