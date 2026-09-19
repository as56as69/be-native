import type { SpotCategory } from "@be-native/shared";

/**
 * DYNAMIC THEME ENGINE — single source of truth for every visual spec
 * the ScenarioViewer switches on per spot category.
 *
 * All classes here are literal strings (Tailwind JIT scans this file).
 * Structure/layout lives in the component exactly once — only the *look*
 * is swappable from here.
 *
 * `layoutType` picks the contextual stage template:
 *   "RECEIPT_MENU"   — cafe/kiosk: dark wood frame + jagged caffeine order-slip
 *   "MANILA_FOLDER"  — govt/university: manila folder, tab, metal fasteners
 *   "CHALKBOARD"     — gym: dark training board, chalk / neon on a slate green
 *   "STREET_POSTER"  — default/street: worn wall poster, washi tape + marker ink
 */
export type SceneLayoutType = "RECEIPT_MENU" | "MANILA_FOLDER" | "CHALKBOARD" | "STREET_POSTER";

export interface ScenarioTheme {
  /** Solid page base applied as the <main> background (overrides paper rules). */
  canvas: string;
  /** Which contextual stage canvas renders around the dialogue/content. */
  layoutType: SceneLayoutType;
  /** Short header line stamped at the top of the stage (menu/receipt/file). */
  boardHeader: string;
  /** Translucent texture overlay painted over the canvas. */
  containerStyle: string;
  /** Full className for an option paper-cutout card. */
  cardStyle: string;
  /** Hex accent for dialogue headers, NPC pill + evaluation stamp. */
  accentColor: string;
  /** Label stamped on the feedback card when the line passes. */
  stampType: string;
  /** English (NPC + option) display font/color classes. */
  npcFont: string;
  optionFont: string;
  /** Arabic hint/equivalence font/color classes. */
  hintFont: string;
}

export const DEFAULT_THEME: ScenarioTheme = {
  canvas: "#f7e3c2",
  layoutType: "STREET_POSTER",
  boardHeader: "ORDER SLIP",
  containerStyle: "bg-gradient-to-b from-[#fffbf2]/30 via-transparent to-[#e7dcc7]/40",
  cardStyle:
    "mx-auto my-2 block w-full max-w-[280px] rounded-[6px] border border-[rgba(120,53,15,0.2)] bg-[#fefae0]/90 px-4 py-3 text-start shadow-[2px_3px_0_rgb(46_32_27/0.15)] transition-transform hover:-translate-y-0.5 hover:bg-[#fefae0]",
  accentColor: "#9a5b22",
  stampType: "BAGHDAD COOL",
  npcFont: "font-mono block text-2xl leading-snug text-ink-900",
  optionFont: "font-mono block text-lg leading-relaxed text-ink-900",
  hintFont: "font-arabic mt-1 block text-xs leading-[1.6] tracking-normal text-ink-500 opacity-70",
};

export const THEMES: Record<SpotCategory, ScenarioTheme> = {
  cafe: {
    canvas: "#f6e3bf",
    layoutType: "RECEIPT_MENU",
    boardHeader: "ORDER SLIP · CAFE",
    containerStyle: "bg-gradient-to-b from-[#fff6e0]/40 via-[#fdecc9]/20 to-[#f3dfb6]/50",
    cardStyle:
      "mx-auto my-2 block w-full max-w-[300px] rounded-[3px] border border-[#d6d3d1] bg-[#fdfcf7] px-4 py-3 text-start shadow-[2px_3px_0_rgb(28_25_23/0.2)] transition-transform hover:-translate-y-0.5 hover:bg-[#ffffff]",
    accentColor: "#b45309",
    stampType: "COFFEE APPROVED",
    npcFont: "font-mono block text-2xl leading-snug text-ink-900",
    optionFont: "font-mono block text-lg leading-relaxed text-ink-900",
    hintFont: "font-arabic mt-1 block text-xs leading-[1.6] tracking-normal text-ink-500 opacity-70",
  },
  restaurant: {
    canvas: "#fdeed8",
    layoutType: "STREET_POSTER",
    boardHeader: "ORDER SLIP · KITCHEN",
    containerStyle: "bg-gradient-to-b from-[#fff4e6]/40 via-[#fbe3d2]/20 to-[#f0cfb8]/50",
    cardStyle:
      "mx-auto my-2 block w-full max-w-[300px] rounded-[3px] border border-[#d6d3d1] bg-[#fdfcf7] px-4 py-3 text-start shadow-[2px_3px_0_rgb(28_25_23/0.2)] transition-transform hover:-translate-y-0.5 hover:bg-[#ffffff]",
    accentColor: "#b91c1c",
    stampType: "KITCHEN PASSED",
    npcFont: "font-mono block text-2xl leading-snug text-ink-900",
    optionFont: "font-mono block text-lg leading-relaxed text-ink-900",
    hintFont: "font-arabic mt-1 block text-xs leading-[1.6] tracking-normal text-ink-500 opacity-70",
  },
  gym: {
    canvas: "#e8f4e0",
    layoutType: "CHALKBOARD",
    boardHeader: "TRAINING BOARD",
    containerStyle: "bg-gradient-to-b from-[#eef7ec]/40 via-[#e2f0df]/20 to-[#cfe4cb]/50",
    cardStyle:
      "mx-auto my-2 block w-full max-w-[300px] rounded-lg border-2 border-[#4ade80]/70 bg-[#10151b] px-4 py-3 text-start shadow-[4px_4px_0_rgb(74_222_128/0.25)] transition-transform hover:-translate-y-0.5 hover:border-[#86efac]",
    accentColor: "#047857",
    stampType: "REP PASSED",
    npcFont: "font-mono block text-2xl font-bold leading-snug text-lime-200",
    optionFont: "font-mono block text-lg font-bold leading-relaxed text-lime-100",
    hintFont: "font-arabic mt-1 block text-xs leading-[1.6] tracking-normal text-lime-300/75",
  },
  taxi_delivery: {
    canvas: "#f8ecc4",
    layoutType: "STREET_POSTER",
    boardHeader: "DISPATCH · ORDER SLIP",
    containerStyle: "bg-gradient-to-b from-[#fdf8e3]/40 via-[#fbefc9]/25 to-[#f2e0a0]/50",
    cardStyle:
      "mx-auto my-2 block w-full max-w-[300px] rounded-[3px] border border-[#d6d3d1] bg-[#fdfcf7] px-4 py-3 text-start shadow-[2px_3px_0_rgb(28_25_23/0.2)] transition-transform hover:-translate-y-0.5 hover:bg-[#ffffff]",
    accentColor: "#a16207",
    stampType: "CAB PICKED",
    npcFont: "font-mono block text-2xl leading-snug text-ink-900",
    optionFont: "font-mono block text-lg leading-relaxed text-ink-900",
    hintFont: "font-arabic mt-1 block text-xs leading-[1.6] tracking-normal text-ink-500 opacity-70",
  },
  university: {
    canvas: "#e6ebf7",
    layoutType: "MANILA_FOLDER",
    boardHeader: "OFFICIAL FILE · STAFF ONLY",
    containerStyle: "bg-gradient-to-b from-[#eef1fb]/40 via-[#e0e6f7]/20 to-[#c8d2ee]/50",
    cardStyle:
      "mx-auto my-2 block w-full max-w-[300px] rounded-none border border-[#b7a06a] bg-[#fdfaf1] px-4 py-3 text-start shadow-[2px_3px_0_rgb(55_48_163/0.15)] transition-transform hover:-translate-y-0.5 hover:bg-[#fffdf6]",
    accentColor: "#4338ca",
    stampType: "DEGREE VERIFIED",
    npcFont: "font-mono block text-2xl leading-snug text-[#2f1f0e]",
    optionFont: "font-mono block text-lg leading-relaxed text-[#2f1f0e]",
    hintFont: "font-arabic mt-1 block text-xs leading-[1.6] tracking-normal text-[#5b4428] opacity-80",
  },
  street_vendor: {
    canvas: "#f7e3c5",
    layoutType: "RECEIPT_MENU",
    boardHeader: "CHALK MENU · STALL",
    containerStyle: "bg-gradient-to-b from-[#fdf1e0]/40 via-[#fbe5c4]/20 to-[#f2d3a4]/50",
    cardStyle:
      "mx-auto my-2 block w-full max-w-[300px] rounded-[3px] border border-[#d6d3d1] bg-[#fdfcf7] px-4 py-3 text-start shadow-[2px_3px_0_rgb(28_25_23/0.2)] transition-transform hover:-translate-y-0.5 hover:bg-[#ffffff]",
    accentColor: "#c2410c",
    stampType: "STREET CRED",
    npcFont: "font-mono block text-2xl leading-snug text-ink-900",
    optionFont: "font-mono block text-lg leading-relaxed text-ink-900",
    hintFont: "font-arabic mt-1 block text-xs leading-[1.6] tracking-normal text-ink-500 opacity-70",
  },
  bookshop: {
    canvas: "#e6f0e3",
    layoutType: "STREET_POSTER",
    boardHeader: "LIBRARY CARD · FILE",
    containerStyle: "bg-gradient-to-b from-[#eef4ee]/40 via-[#deeee2]/20 to-[#c6dfcb]/50",
    cardStyle:
      "mx-auto my-2 block w-full max-w-[300px] rounded-none border border-[#b7a06a] bg-[#fdfaf1] px-4 py-3 text-start shadow-[2px_3px_0_rgb(17_94_89/0.15)] transition-transform hover:-translate-y-0.5 hover:bg-[#fffdf6]",
    accentColor: "#0f766e",
    stampType: "PAGE STAMPED",
    npcFont: "font-mono block text-2xl leading-snug text-[#2f1f0e]",
    optionFont: "font-mono block text-lg leading-relaxed text-[#2f1f0e]",
    hintFont: "font-arabic mt-1 block text-xs leading-[1.6] tracking-normal text-[#5b4428] opacity-80",
  },
  govt_office: {
    canvas: "#efefec",
    layoutType: "MANILA_FOLDER",
    boardHeader: "OFFICIAL FILE · GOVT",
    containerStyle: "bg-gradient-to-b from-[#f2f2f2]/40 via-[#e8e8e8]/20 to-[#cfcfcf]/45",
    cardStyle:
      "mx-auto my-2 block w-full max-w-[300px] rounded-none border border-[#b7a06a] bg-[#fdfaf1] px-4 py-3 text-start shadow-[2px_3px_0_rgb(68_64_60/0.18)] transition-transform hover:-translate-y-0.5 hover:bg-[#fffdf6]",
    accentColor: "#57534e",
    stampType: "OFFICIALLY STAMPED",
    npcFont: "font-mono block text-2xl leading-snug text-[#2f1f0e]",
    optionFont: "font-mono block text-lg leading-relaxed text-[#2f1f0e]",
    hintFont: "font-arabic mt-1 block text-xs leading-[1.6] tracking-normal text-[#5b4428] opacity-80",
  },
  airport: {
    canvas: "#e6eef7",
    layoutType: "STREET_POSTER",
    boardHeader: "BOARDING FILE · FLIGHT",
    containerStyle: "bg-gradient-to-b from-[#eef4fa]/40 via-[#e0ebf6]/20 to-[#c7daf0]/50",
    cardStyle:
      "mx-auto my-2 block w-full max-w-[300px] rounded-none border border-[#b7a06a] bg-[#fdfaf1] px-4 py-3 text-start shadow-[2px_3px_0_rgb(7_89_133/0.16)] transition-transform hover:-translate-y-0.5 hover:bg-[#fffdf6]",
    accentColor: "#0369a1",
    stampType: "AIRBORNE CLEARED",
    npcFont: "font-mono block text-2xl leading-snug text-[#2f1f0e]",
    optionFont: "font-mono block text-lg leading-relaxed text-[#2f1f0e]",
    hintFont: "font-arabic mt-1 block text-xs leading-[1.6] tracking-normal text-[#5b4428] opacity-80",
  },
  hospital: {
    canvas: "#fae7e3",
    layoutType: "STREET_POSTER",
    boardHeader: "PATIENT FILE · WARD",
    containerStyle: "bg-gradient-to-b from-[#fdf0ef]/40 via-[#fbe4e2]/20 to-[#f2cbc8]/50",
    cardStyle:
      "mx-auto my-2 block w-full max-w-[300px] rounded-none border border-[#b7a06a] bg-[#fdfaf1] px-4 py-3 text-start shadow-[2px_3px_0_rgb(159_18_57/0.16)] transition-transform hover:-translate-y-0.5 hover:bg-[#fffdf6]",
    accentColor: "#be123c",
    stampType: "WARD APPROVED",
    npcFont: "font-mono block text-2xl leading-snug text-[#2f1f0e]",
    optionFont: "font-mono block text-lg leading-relaxed text-[#2f1f0e]",
    hintFont: "font-arabic mt-1 block text-xs leading-[1.6] tracking-normal text-[#5b4428] opacity-80",
  },
};

/**
 * SPATIAL CANVAS MAPPINGS — the full-bleed backdrop shell each layoutType
 * renders as its viewport. Literal class names + exact fills/borders so the
 * ScenarioCanvas stays shape-driven and Tailwind always sees the strings.
 */
export const CANVAS_BACKDROPS: Record<SceneLayoutType, string> = {
  RECEIPT_MENU: "receipt-slip",
  MANILA_FOLDER: "manila-folder",
  CHALKBOARD: "chalk-board chalk-frame",
  STREET_POSTER: "",
};

export const CANVAS_THEME_COLORS: Record<
  SceneLayoutType,
  { bg: string; borderColor?: string; borderWidth?: number }
> = {
  RECEIPT_MENU: { bg: "#FFF6E3" },
  MANILA_FOLDER: { bg: "#E6C687", borderColor: "#C19A5B", borderWidth: 4 },
  CHALKBOARD: { bg: "#1E292B", borderColor: "#4A3525", borderWidth: 8 },
  STREET_POSTER: { bg: "#FFFDF7" },
};

/** Loose/legacy spellings → canonical SpotCategory (so the engine never
 *  renders generic CSS just because the DB sent "coffee_shop" or "STREET"). */
const CATEGORY_ALIASES: Record<string, SpotCategory> = {
  coffee_shop: "cafe",
  coffeeshop: "cafe",
  coffee: "cafe",
  kiosk: "street_vendor",
  street: "street_vendor",
  street_vendor_shop: "street_vendor",
  vendor: "street_vendor",
  taxi: "taxi_delivery",
  cab: "taxi_delivery",
  delivery: "taxi_delivery",
  university_campus: "university",
  uni: "university",
  govt: "govt_office",
  government: "govt_office",
  government_office: "govt_office",
  book_store: "bookshop",
  book_store_: "bookshop",
  pharmacy: "hospital",
  clinic: "hospital",
};

const warned = new Set<string>();

/**
 * Extract the theme for a spot category.
 * - trims + lowercases so case/whitespace can never miss a theme;
 * - maps legacy/loose spellings to their canonical category;
 * - falls back to a THEMED default (coffee-shop) — never generic CSS;
 * - logs a dev warning so unknown categories are easy to spot.
 */
export function themeForCategory(category?: string): ScenarioTheme {
  const key = (category ?? "").trim().toLowerCase();
  if (!key) {
    warnOnce("(empty)", themeForCategory.name);
    return THEMES.cafe;
  }
  if (key in THEMES) return THEMES[key as SpotCategory];
  const alias = CATEGORY_ALIASES[key];
  if (alias) {
    warnOnce(key, "alias");
    return THEMES[alias];
  }
  warnOnce(key, themeForCategory.name);
  return THEMES.cafe;
}

function warnOnce(key: string, source: string): void {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(
    `[themeConfig] no direct theme for "${key}" (${source}) — defaulting to coffee-shop theme.`
  );
}