import type { CollectibleItem } from "@be-native/shared";

import { UI_GENZ_COPY } from "../data/seedData";

/**
 * "Traces Scrapbook 📓" slide-over drawer — warm notebook paper, physical
 * paper snippets taped onto it. No dark mode anywhere; English slang always
 * gets explicit LTR isolation.
 */

export interface TraceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Currently unlocked traces, newest first. */
  unlockedItems: CollectibleItem[];
  /** Total registered traces (scenario + admin catalog). */
  total: number;
}

function PaperclipDoodle({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9.5 7.5v9a3.5 3.5 0 0 0 7 0v-9a5 5 0 0 0-10 0v10a2.5 2.5 0 0 0 5 0V9" />
    </svg>
  );
}

export function TraceDrawer({ isOpen, onClose, unlockedItems, total }: TraceDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* backdrop — subtle blur, no dark theming of content */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={UI_GENZ_COPY.scrapbook}
        className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-md flex-col overflow-y-auto border-l-2 border-[#8B5A2B] bg-[#F5EFE6] p-6 shadow-2xl animate-drawer-in"
      >
        {/* header */}
        <div className="mb-5 flex shrink-0 items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-sm border border-[#8B5A2B]/40 bg-[#FFFDF7] text-[#8B5A2B]">
              <PaperclipDoodle className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-2xl font-bold leading-tight text-amber-950">
                <span dir="ltr" className="inline-block">
                  {UI_GENZ_COPY.scrapbook}
                </span>
              </h2>
              <p className="font-arabic mt-0.5 text-xs text-amber-900/70">
                {unlockedItems.length} / {total} أثر مكتشف
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="grid size-8 shrink-0 place-items-center rounded-full border border-[#8B5A2B]/40 bg-[#FFFDF7] text-sm text-amber-950 transition-colors hover:bg-[#F5E7CE]"
          >
            ✕
          </button>
        </div>

        {/* scrapbook cards */}
        {unlockedItems.length === 0 ? (
          <div className="rounded-sm border border-amber-900/20 bg-[#FFFDF7] p-6 text-center shadow-sm">
            <p className="font-arabic text-sm leading-[1.7] text-amber-950/80">
              لم تكتشف أي أثر بعد.. استمر بالحديث!
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {unlockedItems.map((item) => (
              <li
                key={item.id}
                className="relative rounded-sm border border-amber-900/20 bg-[#FFFDF7] p-4 shadow-sm"
              >
                <span
                  className="absolute -right-1 top-4 h-3 w-10 rotate-2 border border-amber-300/40 bg-amber-200/60"
                  aria-hidden
                />
                <p className="pr-6 text-lg font-bold leading-snug text-amber-950">{item.phrase}</p>
                <p className="mt-2">
                  <span dir="ltr" className="inline-block font-mono text-sm text-amber-800">
                    {item.targetSlang}
                  </span>
                </p>
                {item.contextNote ? (
                  <p className="font-arabic mt-2 text-xs italic leading-relaxed text-stone-600">
                    {item.contextNote}
                  </p>
                ) : null}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span
                    className={
                      item.source === "ADMIN"
                        ? "font-arabic rounded-full border border-[#8B0000]/40 px-2 py-0.5 text-[10px] text-[#8B0000]"
                        : "font-arabic rounded-full border border-[#1E3A8A]/40 px-2 py-0.5 text-[10px] text-[#1E3A8A]"
                    }
                  >
                    {item.source === "ADMIN" ? "أثر مخصص" : "أثر مكتشف"}
                  </span>
                  {item.unlockedAt ? (
                    <span className="font-arabic text-[10px] text-stone-400">
                      {new Date(item.unlockedAt).toLocaleDateString("ar-IQ")}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </>
  );
}