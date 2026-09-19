import type { ReactNode } from "react";

import type { Spot, SpotCategory } from "@be-native/shared";

import { MAP_CHARGER_TEXTS } from "../data/seedData";

/** Board caption label — sourced from the seed map-charger texts. */
const BOARD_LABEL = MAP_CHARGER_TEXTS.find((item) => item.kind === "BOARD")?.label ?? "عقدة التحقيق";

export const CATEGORY_META: Record<SpotCategory, { labelAr: string }> = {
  cafe: { labelAr: "مقهى" },
  restaurant: { labelAr: "مطعم" },
  gym: { labelAr: "نادي" },
  taxi_delivery: { labelAr: "تكسي/توصيل" },
  university: { labelAr: "جامعة" },
  street_vendor: { labelAr: "بائع شارع" },
  bookshop: { labelAr: "مكتبة" },
  govt_office: { labelAr: "مكتب حكومي" },
  airport: { labelAr: "مطار" },
  hospital: { labelAr: "مستشفى" },
};

export const TIER_LABEL: Record<string, string> = {
  free: "عادي",
  standard: "معياري",
  professional: "محتري",
};

// Deterministic pseudo-random decoration (stable across renders).
function seed(j: number) {
  const x = Math.sin(j * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Hand-drawn line-art icons (24×24 grid, sketchy double stroke).
   Each icon is drawn twice: a faint "ghost" copy nudged right-down, then the
   crisp line — the classic pencil-sketch effect.
   ──────────────────────────────────────────────────────────────────────────── */

type IconBuilder = () => ReactNode;

const ICON_BUILDERS: Record<SpotCategory, IconBuilder> = {
  cafe: () => (
    <>
      <path d="M7.4 8.6H17l-.4 6.4A4.7 4.6 0 0 1 7.4 15Z" />
      <path d="M17.3 9.5c1.8.2 2.1 1.6 1.8 3.2-.3 1.4-.9 2.2-2 2.4" />
      <path d="M6.4 13.9c3.8 1.7 7.4 1.7 11.2 0" />
      <path d="M6.9 15c3.4 1.4 6.8 1.4 10.2 0" />
      <path d="M9.8 5.3c.7-1-.1-1.9.4-2.6M12.1 5.5c.7-1-.1-1.8.4-2.5M14.4 5.3c.6-.9-.1-1.7.3-2.4" />
    </>
  ),
  restaurant: () => (
    <>
      <path d="M8 10.2h8l-.8 5.4a4.1 4 0 0 1-8.1 0Z" />
      <path d="M6.9 15.6c3.5 1.3 6.8 1.3 10.3 0" />
      <path d="M10.4 6.6c.6-.9 0-1.4.4-2.3M13.7 6.6c.6-.9 0-1.4.4-2.3" />
      <path d="M15.8 4.6l-6.2 15.4M18.2 4.6l-6.2 15.4" />
    </>
  ),
  gym: () => (
    <g transform="rotate(9 12 12)">
      <path d="M6 11.2h12" />
      <rect x="5.4" y="10" width="2.4" height="4.4" rx="0.7" />
      <rect x="7.8" y="8.8" width="1.9" height="6.8" rx="0.5" />
      <rect x="14.3" y="8.8" width="1.9" height="6.8" rx="0.5" />
      <rect x="16.2" y="10" width="2.4" height="4.4" rx="0.7" />
      <path d="M12 4.6v1.4M12 16.2v1.2" />
    </g>
  ),
  taxi_delivery: () => (
    <>
      <path d="M5.6 16.4l2.4-4.2c.2-.4.6-.7 1.1-.7h5.8c.5 0 1 .3 1.2.7l2.3 4.2z" />
      <path d="M7.9 13.4h8.2" />
      <path d="M8.6 12.4l1.1-1.6c.2-.3.5-.5.9-.5h2.9c.4 0 .7.2.9.5l1.1 1.6" />
      <path d="M11.5 10.5l-.3-1h1.6l-.3 1" />
      <path d="M9.3 14.5h5.8" strokeDasharray="1.1 1.1" />
      <path d="M5.8 15.2h1.6" />
      <circle cx="8.4" cy="17.6" r="1.5" />
      <circle cx="15.6" cy="17.6" r="1.5" />
      <circle cx="8.4" cy="17.7" r="0.5" />
      <circle cx="15.6" cy="17.7" r="0.5" />
    </>
  ),
  university: () => (
    <>
      <path d="M4.2 9.2 12 5.8l7.8 3.4-7.8 3.4Z" />
      <path d="M5.4 10.4v4.6c0 1.6 2.9 2.6 6.6 2.6s6.6-1 6.6-2.6v-4.6" />
      <path d="M6.4 14.6c3.7 1.5 7.5 1.5 11.2 0" />
      <path d="M16.6 8v2.6c1.2-.2 2.1.2 2.5 1.1" />
    </>
  ),
  street_vendor: () => (
    <>
      <path d="M7.2 12.4h8.6l-.6 3.6a3.9 3.2 0 0 1-7.4 0Z" />
      <path d="M11.4 12.4l-.4-3.2h1.2l.2 3.2" />
      <path d="M15.9 13.6l3.1.8c.6.1.8.7.3 1.2l-2.7 1.1" />
      <path d="M6.8 13.6c-1.8 0-2.1-1.9-1.2-2.6.6-.5 1.8-.2 1.7.3" />
      <path d="M11.4 17.4h2.6l-.2 1.5a1.12 1.12 0 0 1-2.2 0Z" />
      <path d="M10 20c1.4.5 2.7.5 4 0" />
      <path d="M9.9 5c.5-.8-.1-1.4.3-2.1M12.6 5c.5-.8 0-1.4.4-2.1" />
    </>
  ),
  bookshop: () => (
    <>
      <rect x="6" y="16.2" width="12" height="2.8" rx="0.5" transform="rotate(-3 12 17.6)" />
      <path d="M6.5 17.7h11" transform="rotate(-3 12 17.6)" />
      <rect x="6.8" y="13.4" width="10.6" height="2.8" rx="0.5" transform="rotate(1.5 12 14.8)" />
      <rect x="8.4" y="10.6" width="7.4" height="2.7" rx="0.5" transform="rotate(-2 12 12)" />
      <path d="M9 12h6.2" transform="rotate(-2 12 12)" />
      <path d="M11.9 13.3l.3-2.8-.8-.8 1.7-.1-.3 3.9" />
    </>
  ),
  govt_office: () => (
    <>
      <path d="M4.2 9.8 12 4.4l7.8 5.4Z" />
      <path d="M5.6 9.8c2.4.8 4.1.8 4.1.8" opacity="0.35" />
      <path d="M6.4 12.8v3.4c0 .6.4 1.1 1.1 1.1h8.9c.6 0 1.1-.5 1.1-1.1v-3.4" />
      <path d="M6.4 9.8c1.4.4 2.8.4 4.1.8" opacity="0.35" />
      <path d="M8 12.8v4M12 12.8v4M16 12.8v4" />
      <path d="M12 9.8v3M10.8 11.2h2.4M12 12.8v3" />
    </>
  ),
  airport: () => (
    <>
      <path d="M12 3.4v6.4l7.4 3.7v1.6L12 13.4v4.2l1.8 1.5v1.2L12 19l-1.8 1.3v-1.2L12 17.6v-4.2l-7.4 1.7v-1.6L12 9.8V3.4" />
      <path d="M12 3.4c-.7.3-.6 1.2 0 1.4" />
      <path d="M9.4 13.2h.2M14.6 13.2h.2" />
    </>
  ),
  hospital: () => (
    <>
      <path d="M5.4 8.4 12 3.6l6.6 4.8Z" />
      <path d="M6.2 15.8h11.6l.2 3.6H6Z" />
      <path d="M6 8.4h12v7.4H6Z" />
      <path d="M12 8.4v3.2M10.4 10h3.2" />
      <path d="M8 11.4h.2M16 11.4h.2M8 14.4h.2M16 14.4h.2" />
    </>
  ),
};

export function DrawIcon({ category, title, size = 48 }: { category: SpotCategory; title?: string; size?: number }) {
  const sketchable = category in ICON_BUILDERS;
  const content = sketchable ? ICON_BUILDERS[category]?.() : ICON_BUILDERS.bookshop();
  const common = {
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none" as const,
  };
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden aria-label={title}>
      <g {...common} transform="translate(0.16 0.2)" opacity="0.16">
        {content}
      </g>
      <g {...common}>{content}</g>
    </svg>
  );
}

function LockDoodle({ size = 30 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" transform="translate(0.16 0.2)" opacity="0.18">
        <path d="M9.6 11.4v-2a2.4 2.4 0 0 1 4.8 0v2" />
        <path d="M8.4 11.4h7.2v6.4H8.4z" />
        <circle cx="12" cy="13.7" r="0.8" />
        <path d="M11.6 14.3l.4 1.3h.7l.3-1.3" />
      </g>
      <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M9.6 11.4v-2a2.4 2.4 0 0 1 4.8 0v2" />
        <path d="M8.4 11.4h7.2v6.4H8.4z" />
        <circle cx="12" cy="13.7" r="0.8" />
        <path d="M11.6 14.3l.4 1.3h.7l.3-1.3" />
      </g>
    </svg>
  );
}

/* ───────────────────── hand-drawn push-pin (investigation board) ─────────── */

function PushPinDoodle() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <g>
        {/* needle pushed down into the paper note */}
        <path d="M12 14.6v3" stroke="var(--color-ink-500)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M12 17.6c-1.05 0-1.75 1-1.75 2.15M12 17.6c1.05 0 1.75 1 1.75 2.15" stroke="var(--color-ink-500)" strokeWidth="1.35" strokeLinecap="round" fill="none" />
        <path d="M9.5 19.3q2.5 1.5 5 0" stroke="var(--color-ink-500)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        {/* tack head */}
        <circle cx="12" cy="8.2" r="5.9" fill="var(--color-kraft-500)" stroke="var(--color-ink-700)" strokeWidth="1.3" />
        <path d="M9 6.1a4.7 4.7 0 0 1 3.1-1.8" stroke="#fff8ea" strokeWidth="1.15" strokeLinecap="round" fill="none" opacity="0.9" />
        <path d="M13.6 10.7a5.6 5.6 0 0 0 1.8-1.6" stroke="var(--color-kraft-800)" strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.5" />
      </g>
    </svg>
  );
}

/* ─────────────────────────────── river + scenery ─────────────────────────- */

function DoodleRiver({ color }: { color: string }) {
  const d = "M42 1C36 9 34 19 39 28 44 37 52 41 51 50 50 60 43 65 42 73 41 82 48 92 47 101 46.6 105.5 47.2 108";
  return (
    <g>
      {/* wide organic ink body, dividing Karkh (west) from Rasafa (east) */}
      <path d={d} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" opacity="0.5" />
      {/* sketched bank edges */}
      <path d={d} fill="none" stroke={color} strokeWidth="1.7" strokeDasharray="3.5 6" opacity="0.45" transform="translate(6.5 1.5)" />
      <path d={d} fill="none" stroke={color} strokeWidth="1.7" strokeDasharray="3.5 6" opacity="0.45" transform="translate(-6.5 -1.5)" />
      {/* flow hatch */}
      <path d={d} fill="none" stroke="var(--color-kraft-200)" strokeWidth="1.3" strokeDasharray="2 9" opacity="0.7" transform="translate(0 2)" />
      {/* river island (sandbar) */}
      <path d="M47.2 44.5q2.6 1.7 3.6 4.3-2 1.7-4.2-.2-1-2.4.6-4.1z" fill="var(--color-kraft-100)" stroke={color} strokeWidth="0.7" opacity="0.9" />
      {/* two hand-drawn bridges crossing to the two banks */}
      <g stroke="var(--color-kraft-500)" strokeWidth="0.6" strokeDasharray="1.9 1.9" opacity="0.55">
        <path d="M31 33 61 33" />
        <path d="M30.5 34.5 61 34.5" />
        <path d="M35 78 57 78" />
        <path d="M34.5 79.5 57 79.5" />
      </g>
    </g>
  );
}

function DoodlePalm({ x, y, flip }: { x: number; y: number; flip: boolean }) {
  const sx = flip ? -1 : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${sx} 1)`} opacity="0.62">
      <path d="M0 0c-.3-1.1-1-2.4-1.1-4.2" stroke="var(--color-wasabi-600)" strokeWidth="0.55" fill="none" strokeLinecap="round" />
      <path d="M-1.1-4.2c1-.9 2-1.4 3-1.3-.3 1-.8 1.7-1.8 2.1-.7.3-1 -.5-.6-.8M-1.1-4.2c.7-1.2 1.6-2 2.8-2.6.1 1-.3 1.9-1.3 2.6-.8.5-1.3-.3-.9-.7M-1.1-4.2c-.2-1.3-.8-2.4-2-3.2-1 .2-1.6.9-1.6 2.2 0 .9.9 1.5 1.4.9M-1.1-4.2c-1-.3-2-.2-3.1.4.4 1 1.1 1.6 2.2 1.6.9 0 1.2-.9.6-1.3M-1.1-4.2c-1.2.4-2.2 1-3 2 .7.8 1.6 1 2.8.6.9-.3 1-1.2.3-1.5" stroke="var(--color-wasabi-600)" strokeWidth="0.55" fill="none" strokeLinecap="round" />
    </g>
  );
}

function DoodleBuilding({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const tilt = (seed(x * 13 + y * 7) - 0.5) * 10;
  const gable = seed(x + y) > 0.65;
  return (
    <g transform={`rotate(${tilt} ${x} ${y})`} opacity="0.42">
      {gable ? (
        <path d={`M${x - w / 2} ${y} v${h} h${w} V${y} M${x - w / 2} ${y} l${w / 2} ${-h * 0.4} ${w / 2} ${h * 0.4}`} stroke="var(--color-kraft-500)" strokeWidth="0.7" fill="none" />
      ) : (
        <path d={`M${x - w / 2} ${y} v${h} h${w} V${y}`} stroke="var(--color-kraft-500)" strokeWidth="0.7" fill="none" />
      )}
      <circle cx={x - w / 4} cy={y + h * 0.45} r="0.45" stroke="var(--color-kraft-500)" strokeWidth="0.45" />
      <circle cx={x + w / 4} cy={y + h * 0.45} r="0.45" stroke="var(--color-kraft-500)" strokeWidth="0.45" />
    </g>
  );
}

function DoodleLandmarks() {
  return (
    <g opacity="0.3" aria-hidden>
      {/* طاق كسرى — Sassanid arch on the eastern (Rusafa) bank */}
      <g transform="translate(92 78)" stroke="var(--color-kraft-600)" strokeWidth="0.9" fill="none" strokeLinecap="round">
        <path d="M-7 9V-4h1.6v6.2 10.6 0 0" />
        <path d="M7 9V-4h-1.6v6.2V15.2" />
        <path d="M-6.4-4h12.8" transform="translate(0 -0.6)" />
        <path d="M-6.4 0.6Q0 12 6.4 0.6" />
        <path d="M0 12.4V-4" />
      </g>
      {/* domed shrine on the western (Karkh) bank */}
      <g transform="translate(13 4)" stroke="var(--color-kraft-600)" strokeWidth="0.9" fill="none" strokeLinecap="round">
        <path d="M-6.5 11V3.4h13V11" />
        <path d="M-4.5 3.4q1.8-3.6 3.8-4.6t4.4 1.1 3 3.5" />
        <path d="M-3 11V6.6h6V11" />
      </g>
    </g>
  );
}

function CompassRose() {
  return (
    <g transform="translate(7.5 8)" stroke="var(--color-ink-500)" fill="none" strokeWidth="0.7" opacity="0.5">
      <circle r="2.3" />
      <path d="M0-3.4V-1.6M0 1.6v1.8M-3.1 0h1.8M1.3 0h1.8" />
      <path d="M0-2.9L0.9-0.6 0-1.4-0.9-0.6Z" fill="var(--color-ink-500)" stroke="none" />
      <circle r="0.22" fill="var(--color-ink-500)" stroke="none" />
    </g>
  );
}

function toPercent(v: number): string {
  const pct = ((v + 50) / 112) * 100 + 4;
  return `${Math.min(92, Math.max(4, pct))}%`;
}

/** Fixed layout placement (percent of the map canvas) so the seeded spots never crowd.
 *  Coordinates are geographic: Karkh on the west bank (left), Rasafa east (right).
 *  River channel rule: keep the 38%–62% middle band empty (no pin/card/label). */
const PIN_POS: Record<string, { x: number; y: number }> = {
  "Al-Mansour Street Cafe": { x: 18, y: 15 },
  "Karrada Street Tea Vendor": { x: 78, y: 40 },
  "Ziyouna Gym": { x: 74, y: 62 },
  "Baghdad Taxi Ride": { x: 20, y: 80 },
  "Mutanabbi Bookshop": { x: 78, y: 82 },
};

/* ─────────────────────── dynamic theming architecture ─────────────────────- */

export interface MapTheme {
  id: string;
  name?: string;
  /** Notebook paper background (CSS color). */
  cover: string;
  /** River ink color. */
  river: string;
  /** Investigation-thread color (e.g. "#b91c1c"). */
  thread: string;
  threadDash?: string;
  threadWidth?: number;
  threadOpacity?: number;
  sceneryOpacity?: number;
  labels: { karkh: string; rasafa: string; river: string };
}

export const NOTEBOOK_THEMES: Record<string, MapTheme> = {
  notebook: {
    id: "notebook",
    name: "دفتر التحقيق",
    cover: "var(--color-kraft-100)",
    river: "var(--color-kraft-400)",
    thread: "#b91c1c",
    threadDash: "3,3",
    threadWidth: 1.5,
    threadOpacity: 0.7,
    sceneryOpacity: 1,
    labels: { karkh: "الكرخ", rasafa: "الرصافة", river: "دِجْلَة" },
  },
  // Example seasonal/event skins can be added here and swapped at runtime
  // via the `theme` prop — no backend changes required.
};

const DEFAULT_THEME = NOTEBOOK_THEMES.notebook;

/** ViewBox coordinates (100×110) of a pin anchor, derived from its % placement. */
function pinPoint(spot: Spot): [number, number] {
  const fixed = PIN_POS[spot.title_en];
  const left = fixed ? fixed.x : parseFloat(toPercent(spot.position_x));
  const top = fixed ? fixed.y : parseFloat(toPercent(spot.position_y));
  return [left, top * 1.1];
}

/** Thin, hand-jittered thread path linking the spot notes in order. */
function threadPath(spots: Spot[]): string {
  let d = "";
  spots.forEach((spot, i) => {
    const [x, y] = pinPoint(spot);
    if (i === 0) d = `M${x} ${y}`;
    else {
      const [px, py] = pinPoint(spots[i - 1]);
      const mx = (px + x) / 2;
      const my = (py + y) / 2 + (seed(i * 7 + 3) - 0.5) * 4;
      d += ` Q${mx.toFixed(2)} ${my.toFixed(2)} ${x} ${y}`;
    }
  });
  return d;
}

/* ────────────────── base canvas: notebook + Tigris + threads ──────────────- */

export function NotebookMapCanvas({ spots, theme }: { spots: Spot[]; theme: MapTheme }) {
  return (
    <svg
      viewBox="0 0 100 110"
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 z-0 h-full w-full"
      role="img"
      aria-label="خريطة بغداد — لوحة تحقيق على دفتر ورق"
    >
      <rect x="0" y="0" width="100" height="110" fill={theme.cover} />

      {/* background scenery (painted before threads/pins) */}
      <g className="map-scenery" pointerEvents="none" opacity={theme.sceneryOpacity}>
        <CompassRose />
        <DoodleRiver color={theme.river} />
        <DoodleLandmarks />
        <DoodlePalm x={30} y={21} flip={false} />
        <DoodlePalm x={35} y={24.5} flip={true} />
        <DoodlePalm x={57} y={78} flip={true} />
        <DoodlePalm x={62} y={81} flip={false} />

        {/* irregular hand-drawn buildings along both banks */}
        {[[8, 36], [20, 44], [58, 27], [78, 40], [10, 66], [66, 64], [24, 78], [72, 88], [8, 94]].map(([bx, by], i) => (
          <DoodleBuilding key={i} x={bx} y={by} w={3.2 + seed(i * 3) * 3.4} h={3.6 + seed(i * 5 + 1) * 4.6} />
        ))}
      </g>

      {/* investigation threads — one crisp continuous SVG path on the pins */}
      <g className="map-threads" pointerEvents="none" opacity={theme.threadOpacity} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path
          d={threadPath(spots)}
          stroke={theme.thread}
          strokeWidth={theme.threadWidth}
          strokeDasharray={theme.threadDash}
        />
      </g>

      {/* district labels — clean Tajawal, west/east banks, clear of pins and river */}
      <g aria-hidden className="map-labels">
        <text x="15" y="60" fontSize="4.6" fontWeight="700" fill="var(--color-ink-700)" fontFamily="var(--font-sans)">
          {theme.labels.karkh}
        </text>
        <path d="M10 62.8q3.2.6 6.6.1 2.9-.4 5.6.8" stroke="var(--color-kraft-400)" strokeWidth="0.6" fill="none" opacity="0.8" />
        <text x="90" y="30" fontSize="4.6" fontWeight="700" fill="var(--color-ink-700)" fontFamily="var(--font-sans)">
          {theme.labels.rasafa}
        </text>
        <path d="M86.5 33q3 .5 5.6.1" stroke="var(--color-kraft-400)" strokeWidth="0.55" fill="none" opacity="0.8" />
      </g>

      {/* river name + flow arrow, drawn along the stream */}
      <g opacity="0.75" fill="none" className="map-river-name">
        <text x="36" y="14.5" fontSize="3.2" fontWeight="700" fill="var(--color-kraft-600)" fontFamily="var(--font-sans)">
          {theme.labels.river}
        </text>
        <path d="M41 9.4 44.4 8.8 41.4 12.8" stroke="var(--color-kraft-500)" strokeWidth="0.55" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/* ─────────────────────────────── map + paper notes ──────────────────────── - */

export function DoodleMap({
  spots,
  onSpotClick,
  disabled,
  theme = DEFAULT_THEME,
}: {
  spots: Spot[];
  onSpotClick: (spot: Spot) => void;
  disabled?: boolean;
  theme?: MapTheme;
}) {
  const unlocked = spots.filter((s) => !s.is_locked);
  const locked = spots.filter((s) => s.is_locked);

  return (
    <div className="relative mx-auto h-full w-full overflow-hidden">
      {/* swappable base canvas (notebook / Tigris / threads) */}
      <NotebookMapCanvas spots={spots} theme={theme} />

      {/* paper-note spot cutouts, pinned to the board */}
      {spots.map((spot) => {
        const meta = CATEGORY_META[spot.category];
        const lockedSpot = spot.is_locked;
        const fixed = PIN_POS[spot.title_en];
        const left = fixed ? `${fixed.x}%` : toPercent(spot.position_x);
        const top = fixed ? `${fixed.y}%` : toPercent(spot.position_y);
        const rot = (seed(spot.position_x * 7 + spot.position_y * 13) - 0.5) * 5;
        return (
          <button
            type="button"
            key={spot.id}
            disabled={disabled}
            onClick={() => onSpotClick(spot)}
            style={{ left, top }}
            className={`absolute z-10 -translate-x-1/2 outline-none ${
              lockedSpot ? "cursor-not-allowed" : "cursor-pointer"
            }`}
            aria-label={`${meta.labelAr} ${spot.title_en}`}
          >
            {/* push-pin: centered exactly on the thread anchor */}
            <span className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1/2" aria-hidden>
              <PushPinDoodle />
            </span>

            {/* paper note — fixed grid bounds, subtle kraft sticker, no float shadow */}
            <span
              className="relative z-10 flex h-[75px] w-[110px] flex-col items-center justify-center rounded-[8px] border border-ink-700/15 bg-[#fefae0]/80 p-2 text-ink-700 transition-transform"
              style={{ rotate: `${rot}deg` }}
            >
              <span className={`block text-center leading-none ${lockedSpot ? "opacity-60" : ""}`}>
                {lockedSpot ? <LockDoodle size={28} /> : <DrawIcon category={spot.category} title={spot.title_en} size={28} />}
              </span>
              <span className="mx-auto mt-1 block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-center font-sans text-xs font-bold leading-snug text-ink-700">
                {spot.title_ar}
              </span>
            </span>
          </button>
        );
      })}

      {/* board caption */}
      <figcaption className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap font-display text-base tracking-wide text-ink-500">
        <span className="inline-grid h-3.5 w-3.5 place-items-center align-[-1px]" aria-hidden>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.2 18.8l.8-4.6L15.4 5.8a1.7 1.7 0 0 1 2.4 0l.4.4a1.7 1.7 0 0 1 0 2.4l-8.7 8.1-4.5.9z" />
            <path d="M13.6 7.7l2.6 2.6" />
          </svg>
        </span>
        {BOARD_LABEL} · {unlocked.length} مفتوح {locked.length ? `· ${locked.length} على الطريق` : ""}
      </figcaption>
    </div>
  );
}