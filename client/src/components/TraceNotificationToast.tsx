import { useEffect } from "react";

import { UI_GENZ_COPY } from "../data/seedData";

/**
 * "أثر جديد" toast — a warm notebook paper snippet pinned to the top of the
 * screen when a trace gets unlocked. Paper-only aesthetic: cream paper,
 * dark ink, a tiny scotch-tape accent at top-center. Auto-dismisses.
 */

export interface TraceNotificationToastProps {
  /** The unlocked Baghdadi phrase, e.g. "طابكة عنده". */
  phrase: string;
  onDismiss: () => void;
}

/** Small hand-drawn paperclip doodle. */
function PaperclipDoodle({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9.5 7.5v9a3.5 3.5 0 0 0 7 0v-9a5 5 0 0 0-10 0v10a2.5 2.5 0 0 0 5 0V9" />
    </svg>
  );
}

export function TraceNotificationToast({ phrase, onDismiss }: TraceNotificationToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 3500);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 top-6 z-50 -translate-x-1/2 animate-slide-down"
    >
      <div className="relative flex items-center gap-3 rounded-sm border border-amber-900/30 bg-[#FFFDF7] p-3 px-5 shadow-md">
        {/* scotch tape accent at top-center */}
        <span
          className="absolute left-1/2 top-[-0.5rem] h-3 w-8 -translate-x-1/2 border border-amber-300/40 bg-amber-200/50"
          aria-hidden
        />
        <span className="shrink-0 text-[#5C3A21]">
          <PaperclipDoodle className="size-5" />
        </span>
        <p className="font-arabic whitespace-nowrap text-sm leading-relaxed text-ink-800">
          أثر جديد في{" "}
          <span dir="ltr" className="inline-block">
            {UI_GENZ_COPY.scrapbook}
          </span>
          : <b className="font-mono font-bold">{phrase}</b>
        </p>
      </div>
    </div>
  );
}