import { useEffect, useRef, useState } from "react";
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
      {/* hand-drawn chai glass (استكان) doodle — chai on the mind */}
      <path d="M8.2 3.4h2.6l-.4 3.8a1.9 1.9 0 0 1-3.7 0Z" />
      <path d="M7.6 7.9q1.9 1 3.8 0" />
      <path d="M8.6 4.4h1.8" />
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
  "Al-Mansour Street Cafe": { x: 18, y: 18 },
  "Karrada Street Tea Vendor": { x: 78, y: 44 },
  "Ziyouna Gym": { x: 76, y: 63 },
  "Baghdad Taxi Ride": { x: 20, y: 74 },
  "Mutanabbi Bookshop": { x: 50, y: 90 },
  "Al-Sayed Restaurant": { x: 88, y: 6 },
  "Baghdad Teaching Hospital": { x: 9, y: 26 },
  "Abu Jassem's Kiosk": { x: 62, y: 27 },
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

/* ─────────────────────────────────────────────────────────────────────────────
   Red Yarn System — hand-drawn detective yarn (not flight/dashed map lines):

   • Anchors are computed DYNAMICALLY from the real CSS layout: each card is
     placed with `left/top: <pct>%` inside the map container, the container is
     measured with a ResizeObserver, and the pin head (the pushpin circle) is
     derived in the same pixel frame, then mapped back into the SVG viewBox.
     The yarn therefore meets the actual pushpin the user sees on screen —
     no hardcoded viewBox coordinates, no detached threads.
   • Cubic Bézier with gravity sag: each thread sags below its two pins,
     exactly like a real yarn loosely hand-pinned to a cork board.
   • Bridges: threads cross the Tigris only at the two DoodleRiver bridges
     (never blindly over water or labels).
   • Routing never self-crosses: pins are chained per bank (Karkh → Rasafa)
     sorted by latitude, then connected through the single nearest bridge.
   • Three status costumes:
       active/solved  → solid burgundy/red yarn (drawn, weighty)
       locked         → faint chalky grey dotted yarn (idea, unopened)
   ──────────────────────────────────────────────────────────────────────────── */

/** Measured pixel size of the map container. */
interface MapSize {
  w: number;
  h: number;
}

/** How the 100×110 viewBox is letterbox-fitted (preserveAspectRatio meet) into
 *  the measured container — the inverse mapping CSS px → viewBox units. */
function fitOf({ w, h }: MapSize) {
  const scale = Math.min(w / 100, h / 110);
  return { scale, offsetX: (w - 100 * scale) / 2, offsetY: (h - 110 * scale) / 2 };
}

/** CSS % (0–100) placement of a card — the SAME source the DOM <button> uses. */
function pinPercent(spot: Spot): [number, number] {
  const fixed = PIN_POS[spot.title_en];
  return [
    fixed ? fixed.x : parseFloat(toPercent(spot.position_x)),
    fixed ? fixed.y : parseFloat(toPercent(spot.position_y)),
  ];
}

/** Pushpin head anchor in viewBox coordinates, derived from the live CSS layout:
 *  same % as the card button, measured container size, mapped back into the
 *  100×110 scene so the yarn meets the visible pin exactly.
 *
 *  The pin span floats `top: -7px; translate-y: -50%` above the button (20px
 *  tall), and the pushpin HEAD circle sits at y=8.2 of its 24-unit viewBox →
 *  8.2/24 ≈ 0.342 of the 20px height. So the head center is ≈10.2px ABOVE the
 *  button top edge. This offset is used only pre-measurement (safe fallback);
 *  live renders use the measured DOM rect centre of the actual pin head. */
const PIN_HEAD_OFFSET_PX = 10.2;

function pinAnchor(spot: Spot, size: MapSize): [number, number] {
  const [pctX, pctY] = pinPercent(spot);
  const fit = fitOf(size);
  const xPx = (pctX / 100) * size.w;
  const yPx = (pctY / 100) * size.h - PIN_HEAD_OFFSET_PX;
  return [(xPx - fit.offsetX) / fit.scale, (yPx - fit.offsetY) / fit.scale];
}

/** Waypoint (bridge) that routes a yarn segment across the Tigris. */
const RIVER_BRIDGES: ReadonlyArray<{ id: string; x: number; y: number }> = [
  { id: "north", x: 50, y: 33 },
  { id: "south", x: 50, y: 78 },
];

/** Which bank a pin sits on — west of the river channel (x<38%) or east. */
function bankOfX(x: number): "west" | "east" {
  return x < 38 ? "west" : "east";
}

/** Measured pin positions in viewBox units, merged with `pins` of ctx. */
interface MapCtx {
  size: MapSize;
  pins: Record<string, [number, number]>;
}

function pinAnchorCtx(spot: Spot, ctx: MapCtx): [number, number] {
  const explicit = ctx.pins[spot.id];
  if (explicit) return explicit;
  return pinAnchor(spot, ctx.size);
}

/** Chain pins top→bottom (same bank only) — no zigzag, no self-crossing. */
function chainPath(chain: Spot[], ctx: MapCtx): string {
  let d = "";
  chain.forEach((spot, i) => {
    const to = pinAnchorCtx(spot, ctx);
    if (i === 0) {
      d = `M${to[0].toFixed(2)} ${to[1].toFixed(2)}`;
      return;
    }
    const from = pinAnchorCtx(chain[i - 1], ctx);
    d += ` ${yarnCurve(from, to, i)}`;
  });
  return d;
}

/** Yarn curve — smooth cubic Bézier with a GENEROUS gravity bow so threads
 *  never read as straight PCB wires on the board.
 *  The control points are pushed perpendicular to the chord (alternating side
 *  per segment index) plus a downward bias — like a hand-pinned thread with
 *  visible slack. */
function yarnCurve(from: [number, number], to: [number, number], i = 0): string {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  // Visible slack: at least 4.5 viewBox units (~25px), scaling with the chord.
  const sag = Math.min(14, Math.max(4.5, len * 0.26));
  // Right-hand unit normal of the chord — the bow direction.
  const nx = -dy / len;
  const ny = dx / len;
  const side = i % 2 === 0 ? 1 : -1;
  const bow = sag * side * 0.48;
  // Chunky movement along the chord: always a visible curve, never a straight
  // vertical or horizontal drop — orthogonal PCB look is now impossible.
  const ax = Math.min(0.26, Math.max(0.15, Math.abs(dx) / (Math.abs(dx) + Math.abs(dy) + 1e-6)));
  const cx1 = x1 + dx * (0.5 - ax) + nx * bow;
  const cy1 = y1 + dy * (0.5 - ax) + ny * bow + sag * 0.34;
  const cx2 = x1 + dx * (0.5 + ax) + nx * bow;
  const cy2 = y1 + dy * (0.5 + ax) + ny * bow + sag * 0.34;
  return `M${x1.toFixed(2)} ${y1.toFixed(2)} C${cx1.toFixed(2)} ${cy1.toFixed(2)} ${cx2.toFixed(2)} ${cy2.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

/** Route through a bridge waypoint — two lazy quadratics with visible sag. */
function yarnCurveVia(from: [number, number], to: [number, number], waypoint: { x: number; y: number }, i = 0): string {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const w = waypoint;
  const lenA = Math.hypot(w.x - x1, w.y - y1) || 1;
  const lenB = Math.hypot(x2 - w.x, y2 - w.y) || 1;
  const sagA = Math.min(10, Math.max(3, lenA * 0.18));
  const sagB = Math.min(10, Math.max(3, lenB * 0.18));
  const side = i % 2 === 0 ? 1 : -1;
  return (
    `M${x1.toFixed(2)} ${y1.toFixed(2)} ` +
    `Q${(((x1 + w.x) / 2) + side * sagA * 0.35).toFixed(2)} ${(((y1 + w.y) / 2) + sagA).toFixed(2)} ${w.x.toFixed(2)} ${w.y.toFixed(2)} ` +
    `Q${(((w.x + x2) / 2) - side * sagB * 0.35).toFixed(2)} ${(((w.y + y2) / 2) + sagB).toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`
  );
}

/** Non-crossing route: west bank chain → nearest bridge → east bank chain. */
function routeYarn(spots: Spot[], ctx: MapCtx): string {
  const anchor = (s: Spot) => pinAnchorCtx(s, ctx);
  const west = spots.filter((s) => bankOfX(anchor(s)[0]) === "west").sort((a, b) => anchor(a)[1] - anchor(b)[1]);
  const east = spots.filter((s) => bankOfX(anchor(s)[0]) === "east").sort((a, b) => anchor(a)[1] - anchor(b)[1]);
  if (west.length === 0 || east.length === 0) {
    return chainPath([...west, ...east].sort((a, b) => anchor(a)[1] - anchor(b)[1]), ctx);
  }
  // pick the bridge closest to the segment between the two banks
  const [wx, wy] = anchor(west[west.length - 1]);
  const [ex, ey] = anchor(east[0]);
  const mx = (wx + ex) / 2;
  const my = (wy + ey) / 2;
  let bridge = RIVER_BRIDGES[0];
  let best = Infinity;
  for (const b of RIVER_BRIDGES) {
    const dist = (b.x - mx) ** 2 + (b.y - my) ** 2;
    if (dist < best) {
      best = dist;
      bridge = b;
    }
  }
  const chain = [...west, ...east];
  let d = "";
  chain.forEach((spot, i) => {
    const to = anchor(spot);
    if (i === 0) {
      d = `M${to[0].toFixed(2)} ${to[1].toFixed(2)}`;
      return;
    }
    const from = anchor(chain[i - 1]);
    if (bankOfX(anchor(chain[i - 1])[0]) === "west" && bankOfX(anchor(spot)[0]) === "east") {
      d += ` ${yarnCurveVia(from, to, bridge, i)}`;
    } else {
      d += ` ${yarnCurve(from, to, i)}`;
    }
  });
  return d;
}

/* ────────────────── base canvas: notebook + Tigris + threads ──────────────- */

/** Soft drop-shadow filter — gives the yarn a raised, physical look over the
 *  paper (like real red thread slightly above the board). */
const YARN_FILTER_ID = "yarn-dropshadow";

export function NotebookMapCanvas({
  spots,
  theme,
  measuredPins = {},
}: {
  spots: Spot[];
  theme: MapTheme;
  measuredPins?: Record<string, [number, number]>;
}) {
  const unlocked = spots.filter((s) => !s.is_locked);
  const locked = spots.filter((s) => s.is_locked);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<MapSize>({ w: 100, h: 110 });
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const ctx: MapCtx = { size, pins: measuredPins };
  return (
    <div ref={wrapRef} className="absolute inset-0 z-0 h-full w-full overflow-hidden">
    <svg
      viewBox="0 0 100 110"
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full"
      role="img"
      aria-label="خريطة بغداد — لوحة تحقيق على دفتر ورق"
    >
      <defs>
        <filter id={YARN_FILTER_ID} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="1" dy="1.6" stdDeviation="1.4" floodColor="#2a1513" floodOpacity="0.3" />
        </filter>
      </defs>
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

      {/* Red Yarn System — detective threads (sagging Béziers, pinned at pushpin
          heads, crossing the Tigris only at bridge waypoints; locked spots get a
          faint chalky dotted yarn).
          The whole thread layer sits at z-0 (behind) — cards & pins are z-10/20,
          so the yarn emerges from UNDER the pin heads, never over the notes. */}
      <g className="map-threads" pointerEvents="none" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {locked.length > 0 && (
          <path
            d={routeYarn(locked, ctx)}
            stroke="var(--color-ink-300)"
            strokeWidth={Math.max(0.8, (theme.threadWidth ?? 1.5) - 0.55)}
            strokeDasharray="2 3.5"
            opacity={0.4}
            aria-hidden
          />
        )}
        {/* active yarn — two layered passes for depth (shadow + bright red) */}
        <path d={routeYarn(unlocked, ctx)} stroke="currentColor" strokeWidth={0.4} opacity={0} aria-hidden />
        <path
          d={routeYarn(unlocked, ctx)}
          stroke={theme.thread}
          strokeWidth={Math.max(1.7, (theme.threadWidth ?? 1.6) + 0.5)}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${YARN_FILTER_ID})`}
          className="yarn-shadow"
        />
        <path
          d={routeYarn(unlocked, ctx)}
          stroke={theme.thread}
          strokeWidth={Math.max(1.55, (theme.threadWidth ?? 1.6) + 0.35)}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="yarn-core"
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
    </div>
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
  const currentSpot = unlocked[unlocked.length - 1] ?? null;
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [measuredPins, setMeasuredPins] = useState<Record<string, [number, number]>>({});
  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;
    const measurePins = () => {
      const next: Record<string, [number, number]> = {};
      container.querySelectorAll<HTMLElement>("[data-pin-id]").forEach((pinEl) => {
        const id = pinEl.dataset.pinId;
        if (!id) return;
        const pinRect = pinEl.getBoundingClientRect();
        const mapRect = container.getBoundingClientRect();
        // pushpin HEAD circle centre: y = 8.2 of the 24-unit viewBox (~0.342),
        // so we target the visible red head, not the span or the card edge.
        const headX = pinRect.left + pinRect.width / 2;
        const headY = pinRect.top + pinRect.height * (8.2 / 24);
        const xPx = headX - mapRect.left;
        const yPx = headY - mapRect.top;
        const fit = fitOf({ w: container.clientWidth, h: container.clientHeight });
        next[id] = [(xPx - fit.offsetX) / fit.scale, (yPx - fit.offsetY) / fit.scale];
      });
      setMeasuredPins(next);
    };
    measurePins();
    // re-measure on the next frame so fonts/scrollbars/card layout have settled
    const raf = requestAnimationFrame(measurePins);
    const ro = new ResizeObserver(measurePins);
    ro.observe(container);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [spots]);

  return (
    <div ref={mapRef} className="relative mx-auto h-full w-full overflow-hidden pb-8">
      {/* swappable base canvas (notebook / Tigris / threads) */}
      <NotebookMapCanvas spots={spots} theme={theme} measuredPins={measuredPins} />
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
            {/* push-pin: thread wraps around pin head (anchor lifted 7 units) — pin sits ON TOP of the yarn */}
            <span
              data-pin-id={spot.id}
              className="pointer-events-none absolute left-1/2 top-[-7px] z-20 -translate-x-1/2 -translate-y-1/2"
              aria-hidden
            >
              <PushPinDoodle />
            </span>

            {/* paper note — fixed grid bounds, subtle kraft sticker, no float shadow */}
            <span
              className={`relative z-10 flex h-[80px] w-[110px] flex-col items-center justify-center rounded-[8px] border p-2 text-ink-700 transition-transform duration-150 ${
                lockedSpot
                  ? "border-dashed border-ink-700/25 bg-kraft-100/70 opacity-70"
                  : "border-wasabi-600/45 bg-[#fefae0]/90 shadow-[0_0_12px_-2px_var(--color-highlighter)] card-wobble"
              }`}
              style={{ rotate: `${rot}deg` }}
            >
              <span className={`block text-center leading-none ${lockedSpot ? "opacity-40 grayscale" : ""}`}>
                {lockedSpot ? <LockDoodle size={28} /> : <DrawIcon category={spot.category} title={spot.title_en} size={28} />}
              </span>
              <span className="mx-auto mt-1 block max-w-full text-center font-sans text-[11px] font-bold leading-tight text-ink-700 line-clamp-2">
                {spot.title_ar}
              </span>
            </span>
            {!lockedSpot && currentSpot && spot.id === currentSpot.id && (
              <span className="pointer-events-none absolute -bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border border-ink-700/20 bg-[#fefae0]/95 px-1.5 py-0.5 font-sans text-[9px] font-bold text-ink-700 shadow-sm">
                <span className="here-beacon inline-block size-1.5 rounded-full bg-red-600" aria-hidden />
                أنت هنا
              </span>
            )}
          </button>
        );
      })}

      {/* board caption */}
      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center bg-gradient-to-t from-kraft-100 via-kraft-100/85 to-transparent px-3 pb-1.5 pt-4">
        <span className="inline-grid h-3.5 w-3.5 place-items-center align-[-1px]" aria-hidden>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.2 18.8l.8-4.6L15.4 5.8a1.7 1.7 0 0 1 2.4 0l.4.4a1.7 1.7 0 0 1 0 2.4l-8.7 8.1-4.5.9z" />
            <path d="M13.6 7.7l2.6 2.6" />
          </svg>
        </span>
        <span className="rounded-full border border-ink-700/10 bg-kraft-50/70 px-2.5 py-0.5 font-display text-sm tracking-wide text-ink-500 backdrop-blur-[2px]">
          {BOARD_LABEL} · {unlocked.length} مفتوح {locked.length ? `· ${locked.length} على الطريق` : ""}
        </span>
      </figcaption>
    </div>
  );
}