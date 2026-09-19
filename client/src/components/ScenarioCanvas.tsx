import type { ReactNode } from "react";

import type {
  ScenarioEvaluateResult,
  ScenarioGraph,
  ScenarioNode,
  ScenarioOption,
} from "@be-native/shared";

import type { SceneLayoutType, ScenarioTheme } from "../themeConfig";
import { SCENARIO_COMPLETE_COPY, UI_GENZ_COPY } from "../data/seedData";

/** Fake barcode bars for the café order-slip header. */
const BARCODE_BARS = [3, 1, 2, 1, 3, 2, 4, 1, 2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2];

/** Latest evaluation landing in the action zone (option pick or LLM result). */
export type ScenarioFeedback =
  | { kind: "option"; option: ScenarioOption; correct: boolean }
  | { kind: "evaluate"; result: ScenarioEvaluateResult };

export interface ScenarioCanvasProps {
  theme: ScenarioTheme;
  status: "loading" | "error" | "ready";
  errorText: string;
  complete: boolean;
  graph: ScenarioGraph | null;
  currentNode: ScenarioNode | null;
  progressStats: { step: number; total: number };
  speaker: { name_ar: string } | null;
  evaluation: ScenarioFeedback | null;
  fbCorrect: boolean;
  fbXp: number;
  freeText: string;
  evaluating: boolean;
  xpGained: number;
  energyCost: number;
  xpDisplay: number;
  energyDisplay: string | number;
  stageTitle: string;
  stageLocation: string;
  slamKey: number;
  /** Current number of unlocked traces (shown on the "أثر" trigger badge). */
  collectibleCount: number;
  onOpenCollectibles: () => void;
  onSelectOption: (option: ScenarioOption) => void;
  onSubmitFreeText: () => void;
  onContinue: () => void;
  onRetry: () => void;
  onFreeTextChange: (value: string) => void;
  onBackToMap: () => void;
}

/* ──────────────────────────────────────────────────────────────────────── */

function BoltIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 2.5v4.2M10 13.3v4.2M2.5 10h4.2M13.3 10h4.2M4.6 4.6l3 3M12.4 12.4l3 3M15.4 4.6l-3 3M7.6 12.4l-3 3" />
    </svg>
  );
}

function SparkIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 2l2.2 5.2L17.4 9 12.2 11l-2.2 5.2L7.8 11 2.6 9l5.2-1.8z" />
      <path d="M15.5 13.5l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z" />
    </svg>
  );
}

/** Hand-drawn doodle coffee cup for the café order slip header. */
function CoffeeDoodle({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4.5 8.5h11v7a3.5 3.5 0 0 1-3.5 3.5H8a3.5 3.5 0 0 1-3.5-3.5v-7Z" />
      <path d="M15.5 10h1.5a2 2 0 0 1 0 4h-1.5" />
      <path d="M8.5 5.5c-.6-.9.4-1.3 0-2.1M11.5 5c.5-.7-.4-1.5 0-2.4" />
      <path d="M6.5 17c.7 1.1 2.4 1.2 3.5 0M11 17c.7 1.1 2.4 1.2 3.5 0" />
    </svg>
  );
}

/**
 * Strict LTR isolation for English strings that live inside the Arabic
 * (RTL) shell — keeps punctuation like "?Yo Abu Saleh!" in place.
 */
function LtrText({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span dir="ltr" className={`inline-block unicode-bidi-isolate ${className}`}>
      {children}
    </span>
  );
}

/* ── per-template visual sets (literal Tailwind classes) ────────────────
   One shared warm-notebook paper canvas; templates differ ONLY in
   accent ink tone, hand-drawn border style and tiny corner doodles.  */

interface CanvasStyleSet {
  surface: string;
  sheet: string | undefined;
  stepLabel: string;
  dialogue: string;
  hint: string;
  optionCard: string;
  optionPrimary: string;
  optionHint: string;
  freeHint: string;
  freeInput: string;
  evalBtn: string;
  feedbackCard: string;
  feedbackSub: string;
  feedbackRow: string;
  continueBtn: string;
  chip: string;
  backBtn: string;
  statusText: string;
  errorText: string;
  completeTitle: string;
  completeBody: string;
  linkBtn: string;
}

const SURFACE_ROOT = "fixed inset-0 w-screen h-screen overflow-hidden flex flex-col justify-between p-6";
const PAPER = "bg-[#FFFDF7]";

const CANVAS_STYLES = {
  /* café / kiosk — warm coffee-brown ink (#5C3A21) */
  RECEIPT_MENU: {
    surface: PAPER,
    sheet: undefined,
    stepLabel: "font-arabic mb-3 text-xs leading-relaxed text-[#5C3A21]/75",
    dialogue: "font-mono text-xl leading-relaxed text-[#5C3A21] md:text-2xl",
    hint: "font-arabic mt-4 max-w-xl text-sm leading-[1.7] text-[#5C3A21]/70",
    optionCard:
      "block w-full cursor-pointer border-b-2 border-dashed border-[#5C3A21]/60 bg-[#FBEFE0]/60 p-4 text-start transition-colors hover:bg-[#EFDDBF]",
    optionPrimary: "font-mono block text-lg leading-relaxed text-[#5C3A21]",
    optionHint: "font-arabic mt-0.5 block text-xs leading-[1.6] text-[#5C3A21]/70",
    freeHint: "font-arabic mb-1 block text-xs text-[#5C3A21]/70",
    freeInput:
      "font-mono min-w-0 flex-1 rounded-none border-b-2 border-dashed border-[#5C3A21]/60 bg-transparent px-1 py-2 text-sm text-[#5C3A21] outline-none placeholder:text-[#5C3A21]/35",
    evalBtn:
      "font-arabic shrink-0 rounded-full border border-[#5C3A21]/50 bg-[#FFFDF7] px-3 py-1.5 text-xs text-[#5C3A21] transition-colors hover:bg-[#EFDDBF] disabled:cursor-not-allowed disabled:opacity-50",
    feedbackCard: "w-full border-2 p-4",
    feedbackSub: "font-arabic mt-1.5 text-[11px] leading-[1.6] text-[#5C3A21]/60",
    feedbackRow: "mt-3 flex flex-wrap items-center gap-2",
    continueBtn:
      "font-arabic mt-3 w-full rounded-full border border-[#5C3A21]/50 bg-[#FFFDF7] px-4 py-2 text-sm text-[#5C3A21] transition-colors hover:bg-[#EFDDBF]",
    chip: "hidden items-center gap-1 rounded-full border border-[#5C3A21]/40 bg-[#FFFDF7] px-2.5 py-1 text-[10px] font-bold text-[#5C3A21] sm:inline-flex",
    backBtn:
      "font-arabic shrink-0 rounded-full border border-[#5C3A21]/40 bg-[#FFFDF7] px-3 py-1.5 text-xs text-[#5C3A21] transition-colors hover:bg-[#EFDDBF]",
    statusText: "font-arabic text-lg leading-[1.6] text-[#5C3A21]/70",
    errorText: "font-arabic w-full max-w-xl text-sm leading-[1.6] text-[#5C3A21]",
    completeTitle: "font-display text-3xl leading-relaxed text-[#5C3A21]",
    completeBody: "font-arabic text-sm leading-[1.6] text-[#5C3A21]/70",
    linkBtn: "font-arabic -mt-1 text-sm text-[#5C3A21] underline underline-offset-4",
  },

  /* govt / university — classic navy ink (#1E3A8A) + red margin lines */
  MANILA_FOLDER: {
    surface: PAPER,
    sheet: undefined,
    stepLabel: "font-arabic mb-3 text-xs leading-relaxed text-[#1E3A8A]/75",
    dialogue: "font-mono text-xl leading-relaxed text-[#1E3A8A] md:text-2xl",
    hint: "font-arabic mt-4 max-w-xl text-sm leading-[1.7] text-[#1E3A8A]/70",
    optionCard:
      "block w-full cursor-pointer border-l-4 border-[#8B0000] bg-white/70 p-4 text-start transition-colors hover:bg-red-50/50",
    optionPrimary: "font-mono block text-lg leading-relaxed text-[#1E3A8A]",
    optionHint: "font-arabic mt-0.5 block text-xs leading-[1.6] text-[#1E3A8A]/70",
    freeHint: "font-arabic mb-1 block text-xs text-[#1E3A8A]/70",
    freeInput:
      "font-mono min-w-0 flex-1 rounded-none border-b-2 border-[#1E3A8A]/50 bg-transparent px-1 py-2 text-sm text-[#1E3A8A] outline-none placeholder:text-[#1E3A8A]/35",
    evalBtn:
      "font-arabic shrink-0 rounded-full border border-[#1E3A8A]/50 bg-[#FFFDF7] px-3 py-1.5 text-xs text-[#1E3A8A] transition-colors hover:bg-blue-50/60 disabled:cursor-not-allowed disabled:opacity-50",
    feedbackCard: "w-full border-2 p-4",
    feedbackSub: "font-arabic mt-1.5 text-[11px] leading-[1.6] text-[#1E3A8A]/60",
    feedbackRow: "mt-3 flex flex-wrap items-center gap-2",
    continueBtn:
      "font-arabic mt-3 w-full rounded-full border border-[#1E3A8A]/50 bg-[#FFFDF7] px-4 py-2 text-sm text-[#1E3A8A] transition-colors hover:bg-blue-50/60",
    chip: "hidden items-center gap-1 rounded-full border border-[#1E3A8A]/40 bg-[#FFFDF7] px-2.5 py-1 text-[10px] font-bold text-[#1E3A8A] sm:inline-flex",
    backBtn:
      "font-arabic shrink-0 rounded-full border border-[#1E3A8A]/40 bg-[#FFFDF7] px-3 py-1.5 text-xs text-[#1E3A8A] transition-colors hover:bg-blue-50/60",
    statusText: "font-arabic text-lg leading-[1.6] text-[#1E3A8A]/70",
    errorText: "font-arabic w-full max-w-xl text-sm leading-[1.6] text-[#1E3A8A]",
    completeTitle: "font-display text-3xl leading-relaxed text-[#1E3A8A]",
    completeBody: "font-arabic text-sm leading-[1.6] text-[#1E3A8A]/70",
    linkBtn: "font-arabic -mt-1 text-sm text-[#1E3A8A] underline underline-offset-4",
  },

  /* gym / training — emerald chalk-ink accents (#065F46), dashed chalk edges */
  CHALKBOARD: {
    surface: PAPER,
    sheet: undefined,
    stepLabel: "font-arabic mb-3 text-xs leading-relaxed text-[#065F46]/75",
    dialogue: "font-mono text-xl leading-relaxed text-[#065F46] md:text-2xl",
    hint: "font-arabic mt-4 max-w-xl text-sm leading-[1.7] text-[#065F46]/70",
    optionCard:
      "block w-full cursor-pointer rounded-sm border-2 border-dashed border-emerald-800/60 bg-[#FFFDF7] p-4 text-start transition-colors hover:bg-emerald-50/70",
    optionPrimary: "font-mono block text-lg leading-relaxed text-emerald-900",
    optionHint: "font-arabic mt-0.5 block text-xs leading-[1.6] text-[#065F46]/70",
    freeHint: "font-arabic mb-1 block text-xs text-[#065F46]/70",
    freeInput:
      "font-mono min-w-0 flex-1 rounded-none border-b-2 border-dashed border-emerald-800/60 bg-transparent px-1 py-2 text-sm text-[#065F46] outline-none placeholder:text-[#065F46]/35",
    evalBtn:
      "font-arabic shrink-0 rounded-full border border-emerald-800/50 bg-[#FFFDF7] px-3 py-1.5 text-xs text-[#065F46] transition-colors hover:bg-emerald-50/70 disabled:cursor-not-allowed disabled:opacity-50",
    feedbackCard: "w-full border-2 p-4",
    feedbackSub: "font-arabic mt-1.5 text-[11px] leading-[1.6] text-[#065F46]/60",
    feedbackRow: "mt-3 flex flex-wrap items-center gap-2",
    continueBtn:
      "font-arabic mt-3 w-full rounded-full border border-emerald-800/50 bg-[#FFFDF7] px-4 py-2 text-sm text-[#065F46] transition-colors hover:bg-emerald-50/70",
    chip: "hidden items-center gap-1 rounded-full border border-emerald-800/40 bg-[#FFFDF7] px-2.5 py-1 text-[10px] font-bold text-[#065F46] sm:inline-flex",
    backBtn:
      "font-arabic shrink-0 rounded-full border border-emerald-800/40 bg-[#FFFDF7] px-3 py-1.5 text-xs text-[#065F46] transition-colors hover:bg-emerald-50/70",
    statusText: "font-arabic text-lg leading-[1.6] text-[#065F46]/70",
    errorText: "font-arabic w-full max-w-xl text-sm leading-[1.6] text-[#065F46]",
    completeTitle: "font-display text-3xl leading-relaxed text-emerald-900",
    completeBody: "font-arabic text-sm leading-[1.6] text-[#065F46]/70",
    linkBtn: "font-arabic -mt-1 text-sm text-[#065F46] underline underline-offset-4",
  },

  /* street / library / default — dark charcoal graphite ink (#27272A), pinned sheet */
  STREET_POSTER: {
    surface: PAPER,
    sheet:
      "relative flex h-full w-full flex-col justify-between gap-5 border border-amber-900/20 bg-[#FFFDF7] px-5 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.12)]",
    stepLabel: "font-arabic mb-3 text-xs leading-relaxed text-[#27272A]/75",
    dialogue: "font-mono text-xl leading-relaxed text-[#27272A] md:text-2xl",
    hint: "font-arabic mt-4 max-w-xl text-sm leading-[1.7] text-[#27272A]/70",
    optionCard:
      "block w-full cursor-pointer border-b-2 border-[#27272A]/30 bg-transparent p-4 text-start transition-colors hover:bg-[#27272A]/5",
    optionPrimary: "font-mono block text-lg leading-relaxed text-[#27272A]",
    optionHint: "font-arabic mt-0.5 block text-xs leading-[1.6] text-[#27272A]/70",
    freeHint: "font-arabic mb-1 block text-xs text-[#27272A]/70",
    freeInput:
      "font-mono min-w-0 flex-1 rounded-none border-b-2 border-[#27272A]/40 bg-transparent px-1 py-2 text-sm text-[#27272A] outline-none placeholder:text-[#27272A]/35",
    evalBtn:
      "font-arabic shrink-0 rounded-full border border-[#27272A]/50 bg-[#FFFDF7] px-3 py-1.5 text-xs text-[#27272A] transition-colors hover:bg-[#27272A]/5 disabled:cursor-not-allowed disabled:opacity-50",
    feedbackCard: "w-full border-2 p-4",
    feedbackSub: "font-arabic mt-1.5 text-[11px] leading-[1.6] text-[#27272A]/60",
    feedbackRow: "mt-3 flex flex-wrap items-center gap-2",
    continueBtn:
      "font-arabic mt-3 w-full rounded-full border border-[#27272A]/50 bg-[#FFFDF7] px-4 py-2 text-sm text-[#27272A] transition-colors hover:bg-[#27272A]/5",
    chip: "hidden items-center gap-1 rounded-full border border-[#27272A]/40 bg-[#FFFDF7] px-2.5 py-1 text-[10px] font-bold text-[#27272A] sm:inline-flex",
    backBtn:
      "font-arabic shrink-0 rounded-full border border-[#27272A]/40 bg-[#FFFDF7] px-3 py-1.5 text-xs text-[#27272A] transition-colors hover:bg-[#27272A]/5",
    statusText: "font-arabic text-lg leading-[1.6] text-[#27272A]/70",
    errorText: "font-arabic w-full max-w-xl text-sm leading-[1.6] text-[#27272A]",
    completeTitle: "font-display text-3xl leading-relaxed text-[#27272A]",
    completeBody: "font-arabic text-sm leading-[1.6] text-[#27272A]/70",
    linkBtn: "font-arabic -mt-1 text-sm text-[#27272A] underline underline-offset-4",
  },
} satisfies Record<SceneLayoutType, CanvasStyleSet>;

type CanvasStyles = CanvasStyleSet;

/* ──────────────────────────────────────────────────────────────────────── */

interface TemplateHeaderProps {
  tpl: SceneLayoutType;
  s: CanvasStyles;
  stageTitle: string;
  stageLocation: string;
  xpDisplay: number;
  energyDisplay: string | number;
  collectibleCount: number;
  onOpenCollectibles: () => void;
  onBackToMap: () => void;
}

function TemplateHeader({
  tpl,
  s,
  stageTitle,
  stageLocation,
  xpDisplay,
  energyDisplay,
  collectibleCount,
  onOpenCollectibles,
  onBackToMap,
}: TemplateHeaderProps) {
  const cluster = (
    <div className="flex shrink-0 items-center gap-3">
      <span className={s.chip}>
        <SparkIcon className="size-3" />
        <b className="font-arabic">{xpDisplay}</b>
        <span className="mx-0.5 text-current opacity-40">·</span>
        <BoltIcon className="size-3" />
        <b className="font-arabic">{energyDisplay}</b>
      </span>
      <button
        type="button"
        onClick={onOpenCollectibles}
        className={`${s.backBtn} inline-flex items-center gap-1.5`}
      >
        <span>أثر</span>
        <span className="rounded-full border border-current px-1.5 text-[10px] font-bold opacity-70">
          {collectibleCount}
        </span>
      </button>
      <button type="button" onClick={onBackToMap} className={s.backBtn}>
        خريطة ←
      </button>
    </div>
  );

  /* office — folder tab + twin fasteners as a corner doodle badge */
  if (tpl === "MANILA_FOLDER") {
    return (
      <div className="w-full shrink-0">
        <div className="relative flex justify-between px-6">
          <span className="metal-fastener block size-3.5" />
          <span className="metal-fastener block size-3.5" />
        </div>
        <div className="mt-2 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="folder-tab rounded-sm px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#1E3A8A]">
              Official Register
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-bold leading-tight text-[#1E3A8A]">{stageTitle}</p>
              <p className="font-arabic truncate text-xs leading-relaxed text-[#1E3A8A]/70">{stageLocation}</p>
            </div>
          </div>
          {cluster}
        </div>
      </div>
    );
  }

  /* gym — emerald chalk headline with dashed chalk divider */
  if (tpl === "CHALKBOARD") {
    return (
      <div className="w-full shrink-0 text-center">
        <p className="font-mono text-2xl leading-tight tracking-wide text-[#065F46]">{stageTitle}</p>
        <p className="font-arabic mt-1 text-sm text-[#065F46]/70">{stageLocation}</p>
        <div className="mx-auto mt-2 w-full border-b-2 border-dashed border-emerald-800/40" />
        <div className="mt-3 flex items-center justify-center gap-3">{cluster}</div>
      </div>
    );
  }

  /* street / library — charcoal ink with a marker underline */
  if (tpl === "STREET_POSTER") {
    return (
      <div className="w-full shrink-0">
        <div className="flex items-center justify-between gap-4 px-2">
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-bold leading-tight text-[#27272A]">{stageTitle}</p>
            <p className="font-arabic truncate text-xs leading-relaxed text-[#27272A]/70">{stageLocation}</p>
          </div>
          {cluster}
        </div>
        <div className="ml-2 mt-2 h-1 w-24 rounded-full bg-[#E0C068]" />
      </div>
    );
  }

  /* café — coffee doodle · title · barcode */
  return (
    <div className="flex w-full shrink-0 items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <CoffeeDoodle className="size-7 shrink-0 text-[#5C3A21]" />
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold leading-tight text-[#5C3A21]">{stageTitle}</p>
          <p className="font-arabic truncate text-xs leading-relaxed text-[#5C3A21]/70">{stageLocation}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        {cluster}
        <svg
          viewBox="0 0 80 24"
          width="64"
          height="18"
          aria-hidden
          className="hidden shrink-0 text-[#5C3A21] sm:block"
        >
          {BARCODE_BARS.slice(0, 24).map((_, i) => (
            <rect key={i} x={1.5 + i * 3} y={1} width={1.5} height={22} fill="currentColor" />
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ── inner stage: header + center + dialogue + options + stamp ───────── */

interface StageContentProps {
  props: ScenarioCanvasProps;
  tpl: SceneLayoutType;
  s: CanvasStyles;
}

function StageContent({ props, tpl, s }: StageContentProps) {
  const {
    status,
    errorText,
    complete,
    graph,
    currentNode: node,
    progressStats,
    speaker,
    evaluation: feedback,
    fbCorrect,
    fbXp,
    freeText,
    evaluating,
    xpGained,
    energyCost,
    theme,
    slamKey,
    onSelectOption,
    onSubmitFreeText,
    onContinue,
    onRetry,
    onFreeTextChange,
    onBackToMap,
  } = props;

  return (
    <>
      {/* ── header ─────────────────────────────────────────────────── */}
      <TemplateHeader
        tpl={tpl}
        s={s}
        stageTitle={props.stageTitle}
        stageLocation={props.stageLocation}
        xpDisplay={props.xpDisplay}
        energyDisplay={props.energyDisplay}
        collectibleCount={props.collectibleCount}
        onOpenCollectibles={props.onOpenCollectibles}
        onBackToMap={onBackToMap}
      />

      {/* ── CENTER STAGE ───────────────────────────────────────────── */}
      {(status === "loading" || status === "error" || (status === "ready" && complete)) && (
        <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          {status === "loading" && <p className={s.statusText}>خيوط بغداد تترسم…</p>}
          {status === "error" && (
            <>
              <span className="text-2xl">𐄂</span>
              <p className={s.errorText}>{errorText}</p>
              <button type="button" onClick={onBackToMap} className={s.linkBtn}>
                رجّعني للخريطة
              </button>
            </>
          )}
          {status === "ready" && complete && (
            <>
              <span
                aria-label={SCENARIO_COMPLETE_COPY.verdictLabel}
                dir="ltr"
                className="mb-1 inline-block rounded-full border border-current px-2.5 py-0.5 text-[11px] font-bold opacity-80"
              >
                {UI_GENZ_COPY.verdict}
              </span>
              <p className={s.completeTitle}>{SCENARIO_COMPLETE_COPY.title}</p>
              <p className={s.completeBody}>{graph?.title}</p>
              <span className="text-sm font-bold text-wasabi-600">
                <SparkIcon className="me-1 inline-block size-4" /> +{xpGained} ن.ت
              </span>
              <button type="button" onClick={onBackToMap} className={s.linkBtn}>
                {SCENARIO_COMPLETE_COPY.backToMap}
              </button>
            </>
          )}
        </div>
      )}

      {/* live dialogue — flex-fill, centered, fluid, never scrolls */}
      {status === "ready" && !complete && node && (
        <>
          {/* Dialogue box */}
          <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 text-center">
            <p className={s.stepLabel}>
              خطوة {progressStats.step} من {progressStats.total}
              {speaker?.name_ar ? ` · ${speaker.name_ar}` : ""}
            </p>
            <p className={s.dialogue}>
              <LtrText className="text-left">{node.text_en_slang}</LtrText>
            </p>
            <p className={s.hint}>{node.text_ar_hint}</p>
          </section>

          {/* Options — template-specific ink cards/strips */}
          <div className="mx-auto w-full max-w-3xl space-y-3 pb-4">
            {feedback ? (
              <div
                className={s.feedbackCard}
                style={{
                  borderColor: fbCorrect ? theme.accentColor : "#9f1239",
                  backgroundColor: "#FFFDF7",
                }}
              >
                {feedback.kind === "option" ? (
                  <>
                    <p className={s.optionPrimary}>
                      <LtrText>{feedback.option.text_en_slang}</LtrText>
                    </p>
                    <p className={s.optionHint}>يعني: {feedback.option.text_ar_equivalent}</p>
                  </>
                ) : (
                  <>
                    <p className={s.optionPrimary}>
                      <LtrText>{feedback.result.text_en_slang}</LtrText>
                    </p>
                    <p className={s.optionHint}>يعني: {feedback.result.text_ar_equivalent}</p>
                    <p className={s.feedbackSub}>
                      {feedback.result.source === "llm" ? "ضبّطها الذكاء الفوري" : "خريطة بغداد المحفوظة"}
                    </p>
                  </>
                )}
                <div className={s.feedbackRow}>
                  {fbCorrect && <span className="font-mono text-sm font-bold text-wasabi-600">+ {fbXp} ن.ت</span>}
                  {fbCorrect && (
                    <span className="font-arabic ml-auto text-[11px] text-current opacity-60">−{energyCost} طاقة</span>
                  )}
                </div>
                <button type="button" onClick={fbCorrect ? onContinue : onRetry} className={s.continueBtn}>
                  {fbCorrect ? "يالله، النقطة الجاية" : "حاول من جديد"}
                </button>
              </div>
            ) : (
              <>
                {node.options.map((option) => (
                  <button
                    type="button"
                    key={option.id}
                    onClick={() => onSelectOption(option)}
                    className={s.optionCard}
                  >
                    <span className={s.optionPrimary}>
                      <LtrText>{option.text_en_slang}</LtrText>
                    </span>
                    <span className={s.optionHint}>{option.text_ar_equivalent}</span>
                  </button>
                ))}

                <div className="w-full">
                  <label htmlFor="scenario-free" className={s.freeHint}>
                    عينك إنجليزية — ردّك للأمريكيّ العاميّ (Slang)…
                  </label>
                  <div className="flex w-full items-stretch gap-2">
                    <input
                      id="scenario-free"
                      dir="ltr"
                      value={freeText}
                      onChange={(e) => onFreeTextChange(e.target.value)}
                      placeholder="Type your line in street-American slang…"
                      className={s.freeInput}
                    />
                    <button
                      type="button"
                      onClick={onSubmitFreeText}
                      disabled={evaluating || freeText.trim().length === 0}
                      className={s.evalBtn}
                    >
                      {evaluating ? "…" : "قيّم ردّي"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* ── compact evaluation stamp (top-right, locked 64×64 badge) ─── */}
      {feedback && (
        <div className="pointer-events-none absolute right-6 top-4 z-30 flex h-16 w-16 flex-shrink-0 scale-90 -rotate-12 opacity-90">
          <div
            key={slamKey}
            className={`h-full w-full overflow-hidden border-4 bg-white/90 p-1.5 shadow-2xl ${
              fbCorrect ? "border-[#15803d] text-[#15803d]" : "border-red-600 text-red-600"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-full w-full object-contain"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              {fbCorrect ? <path d="M5 12.5l4.5 4.5L19 7" /> : <path d="M6 6l12 12M18 6L6 18" />}
            </svg>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * PRESENTATION ONLY — the full-viewport scenario stage.
 * One warm notebook paper canvas for every location; templates differ
 * only in accent ink tone, hand-drawn borders and tiny corner doodles.
 * No state, no hooks, no API. Pure function of its props.
 */
export function ScenarioCanvas(props: ScenarioCanvasProps) {
  const tpl: SceneLayoutType = props.theme.layoutType;
  const s = CANVAS_STYLES[tpl];

  return (
    <main className={`${SURFACE_ROOT} ${s.surface} ${props.theme.containerStyle}`}>
      {s.sheet ? (
        /* street poster — pinned paper sheet over the notebook page */
        <div className={s.sheet}>
          <span className="absolute -left-4 -top-2 tape" aria-hidden />
          <span className="absolute -right-4 -top-2 tape" aria-hidden />
          <span className="absolute -bottom-2 -left-4 tape" aria-hidden />
          <span className="absolute -bottom-2 -right-4 tape" aria-hidden />
          <StageContent props={props} tpl={tpl} s={s} />
        </div>
      ) : (
        <StageContent props={props} tpl={tpl} s={s} />
      )}
    </main>
  );
}