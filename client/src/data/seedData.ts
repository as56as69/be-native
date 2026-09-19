import type { CollectibleItem, ScenarioNode, VibeCategory, VibeMapEntry } from "@be-native/shared";

/**
 * Seed baseline data — the warm-paper defaults that back the app when
 * localStorage is empty. Hydrated seamlessly by the hooks (in-memory) and
 * used as the reference baseline for the admin "Reset to Seed" action.
 *
 * Every export shape strictly matches the shared contracts:
 * CollectibleItem | VibeMapEntry | ScenarioNode.
 */

/** The unified admin export envelope (collectibles + vibe dictionary + scenarios). */
export interface SeedExportBundle {
  exportedAt: string;
  collectibles: CollectibleItem[];
  vibeEntries: VibeMapEntry[];
  scenarios: ScenarioNode[];
}

/* ── Traces / أثر ─────────────────────────────────────────────────────── */

/** Initial unlocked traces — discovered-style, matching CollectibleItem. */
export const DEFAULT_COLLECTIBLES: CollectibleItem[] = [
  {
    id: "seed-trace-001",
    phrase: "انطي الخبز لخبازه",
    targetSlang: "Let him cook",
    contextNote: "الثقة بمهارة أهل الاختصاص وعدم التطفل على شغلهم",
    category: "MANILA_FOLDER",
    source: "SCENARIO",
    isUnlocked: true,
    unlockedAt: "2025-01-01T10:00:00.000Z",
    createdAt: "2025-01-01T10:00:00.000Z",
  },
  {
    id: "seed-trace-002",
    phrase: "يده ثقيلة",
    targetSlang: "Main character energy",
    contextNote: "من تمسكه برّا يزدهر؛ حضوره وحضه يملآن المكان",
    category: "GLOBAL",
    source: "SCENARIO",
    isUnlocked: true,
    unlockedAt: "2025-01-01T10:01:00.000Z",
    createdAt: "2025-01-01T10:01:00.000Z",
  },
  {
    id: "seed-trace-003",
    phrase: "طابكة عنده",
    targetSlang: "He's trippin'",
    contextNote: "تُقال لمن يتصرف بغرابة أو يخرج عن النص ذهنيًا",
    category: "STREET_POSTER",
    source: "SCENARIO",
    isUnlocked: true,
    unlockedAt: "2025-01-01T10:02:00.000Z",
    createdAt: "2025-01-01T10:02:00.000Z",
  },
  {
    id: "seed-trace-004",
    phrase: "ريحت بالي",
    targetSlang: "You're a lifesaver",
    contextNote: "شكر لا يُنسى لمن أزال الهم عنك",
    category: "CHALKBOARD",
    source: "SCENARIO",
    isUnlocked: true,
    unlockedAt: "2025-01-01T10:03:00.000Z",
    createdAt: "2025-01-01T10:03:00.000Z",
  },
  {
    id: "seed-trace-005",
    phrase: "هاي زين",
    targetSlang: "That's clean",
    contextNote: "إطراء سريع على شيء متناسق وجميل",
    category: "RECEIPT_MENU",
    source: "SCENARIO",
    isUnlocked: true,
    unlockedAt: "2025-01-01T10:04:00.000Z",
    createdAt: "2025-01-01T10:04:00.000Z",
  },
];

/* ── Vibe dictionary / القاموس الحسي ─────────────────────────────────── */

/** Pre-seeded Baghdadi → Gen Z mappings, one per VibeCategory. */
export const DEFAULT_VIBE_ENTRIES: VibeMapEntry[] = [
  {
    id: "seed-vibe-001",
    baghdadiPhrase: "انطي الخبز لخبازه",
    contextTag: "مدح مهارة",
    literalMeaning: "أعطِ الخبز لصاحبه المحترف",
    culturalVibe: "لا تتطفل على شغل المحترف؛ ثق بقدرته وخلّيه يشتغل بهدوء.",
    genZSlang: "Let him cook",
    auraImpact: "+500 Aura",
    usageExample: "Don't edit his slides, bro. Let him cook.",
    category: "MASTERY",
    source: "AI_GENERATED",
    createdAt: "2025-01-01T10:00:00.000Z",
  },
  {
    id: "seed-vibe-002",
    baghdadiPhrase: "يده ثقيلة",
    contextTag: "هيبة وحضّ",
    literalMeaning: "يده محظوظة وموفّقة",
    culturalVibe: "كل ما يمسّه ينجح؛ حضوره وحظه يسابقان سمعته.",
    genZSlang: "Main character energy",
    auraImpact: "+1000 Aura",
    usageExample: "Every project he touches works out. Total main character energy.",
    category: "AURA",
    source: "AI_GENERATED",
    createdAt: "2025-01-01T10:01:00.000Z",
  },
  {
    id: "seed-vibe-003",
    baghdadiPhrase: "الأصل غطّى",
    contextTag: "نخوة وأصل",
    literalMeaning: "الأصل والتربية ظهرا على تصرّفه",
    culturalVibe: "الاحترام هنا مش كلام؛ الموقف يثبت الأصالة والأخلاق.",
    genZSlang: "Real one act",
    auraImpact: "+300 Aura",
    usageExample: "He covered for the whole team and never bragged. That's a real one act.",
    category: "RESPECT",
    source: "AI_GENERATED",
    createdAt: "2025-01-01T10:02:00.000Z",
  },
  {
    id: "seed-vibe-004",
    baghdadiPhrase: "يلوع بيك",
    contextTag: "تحشيش ومقلب",
    literalMeaning: "يمازحك ويلعب فيك",
    culturalVibe: "مجرد مزاح بين الأصدقاء؛ المقصود الضحك لا التجريح.",
    genZSlang: "He's baiting you",
    auraImpact: "+200 Aura (مناعة ضحك)",
    usageExample: "He keeps sending you voicenotes at 2am — he's baiting you, bro.",
    category: "BANTER",
    source: "AI_GENERATED",
    createdAt: "2025-01-01T10:03:00.000Z",
  },
  {
    id: "seed-vibe-005",
    baghdadiPhrase: "انقلبت المواجيز",
    contextTag: "فوضى ودراما",
    literalMeaning: "انقلبت الأحوال رأسًا على عقب",
    culturalVibe: "الموضوع فوق طاقتنا والكل مشوش؛ مكانه تحلطم وطنز لتردّ الروح.",
    genZSlang: "It's giving chaos",
    auraImpact: "-100 Aura (على من قلّبها)",
    usageExample: "The family group chat is chaos today. It's giving total meltdown.",
    category: "DRAMA",
    source: "AI_GENERATED",
    createdAt: "2025-01-01T10:04:00.000Z",
  },
  {
    id: "seed-vibe-006",
    baghdadiPhrase: "قدها وقدود",
    contextTag: "تحدي ومواجهة",
    literalMeaning: "قادر على مستوى التحدي وجاهز له",
    culturalVibe: "المواجهة متقبلة والثقة حاضرة؛ الكلمة مع الثبات والظهور على قدر الحجم.",
    genZSlang: "Built different",
    auraImpact: "+400 Aura",
    usageExample: "They said nobody could beat him in the final. He's built different.",
    category: "CONFLICT",
    source: "AI_GENERATED",
    createdAt: "2025-01-01T10:05:00.000Z",
  },
];

/* ── Scenario nodes / سيناريوهات ─────────────────────────────────────── */

/** A core mini-graph — native American-slang dialogue, matching ScenarioNode. */
export const DEFAULT_SCENARIOS: ScenarioNode[] = [
  {
    id: "seed-node-001",
    character: "char_ziko",
    text_en_slang: "Ayo, you tryna get in line with me or what?",
    text_ar_hint: "أحد الشباب يكلّفك بالوقوف معه في طابور الشاورما الجانب",
    options: [
      {
        id: "seed-opt-001",
        text_en_slang: "Bet, my treat — you're up big today.",
        text_ar_equivalent: "رهان، أنا أدفع — يومك حظ.",
        is_correct: true,
        xp_reward: 40,
        next_node_id: "seed-node-002",
      },
      {
        id: "seed-opt-002",
        text_en_slang: "Nah man, I'm gonna bounce, catch you later.",
        text_ar_equivalent: "لا راح أسحب، نشوفك بعدين.",
        is_correct: false,
        xp_reward: 5,
        next_node_id: null,
      },
    ],
  },
  {
    id: "seed-node-002",
    character: "char_zahra",
    text_en_slang: "Bro, you got the hookup? That platter slaps every single time.",
    text_ar_hint: "زهرة تسألك إن كان عندك واسطة عند صاحب المحل",
    options: [
      {
        id: "seed-opt-003",
        text_en_slang: "Say less. Me and the whole block fw it.",
        text_ar_equivalent: "خلص الموضوع، إحنا وكل الحارة نحبّه.",
        is_correct: true,
        xp_reward: 45,
        next_node_id: null,
      },
      {
        id: "seed-opt-004",
        text_en_slang: "Dunno, I just take whatever's cheap.",
        text_ar_equivalent: "ما أدري، أني أخذ أي شي رخيص.",
        is_correct: false,
        xp_reward: 5,
        next_node_id: null,
      },
    ],
  },
];

/* ── Gen Z UI copy (slang tone for navigation & buttons) ─────────────── */

/**
 * Gen Z slang re-labelling of the app's navigation/button copy — single
 * source of truth so every surface (header, engine, scrapbook, voucher,
 * scenario verdict) speaks the same slang dialect.
 */
export const UI_GENZ_COPY = {
  /** "البحث" — search affordance. */
  search: "Vibe Check 🔍",
  /** "حفظ" — save/pin action. */
  save: "Locked In 📌",
  /** Confirmed-save state. */
  saveDone: "Locked In ✓",
  /** "القاموس الحسي" — the cultural vibe dictionary. */
  dictionary: "Vibe Vault ⚡",
  /** "كشكول أثر" — the traces scrapbook. */
  scrapbook: "Traces Scrapbook 📓",
  /** "شحن الخريطة" — map energy recharge button. */
  recharge: "Aura Recharge 🔋",
  /** "نتيجة السيناريو" — scaffold verdict chip. */
  verdict: "Aura Verdict ⚡",
} as const;

/* ── Scenario completion / end-of-scenario copy ──────────────────────── */

/** End-of-graph announcement — single source of truth for the finish card. */
export const SCENARIO_COMPLETE_COPY = {
  /** Arabic helper beside the Gen Z verdict (mapped to UI_GENZ_COPY.verdict). */
  verdictLabel: "نتيجة السيناريو",
  /** Celebration headline when a graph finishes. */
  title: "يا حبّ؟ صرتِ ابن بلد!",
  /** Gen Z English parallel — the educational mirror of "صرت ابن بلد". */
  slang: "You're a real one now! Straight up native status ⚡",
  /** Back-to-map action label. */
  backToMap: "ارجع للخريطة",
} as const;

/* ── Map charger texts (searchable map index) ────────────────────────── */

export type MapChargerKind = "DISTRICT" | "RIVER" | "BOARD" | "SPOT" | "RECHARGE";

/** One searchable map-affinity string: a district, the river, the board
 *  caption, a spot "charger" label, or the Aura Recharge button itself. */
export interface MapChargerText {
  id: string;
  kind: MapChargerKind;
  /** Primary display label (Arabic, or the themed English nickname). */
  label: string;
  /** Alternate search terms (Arabic + English) the vibe search indexes. */
  terms: string[];
}

export const MAP_CHARGER_TEXTS: MapChargerText[] = [
  { id: "map-district-karkh", kind: "DISTRICT", label: "الكرخ", terms: ["المنصور", "Karkh", "west bank"] },
  { id: "map-district-rasafa", kind: "DISTRICT", label: "الرصافة", terms: ["Rasafa", "east bank"] },
  { id: "map-river", kind: "RIVER", label: "دِجْلَة", terms: ["دجلة", "Tigris", "نهر", "river"] },
  {
    id: "map-board",
    kind: "BOARD",
    label: "عقدة التحقيق",
    terms: ["خريطة بغداد", "لوحة التحقيق", "investigation board", "map of baghdad"],
  },
  { id: "map-spot-cafe", kind: "SPOT", label: "مقهى شارع المنصور", terms: ["Al-Mansour Street Cafe", "مقهى", "cafe", "كافيه"] },
  { id: "map-spot-tea", kind: "SPOT", label: "بائع شاي كرادة", terms: ["Karrada Street Tea Vendor", "شاي", "tea", "بائع شارع"] },
  { id: "map-spot-gym", kind: "SPOT", label: "نادي الزيونة", terms: ["Ziyouna Gym", "جيم", "gym", "نادي"] },
  { id: "map-spot-taxi", kind: "SPOT", label: "تكسي بغداد", terms: ["Baghdad Taxi Ride", "تكسي", "taxi", "توصيل"] },
  { id: "map-spot-bookshop", kind: "SPOT", label: "مكتبة المتنبي", terms: ["Mutanabbi Bookshop", "مكتبة", "المتنبي", "bookshop"] },
  { id: "map-spot-sayed", kind: "SPOT", label: "مطعم السيد", terms: ["Al-Sayed Restaurant", "مطعم السيد", "مطعم", "الصدر", "كباب", "restaurant"] },
  { id: "map-spot-hospital", kind: "SPOT", label: "مستشفى بغداد التعليمي", terms: ["Baghdad Teaching Hospital", "مستشفى", "hospital", "باب المعظم", "صحة"] },
  { id: "map-spot-kiosk", kind: "SPOT", label: "كشك أبو جاسم", terms: ["Abu Jassem's Kiosk", "كشك", "كشك أبو جاسم", "حلويات", "kiosk"] },
  {
    id: "map-recharge",
    kind: "RECHARGE",
    label: UI_GENZ_COPY.recharge,
    terms: ["شحن", "طاقة", "recharge", "energy", "كوبون", "voucher", "شحن الخريطة"],
  },
];

/* ── Scenario outcome cards (searchable vibe entries) ────────────────── */

/** Per-node vibe register for the seeded shawarma graph. */
const SCENARIO_VIBE_CATEGORY: Record<string, VibeCategory> = {
  "seed-node-001": "BANTER",
  "seed-node-002": "AURA",
};

function scenarioCategory(node: ScenarioNode): VibeCategory {
  return SCENARIO_VIBE_CATEGORY[node.id] ?? "AURA";
}

/**
 * Flatten a ScenarioNode (NPC line + every option outcome) into
 * VibeMapEntry-shaped cards, so the vibe search can surface scenario
 * end-states ("Aura Verdict") alongside the dictionary — even phrases that
 * only exist as an option outcome.
 */
export function scenarioVibesFor(scenarios: ScenarioNode[]): VibeMapEntry[] {
  const cards: VibeMapEntry[] = [];
  for (const node of scenarios) {
    const category = scenarioCategory(node);
    cards.push({
      id: `scn-${node.id}-scene`,
      baghdadiPhrase: node.text_ar_hint,
      contextTag: `${UI_GENZ_COPY.verdict} — أوّل السطر في سيناريو بغداد`,
      literalMeaning: node.text_ar_hint,
      culturalVibe: node.text_ar_hint,
      genZSlang: node.text_en_slang,
      auraImpact: `+${node.options.reduce((sum, o) => Math.max(sum, o.xp_reward), 0)} XP متاحة`,
      usageExample: node.text_en_slang,
      category,
      source: "AI_GENERATED",
      createdAt: "2025-01-01T09:00:00.000Z",
    });
    for (const option of node.options) {
      cards.push({
        id: `scn-${node.id}-${option.id}`,
        baghdadiPhrase: option.text_ar_equivalent || node.text_ar_hint,
        contextTag: `${UI_GENZ_COPY.verdict} — ${option.is_correct ? "الإجابة الصحيحة" : "اختيار آخر"}`,
        literalMeaning: node.text_ar_hint,
        culturalVibe: node.text_ar_hint,
        genZSlang: option.text_en_slang,
        auraImpact: `+${option.xp_reward} XP`,
        usageExample: option.text_en_slang,
        category,
        source: "AI_GENERATED",
        createdAt: "2025-01-01T09:00:00.000Z",
      });
    }
  }
  return cards;
}

/** Derived from DEFAULT_SCENARIOS at load — merged into the vibe search. */
export const DERIVED_SCENARIO_VIBES: VibeMapEntry[] = scenarioVibesFor(DEFAULT_SCENARIOS);