import { useMemo, useState } from "react";

import {
  VIBE_CATEGORIES,
  type CollectibleItem,
  type VibeCategory,
  type VibeMapEntry,
} from "@be-native/shared";

import {
  VIBE_TEMPLATES,
  type VibePipelineReport,
  type VibePipelineStageId,
  type VibeTemplateId,
} from "../hooks/useVibeMapper";
import { playPaperUnfold } from "../hooks/useVibeAudio";
import { DERIVED_SCENARIO_VIBES, MAP_CHARGER_TEXTS, UI_GENZ_COPY } from "../data/seedData";
import { VibeEngineCard } from "./VibeEngineCard";

/**
 * "محرك الترجمة الحسية (Gen Z Vibe Engine)" — the generation form that runs
 * the 3-step pipeline (تفكيك → قالب وسيط → صياغة Gen Z), renders the result
 * card, and offers a searchable/filterable browser (Vibe Vault ⚡).
 *
 * The search index reaches beyond the dictionary: it also inspects scenario
 * node lines + option outcomes (derived Aura Verdict cards) and the map
 * charger texts (districts, river, board caption, spot labels, recharge).
 *
 * Warm paper only. All English/Gen Z output is isolated with dir="ltr".
 */

export interface VibeMapperEngineProps {
  /** 3-step AI pipeline: resolves/synthesizes + persists, reports stages. */
  generateVibe: (
    input: { baghdadiPhrase: string; template: VibeTemplateId },
    onStage?: (report: VibePipelineReport) => void,
  ) => Promise<VibeMapEntry>;
  /** Saves a generated mapping straight into the global أثر scrapbook. */
  saveToTraces?: (entry: VibeMapEntry) => CollectibleItem | null;
  /** Stored dictionary (manual + AI) surfaced in the browser grid. */
  entries?: VibeMapEntry[];
}

const STAGE_STEPS: { id: VibePipelineStageId; label: string }[] = [
  { id: "DECONSTRUCT", label: "1. تفكيك" },
  { id: "BRIDGE", label: "2. قالب وسيط" },
  { id: "SYNTHESIS", label: "3. صياغة Gen Z" },
];

const OUTPUT_LABEL: Record<string, string> = {
  literalMeaning: "الترجمة الحرفية",
  culturalVibe: "الشرح الحسي",
  contextTag: "وسم سياق",
  category: "التصنيف",
  socialDynamics: "ديناميكية اجتماعية",
  toneIntensity: "شدة النبرة",
  vibeIntent: "نية القالب",
  genZSlang: "سلانغ Gen Z",
  auraImpact: "تأثير هالة",
  usageExample: "مثال شوارع",
};

const VIBE_CATEGORY_LABEL: Record<VibeCategory, string> = {
  BANTER: "بذاءة مرحة",
  RESPECT: "احترام",
  CONFLICT: "صراع",
  MASTERY: "إتقان",
  DRAMA: "دراما",
  AURA: "هالة",
};

const inputCls =
  "w-full rounded-sm border border-amber-900/30 bg-[#FFFDF7] px-3 py-2 font-arabic text-sm text-amber-950 outline-none transition-colors placeholder:text-amber-900/35 focus:border-amber-900/60";

const selectCls =
  "w-full rounded-sm border border-amber-900/30 bg-[#FFFDF7] px-3 py-2 font-arabic text-sm text-amber-950 outline-none transition-colors focus:border-amber-900/60";

export function VibeMapperEngine({ generateVibe, saveToTraces, entries }: VibeMapperEngineProps) {
  const [phrase, setPhrase] = useState("");
  const [templateId, setTemplateId] = useState<VibeTemplateId>(VIBE_TEMPLATES[0].id);
  const [generating, setGenerating] = useState(false);
  const [lastEntry, setLastEntry] = useState<VibeMapEntry | null>(null);

  /* pipeline progress */
  const [reportIndex, setReportIndex] = useState(-1);
  const [reports, setReports] = useState<VibePipelineReport[]>([]);

  /* dictionary browser */
  const [browseQuery, setBrowseQuery] = useState("");
  const [browseCategory, setBrowseCategory] = useState<"ALL" | VibeCategory>("ALL");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const baghdadiPhrase = phrase.trim();
    if (!baghdadiPhrase || generating) return;
    setGenerating(true);
    setLastEntry(null);
    setReports([]);
    setReportIndex(-1);
    const entry = await generateVibe({ baghdadiPhrase, template: templateId }, (report) => {
      setReports((prev) => [...prev, report]);
      setReportIndex(STAGE_STEPS.findIndex((s) => s.id === report.stage));
    });
    setGenerating(false);
    setLastEntry(entry);
    playPaperUnfold();
  };

  /** Vault browser items = stored dictionary + scenario-derived verdict cards. */
  const browseCards = useMemo<VibeMapEntry[]>(
    () => [...(entries ?? []), ...DERIVED_SCENARIO_VIBES],
    [entries],
  );

  const visibleEntries = useMemo(() => {
    const needle = browseQuery.trim().toLowerCase();
    const hits = (value: string) => value.toLowerCase().includes(needle);
    return browseCards.filter((entry) => {
      if (browseCategory !== "ALL" && entry.category !== browseCategory) return false;
      if (!needle) return true;
      return (
        hits(entry.baghdadiPhrase) ||
        hits(entry.contextTag) ||
        hits(entry.literalMeaning) ||
        hits(entry.culturalVibe) ||
        hits(entry.genZSlang) ||
        hits(entry.auraImpact) ||
        hits(entry.usageExample) ||
        hits(entry.id)
      );
    });
  }, [browseCards, browseQuery, browseCategory]);

  /** Map charger texts surfaced by the same search needle. */
  const visibleChargers = useMemo(() => {
    const needle = browseQuery.trim().toLowerCase();
    if (!needle) return [];
    return MAP_CHARGER_TEXTS.filter((item) =>
      [item.label, ...item.terms].some((term) => term.toLowerCase().includes(needle)),
    );
  }, [browseQuery]);

  const latestOutputs = reportIndex >= 0 ? reports[reportIndex]?.outputs : undefined;

  return (
    <div className="rounded-sm border border-amber-900/20 bg-[#FFFDF7] p-5 shadow-[2px_3px_0_rgb(0_0_0/0.08)]">
      <h3 className="font-display mb-1 text-xl font-bold leading-none text-amber-950">
        محرك الترجمة الحسية (Gen Z Vibe Engine)
      </h3>
      <p className="font-arabic mb-4 text-xs leading-relaxed text-amber-900/70">
        حط العبارة البغدادية واختار القالب — المحرك يمر بثلاث مراحل (تفكيك → قالب وسيط → صياغة
        Gen Z) ويرجع لك بطاقة الحس ويمكن حفظها فورًا في أثر.
      </p>

      <form onSubmit={(e) => void handleGenerate(e)} className="grid gap-3 sm:grid-cols-[1.4fr_1fr_auto]">
        <label className="grid gap-1">
          <span className="font-arabic text-xs text-amber-900/80">العبارة أو المثل البغدادي</span>
          <input
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder="عابر القارة — فدوة روحك…"
            aria-label="العبارة البغدادية"
            className={inputCls}
          />
        </label>
        <label className="grid gap-1">
          <span className="font-arabic text-xs text-amber-900/80">القالب (السياق)</span>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value as VibeTemplateId)}
            aria-label="قالب السياق"
            className={selectCls}
          >
            {VIBE_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={generating || phrase.trim().length === 0}
            className="font-arabic w-full rounded-full border border-[#5C3A21]/50 bg-[#FFFDF7] px-5 py-2 text-sm font-semibold text-[#5C3A21] transition-colors hover:bg-[#EFDDBF] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            {generating ? "يولّد…" : "توليد المعنى الحسي ⚡"}
          </button>
        </div>
      </form>

      {/* 3-stage pipeline progress */}
      {generating && (
        <div className="mt-4 rounded-sm border border-dashed border-amber-900/25 bg-[#F5EFE6] p-3">
          <ol className="flex flex-wrap items-center gap-1.5">
            {STAGE_STEPS.map((step, i) => {
              const done = reportIndex >= i;
              const active = reportIndex === i;
              return (
                <li key={step.id} className="flex items-center gap-1.5">
                  <span
                    className={`font-arabic rounded-full border px-2.5 py-1 text-[11px] transition-all ${
                      done
                        ? "border-[#5C3A21]/40 bg-[#EFDDBF] text-[#5C3A21]"
                        : active
                          ? "border-[#5C3A21]/70 bg-[#FFFDF7] font-bold text-[#5C3A21] animate-card-in"
                          : "border-amber-900/20 bg-[#FFFDF7]/60 text-amber-900/50"
                    }`}
                  >
                    {done ? "✓ " : active ? "⚡ " : "○ "}
                    {step.label}
                  </span>
                  {i < STAGE_STEPS.length - 1 && (
                    <span className="h-px w-3 bg-amber-900/30" aria-hidden />
                  )}
                </li>
              );
            })}
          </ol>
          {latestOutputs && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(latestOutputs).map(([key, value]) => (
                <span
                  key={key}
                  className="rounded border border-amber-900/20 bg-[#FFFDF7] px-1.5 py-0.5 text-[10px] text-amber-900/80"
                >
                  {OUTPUT_LABEL[key] ?? key}:
                  <span dir="ltr" className="font-mono text-[10px] font-semibold text-amber-950">
                    {" "}
                    {value}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* result card */}
      {lastEntry && (
        <div className="mt-4">
          <VibeEngineCard entry={lastEntry} onSaveToTraces={(e) => void saveToTraces?.(e)} />
        </div>
      )}

      {/* dictionary browser — searchable/filterable grid (manual + AI + scenario) */}
      {browseCards.length > 0 && (
        <div className="mt-5 border-t border-dashed border-amber-900/25 pt-4">
          <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <h4 className="font-display content-center text-lg font-bold text-amber-950">
              <span dir="ltr" className="inline-block">
                {UI_GENZ_COPY.dictionary}
              </span>
            </h4>
            <input
              value={browseQuery}
              onChange={(e) => setBrowseQuery(e.target.value)}
              placeholder={`${UI_GENZ_COPY.search} — ابحث بالعربي أو سلانغ…`}
              aria-label={UI_GENZ_COPY.search}
              className={inputCls}
            />
            <select
              value={browseCategory}
              onChange={(e) => {
                setBrowseCategory(e.target.value as "ALL" | VibeCategory);
                playPaperUnfold();
              }}
              aria-label="تصفية حسب التصنيف"
              className={selectCls}
            >
              <option value="ALL">كل التصنيفات</option>
              {VIBE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c} — {VIBE_CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </div>
          <p className="mb-3 text-[11px] text-amber-900/60">
            {visibleEntries.length} مدخل — يدوي + توليد ذكي + Aura Verdict من السيناريوهات
            {visibleChargers.length > 0 && " + خريطة بغداد"}
          </p>

          {/* map charger texts surfaced by the active search */}
          {visibleChargers.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              <span className="font-arabic rounded-full border border-amber-900/25 bg-[#F5EFE6] px-2 py-0.5 text-[11px] text-amber-900/70">
                الخريطة 🔋:
              </span>
              {visibleChargers.map((item) => (
                <span
                  key={item.id}
                  dir="ltr"
                  className="inline-block rounded-full border border-amber-900/30 bg-[#FFFDF7] px-2.5 py-0.5 font-mono text-[11px] font-semibold text-amber-800"
                >
                  {item.label}
                </span>
              ))}
            </div>
          )}

          {visibleEntries.length === 0 ? (
            <p className="py-4 text-center font-arabic text-xs text-amber-900/50">
              — لا مدخلات مطابقة، جرّب Vibe Check 🔍 مختلفة —
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {visibleEntries.map((entry) => (
                <li key={entry.id}>
                  <VibeEngineCard
                    entry={entry}
                    onSaveToTraces={(e) => void saveToTraces?.(e)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}