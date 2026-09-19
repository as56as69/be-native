import { useEffect, useRef, useState } from "react";

import type { Spot } from "@be-native/shared";

import { useGame } from "../state/GameContext";
import { CATEGORY_META, TIER_LABEL } from "./DoodleMap";

const SLOW_CAPTION = "مشي / نقل عام — بلاش، عادي. بوابة بغداد تفرّج لك أجمل الريل.";
const TRANSIT_CAPTION = "نقل عام (الكيّة) — أسرع شوية، بس تدفع طاقتين.";
const FAST_CAPTION = "تكسي سريع — يوصلك هسه مقابل 10 طاقات.";

export function TransitModal({ spot, onClose }: { spot: Spot; onClose: () => void }) {
  const { user, startTransit, enterScene, openVoucher, refreshUser } = useGame();

  const [phase, setPhase] = useState<"choose" | "walking" | "driving" | "error">("choose");
  const [message, setMessage] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [waitMode, setWaitMode] = useState<"slow" | "transit">("slow");
  const busy = useRef(false);

  const meta = CATEGORY_META[spot.category];

  // visual fill for the ring timer (0 → 100%)
  const ring = 1 - secondsLeft / 60;

  const runSlow = async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const first = await startTransit("slow");
      if (first.status === "unlocked") {
        enterScene(first, "slow", spot.id);
        return;
      }
      setWaitMode("slow");
      setPhase("walking");
      setSecondsLeft(first.retry_after_seconds);
      setAnimKey((k) => k + 1);
    } catch (err) {
      setPhase("error");
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      busy.current = false;
    }
  };

  const runTransit = async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const response = await startTransit("transit");
      if (response.status === "unlocked") {
        enterScene(response, "transit", spot.id);
        return;
      }
      setWaitMode("transit");
      setPhase("walking");
      setSecondsLeft(response.retry_after_seconds);
      setAnimKey((k) => k + 1);
    } catch (err) {
      setPhase("error");
      setMessage(err instanceof Error ? err.message : String(err));
      if (err instanceof Error && err.message.includes("INSUFFICIENT_CREDITS")) await refreshUser();
    } finally {
      busy.current = false;
    }
  };

  // gate check: as the timer hits zero, re-board the trip
  useEffect(() => {
    if (phase !== "walking") return;
    const tick = window.setInterval(() => {
      setSecondsLeft((s) => {
        const next = s - 1;
        if (next <= 0) {
          window.clearInterval(tick);
          if (waitMode === "transit") {
            void runTransit();
          } else {
            void runSlow();
          }
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, animKey]);

  const runFast = async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const response = await startTransit("fast");
      enterScene(response, "fast", spot.id);
    } catch (err) {
      const isElmi = err instanceof Error && err.message.includes("INSUFFICIENT_CREDITS");
      setPhase("error");
      setMessage(
        isElmi
          ? "الطاقة خلصت — شحّنها بكوبون وشوف طريق جديد."
          : err instanceof Error
            ? err.message
            : String(err)
      );
      if (isElmi) await refreshUser();
    } finally {
      busy.current = false;
    }
  };

  return (
    <div
      className="animate-modal-in fixed inset-0 z-40 flex items-end justify-center bg-ink-900/30 p-3 backdrop-blur-[1px] sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`الوصول إلى ${spot.title_ar}`}
    >
      <div className="animate-card-in notebook-card paper-edge w-full max-w-sm p-6">
        {/* tape strip */}
        <span className="tape -top-3 left-1/2 -translate-x-1/2" />

        <div className="flex items-start justify-between gap-3">
          <h2 className="font-sans text-2xl leading-relaxed tracking-tight text-ink-700">
            {spot.title_ar}
            <span className="font-display mt-0.5 block text-sm leading-relaxed tracking-wide text-kraft-600">
              {spot.title_en}
            </span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 -rotate-3 shrink-0 place-items-center rounded-full border-2 border-ink-700 bg-kraft-50 text-sm font-bold hover:bg-kraft-200"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>
        <p className="mb-4 mt-3 text-sm leading-relaxed text-ink-500">
          {meta.labelAr} • “{spot.vibe_description ?? spot.title_en}”
        </p>

        {phase === "walking" && (
          <div className="mt-5 flex flex-col items-center gap-3 text-center">
            <div className="relative size-32">
              <svg viewBox="0 0 120 120" className="size-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-kraft-200)" strokeWidth="9" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="var(--color-wasabi-600)"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={`${ring * 326.7} 326.7`}
                />
              </svg>
              <span className="absolute inset-0 grid place-items-center font-display text-4xl">
                {Math.max(0, secondsLeft)}s
              </span>
            </div>
            <p className="font-display text-xl leading-relaxed">مُنّي بالممر ويا الدفتر…</p>
            <p className="text-sm leading-relaxed text-ink-500">بوابة بغداد تفگّر بشلون توصلك، وكل ثانية تبلش قصة جديدة هسه.</p>
            <button
              type="button"
              onClick={runSlow}
              className="btn-doodle mt-1 text-sm"
              aria-label="اسأل البوابة مرة أخرى"
            >
              <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M16 3v4h-4M4 5.5A7 7 0 0 1 16 7v0M4 17v-4h4M16 14.5A7 7 0 0 1 4 13v0" />
              </svg>
              اسأل البوابة
            </button>
          </div>
        )}

        {phase === "choose" && (
          <div className="grid gap-3">
            <button type="button" onClick={runSlow} className="btn-doodle flex w-full items-center justify-between gap-4 text-start">
              <span className="min-w-0">
                <span className="font-sans block text-lg leading-relaxed text-ink-900">مشي</span>
                <span className="block text-xs leading-relaxed text-ink-500">{SLOW_CAPTION}</span>
              </span>
              <span className="stamp shrink-0 whitespace-nowrap text-center">0 طاقة</span>
            </button>

            <button type="button" onClick={runTransit} className="btn-doodle flex w-full items-center justify-between gap-4 text-start">
              <span className="min-w-0">
                <span className="font-sans block text-lg leading-relaxed text-ink-900">نقل عام (الكيّة)</span>
                <span className="block text-xs leading-relaxed text-ink-500">{TRANSIT_CAPTION}</span>
              </span>
              <span className="stamp shrink-0 whitespace-nowrap text-center">2 طاقة</span>
            </button>

            <button type="button" onClick={runFast} className="btn-doodle flex w-full items-center justify-between gap-4 text-start" aria-label="تكسي سريع -10 طاقات">
              <span className="min-w-0">
                <span className="inline-flex items-center gap-1.5 font-sans text-lg leading-relaxed text-ink-900">
                  <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-wasabi-600" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5.6 16.4l2.4-4.2c.2-.4.6-.7 1.1-.7h5.8c.5 0 1 .3 1.2.7l2.3 4.2z" />
                    <path d="M7.9 13.4h8.2" />
                    <path d="M8.6 12.4l1.1-1.6c.2-.3.5-.5.9-.5h2.9c.4 0 .7.2.9.5l1.1 1.6" />
                    <circle cx="8.4" cy="17.6" r="1.5" />
                    <circle cx="15.6" cy="17.6" r="1.5" />
                  </svg>
                  تكسي سريع
                </span>
                <span className="block text-xs leading-relaxed text-ink-500">{FAST_CAPTION}</span>
              </span>
              <span className="stamp shrink-0 whitespace-nowrap text-center">10 طاقة</span>
            </button>

            <p className="pt-1 text-center text-xs leading-relaxed text-ink-500">
              رصيدك:{" "}
              <b className="text-wasabi-600">{user?.credits_balance ?? "…"}</b>{" "}
              <span className="text-ink-500">•</span>{" "}
              {TIER_LABEL[user?.current_tier ?? "free"]}
            </p>
          </div>
        )}

        {phase === "error" && message && (
          <div className="mt-5 rounded-md border-2 border-dashed border-red-800/40 bg-kraft-50 p-4 text-sm leading-relaxed text-red-900">
            <p className="font-bold">وصل مقفول!</p>
            <p className="mt-1">{message}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => setPhase("choose")} className="btn-doodle text-xs">
                جرّب خيار ثاني
              </button>
              {message.includes("كوبون") && (
                <button type="button" onClick={openVoucher} className="btn-doodle text-xs">
                  <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M3 6h14v8H3z" />
                    <path d="M12.5 8.5v3" />
                    <path d="M3 9.2V8M3 12v-1.2" />
                  </svg>
                  شحن بالكوبون
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}