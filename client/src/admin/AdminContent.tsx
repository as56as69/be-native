import { useCallback, useMemo, useState } from "react";

import {
  VIBE_CATEGORIES,
  type CollectibleCategory,
  type CollectibleItem,
  type ContentHit,
  type VibeCategory,
  type VibeMapEntry,
} from "@be-native/shared";

import { useCollectibles } from "../hooks/useCollectibles";
import { useVibeMapper } from "../hooks/useVibeMapper";
import { VibeMapperEngine } from "../components/VibeMapperEngine";
import { DEFAULT_SCENARIOS, UI_GENZ_COPY, type SeedExportBundle } from "../data/seedData";
import {
  getApiConfig,
  setApiConfig,
  LLM_PROVIDERS,
  TTS_PROVIDERS,
  VOICE_CLONE_PROVIDERS,
  type LlmProvider,
  type TtsProvider,
  type VoiceCloneProvider,
} from "../services/apiConfig";
import { api } from "../lib/api";
import { Badge, Btn, Empty, Panel, TextInput } from "./AdminUI";

const rowKey = (hit: ContentHit) => `${hit.entityType}:${hit.id}:${hit.fieldName}`;

const ENTITY_LABEL: Record<ContentHit["entityType"], string> = {
  spot: "نقطة",
  scenario: "سيناريو",
  opening_quote: "عبارة",
  scenario_graph: "خريطة",
};

const VIBE_CATEGORY_LABEL: Record<VibeCategory, string> = {
  BANTER: "بذاءة مرحة",
  RESPECT: "احترام",
  CONFLICT: "صراع",
  MASTERY: "إتقان",
  DRAMA: "دراما",
  AURA: "هالة",
};

export function AdminContent() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<ContentHit[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [searching, setSearching] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const { items, addAdminItem, removeAdminItem, updateAdminItem, resetToSeed: resetCollectiblesToSeed } = useCollectibles();

  const [traceForm, setTraceForm] = useState<{
    phrase: string;
    targetSlang: string;
    contextNote: string;
    category: CollectibleCategory;
  }>({ phrase: "", targetSlang: "", contextNote: "", category: "GLOBAL" });
  const [traceNote, setTraceNote] = useState<string | null>(null);
  const [editingTraceId, setEditingTraceId] = useState<string | null>(null);
  const [traceDraft, setTraceDraft] = useState<{ phrase: string; targetSlang: string; contextNote: string }>({
    phrase: "",
    targetSlang: "",
    contextNote: "",
  });

  /* ── Vibe Mapper form state ────────────────────────────────────────── */
  const {
    entries: vibeEntries,
    addManualEntry,
    deleteEntry: deleteVibeEntry,
    updateEntry: updateVibeEntry,
    searchEntriesByVibe: searchVibes,
    generateVibe,
    saveToTraces,
    resetToSeed: resetVibesToSeed,
  } = useVibeMapper(addAdminItem);

  const [vibeForm, setVibeForm] = useState<{
    baghdadiPhrase: string;
    contextTag: string;
    literalMeaning: string;
    culturalVibe: string;
    genZSlang: string;
    auraImpact: string;
    usageExample: string;
    category: VibeCategory;
  }>({
    baghdadiPhrase: "",
    contextTag: "",
    literalMeaning: "",
    culturalVibe: "",
    genZSlang: "",
    auraImpact: "",
    usageExample: "",
    category: "BANTER",
  });
  const [vibeNote, setVibeNote] = useState<string | null>(null);
  const [vibeFilter, setVibeFilter] = useState<"ALL" | VibeCategory>("ALL");
  const [vibeQuery, setVibeQuery] = useState("");
  const [editingVibeId, setEditingVibeId] = useState<string | null>(null);
  const [vibeDraft, setVibeDraft] = useState<{
    baghdadiPhrase: string;
    contextTag: string;
    literalMeaning: string;
    culturalVibe: string;
    genZSlang: string;
    auraImpact: string;
    usageExample: string;
    category: VibeCategory;
  }>({
    baghdadiPhrase: "",
    contextTag: "",
    literalMeaning: "",
    culturalVibe: "",
    genZSlang: "",
    auraImpact: "",
    usageExample: "",
    category: "BANTER",
  });

  const flashToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  /* ── Export / Reset data toolbar ───────────────────────────────────── */
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const exportSeedData = () => {
    const bundle: SeedExportBundle = {
      exportedAt: new Date().toISOString(),
      collectibles: items,
      vibeEntries: vibeEntries,
      scenarios: DEFAULT_SCENARIOS,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "seedData.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    flashToast("تم تصدير seedData.json ✓");
  };

  const confirmResetToSeed = () => {
    resetCollectiblesToSeed();
    resetVibesToSeed();
    setResetConfirmOpen(false);
    flashToast("تمت إعادة الضبط للمرجع الأصلي ✓");
  };

  /* ── API / voice provider configuration ────────────────────────────── */
  const [apiForm, setApiForm] = useState(() => {
    const current = getApiConfig();
    return {
      llmApiKey: current.llm.apiKey,
      llmProvider: current.llm.provider,
      ttsApiKey: current.tts.apiKey,
      ttsProvider: current.tts.provider,
      voiceCloneApiKey: current.voiceClone.apiKey,
      voiceCloneProvider: current.voiceClone.provider,
      mockMode: current.mockMode,
    };
  });

  const saveApiConfig = () => {
    setApiConfig({
      llm: { apiKey: apiForm.llmApiKey.trim(), provider: apiForm.llmProvider },
      tts: { apiKey: apiForm.ttsApiKey.trim(), provider: apiForm.ttsProvider },
      voiceClone: {
        apiKey: apiForm.voiceCloneApiKey.trim(),
        provider: apiForm.voiceCloneProvider,
      },
      mockMode: apiForm.mockMode,
    });
    flashToast("تم حفظ إعدادات الربط والخدمات الصوتية ✓");
  };

  const submitTrace = (e: React.FormEvent) => {
    e.preventDefault();
    const phrase = traceForm.phrase.trim();
    const targetSlang = traceForm.targetSlang.trim();
    if (!phrase || !targetSlang) {
      setTraceNote("اكتب العبارة البغدادية والسلانغ الأمريكي كحد أدنى.");
      return;
    }
    addAdminItem({
      phrase,
      targetSlang,
      contextNote: traceForm.contextNote.trim(),
      category: traceForm.category,
      isUnlocked: true,
    });
    setTraceForm((prev) => ({ ...prev, phrase: "", targetSlang: "", contextNote: "" }));
    setTraceNote("تمت إضافة أثر مخصص ✓");
  };

  const deleteTrace = (id: string) => {
    removeAdminItem(id);
    setTraceNote("تم حذف الأثر ✓");
  };

  const updateTrace = (id: string, patch: Partial<Pick<CollectibleItem, "phrase" | "targetSlang" | "contextNote" | "category">>) => {
    updateAdminItem(id, patch);
    setTraceNote("تم تعديل الأثر ✓");
  };

  const beginEditTrace = (item: CollectibleItem) => {
    setEditingTraceId(item.id);
    setTraceDraft({ phrase: item.phrase, targetSlang: item.targetSlang, contextNote: item.contextNote ?? "" });
  };

  const saveTraceEdit = (id: string) => {
    updateTrace(id, traceDraft);
    setEditingTraceId(null);
  };

  /* ── Vibe Mapper handlers ──────────────────────────────────────────── */
  const submitVibe = (e: React.FormEvent) => {
    e.preventDefault();
    const baghdadiPhrase = vibeForm.baghdadiPhrase.trim();
    const contextTag = vibeForm.contextTag.trim();
    const literalMeaning = vibeForm.literalMeaning.trim();
    const culturalVibe = vibeForm.culturalVibe.trim();
    const genZSlang = vibeForm.genZSlang.trim();
    const usageExample = vibeForm.usageExample.trim();
    if (!baghdadiPhrase || !contextTag || !literalMeaning || !culturalVibe || !genZSlang || !usageExample) {
      setVibeNote("أكمل الحقول الأساسية: العبارة، السياق، الترجمة الحرفية، الشرح الحسي، السلانغ، والمثال.");
      return;
    }
    addManualEntry({
      baghdadiPhrase,
      contextTag,
      literalMeaning,
      culturalVibe,
      genZSlang,
      usageExample,
      auraImpact: vibeForm.auraImpact.trim(),
      category: vibeForm.category,
    });
    setVibeForm((prev) => ({
      ...prev,
      baghdadiPhrase: "",
      contextTag: "",
      literalMeaning: "",
      culturalVibe: "",
      genZSlang: "",
      auraImpact: "",
      usageExample: "",
    }));
    setVibeNote("تمت إضافة مدخل للقاموس الحسي ✓");
  };

  const visibleVibeEntries = useMemo(() => {
    const q = vibeQuery.trim();
    const byQuery = q ? searchVibes(q) : vibeEntries;
    return vibeFilter === "ALL"
      ? byQuery
      : byQuery.filter((entry) => entry.category === vibeFilter);
  }, [vibeEntries, vibeFilter, vibeQuery, searchVibes]);

  const deleteVibe = (id: string) => {
    deleteVibeEntry(id);
    setVibeNote("تم حذف المدخل الحسي ✓");
  };

  const updateVibe = (
    id: string,
    patch: Partial<Pick<VibeMapEntry, "baghdadiPhrase" | "contextTag" | "literalMeaning" | "culturalVibe" | "genZSlang" | "auraImpact" | "usageExample" | "category">>,
  ) => {
    updateVibeEntry(id, patch);
    setVibeNote("تم تعديل المدخل الحسي ✓");
  };

  const beginEditVibe = (entry: VibeMapEntry) => {
    setEditingVibeId(entry.id);
    setVibeDraft({
      baghdadiPhrase: entry.baghdadiPhrase,
      contextTag: entry.contextTag,
      literalMeaning: entry.literalMeaning,
      culturalVibe: entry.culturalVibe,
      genZSlang: entry.genZSlang,
      auraImpact: entry.auraImpact ?? "",
      usageExample: entry.usageExample ?? "",
      category: entry.category,
    });
  };

  const saveVibeEdit = (id: string) => {
    updateVibe(id, vibeDraft);
    setEditingVibeId(null);
  };

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setError(null);
    try {
      const found = await api.adminContent.search(q);
      setHits(found);
      setDrafts(Object.fromEntries(found.map((hit) => [rowKey(hit), hit.currentText])));
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSearching(false);
    }
  };

  const save = async (hit: ContentHit) => {
    const key = rowKey(hit);
    const newText = drafts[key] ?? "";
    setSavingKey(key);
    setError(null);
    try {
      await api.adminContent.update({
        id: hit.id,
        entityType: hit.entityType,
        fieldName: hit.fieldName,
        newText,
      });
      setHits((prev) =>
        prev.map((row) => (rowKey(row) === key ? { ...row, currentText: newText } : row))
      );
      flashToast("تم الحفظ في قاعدة البيانات ✓");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="grid gap-4">
      {/* ── data export / reset — warm paper toolbar ──────────────────── */}
      <section className="rounded-lg border border-amber-900/25 bg-[#F5EFE6] p-4 shadow-[3px_4px_0_rgb(0_0_0/0.12)]">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl leading-none tracking-tight text-amber-950">
            إدارة واستخراج قاعدة البيانات
          </h2>
          <span className="inline-flex items-center gap-1 rounded border-[1.5px] border-[#5C3A21]/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[#5C3A21]">
            {items.length} أثر · {vibeEntries.length} مدخل حسي
          </span>
        </header>
        <p className="font-arabic mb-4 text-sm leading-relaxed text-amber-900/70">
          صدّر كل الحالة الحالية (الآثار + <span dir="ltr" className="inline-block">{UI_GENZ_COPY.dictionary}</span>{" "}
          + السيناريوهات) كملف JSON موحد، أو
          أعد ضبط المتصفح للمرجع الأصلي وحذف التخصيصات المحلية.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportSeedData}
            className="font-arabic rounded-full border border-[#5C3A21]/50 bg-[#FFFDF7] px-4 py-2 text-sm font-semibold text-[#5C3A21] transition-colors hover:bg-[#EFDDBF]"
          >
            تصدير الملف الموحد (Export seedData.json)
          </button>
          <button
            type="button"
            onClick={() => setResetConfirmOpen(true)}
            className="font-arabic rounded-full border border-red-700/50 bg-[#FFFDF7] px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
          >
            إعادة ضبط للمرجع الأصلي (Reset to Seed)
          </button>
        </div>
      </section>

      {/* ── API & voice provider config — warm paper section ───────────── */}
      <section className="rounded-lg border border-amber-900/25 bg-[#F5EFE6] p-4 shadow-[3px_4px_0_rgb(0_0_0/0.12)]">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl leading-none tracking-tight text-amber-950">
            إعدادات المزودات ومفاتيح الـ API
          </h2>
          <span className="inline-flex items-center gap-1 rounded border-[1.5px] border-[#5C3A21]/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[#5C3A21]">
            وضع الحالي: {apiForm.mockMode ? "Mock محلي" : "مزود حقيقي"}
          </span>
        </header>
        <p className="font-arabic mb-4 text-sm leading-relaxed text-amber-900/70">
          المفاتيح تُحفظ في متصفحك فقط. الصوت للنطق الإنجليزي (Gen Z slang) حصريًا — لا توليد عربي أبدًا.
          أبقي المفتاح فارغًا أو اختر MOCK ليعمل كل شيء محليًا بلا انترنت.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* LLM */}
          <div className="grid gap-2 rounded-sm border border-amber-900/20 bg-[#FFFDF7] p-3">
            <h3 className="font-display text-base font-bold text-amber-950">مزود الـ LLM</h3>
            <label className="grid gap-1">
              <span className="font-arabic text-xs text-amber-900/80">المفتاح</span>
              <input
                type="password"
                dir="ltr"
                value={apiForm.llmApiKey}
                onChange={(e) => setApiForm((prev) => ({ ...prev, llmApiKey: e.target.value }))}
                placeholder="sk-…"
                className="w-full rounded-sm border border-amber-900/30 bg-[#FFFDF7] px-3 py-2 font-mono text-sm text-amber-950 outline-none transition-colors placeholder:text-amber-900/35 focus:border-amber-900/60"
              />
            </label>
            <label className="grid gap-1">
              <span className="font-arabic text-xs text-amber-900/80">المزود</span>
              <select
                value={apiForm.llmProvider}
                onChange={(e) => setApiForm((prev) => ({ ...prev, llmProvider: e.target.value as LlmProvider }))}
                className="w-full rounded-sm border border-amber-900/30 bg-[#FFFDF7] px-3 py-2 font-mono text-sm text-amber-950 outline-none transition-colors focus:border-amber-900/60"
              >
                {LLM_PROVIDERS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* TTS */}
          <div className="grid gap-2 rounded-sm border border-amber-900/20 bg-[#FFFDF7] p-3">
            <h3 className="font-display text-base font-bold text-amber-950">مزود الـ TTS (نطق Gen Z)</h3>
            <label className="grid gap-1">
              <span className="font-arabic text-xs text-amber-900/80">المفتاح</span>
              <input
                type="password"
                dir="ltr"
                value={apiForm.ttsApiKey}
                onChange={(e) => setApiForm((prev) => ({ ...prev, ttsApiKey: e.target.value }))}
                placeholder="…"
                className="w-full rounded-sm border border-amber-900/30 bg-[#FFFDF7] px-3 py-2 font-mono text-sm text-amber-950 outline-none transition-colors placeholder:text-amber-900/35 focus:border-amber-900/60"
              />
            </label>
            <label className="grid gap-1">
              <span className="font-arabic text-xs text-amber-900/80">المزود</span>
              <select
                value={apiForm.ttsProvider}
                onChange={(e) => setApiForm((prev) => ({ ...prev, ttsProvider: e.target.value as TtsProvider }))}
                className="w-full rounded-sm border border-amber-900/30 bg-[#FFFDF7] px-3 py-2 font-mono text-sm text-amber-950 outline-none transition-colors focus:border-amber-900/60"
              >
                {TTS_PROVIDERS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Voice clone */}
          <div className="grid gap-2 rounded-sm border border-amber-900/20 bg-[#FFFDF7] p-3">
            <h3 className="font-display text-base font-bold text-amber-950">مزود استنساخ الصوت</h3>
            <label className="grid gap-1">
              <span className="font-arabic text-xs text-amber-900/80">المفتاح</span>
              <input
                type="password"
                dir="ltr"
                value={apiForm.voiceCloneApiKey}
                onChange={(e) => setApiForm((prev) => ({ ...prev, voiceCloneApiKey: e.target.value }))}
                placeholder="…"
                className="w-full rounded-sm border border-amber-900/30 bg-[#FFFDF7] px-3 py-2 font-mono text-sm text-amber-950 outline-none transition-colors placeholder:text-amber-900/35 focus:border-amber-900/60"
              />
            </label>
            <label className="grid gap-1">
              <span className="font-arabic text-xs text-amber-900/80">المزود</span>
              <select
                value={apiForm.voiceCloneProvider}
                onChange={(e) =>
                  setApiForm((prev) => ({ ...prev, voiceCloneProvider: e.target.value as VoiceCloneProvider }))
                }
                className="w-full rounded-sm border border-amber-900/30 bg-[#FFFDF7] px-3 py-2 font-mono text-sm text-amber-950 outline-none transition-colors focus:border-amber-900/60"
              >
                {VOICE_CLONE_PROVIDERS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setApiForm((prev) => ({ ...prev, mockMode: !prev.mockMode }))}
            className={`font-arabic inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              apiForm.mockMode
                ? "border-[#5C3A21]/60 bg-[#EFDDBF] text-[#5C3A21]"
                : "border-amber-900/40 bg-[#FFFDF7] text-amber-900/70"
            }`}
          >
            <span
              className={`inline-block size-3 rounded-full border transition-colors ${
                apiForm.mockMode ? "border-[#5C3A21] bg-[#5C3A21]" : "border-amber-900/40"
              }`}
              aria-hidden
            />
            تفعيل الوضع المحلي التجريبي (Mock Mode)
          </button>
          <button
            type="button"
            onClick={saveApiConfig}
            className="font-arabic rounded-full border border-[#5C3A21]/50 bg-[#FFFDF7] px-4 py-2 text-sm font-semibold text-[#5C3A21] transition-colors hover:bg-[#EFDDBF]"
          >
            حفظ الإعدادات
          </button>
        </div>
      </section>

      <Panel
        title="محرّر المحتوى"
        aside={<Badge tone={hits.length ? "ok" : "idle"}>{hits.length} نتيجة</Badge>}
      >
        <p className="mb-3 text-sm text-slatew-400">
          ابحث عن أي نص داخل اللعبة (حوارات الشخصيات، نصوص الخيارات، عناوين الخرائط، عبارات
          البداية…) وعدّله مباشرة في قاعدة البيانات دون تعديل الكود.
        </p>

        {/* single search bar */}
        <form
          className="mb-4 flex items-stretch gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void search();
          }}
        >
          <TextInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="اكتب كلمة أو جملة للبحث عنها…"
            aria-label="بحث في نصوص المحتوى"
          />
          <Btn type="submit" disabled={searching || query.trim().length === 0}>
            {searching ? "يبحث…" : "بحث"}
          </Btn>
        </form>

        {error && (
          <p className="mb-3 rounded border border-red-400/50 bg-red-900/30 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}

        {hits.length === 0 ? (
          <Empty label={searched ? "لا نتائج مطابقة" : "ابدأ بالبحث لعرض النصوص"} />
        ) : (
          <ul className="grid gap-2">
            {hits.map((hit) => {
              const key = rowKey(hit);
              const dirty = (drafts[key] ?? "") !== hit.currentText;
              return (
                <li
                  key={key}
                  className="grid gap-2 rounded-md border border-slatew-700 bg-slatew-950/50 p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="warn">{ENTITY_LABEL[hit.entityType]}</Badge>
                    <span className="min-w-0 flex-1 truncate text-sm text-slatew-200" title={hit.label}>
                      {hit.label}
                    </span>
                    <code className="rounded bg-slatew-950 px-1 py-0.5 font-mono text-[10px] text-slatew-500">
                      {hit.fieldName}
                    </code>
                  </div>
                  <textarea
                    dir="auto"
                    rows={2}
                    value={drafts[key] ?? ""}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="w-full resize-y rounded-md border border-slatew-700 bg-slatew-950/70 px-3 py-2 text-sm leading-relaxed text-slatew-100 outline-none transition-colors placeholder:text-slatew-500 focus:border-kraft-400"
                  />
                  <div className="flex items-center justify-end gap-2">
                    {dirty && <span className="text-[11px] text-kraft-300">• تغييرات غير محفوظة</span>}
                    <Btn
                      onClick={() => void save(hit)}
                      disabled={savingKey === key || !dirty}
                    >
                      {savingKey === key ? "يحفظ…" : "حفظ في قاعدة البيانات"}
                    </Btn>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {/* ── Traces / أثر management — warm paper section ────────── */}
      <section className="rounded-lg border border-amber-900/25 bg-[#F5EFE6] p-4 shadow-[3px_4px_0_rgb(0_0_0/0.12)]">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl leading-none tracking-tight text-amber-950">
            إدارة الأثر
          </h2>
          <span className="inline-flex items-center gap-1 rounded border-[1.5px] border-[#5C3A21]/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[#5C3A21]">
            {items.length} أثر
          </span>
        </header>
        <p className="font-arabic mb-4 text-sm leading-relaxed text-amber-900/70">
          أضف آثارًا مخصصة تُضاف فورًا لكشكول اللاعب، أو حذف/تنظيف إدخالات الاختبار.
        </p>

        {/* create form */}
        <form
          onSubmit={submitTrace}
          className="mb-5 grid gap-3 rounded-sm border border-amber-900/20 bg-[#FFFDF7] p-4 sm:grid-cols-2"
        >
          <label className="grid gap-1">
            <span className="font-arabic text-xs text-amber-900/80">العبارة البغدادية</span>
            <input
              value={traceForm.phrase}
              onChange={(e) => setTraceForm((prev) => ({ ...prev, phrase: e.target.value }))}
              placeholder="عابر القارة"
              className="w-full rounded-sm border border-amber-900/30 bg-[#FFFDF7] px-3 py-2 text-sm text-amber-950 outline-none transition-colors placeholder:text-amber-900/35 focus:border-amber-900/60"
            />
          </label>
          <label className="grid gap-1">
            <span className="font-arabic text-xs text-amber-900/80">السلانغ الأمريكي</span>
            <input
              dir="ltr"
              value={traceForm.targetSlang}
              onChange={(e) => setTraceForm((prev) => ({ ...prev, targetSlang: e.target.value }))}
              placeholder="Next level"
              className="w-full rounded-sm border border-amber-900/30 bg-[#FFFDF7] px-3 py-2 font-mono text-sm text-amber-950 outline-none transition-colors placeholder:text-amber-900/35 focus:border-amber-900/60"
            />
          </label>
          <label className="grid gap-1">
            <span className="font-arabic text-xs text-amber-900/80">سياق الاستخدام</span>
            <input
              value={traceForm.contextNote}
              onChange={(e) => setTraceForm((prev) => ({ ...prev, contextNote: e.target.value }))}
              placeholder="تُقال للثناء على شخص متفوق جداً"
              className="w-full rounded-sm border border-amber-900/30 bg-[#FFFDF7] px-3 py-2 text-sm text-amber-950 outline-none transition-colors placeholder:text-amber-900/35 focus:border-amber-900/60"
            />
          </label>
          <label className="grid content-start gap-1">
            <span className="font-arabic text-xs text-amber-900/80">التصنيف</span>
            <select
              value={traceForm.category}
              onChange={(e) =>
                setTraceForm((prev) => ({ ...prev, category: e.target.value as CollectibleCategory }))
              }
              className="w-full rounded-sm border border-amber-900/30 bg-[#FFFDF7] px-3 py-2 text-sm text-amber-950 outline-none transition-colors focus:border-amber-900/60"
            >
              {(["GLOBAL", "RECEIPT_MENU", "CHALKBOARD", "MANILA_FOLDER", "STREET_POSTER"] as const).map(
                (c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ),
              )}
            </select>
          </label>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="font-arabic rounded-full border border-[#5C3A21]/50 bg-[#FFFDF7] px-4 py-2 text-sm font-semibold text-[#5C3A21] transition-colors hover:bg-[#EFDDBF]"
            >
              إضافة أثر مخصص
            </button>
            {traceNote && (
              <span className="font-arabic text-xs text-[#5C3A21]">{traceNote}</span>
            )}
          </div>
        </form>

        {/* existing traces list — sorted by creation date, newest first */}
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-amber-900/60">
            — لا توجد آثار محفوظة بعد —
          </p>
        ) : (
          <ul className="grid gap-2">
            {[...items]
              .sort(
                (a, b) =>
                  (b.createdAt ?? "").localeCompare(a.createdAt ?? "") ||
                  (b.unlockedAt ?? "").localeCompare(a.unlockedAt ?? ""),
              )
              .map((item) => (
                <li
                  key={item.id}
                  className="grid gap-2 rounded-sm border border-amber-900/20 bg-[#FFFDF7] p-3 sm:grid-cols-[1fr_auto]"
                >
                  <div className="min-w-0">
                    <p className="text-base font-bold leading-snug text-amber-950">{item.phrase}</p>
                    <p className="mt-1">
                      <span dir="ltr" className="inline-block font-mono text-sm text-amber-800">
                        {item.targetSlang}
                      </span>
                    </p>
                    {item.contextNote && (
                      <p className="font-arabic mt-1.5 text-xs italic leading-relaxed text-stone-600">
                        {item.contextNote}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={
                          item.source === "ADMIN"
                            ? "font-arabic rounded-full border border-[#8B0000]/40 px-2 py-0.5 text-[10px] text-[#8B0000]"
                            : "font-arabic rounded-full border border-[#1E3A8A]/40 px-2 py-0.5 text-[10px] text-[#1E3A8A]"
                        }
                      >
                        {item.source === "ADMIN" ? "أثر مخصص" : "أثر مكتشف"}
                      </span>
                      <span className="rounded-full border border-amber-900/30 px-2 py-0.5 font-mono text-[10px] text-amber-900/70">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-row items-center gap-2 sm:flex-col sm:items-end">
                    {item.createdAt && (
                      <span className="font-arabic text-[10px] text-stone-400">
                        {new Date(item.createdAt).toLocaleDateString("ar-IQ")}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5">
                      {editingTraceId === item.id ? (
                        <>
                          {(
                            [
                              ["phrase", "العبارة البغدادية", traceDraft.phrase, (v: string) => setTraceDraft((p) => ({ ...p, phrase: v }))],
                              ["targetSlang", "السلانغ الأمريكي", traceDraft.targetSlang, (v: string) => setTraceDraft((p) => ({ ...p, targetSlang: v }))],
                              ["contextNote", "ملاحظة السياق", traceDraft.contextNote, (v: string) => setTraceDraft((p) => ({ ...p, contextNote: v }))],
                            ] as const
                          ).map(([key, label, value, setV]) => (
                            <input
                              key={key}
                              value={value}
                              onChange={(e) => setV(e.target.value)}
                              placeholder={label}
                              className="w-full rounded-sm border border-amber-900/30 bg-[#FFFDF7] px-2 py-1 text-xs text-amber-950 outline-none focus:border-amber-900/60"
                            />
                          ))}
                          <button
                            type="button"
                            onClick={() => setEditingTraceId(null)}
                            className="font-arabic rounded-full border border-amber-700/40 bg-[#FFFDF7] px-2 py-1 text-xs text-amber-800 transition-colors hover:bg-amber-50"
                          >
                            إلغاء
                          </button>
                          <button
                            type="button"
                            onClick={() => saveTraceEdit(item.id)}
                            className="font-arabic rounded-full border border-emerald-700/50 bg-[#FFFDF7] px-3 py-1 text-xs text-emerald-700 transition-colors hover:bg-emerald-50"
                          >
                            حفظ
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => beginEditTrace(item)}
                            className="font-arabic rounded-full border border-blue-700/40 bg-[#FFFDF7] px-3 py-1 text-xs text-blue-700 transition-colors hover:bg-blue-50"
                          >
                            تعديل
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTrace(item.id)}
                            className="font-arabic rounded-full border border-red-700/50 bg-[#FFFDF7] px-3 py-1 text-xs text-red-700 transition-colors hover:bg-red-50"
                          >
                            حذف
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>

      {/* ── Vibe Mapper / Vibe Vault — warm paper section ─────────────── */}
      <section className="rounded-lg border border-amber-900/25 bg-[#F5EFE6] p-4 shadow-[3px_4px_0_rgb(0_0_0/0.12)]">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl leading-none tracking-tight text-amber-950">
            <span dir="ltr" className="inline-block">
              {UI_GENZ_COPY.dictionary}
            </span>{" "}
            — القوالب الحسية (Gen Z Vibe Mapper)
          </h2>
          <span className="inline-flex items-center gap-1 rounded border-[1.5px] border-[#5C3A21]/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[#5C3A21]">
            {vibeEntries.length} مدخل
          </span>
        </header>
        <p className="font-arabic mb-4 text-sm leading-relaxed text-amber-900/70">
          اربط العبارات البغدادية بسلانغ جيل Z عبر قوالب حسية (بذاءة مرحة، احترام، صراع، إتقان، دراما،
          هالة). المدخلات اليدوية تُحفظ محليًا فورًا وتُغذي محرك التوليد — بدون بوابات دينية أو جغرافية.
        </p>

        {/* ── vibe engine generator ── */}
        <VibeMapperEngine
          generateVibe={generateVibe}
          saveToTraces={saveToTraces}
          entries={vibeEntries}
        />

        <div className="my-5 h-px border-t border-dashed border-amber-900/25" aria-hidden />

        {/* create form */}
        <form
          onSubmit={submitVibe}
          className="mb-5 grid gap-3 rounded-sm border border-amber-900/20 bg-[#FFFDF7] p-4 sm:grid-cols-2"
        >
          <label className="grid gap-1">
            <span className="font-arabic text-xs text-amber-900/80">العبارة البغدادية *</span>
            <input
              value={vibeForm.baghdadiPhrase}
              onChange={(e) => setVibeForm((prev) => ({ ...prev, baghdadiPhrase: e.target.value }))}
              placeholder="انطي الخبز لخبازه"
              className="w-full rounded-sm border border-amber-900/30 bg-[#FFFDF7] px-3 py-2 text-sm text-amber-950 outline-none transition-colors placeholder:text-amber-900/35 focus:border-amber-900/60"
            />
          </label>
          <label className="grid gap-1">
            <span className="font-arabic text-xs text-amber-900/80">وسم السياق *</span>
            <input
              value={vibeForm.contextTag}
              onChange={(e) => setVibeForm((prev) => ({ ...prev, contextTag: e.target.value }))}
              placeholder="عمل وبروفيشينال"
              className="w-full rounded-sm border border-amber-900/30 bg-[#FFFDF7] px-3 py-2 text-sm text-amber-950 outline-none transition-colors placeholder:text-amber-900/35 focus:border-amber-900/60"
            />
          </label>
          <label className="grid gap-1">
            <span className="font-arabic text-xs text-amber-900/80">الترجمة الحرفية *</span>
            <input
              value={vibeForm.literalMeaning}
              onChange={(e) => setVibeForm((prev) => ({ ...prev, literalMeaning: e.target.value }))}
              placeholder="إعطاء الخبز للخباز المختص"
              className="w-full rounded-sm border border-amber-900/30 bg-[#FFFDF7] px-3 py-2 text-sm text-amber-950 outline-none transition-colors placeholder:text-amber-900/35 focus:border-amber-900/60"
            />
          </label>
          <label className="grid gap-1">
            <span className="font-arabic text-xs text-amber-900/80">السلانغ الأمريكي *</span>
            <input
              dir="ltr"
              value={vibeForm.genZSlang}
              onChange={(e) => setVibeForm((prev) => ({ ...prev, genZSlang: e.target.value }))}
              placeholder="Let him cook"
              className="w-full rounded-sm border border-amber-900/30 bg-[#FFFDF7] px-3 py-2 font-mono text-sm text-amber-950 outline-none transition-colors placeholder:text-amber-900/35 focus:border-amber-900/60"
            />
          </label>
          <label className="grid gap-1 sm:col-span-2">
            <span className="font-arabic text-xs text-amber-900/80">الشرح والإحساس الشعبي (cultural vibe) *</span>
            <textarea
              rows={2}
              value={vibeForm.culturalVibe}
              onChange={(e) => setVibeForm((prev) => ({ ...prev, culturalVibe: e.target.value }))}
              placeholder="تسليم المهام المعقدة لأهل الاختصاص وعدم التطفل"
              className="w-full resize-y rounded-sm border border-amber-900/30 bg-[#FFFDF7] px-3 py-2 text-sm leading-relaxed text-amber-950 outline-none transition-colors placeholder:text-amber-900/35 focus:border-amber-900/60"
            />
          </label>
          <label className="grid gap-1">
            <span className="font-arabic text-xs text-amber-900/80">مثال الاستخدام الأمريكي *</span>
            <input
              dir="ltr"
              value={vibeForm.usageExample}
              onChange={(e) => setVibeForm((prev) => ({ ...prev, usageExample: e.target.value }))}
              placeholder="Don't tell him how to edit, bro. Let him cook."
              className="w-full rounded-sm border border-amber-900/30 bg-[#FFFDF7] px-3 py-2 font-mono text-sm text-amber-950 outline-none transition-colors placeholder:text-amber-900/35 focus:border-amber-900/60"
            />
          </label>
          <label className="grid gap-1">
            <span className="font-arabic text-xs text-amber-900/80">تأثير الهالة (اختياري)</span>
            <input
              dir="ltr"
              value={vibeForm.auraImpact}
              onChange={(e) => setVibeForm((prev) => ({ ...prev, auraImpact: e.target.value }))}
              placeholder="+500 Aura"
              className="w-full rounded-sm border border-amber-900/30 bg-[#FFFDF7] px-3 py-2 font-mono text-sm text-amber-950 outline-none transition-colors placeholder:text-amber-900/35 focus:border-amber-900/60"
            />
          </label>
          <label className="grid content-start gap-1">
            <span className="font-arabic text-xs text-amber-900/80">التصنيف الحسي</span>
            <select
              value={vibeForm.category}
              onChange={(e) => setVibeForm((prev) => ({ ...prev, category: e.target.value as VibeCategory }))}
              className="w-full rounded-sm border border-amber-900/30 bg-[#FFFDF7] px-3 py-2 text-sm text-amber-950 outline-none transition-colors focus:border-amber-900/60"
            >
              {VIBE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c} — {VIBE_CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="font-arabic rounded-full border border-[#5C3A21]/50 bg-[#FFFDF7] px-4 py-2 text-sm font-semibold text-[#5C3A21] transition-colors hover:bg-[#EFDDBF]"
            >
              إضافة إلى <span dir="ltr" className="inline-block">{UI_GENZ_COPY.dictionary}</span>
            </button>
            {vibeNote && <span className="font-arabic text-xs text-[#5C3A21]">{vibeNote}</span>}
          </div>
        </form>

        {/* filter bar */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <select
            value={vibeFilter}
            onChange={(e) => setVibeFilter(e.target.value as "ALL" | VibeCategory)}
            aria-label="تصفية حسب التصنيف"
            className="w-auto rounded-sm border border-amber-900/30 bg-[#FFFDF7] px-3 py-2 text-sm text-amber-950 outline-none transition-colors focus:border-amber-900/60"
          >
            <option value="ALL">كل التصنيفات</option>
            {VIBE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c} — {VIBE_CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
          <input
            value={vibeQuery}
            onChange={(e) => setVibeQuery(e.target.value)}
            placeholder="ابحث في العبارة / السياق / السلانغ…"
            aria-label="بحث في المدخلات الحسية"
            className="min-w-[220px] flex-1 rounded-sm border border-amber-900/30 bg-[#FFFDF7] px-3 py-2 font-arabic text-sm text-amber-950 outline-none transition-colors placeholder:text-amber-900/35 focus:border-amber-900/60"
          />
          <span className="font-arabic rounded-full border border-amber-900/30 px-2 py-1 text-[10px] text-amber-900/70">
            {visibleVibeEntries.length} مدخل
          </span>
        </div>

        {/* dictionary table */}
        {visibleVibeEntries.length === 0 ? (
          <p className="py-6 text-center text-sm text-amber-900/60">
            — لا توجد مدخلات مطابقة بعد —
          </p>
        ) : (
          <ul className="grid gap-2">
            {visibleVibeEntries.map((entry) => (
              <li
                key={entry.id}
                className="grid gap-2 rounded-sm border border-amber-900/20 bg-[#FFFDF7] p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-bold leading-snug text-amber-950">
                    {entry.baghdadiPhrase}
                  </span>
                  <span dir="ltr" className="font-mono text-sm font-semibold text-amber-800">
                    → {entry.genZSlang}
                  </span>
                </div>
                <p className="font-arabic text-xs text-amber-900/70">
                  <span className="font-semibold text-amber-950">{entry.contextTag}</span>
                  {" — "}
                  {entry.culturalVibe}
                </p>
                {entry.auraImpact && (
                  <p dir="ltr" className="font-mono text-xs text-emerald-700">
                    {entry.auraImpact}
                  </p>
                )}
                {entry.usageExample && (
                  <p dir="ltr" className="rounded-sm bg-[#F5EFE6] px-2 py-1 font-mono text-xs italic text-stone-600">
                    “{entry.usageExample}”
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  {editingVibeId === entry.id ? (
                    <>
                      {(
                        [
                          ["baghdadiPhrase", "العبارة البغدادية", vibeDraft.baghdadiPhrase, (v: string) => setVibeDraft((p) => ({ ...p, baghdadiPhrase: v }))],
                          ["contextTag", "وسم السياق", vibeDraft.contextTag, (v: string) => setVibeDraft((p) => ({ ...p, contextTag: v }))],
                          ["literalMeaning", "المعنى الحرفي", vibeDraft.literalMeaning, (v: string) => setVibeDraft((p) => ({ ...p, literalMeaning: v }))],
                          ["culturalVibe", "الشرح الحسي", vibeDraft.culturalVibe, (v: string) => setVibeDraft((p) => ({ ...p, culturalVibe: v }))],
                          ["genZSlang", "السلانغ", vibeDraft.genZSlang, (v: string) => setVibeDraft((p) => ({ ...p, genZSlang: v }))],
                          ["auraImpact", "Aura", vibeDraft.auraImpact, (v: string) => setVibeDraft((p) => ({ ...p, auraImpact: v }))],
                          ["usageExample", "مثال", vibeDraft.usageExample, (v: string) => setVibeDraft((p) => ({ ...p, usageExample: v }))],
                        ] as const
                      ).map(([key, label, value, setV]) => (
                        <input
                          key={key}
                          value={value}
                          onChange={(e) => setV(e.target.value)}
                          placeholder={label}
                          className="w-full rounded-sm border border-amber-900/30 bg-[#FFFDF7] px-2 py-1 text-xs text-amber-950 outline-none focus:border-amber-900/60"
                        />
                      ))}
                      <select
                        value={vibeDraft.category}
                        onChange={(e) => setVibeDraft((p) => ({ ...p, category: e.target.value as VibeCategory }))}
                        className="rounded-sm border border-amber-900/30 bg-[#FFFDF7] px-2 py-1 text-xs text-amber-950 outline-none focus:border-amber-900/60"
                      >
                        {VIBE_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c} — {VIBE_CATEGORY_LABEL[c]}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setEditingVibeId(null)}
                        className="font-arabic rounded-full border border-amber-700/40 bg-[#FFFDF7] px-2 py-1 text-xs text-amber-800 transition-colors hover:bg-amber-50"
                      >
                        إلغاء
                      </button>
                      <button
                        type="button"
                        onClick={() => saveVibeEdit(entry.id)}
                        className="font-arabic rounded-full border border-emerald-700/50 bg-[#FFFDF7] px-3 py-1 text-xs text-emerald-700 transition-colors hover:bg-emerald-50"
                      >
                        حفظ
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => beginEditVibe(entry)}
                        className="mr-auto font-arabic rounded-full border border-blue-700/40 bg-[#FFFDF7] px-3 py-1 text-xs text-blue-700 transition-colors hover:bg-blue-50"
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteVibe(entry.id)}
                        className="font-arabic rounded-full border border-red-700/50 bg-[#FFFDF7] px-3 py-1 text-xs text-red-700 transition-colors hover:bg-red-50"
                      >
                        حذف
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* success toast */}
      {toast && (
        <div
          role="status"
          className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-md border-[1.5px] border-kraft-400 bg-slatew-900/95 px-4 py-2 text-sm font-semibold text-kraft-100 shadow-[3px_4px_0_rgb(0_0_0/0.45)]"
        >
          {toast}
        </div>
      )}

      {/* reset-to-seed confirmation — warm paper modal */}
      {resetConfirmOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setResetConfirmOpen(false)}
            aria-hidden
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label="تأكيد إعادة الضبط"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-card-in"
          >
            <div className="w-full max-w-sm rounded-sm border-2 border-[#8B5A2B] bg-[#F5EFE6] p-5 shadow-2xl">
              <h3 className="font-display text-xl font-bold leading-none text-amber-950">
                إعادة ضبط للمرجع الأصلي؟
              </h3>
              <p className="font-arabic mt-3 text-sm leading-relaxed text-amber-900/80">
                سيتم حذف كل الآثار والمدخلات الحسية المخصصة من هذا المتصفح واستعادة البذرة
                الأصلية (seeds). لا يمكن التراجع عن هذا الإجراء محليًا.
              </p>
              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetConfirmOpen(false)}
                  className="font-arabic rounded-full border border-[#5C3A21]/50 bg-[#FFFDF7] px-4 py-2 text-sm font-semibold text-[#5C3A21] transition-colors hover:bg-[#EFDDBF]"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={confirmResetToSeed}
                  className="font-arabic rounded-full border border-red-700/50 bg-[#FFFDF7] px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
                >
                  نعم، إعادة الضبط
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
