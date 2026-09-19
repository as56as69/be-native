import { useEffect, useState } from "react";

import { GameProvider, useGame } from "./state/GameContext";
import { AdminShell } from "./admin/AdminShell";
import { useCrossfade } from "./hooks/useCrossfade";
import { useInstallPrompt } from "./hooks/useInstallPrompt";
import { useServiceWorker } from "./hooks/useServiceWorker";

import { StatusChip } from "./components/StatusChip";
import { OpeningStory } from "./components/OpeningStory";
import { DoodleMap, TIER_LABEL } from "./components/DoodleMap";
import { TransitModal } from "./components/TransitModal";
import { ScenarioViewer } from "./components/ScenarioViewer";
import { TraceDrawer } from "./components/TraceDrawer";
import { VibeMapperEngine } from "./components/VibeMapperEngine";
import { VoucherModal } from "./components/VoucherModal";
import { UI_GENZ_COPY } from "./data/seedData";
import { useCollectibles } from "./hooks/useCollectibles";
import { useVibeMapper } from "./hooks/useVibeMapper";

function MapScreen() {
  const { user, spots, openSpot, openVoucher, apiConnected } = useGame();
  const { addAdminItem, items, getUnlockedItems } = useCollectibles();
  const { entries: vibeEntries, generateVibe, saveToTraces } = useVibeMapper(addAdminItem);
  const [tracesOpen, setTracesOpen] = useState(false);
  const [isVibeMapperOpen, setIsVibeMapperOpen] = useState(false);
  const { canInstall, install } = useInstallPrompt();
  const { offlineReady } = useServiceWorker();

  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return (
    <main className="notebook-paper relative flex h-dvh flex-col overflow-hidden">
      {/* sticky status header */}
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-line-300/60 bg-kraft-100/90 px-4 py-2 backdrop-blur-sm">
        {/* title — breathes in the empty middle */}
        <span className="font-display text-xl text-ink-700">بغداد</span>

        {/* left cluster (RTL start): connection + balance indicators */}
        <span className="mx-0.5 h-4 w-px bg-line-300" aria-hidden />
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusChip tone={online ? "ok" : "bad"}>{online ? "متصل" : "أوفلاين"}</StatusChip>
          <StatusChip tone={apiConnected ? "ok" : "warn"}>
            {apiConnected ? "خادم جاهز" : "بلا رصيد"}
          </StatusChip>
          {offlineReady && <StatusChip tone="ok">نُسخ يدك</StatusChip>}
          <span className="inline-flex items-center gap-1.5 text-sm text-ink-500">
            <span className="font-display inline-flex items-center gap-1.5 text-wasabi-600">
              <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M10 2l2 5h5l-4 3.5 1.6 5.5L10 13 6.4 16l1.6-5.5L4 7h5z" />
              </svg>
              {user?.credits_balance ?? "…"} طاقة
            </span>
            <span className="text-ink-500/50">•</span>
            <span>{TIER_LABEL[user?.current_tier ?? "free"]}</span>
          </span>
        </div>

        {/* spacer — keeps the middle empty for visual breathing */}
        <div className="min-w-4 flex-1" aria-hidden />

        {/* right cluster (RTL end): Aura / Vault / Scrapbook actions */}
        <div className="flex flex-wrap items-center justify-end gap-2">
        {/* global traces scrapbook button (typescript: single top-level entry) */}
        <button
          type="button"
          onClick={() => setTracesOpen(true)}
          className="fab-doodle text-sm"
          aria-label="Traces Scrapbook: سجلّ العبارات المكتشفة"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9.5 7.5v9a3.5 3.5 0 0 0 7 0v-9a5 5 0 0 0-10 0v10a2.5 2.5 0 0 0 5 0V9" />
          </svg>
          <span dir="ltr" className="inline-block">
            {UI_GENZ_COPY.scrapbook}
          </span>
          <span className="font-arabic inline-flex min-w-5 items-center justify-center rounded-full border border-amber-900/30 bg-[#FFFDF7] px-1.5 py-px text-xs font-bold text-[#5C3A21]">
            {getUnlockedItems().length}
          </span>
        </button>
        {/* cultural vibe mapper — opens the generation engine overlay */}
        <button
          type="button"
          onClick={() => setIsVibeMapperOpen(true)}
          className="fab-doodle text-sm"
          aria-label="Vibe Vault: محرك الترجمة من البغدادي لسلانغ جيل Z"
        >
          <span dir="ltr" className="inline-block">
            {UI_GENZ_COPY.dictionary}
          </span>
        </button>
        {/* install prompt (fires when the browser is ready) */}
        {canInstall && (
          <button
            type="button"
            onClick={install}
            className="fab-doodle text-sm"
            aria-label="ثبّت التطبيق على جهازك"
          >
            <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M10 3v8M6.5 7.5 10 11l3.5-3.5M4 14v2h12v-2" />
            </svg>
            ثبّت
          </button>
        )}
        {/* voucher FAB */}
        <button
          type="button"
          onClick={openVoucher}
          className="fab-doodle text-sm"
          aria-label="Aura Recharge: شحن الطاقات بكوبون"
        >
          <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 6h14v8H3z" />
            <path d="M12.5 8.5v3" />
            <path d="M3 9.2V8M3 12v-1.2" />
          </svg>
          <span dir="ltr" className="inline-block">
            {UI_GENZ_COPY.recharge}
          </span>
        </button>
        {/* admin link */}
        <a
          href="/admin"
          className="fab-doodle size-8"
          aria-label="غرفة عمليات النظام"
          title="Admin Dashboard"
        >
          <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="10" cy="10" r="2.6" />
            <path d="M10 2.8v2M10 15.2v2M2.8 10h2M15.2 10h2M4.9 4.9l1.4 1.4M13.7 13.7l1.4 1.4M15.1 4.9l-1.4 1.4M6.3 13.7l-1.4 1.4" />
          </svg>
        </a>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden px-3 pb-16">
        <DoodleMap spots={spots} onSpotClick={openSpot} />
      </div>

      {/* unified traces scrapbook, opened from the global header button */}
      <TraceDrawer
        isOpen={tracesOpen}
        onClose={() => setTracesOpen(false)}
        unlockedItems={getUnlockedItems()}
        total={items.length}
      />

      {/* cultural vibe mapper — paper overlay with the generation engine */}
      {isVibeMapperOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsVibeMapperOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Vibe Vault"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-card-in"
          >
            <div className="relative max-h-[85dvh] w-full max-w-xl overflow-y-auto rounded-sm border-2 border-[#8B5A2B] bg-[#F5EFE6] p-5 shadow-2xl">
              <header className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-bold leading-tight text-amber-950">
                    <span dir="ltr" className="inline-block">
                      {UI_GENZ_COPY.dictionary}
                    </span>
                  </h2>
                  <p className="font-arabic mt-0.5 text-xs text-amber-900/70">
                    من البغدادي لسلانغ جيل Z — ولّد واحفظ في أثر مباشرة.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVibeMapperOpen(false)}
                  aria-label="إغلاق"
                  className="grid size-8 shrink-0 place-items-center rounded-full border border-[#8B5A2B]/40 bg-[#FFFDF7] text-sm text-amber-950 transition-colors hover:bg-[#F5E7CE]"
                >
                  ✕
                </button>
              </header>
              <VibeMapperEngine
                generateVibe={generateVibe}
                saveToTraces={saveToTraces}
                entries={vibeEntries}
              />
            </div>
          </div>
        </>
      )}
    </main>
  );
}

function Shell() {
  const { screen, activeSpot, voucherOpen, tapStory, closeSpot, apiConnected } = useGame();
  const { current, previous, exiting } = useCrossfade(screen);

  const renderScreen = (s: typeof screen) => {
    if (s === "story") return <OpeningStory onDone={tapStory} apiConnected={apiConnected} />;
    if (s === "scene") return <ScenarioViewer />;
    return <MapScreen />;
  };

  return (
    <>
      {/* page-turn crossfade stage */}
      <div className="relative min-h-dvh overflow-hidden">
        {previous && previous !== current && (
          <div key={`out-${previous}`} className="screen-exit absolute inset-0 z-0" aria-hidden>
            {renderScreen(previous)}
          </div>
        )}
        <div key={`in-${current}`} className={exiting ? "screen-enter relative z-10" : ""}>
          {renderScreen(current)}
        </div>
      </div>

      {/* overlays sit on top of the crossfade stage */}
      {current === "map" && activeSpot && <TransitModal spot={activeSpot} onClose={closeSpot} />}
      {current === "map" && voucherOpen && <VoucherModal />}
    </>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppGate />
    </GameProvider>
  );
}

/** Tiny router: /admin renders the operations dashboard, anything else the game. */
function AppGate() {
  const [isAdmin] = useState(() => window.location.pathname.startsWith("/admin"));
  if (isAdmin) return <AdminShell />;
  return <Shell />;
}