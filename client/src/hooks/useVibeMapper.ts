import { useCallback, useState } from "react";

import {
  VIBE_DICTIONARY_KEY,
  type AdminCollectibleInput,
  type AdminVibeInput,
  type CollectibleCategory,
  type CollectibleItem,
  type VibeCategory,
  type VibeMapEntry,
  type VibeSource,
} from "@be-native/shared";

import { DEFAULT_VIBE_ENTRIES } from "../data/seedData";

/**
 * "Vibe Mapper / قاموس القوالب الحسية" — local-first cultural dictionary.
 *
 * DUAL-SOURCED:
 *  - ADMIN_MANUAL entries come from the Admin panel (`addManualEntry`).
 *  - AI_GENERATED entries arrive from the multi-layer vibe engine
 *    (`addAIEntry`), persisted in the same envelope.
 *
 * State lives in localStorage under `native_slang_vibe_dictionary` so manual
 * entries survive reloads and are immediately available to the engine.
 *
 * NO UI HERE — data contracts + persistence only.
 */

interface UseVibeMapperResult {
  /** Full dictionary (manual + AI) in memory, newest first. */
  entries: VibeMapEntry[];
  /** Persists a manual admin entry with source "ADMIN_MANUAL". */
  addManualEntry: (input: AdminVibeInput) => VibeMapEntry;
  /** Persists an engine-generated entry with source "AI_GENERATED". */
  addAIEntry: (input: AdminVibeInput) => VibeMapEntry;
  /** Entries restricted to a single vibe category. */
  getEntriesByCategory: (category: VibeCategory) => VibeMapEntry[];
  /** Free-text lookup across phrase, context, vibe, slang, example. */
  searchEntriesByVibe: (query: string) => VibeMapEntry[];
  /** Removes an entry by id and purges it from localStorage. */
  deleteEntry: (id: string) => void;
  /**
   * 3-step AI pipeline (تفكيك → قالب وسيط → صياغة Gen Z): resolves (or
   * synthesizes) a vibe mapping for a Baghdadi phrase + template, reports
   * each stage through `onStage`, persists the result as source
   * "AI_GENERATED" and returns it for immediate display.
   */
  generateVibe: (
    input: { baghdadiPhrase: string; template: VibeTemplateId },
    onStage?: (report: VibePipelineReport) => void,
  ) => Promise<VibeMapEntry>;
  /**
   * Saves a vibe entry straight into the global "أثر" scrapbook as an
   * unlocked CollectibleItem. Returns the saved trace, or null when no
   * collectibles adapter was supplied to the hook.
   */
  saveToTraces: (entry: VibeMapEntry) => CollectibleItem | null;
  /** Wipes custom overrides and restores the base seed baseline. */
  resetToSeed: () => void;
}

/** The four selectable generation contexts ("القالب"). */
export type VibeTemplateId = "WORK" | "BANTER" | "REPROACH" | "WEIGHT";

/** The three observable pipeline stages of the vibe engine. */
export type VibePipelineStageId = "DECONSTRUCT" | "BRIDGE" | "SYNTHESIS";

/** Field-level outputs produced by a single pipeline stage. */
export interface VibePipelineReport {
  stage: VibePipelineStageId;
  outputs: Record<string, string>;
}

/** Selectable engine template record (label shown in the admin select). */
export interface VibeTemplate {
  id: VibeTemplateId;
  label: string;
  contextTag: string;
  category: VibeCategory;
  /** Skins the synthesized AI entry with idiom-level metdata. */
  skeleton: Omit<AdminVibeInput, "baghdadiPhrase" | "contextTag" | "category">;
  /** Step-2 bridge model: social dynamics, tone intensity & intent. */
  bridge: {
    socialDynamics: string;
    toneIntensity: string;
    vibeIntent: string;
  };
}

export const VIBE_TEMPLATES: VibeTemplate[] = [
  {
    id: "WORK",
    label: "عمل وتفوق",
    contextTag: "عمل وتفوق",
    category: "MASTERY",
    skeleton: {
      literalMeaning: "إنجاز مهمة بمنتهى الاحتراف وتسليم الشغل لأهل الاختصاص",
      culturalVibe: "هذا الشغل صار بيد أهل الاختصاص؛ لا تتطفل ولا تشكك، المحترف يعرف شغله.",
      genZSlang: "Pure masterclass",
      usageExample: "Bro left his deadline to me and vanished. Can't complain though — pure masterclass.",
      auraImpact: "+500 Aura",
    },
    bridge: {
      socialDynamics: "تسليم الشغل لأهل الاختصاص والثقة الكاملة بمهارتهم",
      toneIntensity: "هادئ وواثق",
      vibeIntent: "تأكيد الاحتراف",
    },
  },
  {
    id: "BANTER",
    label: "تحشيش وسخرية",
    contextTag: "تحشيش وسخرية",
    category: "BANTER",
    skeleton: {
      literalMeaning: "مزاح خفيف وردّة سريعة من غير ما تكسر الخاطر",
      culturalVibe: "المسموح بالجلسة طعن خفيف وردة أسرع — الكل يضحك والكل يعرف حدوده.",
      genZSlang: "Ratioed, no cap",
      usageExample: "You backed that play up way too fast — ratioed, no cap.",
      auraImpact: "+200 Aura (مناعة ضحك)",
    },
    bridge: {
      socialDynamics: "مزاح متبادل بلا كسر خاطر والحدود واضحة بين الأصدقاء",
      toneIntensity: "خفيف وسريع",
      vibeIntent: "ترويج للمرح والتقبل",
    },
  },
  {
    id: "REPROACH",
    label: "زعل وعتاب",
    contextTag: "زعل وعتاب",
    category: "DRAMA",
    skeleton: {
      literalMeaning: "زعل داخلي وحرقة معاتبة لا تُعلن صريحًا",
      culturalVibe: "الزعل البغدادي هادي بالكلام ثقيل بالعين؛ صمت أدب والمقصود مفهوم.",
      genZSlang: "Awkward silence material",
      usageExample: "Oh, you told her that? That's awkward silence material right there.",
      auraImpact: "-100 Aura لمن قصّر",
    },
    bridge: {
      socialDynamics: "معاتبة هادئة بصمت أدب تُفهم قراءة العين",
      toneIntensity: "ثقيل هادئ",
      vibeIntent: "إظهار الأثر بدون مواجهة مباشرة",
    },
  },
  {
    id: "WEIGHT",
    label: "هيبة وثقل",
    contextTag: "هيبة وثقل",
    category: "AURA",
    skeleton: {
      literalMeaning: "هيبة قول تُحسب ولا تُناقش",
      culturalVibe: "الثقل الحقيقي ما يرفع صوته؛ كلمته الوحدة تنهي النقاش ويُحسب لها ألف حساب.",
      genZSlang: "Big aura energy",
      usageExample: "He said one word and the whole chat went quiet. Big aura energy.",
      auraImpact: "+1000 Aura",
    },
    bridge: {
      socialDynamics: "حضور يسكت النقاش وقيادة صامتة بالكلمة الواحدة",
      toneIntensity: "ثقل نهائي",
      vibeIntent: "فرض الاحترام والهيبة",
    },
  },
];

/** Vibe register → scrapbook scene template (trace-surface mapping). */
const VIBE_TO_TRACE_CATEGORY: Record<VibeCategory, CollectibleCategory> = {
  BANTER: "RECEIPT_MENU",
  RESPECT: "CHALKBOARD",
  CONFLICT: "STREET_POSTER",
  MASTERY: "MANILA_FOLDER",
  DRAMA: "RECEIPT_MENU",
  AURA: "GLOBAL",
};

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — fail silently, state still works in-memory */
  }
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `vibe_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/** Seed baseline collapsed into a dedupe key (lowercased baghdadiPhrase). */
const SEED_VIBE_KEYS = new Set(
  DEFAULT_VIBE_ENTRIES.map((entry) => entry.baghdadiPhrase.toLowerCase()),
);

/** Seeds merged under any custom localStorage overrides, without duplicates. */
function hydrateVibeEntries(): VibeMapEntry[] {
  const stored = readJSON<VibeMapEntry[]>(VIBE_DICTIONARY_KEY, []);
  const custom = stored.filter(
    (entry) => !SEED_VIBE_KEYS.has(entry.baghdadiPhrase.toLowerCase()),
  );
  return [...custom, ...DEFAULT_VIBE_ENTRIES];
}

export function useVibeMapper(addAdminItem?: (input: AdminCollectibleInput) => CollectibleItem): UseVibeMapperResult {
  const [entries, setEntries] = useState<VibeMapEntry[]>(() => hydrateVibeEntries());

  const persistEntry = useCallback((input: AdminVibeInput, source: VibeSource): VibeMapEntry => {
    const entry: VibeMapEntry = {
      ...input,
      id: makeId(),
      source,
      createdAt: new Date().toISOString(),
    };
    setEntries((prev) => {
      const next = [entry, ...prev];
      writeJSON(VIBE_DICTIONARY_KEY, next);
      return next;
    });
    return entry;
  }, []);

  const addManualEntry = useCallback(
    (input: AdminVibeInput): VibeMapEntry => persistEntry(input, "ADMIN_MANUAL"),
    [persistEntry],
  );

  const addAIEntry = useCallback(
    (input: AdminVibeInput): VibeMapEntry => persistEntry(input, "AI_GENERATED"),
    [persistEntry],
  );

  const getEntriesByCategory = useCallback(
    (category: VibeCategory): VibeMapEntry[] =>
      entries.filter((entry) => entry.category === category),
    [entries],
  );

  const searchEntriesByVibe = useCallback(
    (query: string): VibeMapEntry[] => {
      const needle = query.trim().toLowerCase();
      if (!needle) return entries;
      const hits = (value: string) => value.toLowerCase().includes(needle);
      return entries.filter(
        (entry) =>
          hits(entry.baghdadiPhrase) ||
          hits(entry.contextTag) ||
          hits(entry.literalMeaning) ||
          hits(entry.culturalVibe) ||
          hits(entry.genZSlang) ||
          hits(entry.usageExample) ||
          hits(entry.auraImpact),
      );
    },
    [entries],
  );

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((entry) => entry.id !== id);
      writeJSON(VIBE_DICTIONARY_KEY, next);
      return next;
    });
  }, []);

  const resetToSeed = useCallback(() => {
    try {
      window.localStorage.removeItem(VIBE_DICTIONARY_KEY);
    } catch {
      /* private mode — in-memory reset still applies */
    }
    setEntries([...DEFAULT_VIBE_ENTRIES]);
  }, []);

  const generateVibe = useCallback(
    async (
      { baghdadiPhrase, template: templateId }: { baghdadiPhrase: string; template: VibeTemplateId },
      onStage?: (report: VibePipelineReport) => void,
    ): Promise<VibeMapEntry> => {
      const clean = baghdadiPhrase.trim();
      const needle = clean.toLowerCase();
      const existing = needle
        ? entries.find((entry) => entry.baghdadiPhrase.toLowerCase() === needle)
        : undefined;
      const tmpl = VIBE_TEMPLATES.find((t) => t.id === templateId) ?? VIBE_TEMPLATES[0];

      // Step 1 — تفكيك: deconstruct the phrase into literal + cultural meaning.
      onStage?.({
        stage: "DECONSTRUCT",
        outputs: existing
          ? { literalMeaning: existing.literalMeaning, culturalVibe: existing.culturalVibe }
          : {
              literalMeaning: tmpl.skeleton.literalMeaning,
              culturalVibe: tmpl.skeleton.culturalVibe,
            },
      });
      await sleep(420);

      // Step 2 — قالب وسيط: model social dynamics, tone intensity & intent.
      onStage?.({
        stage: "BRIDGE",
        outputs: {
          contextTag: tmpl.contextTag,
          category: tmpl.category,
          socialDynamics: tmpl.bridge.socialDynamics,
          toneIntensity: tmpl.bridge.toneIntensity,
          vibeIntent: tmpl.bridge.vibeIntent,
        },
      });
      await sleep(420);

      // Step 3 — صياغة Gen Z: synthesize slang, aura impact & street example.
      onStage?.({
        stage: "SYNTHESIS",
        outputs: existing
          ? {
              genZSlang: existing.genZSlang,
              auraImpact: existing.auraImpact,
              usageExample: existing.usageExample,
            }
          : {
              genZSlang: tmpl.skeleton.genZSlang,
              auraImpact: tmpl.skeleton.auraImpact,
              usageExample: tmpl.skeleton.usageExample,
            },
      });
      await sleep(420);

      // Existing dictionary entry (admin or prior AI) wins — no duplicate persist.
      if (existing) return existing;

      return addAIEntry({
        baghdadiPhrase: clean,
        contextTag: tmpl.contextTag,
        literalMeaning: tmpl.skeleton.literalMeaning,
        culturalVibe: tmpl.skeleton.culturalVibe,
        genZSlang: tmpl.skeleton.genZSlang,
        usageExample: tmpl.skeleton.usageExample,
        auraImpact: tmpl.skeleton.auraImpact,
        category: tmpl.category,
      });
    },
    [entries, addAIEntry],
  );

  const saveToTraces = useCallback(
    (entry: VibeMapEntry): CollectibleItem | null => {
      if (!addAdminItem) return null;
      const contextParts = [entry.culturalVibe, entry.literalMeaning];
      if (entry.usageExample) contextParts.push(entry.usageExample);
      return addAdminItem({
        phrase: entry.baghdadiPhrase,
        targetSlang: entry.genZSlang,
        contextNote: contextParts.join(" — "),
        category: VIBE_TO_TRACE_CATEGORY[entry.category],
        isUnlocked: true,
      });
    },
    [addAdminItem],
  );

  return {
    entries,
    addManualEntry,
    addAIEntry,
    getEntriesByCategory,
    searchEntriesByVibe,
    deleteEntry,
    generateVibe,
    saveToTraces,
    resetToSeed,
  };
}