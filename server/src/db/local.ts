/**
 * Local dev database — a dependency-free, PostgREST-shaped in-memory store
 * that backs the whole API when no Supabase credentials are configured.
 *
 * - Chainable query builder mirrors the subset of the supabase-js surface
 *   (`from/select/eq/order/limit/single/maybeSingle/insert/update/upsert/
 *   delete/rpc`) that the routes actually use.
 * - Seeded with the same data as `db/seed.ts` (spots, scenarios, graphs,
 *   providers, voucher, demo user) plus sensible opening quotes + settings.
 * - Mutations persist to `server/.local-db.json` so admin edits and gameplay
 *   survive server restarts; the file is regenerated if wiped.
 */
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { seededScenarioGraphs } from "../data/scenarios.js";

// ------------------------------------------------------------------ config

const LOCAL_DB_FILE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".local-db.json"
);

/** True when the server should fall back to the local dev database. */
export function localDbMode(): "supabase" | "local" {
  const url = process.env.SUPABASE_URL ?? "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
  return url && key ? "supabase" : "local";
}

// --------------------------------------------------------------------- seed

type Row = Record<string, unknown>;

const DEMO_USER_ID = "00000000-0000-4000-8000-0000000000b1";
const VOUCHER_ID = "00000000-0000-4000-8000-0000000000f1";

const seededUsers: Row[] = [
  {
    id: DEMO_USER_ID,
    phone: "+964000000001",
    auth_id: null,
    credits_balance: 50,
    current_tier: "standard",
    created_at: new Date().toISOString(),
  },
];

const seededSpots: Row[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    title_ar: "مقهى المنصور",
    title_en: "Al-Mansour Street Cafe",
    category: "cafe",
    vibe_description:
      "روائح قهوة مطحونة طازجة، جدران خشبية دافئة، وضجيج هادئ لمحادثات الشباب على الطاولات.",
    position_x: 14.5,
    position_y: -6.25,
    is_locked: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    title_ar: "جاي مهيّل كرادة",
    title_en: "Karrada Street Tea Vendor",
    category: "street_vendor",
    vibe_description:
      "بخار الگوري فوق گاس الجاي، زحام الشارع الحي، وأصوات المارّة وأبواق السيارات القريبة.",
    position_x: 28.0,
    position_y: 33.5,
    is_locked: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    title_ar: "قاعة زيونة الرياضية",
    title_en: "Ziyouna Gym",
    category: "gym",
    vibe_description:
      "أصوات الأوزان، إيقاعات التمرين، وضحك اللاعبين بين الجلسات على المقاعد.",
    position_x: -12.75,
    position_y: 19.1,
    is_locked: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    title_ar: "تكسي بغداد",
    title_en: "Baghdad Taxi Ride",
    category: "taxi_delivery",
    vibe_description:
      "سيارة تكسي قديمة، رائحة البنزين، وأبو كريم يسولف عن كل زنقة بالرصافة أثناء السير.",
    position_x: -35.0,
    position_y: 55.0,
    is_locked: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    title_ar: "مكتبة المتنبي",
    title_en: "Mutanabbi Bookshop",
    category: "bookshop",
    vibe_description:
      "رفوف الكتب إلى السقف، رائحة الورق القديم، وركن القصائد تحت ضوء نافذة غبارها ذهبي.",
    position_x: 42.0,
    position_y: 62.0,
    is_locked: false,
    created_at: new Date().toISOString(),
  },
];

const seededVouchers: Row[] = [
  {
    id: VOUCHER_ID,
    code: "BN-LAUNCH-2026",
    credit_amount: 50,
    is_redeemed: false,
    redeemed_by_user_id: null,
    redeemed_at: null,
    created_at: new Date().toISOString(),
  },
];

const seededProviders: Row[] = [
  {
    id: "00000000-0000-4000-8000-0000000000c1",
    name: "MOCK",
    api_key_encrypted: "MOCK-FAIL",
    is_active: true,
    priority: 10,
    cost_per_token: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-4000-8000-0000000000c2",
    name: "MOCK",
    api_key_encrypted: "",
    is_active: true,
    priority: 20,
    cost_per_token: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-4000-8000-0000000000c3",
    name: "MOCK",
    api_key_encrypted: "MOCK-SLOW",
    is_active: false,
    priority: 30,
    cost_per_token: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-4000-8000-0000000000c4",
    name: "ElevenLabs",
    api_key_encrypted: "MOCK-ELEVEN",
    is_active: true,
    priority: 40,
    cost_per_token: 0,
    created_at: new Date().toISOString(),
  },
];

const seededScenarios: Row[] = [
  {
    id: "00000000-0000-4000-8000-0000000000a1",
    spot_id: "00000000-0000-4000-8000-000000000001",
    title: "المنصور — طگّة العجّة وأول قهوة",
    system_prompt:
      "سيناريو تفاعلي في مقهى المنصور. زبون أمريكي يتعلّم عراقي بغدادي. الحوار بالعراقي المبسّط مع ترجمة إنجليزية قوسية لكل جملة، وكل سطر يعكس أجواء الكافيه: ريحة البن، الطاولات الخشبية، وضجيج السوالف. أنهِ دائماً سطر المعنى البغدادي بجملة عراقية مكافئة مثل: «إرقدْ وريّح بالك» المقابل لـ Relax.",
    graph_rules: {
      nodes: [
        { id: "n1", npcId: "amir", order: 1, label_ar: "التحية واختيار المقعد" },
        { id: "n2", npcId: "amir", order: 2, label_ar: "طلب العجّة والقهوة" },
        { id: "n3", npcId: "baba_amin", order: 3, label_ar: "الحساب والشكر" },
      ],
      orderErrors: [
        { nodeId: "n2", message_ar: "شلون تطلب العجّة قبل ما تگعد وتسوي سوالف؟ التحية أول شي." },
        { nodeId: "n3", message_ar: "الحساب هسه؟ لأ، بچيّنا شوي نتلكّم عند أمير." },
      ],
      interrupts: [
        { fromNodeId: "n2", toNodeId: "n1", trigger_ar: "سأل عن السعر وهو جان واقف على الباب", allowed: true },
      ],
    },
    provider_config: {
      primary: { provider: "MOCK", model: "mock-1" },
      tts: { provider: "ElevenLabs", voice: "arabi" },
      temperature: 0.7,
      maxTokens: 800,
    },
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-4000-8000-0000000000a2",
    spot_id: "00000000-0000-4000-8000-000000000002",
    title: "كرادة —چاي مهيل وسعر التعارف",
    system_prompt:
      "سيناريو عند بائع جاي مهيل (شاي بالنار) في زحمة شارع كرادة. سائح يسلّم ويسأل عن سعر الكاسة بالعراقي. جوّ الشارع حي: أبواق، وصياح الباعة، والبخار المتطاير من الگوري. كل سطر ترجمته بإنجليزية عامية. المعنى البغدادي يشرح مصطلح «مهيل» و«يتغيّر هوا» بمرح.",
    graph_rules: {
      nodes: [
        { id: "n1", npcId: "abu_saleh", order: 1, label_ar: "تحية البائع والصوت" },
        { id: "n2", npcId: "abu_saleh", order: 2, label_ar: "سؤال السعر والتذوّق" },
        { id: "n3", npcId: "abu_saleh", order: 3, label_ar: "المساومة والدعابة" },
      ],
      orderErrors: [
        { nodeId: "n2", message_ar: "زحمة الشارع تهمّش صوتك — ردّد التحية على البائع أول." },
      ],
      interrupts: [
        { fromNodeId: "n3", toNodeId: "n2", trigger_ar: "حاول يدفع بدون ما يتذوّق الكاسة", allowed: true },
      ],
    },
    provider_config: {
      primary: { provider: "MOCK", model: "mock-1" },
      tts: { provider: "ElevenLabs", voice: "arabi" },
      temperature: 0.7,
      maxTokens: 800,
    },
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-4000-8000-0000000000a3",
    spot_id: "00000000-0000-4000-8000-000000000003",
    title: "زيونة —أوزان وأعداد بالعراقي",
    system_prompt:
      "سيناريو في قاعة رياضية بحيّ زيونة. مدرب بغدادي يدلّ سائحاً على الأجهزة ويعلّمه أسماء التمارين والعدادات بالعراقي: شنو چلبك، إزبد، انگز. الجو: عرق وإيقاعات، وضحك بين الجلسات. كل سطر بترجمة إنجليزية. المعنى البغدادي يشرح مثلاً «تگلب الساعه الزيادة» بمرح.",
    graph_rules: {
      nodes: [
        { id: "n1", npcId: "amjad", order: 1, label_ar: "السلام على المدرب" },
        { id: "n2", npcId: "amjad", order: 2, label_ar: "شرح الأجهزة والعدّات" },
        { id: "n3", npcId: "habib", order: 3, label_ar: "التحفيز والوداع" },
      ],
      orderErrors: [
        { nodeId: "n2", message_ar: "بدون تحية تفوت على الأجهزة؟ المدرب يبي يعرف شسمك أول." },
      ],
      interrupts: [
        { fromNodeId: "n3", toNodeId: "n1", trigger_ar: "سأل عن سعر الاشتراك وهو لسه بباب القاعة", allowed: false },
      ],
    },
    provider_config: {
      primary: { provider: "MOCK", model: "mock-1" },
      tts: { provider: "ElevenLabs", voice: "arabi" },
      temperature: 0.7,
      maxTokens: 800,
    },
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-4000-8000-0000000000a4",
    spot_id: "00000000-0000-4000-8000-000000000004",
    title: "تكسي بغداد —مساومة الأجرة وشوارع الرصافة",
    system_prompt:
      "سيناريو بلا ركوب لا يبدأ: سوّاق تكسي بغدادي قديم (أبو كريم) يقلّك من الكرادة للمتنبي ويحچي لك عن الشوارع. يعلمّك تگول «إدفه» للشارع و«كد السوق» للأجرة. الحوار بالعراقي + ترجمة إنجليزية، والمعنى البغدادي يشرح مصطلحات الركوب، مثل «طگّر إيده» لمن يرفض الزبون.",
    graph_rules: {
      nodes: [
        { id: "n1", npcId: "abu_kareem", order: 1, label_ar: "تحية السوّاق وتحديد الوجهة" },
        { id: "n2", npcId: "abu_kareem", order: 2, label_ar: "المساومة على الأجرة" },
        { id: "n3", npcId: "abu_kareem", order: 3, label_ar: "جولة الشوارع والوصول" },
      ],
      orderErrors: [
        { nodeId: "n2", message_ar: "شلون تگلّر الأجرة قبل ما تعرف الوجهة؟ تعالج!" },
        { nodeId: "n3", message_ar: "ما توصل لحد ما تسوّي السعر مع السوّاق." },
      ],
      interrupts: [
        { fromNodeId: "n2", toNodeId: "n1", trigger_ar: "ركب وبرا ما گال وين يريد يروح", allowed: false },
      ],
    },
    provider_config: {
      primary: { provider: "MOCK", model: "mock-1" },
      tts: { provider: "ElevenLabs", voice: "arabi" },
      temperature: 0.7,
      maxTokens: 800,
    },
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-4000-8000-0000000000a5",
    spot_id: "00000000-0000-4000-8000-000000000005",
    title: "المتنبي —دفتر الدخول لساحة القصيدة",
    system_prompt:
      "سيناريو في مكتبة شارع المتنبي. صاحب المكتبة (أبو اليوسف) يستقبل سائحاً بابتسامة الشعر. علّمه يگول «دچّت المكتبة» و«نطالع بالعنوان». الجو: رائحة الورق، وأصوات المارّة، وركن القصائد عند الجدار. كل سطر بترجمة إنجليزية. المعنى البغدادي يربط «خذها من گلبي» بمشهد المكتبة.",
    graph_rules: {
      nodes: [
        { id: "n1", npcId: "abu_yusuf", order: 1, label_ar: "التحية ودخول المكتبة" },
        { id: "n2", npcId: "abu_yusuf", order: 2, label_ar: "السؤال عن كتاب" },
        { id: "n3", npcId: "sadiq", order: 3, label_ar: "هدية القصيدة والوداع" },
      ],
      orderErrors: [
        { nodeId: "n2", message_ar: "ما تنطّي عنوان الكتاب قبل ما تسلّم على صاحب المكتبة!" },
      ],
      interrupts: [
        { fromNodeId: "n3", toNodeId: "n2", trigger_ar: "سأل عن ثمن القصيدة وهدية القراءة", allowed: true },
      ],
    },
    provider_config: {
      primary: { provider: "MOCK", model: "mock-1" },
      tts: { provider: "ElevenLabs", voice: "arabi" },
      temperature: 0.7,
      maxTokens: 800,
    },
    created_at: new Date().toISOString(),
  },
];

const seededQuotes: Row[] = [
  {
    id: "00000000-0000-4000-8000-0000000000e1",
    text_ar: "لو تعرف البلد من گعدة چاي ما تعوّضه شعبٍ كامل.",
    text_en: "Get a country from a single cup of chai — no crowd can match it.",
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-4000-8000-0000000000e2",
    text_ar: "تعلّم كلمة من بغدادي يخليها تسوّي برد بالگلب.",
    text_en: "One word learned from a Baghdadi warms the whole heart.",
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-4000-8000-0000000000e3",
    text_ar: "بگداد ما تتعلمها بالكتاب، بالتهابي تعلمها.",
    text_en: "Baghdad isn't learned from a book — you learn it street-side.",
    is_active: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
  },
];

const seededSettings: Row[] = [
  { key: "slow_gate_ms", value: 60_000, updated_at: new Date().toISOString() },
];

// ------------------------------------------------------------------ state

interface LocalState {
  users: Row[];
  spots: Row[];
  vouchers: Row[];
  api_providers: Row[];
  scenarios: Row[];
  scenario_graphs: Row[];
  opening_quotes: Row[];
  settings: Row[];
}

const TABLE_KEYS: Array<keyof LocalState> = [
  "users",
  "spots",
  "vouchers",
  "api_providers",
  "scenarios",
  "scenario_graphs",
  "opening_quotes",
  "settings",
];

/**
 * Column defaults that Postgres column definitions would apply for rows
 * that omit them (the seed data relies on DEFAULT true here).
 */
const TABLE_DEFAULTS: Partial<Record<keyof LocalState, Row>> = {
  scenario_graphs: { is_active: true },
};

interface PersistedState {
  users: Row[] | undefined;
  spots: Row[] | undefined;
  vouchers: Row[] | undefined;
  api_providers: Row[] | undefined;
  scenarios: Row[] | undefined;
  scenario_graphs: Row[] | undefined;
  opening_quotes: Row[] | undefined;
  settings: Row[] | undefined;
}

function freshSeed(): LocalState {
  return {
    users: [...seededUsers],
    spots: [...seededSpots],
    vouchers: [...seededVouchers],
    api_providers: [...seededProviders],
    scenarios: [...seededScenarios],
    scenario_graphs: seededScenarioGraphs as unknown as Row[],
    opening_quotes: [...seededQuotes],
    settings: [...seededSettings],
  };
}

function load(): LocalState {
  if (fs.existsSync(LOCAL_DB_FILE)) {
    try {
      const raw = fs.readFileSync(LOCAL_DB_FILE, "utf8");
      const parsed = JSON.parse(raw) as PersistedState;
      const seeded = freshSeed();
      const state: LocalState = { ...seeded };
      for (const key of TABLE_KEYS) {
        if (Array.isArray(parsed[key])) (state[key] as Row[]) = parsed[key] as Row[];
      }
      // apply column defaults so rows persisted before defaults existed behave
      // exactly like fresh Postgres rows (e.g. scenario_graphs.is_active)
      for (const key of TABLE_KEYS) {
        const defaults = TABLE_DEFAULTS[key];
        if (!defaults) continue;
        for (const row of state[key]) {
          for (const [col, value] of Object.entries(defaults)) {
            if (!(col in row)) row[col] = value;
          }
        }
      }
      return state;
    } catch {
      // corrupt file → reseed and carry on
    }
  }
  const state = freshSeed();
  persist(state);
  return state;
}

function persist(state: LocalState): void {
  try {
    const dump: PersistedState = { ...state };
    for (const key of TABLE_KEYS) {
      dump[key] = state[key].map((row) => structuredClone(row));
    }
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(dump, null, 2), "utf8");
  } catch {
    // persistence is best-effort; the in-memory state still works
  }
}

let state: LocalState = load();

// ----------------------------------------------------------- query builder

type EqFilter = { column: string; value: unknown };
type OrderSpec = { column: string; ascending: boolean };

interface DbResponse {
  data: unknown;
  error: { message: string } | null;
  count?: number;
}

const errorOut = (message: string): DbResponse => ({ data: null, error: { message } });

function matches(rows: Row[], filters: EqFilter[]): Row[] {
  if (filters.length === 0) return rows;
  return rows.filter((row) =>
    filters.every((f) => (row[f.column] as unknown) === (f.value as unknown))
  );
}

function project(rows: Row[], columns: string | string[]): Row[] {
  if (columns === "*") return rows;
  const list = Array.isArray(columns)
    ? columns
    : columns.split(",").map((c) => c.trim()).filter(Boolean);
  return rows.map((row) => {
    const out: Row = {};
    for (const c of list) if (c in row) out[c] = row[c];
    return out;
  });
}

function sortRows(rows: Row[], orders: OrderSpec[]): Row[] {
  if (orders.length === 0) return rows;
  const sorted = [...rows];
  // apply last-chained order as the highest-precedence sort (PostgREST order)
  for (let i = orders.length - 1; i >= 0; i -= 1) {
    const { column, ascending } = orders[i];
    sorted.sort((a, b) => {
      const av = a[column] as unknown;
      const bv = b[column] as unknown;
      if (av === bv) return 0;
      if (av === null || av === undefined) return ascending ? 1 : -1;
      if (bv === null || bv === undefined) return ascending ? -1 : 1;
      if (typeof av === "number" && typeof bv === "number") {
        return ascending ? av - bv : bv - av;
      }
      return ascending
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }
  return sorted;
}

/** Find a user row by id / phone / auth_id (loose matching for the demo). */
function findUser(idValue: string): Row | null {
  const v = String(idValue);
  return (
    state.users.find(
      (u) =>
        String(u.id) === v ||
        (u.phone != null && String(u.phone) === v) ||
        (u.auth_id != null && String(u.auth_id) === v)
    ) ?? null
  );
}

class LocalQuery {
  private mutation: "insert" | "update" | "upsert" | "delete" | null = null;
  private insertRows: Row[] = [];
  private updatePatch: Row = {};
  private conflictCol = "id";
  private head = false;
  private columns: string | string[] = "*";
  private countRequested = false;
  private filters: EqFilter[] = [];
  private orders: OrderSpec[] = [];
  private limitN: number | null = null;

  constructor(private table: keyof LocalState) {}

  select(columns?: string | string[], opts?: { count?: "exact"; head?: boolean }): this {
    if (columns !== undefined) this.columns = columns;
    if (opts?.head) this.head = true;
    if (opts?.count) this.countRequested = true;
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push({ column, value });
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }): this {
    this.orders.push({ column, ascending: opts?.ascending !== false });
    return this;
  }

  limit(count: number): this {
    this.limitN = count;
    return this;
  }

  insert(rows: Row | Row[]): this {
    this.mutation = "insert";
    this.insertRows = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  update(patch: Row): this {
    this.mutation = "update";
    this.updatePatch = patch;
    return this;
  }

  upsert(rows: Row | Row[], opts?: { onConflict?: string }): this {
    this.mutation = "upsert";
    this.insertRows = Array.isArray(rows) ? rows : [rows];
    if (opts?.onConflict) this.conflictCol = opts.onConflict;
    return this;
  }

  delete(): this {
    this.mutation = "delete";
    return this;
  }

  async single(): Promise<DbResponse> {
    return this.resolve("single");
  }

  async maybeSingle(): Promise<DbResponse> {
    return this.resolve("maybe");
  }

  async rpc(name: string, params: Record<string, unknown>): Promise<DbResponse> {
    const ran = runRpc(name, params);
    persist(state);
    return ran;
  }

  then<TResult1 = DbResponse, TResult2 = never>(
    onFulfilled?: ((value: DbResponse) => TResult1 | PromiseLike<TResult1>) | null,
    onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    // PostgREST-style builders are awaitable directly. Route code like
    // `await db.from("x").select("*").order(...)` depends on this.
    return this.resolve("array").then(onFulfilled, onRejected);
  }

  private async resolve(mode: "array" | "single" | "maybe"): Promise<DbResponse> {
    const table = state[this.table];

    if (this.mutation === "insert") {
      const created: Row[] = [];
      const defaults = TABLE_DEFAULTS[this.table] ?? {};
      for (const row of this.insertRows) {
        const next: Row = {
          id: randomUUID(),
          created_at: new Date().toISOString(),
          ...defaults,
          ...row,
        };
        table.push(next);
        created.push(next);
      }
      persist(state);
      return this.readResponse(created, mode);
    }

    if (this.mutation === "upsert") {
      const created: Row[] = [];
      const defaults = TABLE_DEFAULTS[this.table] ?? {};
      for (const row of this.insertRows) {
        const conflictVal = row[this.conflictCol];
        const existing = table.find(
          (r) => (r[this.conflictCol] as unknown) === (conflictVal as unknown)
        );
        if (existing) {
          Object.assign(existing, defaults, row);
          created.push(existing);
        } else {
          const next: Row = {
            id: randomUUID(),
            created_at: new Date().toISOString(),
            ...defaults,
            ...row,
          };
          table.push(next);
          created.push(next);
        }
      }
      persist(state);
      return this.readResponse(created, mode);
    }

    if (this.mutation === "update") {
      const matched = matches(table, this.filters);
      for (const row of matched) Object.assign(row, this.updatePatch);
      persist(state);
      return this.readResponse(matched, mode);
    }

    if (this.mutation === "delete") {
      const matched = matches(table, this.filters);
      const doomed = new Set(matched);
      const kept = table.filter((row) => !doomed.has(row));
      (state[this.table] as Row[]).length = 0;
      (state[this.table] as Row[]).push(...kept);
      persist(state);
      return { data: project(matched, this.columns), error: null, count: matched.length };
    }

    // plain read
    if (this.head || this.countRequested) {
      const count = matches(table, this.filters).length;
      return { data: [], error: null, count };
    }

    const filtered = matches(table, this.filters);
    const limited = this.limitN !== null ? filtered.slice(0, this.limitN) : filtered;
    return this.readResponse(limited, mode);
  }

  private readResponse(rows: Row[], mode: "array" | "single" | "maybe"): DbResponse {
    const projected = project(rows, this.columns);
    const sorted = sortRows(projected, this.orders);
    if (mode === "array") {
      return { data: sorted, error: null };
    }
    if (mode === "maybe") {
      return { data: sorted.length === 0 ? null : sorted[0], error: null };
    }
    if (sorted.length === 1) {
      return { data: sorted[0], error: null };
    }
    return errorOut("JSON object requested, multiple (or no) rows returned");
  }
}

// ------------------------------------------------------------------ rpc

function runRpc(name: string, params: Record<string, unknown>): DbResponse {
  const p_user_id = String(params.p_user_id ?? "");
  const user = findUser(p_user_id);

  switch (name) {
    case "spend_credits": {
      const amount = Math.max(0, Math.round(Number(params.p_amount) || 0));
      if (!user) return { data: null, error: null }; // unknown user: cannot spend
      const balance = Number(user.credits_balance) || 0;
      if (balance < amount) return { data: null, error: null };
      user.credits_balance = balance - amount;
      return { data: user.credits_balance, error: null };
    }
    case "adjust_credits": {
      if (!user) return errorOut("adjust_credits: USER_NOT_FOUND");
      const delta = Math.round(Number(params.p_delta) || 0);
      user.credits_balance = Math.max(0, (Number(user.credits_balance) || 0) + delta);
      return { data: user.credits_balance, error: null };
    }
    case "redeem_voucher": {
      if (!user) return errorOut("redeem_voucher: USER_NOT_FOUND");
      const code = String(params.p_code ?? "").trim();
      const voucher = state.vouchers.find(
        (v) => String(v.code) === code && v.is_redeemed !== true
      ) ?? null;
      if (!voucher) return errorOut("redeem_voucher: VOUCHER_INVALID");
      voucher.is_redeemed = true;
      voucher.redeemed_by_user_id = user.id;
      voucher.redeemed_at = new Date().toISOString();
      user.credits_balance =
        (Number(user.credits_balance) || 0) + (Number(voucher.credit_amount) || 0);
      return { data: user.credits_balance, error: null };
    }
    default:
      return errorOut(`rpc ${name} is not implemented by the local dev database`);
  }
}

// ------------------------------------------------------------------ public

/**
 * Returns the local dev database client. Tolerates being called before the
 * module finishes (State is seeded synchronously at import time).
 */
export function localDatabase(): {
  from: (table: string) => LocalQuery;
  rpc: (name: string, params: Record<string, unknown>) => Promise<DbResponse>;
} {
  const client = {
    from(table: string): LocalQuery {
      if (!(table in state)) {
        throw new Error(`local db: unknown table "${table}"`);
      }
      return new LocalQuery(table as keyof LocalState);
    },
    rpc(name: string, params: Record<string, unknown>): Promise<DbResponse> {
      const result = runRpc(name, params);
      persist(state);
      return Promise.resolve(result);
    },
  };

  Object.defineProperty(client, "localDbFile", {
    get: () => LOCAL_DB_FILE,
    enumerable: false,
  });

  return client;
}