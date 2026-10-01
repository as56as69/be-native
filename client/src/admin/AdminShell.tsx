import { useState } from "react";
import type { ReactNode } from "react";

import { AdminContent } from "./AdminContent";
import { JweysimAdmin } from "./JweysimAdmin";
import { ProviderManager } from "./ProviderManager";
import { SpotStudio } from "./SpotStudio";
import { VoucherGenerator } from "./VoucherGenerator";
import { UserTracker } from "./UserTracker";
import { SystemSettings } from "./SystemSettings";
import { OpeningQuotes } from "./OpeningQuotes";
import { ADMIN_THEMES, loadAdminTheme, saveAdminTheme } from "./adminThemes";
import type { AdminThemeId } from "./adminThemes";

const TAB_ICONS: Record<string, ReactNode> = {
  providers: (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M5 5v10M15 5v10M8 7v6M12 8v4M5 10h10" />
    </svg>
  ),
  spots: (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M10 2C6.7 2 4 4.7 4 8c0 4.5 6 10 6 10s6-5.5 6-10c0-3.3-2.7-6-6-6Z" />
      <circle cx="10" cy="8" r="2" />
    </svg>
  ),
  jweysim: (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {/* قصاصة دفتر ممزقة */}
      <path d="M5 3h10.5l1 1.5v11l-1.2.8H5.5L4.5 15V5.5L5 3Z" />
      <path d="M6 7h8M6 10h8M6 13h5" />
    </svg>
  ),
  vouchers: (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" />
      <path d="M7 4.5V2.5M13 4.5V2.5M2.5 9h15" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="7" cy="6" r="2.5" />
      <path d="M2 17v-1.5C2 13.7 4.2 12 7 12s5 1.7 5 3.5V17" />
      <circle cx="14" cy="6.5" r="2" />
      <path d="M12 17v-1c0-1 1.3-2 3-2.2" />
    </svg>
  ),
  quotes: (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3.5h9v5H6v3h-3V3.5Z" />
      <path d="M8.5 8.5 7 11" />
      <path d="M12 3.5h5v5h-3l1.2 2.2" />
      <path d="M15 5.5h1.8" />
    </svg>
  ),
  content: (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 3h12v14H4z" />
      <path d="M7 7h6M7 10h4" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 2v2.5M10 15.5V18M2 10h2.5M15.5 10H18M4.2 4.2l1.8 1.8M14 14l1.8 1.8M15.8 4.2l-1.8 1.8M6 14l-1.8 1.8" />
    </svg>
  ),
};

const TABS = [
  { id: "content", label: "محرّر المحتوى" },
  { id: "providers", label: "المزوّدون" },
  { id: "spots", label: "استوديو النقاط" },
  { id: "jweysim", label: "جويسم" },
  { id: "vouchers", label: "الكوبونات" },
  { id: "users", label: "المستخدمون" },
  { id: "quotes", label: "عبارات البداية" },
  { id: "settings", label: "إعدادات النظام" },
] as const;

export type AdminTabId = (typeof TABS)[number]["id"];

export function AdminShell() {
  const [tab, setTab] = useState<AdminTabId>(() =>
    window.location.pathname === "/admin/content" ? "content" : "providers"
  );
  const [themeId, setThemeId] = useState<AdminThemeId>(() => loadAdminTheme());
  const themeMeta = ADMIN_THEMES.find((t) => t.id === themeId) ?? ADMIN_THEMES[0];
  const themeClass = themeMeta.className;

  return (
    <div className={`admin-bg flex min-h-dvh flex-col text-slatew-100 ${themeClass}`}>
      {/* top bar */}
      <header className="flex flex-wrap items-center gap-3 border-b border-slatew-700/60 px-4 py-3">
        <span className="font-display text-2xl leading-none tracking-tight text-kraft-300">غرفة العمليات</span>
        <span className="rounded border border-slatew-600 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-slatew-400">
          admin / be-native
        </span>
        <a
          href="/"
          className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-slatew-600 px-3 py-1.5 text-sm text-slatew-200 transition-colors hover:bg-slatew-800/70"
        >
          ← العودة للخريطة
        </a>
        {/* theme switcher — تبديل ثيم الداشبورد، ينحفظ بالمتصفح */}
        <div className="flex items-center gap-1 rounded-full border border-slatew-700 bg-slatew-900/80 p-1" title="ثيم الداشبورد">
          {ADMIN_THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setThemeId(t.id);
                saveAdminTheme(t.id);
              }}
              aria-pressed={themeId === t.id}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-colors ${
                themeId === t.id
                  ? "bg-kraft-600/25 text-kraft-100"
                  : "text-slatew-400 hover:bg-slatew-800/60 hover:text-slatew-100"
              }`}
            >
              <span aria-hidden>{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* tab nav */}
      <nav className="flex flex-wrap gap-1.5 px-4 py-2.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-1.5 rounded-md border-[1.5px] px-3 py-1.5 text-sm transition-colors ${
              tab === t.id
                ? "border-kraft-500 bg-kraft-600/20 text-kraft-200"
                : "border-slatew-700 text-slatew-300 hover:bg-slatew-800/60 hover:text-slatew-100"
            }`}
          >
            {TAB_ICONS[t.id]}
            {t.label}
          </button>
        ))}
      </nav>

      {/* content */}
      <main className="grid gap-4 px-4 pb-10">
        <TabBody tab={tab} />
      </main>

      <footer className="mt-auto border-t border-dashed border-slatew-700/60 px-4 py-2.5 text-center text-[11px] text-slatew-500">
        Be Native Ops — البيانات تُقرأ من الخريطة المحلية (Supabase) عبر /api/admin
      </footer>
    </div>
  );
}

function TabBody({ tab }: { tab: AdminTabId }) {
  const map: Record<AdminTabId, ReactNode> = {
    content: <AdminContent />,
    providers: <ProviderManager />,
    spots: <SpotStudio />,
    jweysim: <JweysimAdmin />,
    vouchers: <VoucherGenerator />,
    users: <UserTracker />,
    quotes: <OpeningQuotes />,
    settings: <SystemSettings />,
  };
  return <>{map[tab]}</>;
}
