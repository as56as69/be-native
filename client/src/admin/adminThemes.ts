/** Admin dashboard themes — pure metadata. The actual colors live in
 *  CSS custom properties driven by the className applied to the root
 *  (default / admin-theme-notebook / admin-theme-midnight). */
export type AdminThemeId = "ops" | "notebook" | "midnight";

export interface AdminThemeMeta {
  id: AdminThemeId;
  label: string;
  emoji: string;
  className: string;
}

export const ADMIN_THEMES: AdminThemeMeta[] = [
  { id: "ops", label: "غرفة العمليات", emoji: "🌑", className: "" },
  { id: "notebook", label: "دفتر ورقي", emoji: "📓", className: "admin-theme-notebook" },
  { id: "midnight", label: "منتصف الليل", emoji: "🌙", className: "admin-theme-midnight" },
];

const STORAGE_KEY = "benative.admin.theme";

export function loadAdminTheme(): AdminThemeId {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY) as AdminThemeId | null;
    if (saved && ADMIN_THEMES.some((t) => t.id === saved)) return saved;
  } catch {
    /* private mode — fall through */
  }
  return "ops";
}

export function saveAdminTheme(id: AdminThemeId): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore write failures */
  }
}
