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
  {
    id: "00000000-0000-4000-8000-000000000006",
    title_ar: "مطعم السيد",
    title_en: "Al-Sayed Restaurant",
    category: "restaurant",
    vibe_description:
      "صينية الكباب تگعد على المانع، ريحة فحم تقلب الجو، وتكتكة السكاكين مع ضحك الزباين — مطعم شعبي بمدينة الصدر.",
    position_x: 44.0,
    position_y: -32.0,
    is_locked: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-4000-8000-000000000007",
    title_ar: "مستشفى بغداد التعليمي",
    title_en: "Baghdad Teaching Hospital",
    category: "hospital",
    vibe_description:
      "أضواء بيضاء هادئة، رائحة المعقمات، وأصوات أجهزة المراقبة — دكتورة غيداء تعالج بثقة والممرض حيدر يهوّن عليك.",
    position_x: -28.0,
    position_y: -1.0,
    is_locked: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-4000-8000-000000000008",
    title_ar: "كشك أبو جاسم",
    title_en: "Abu Jassem's Kiosk",
    category: "street_vendor",
    vibe_description:
      "كشك زجاجي صغير كل شي فيه: مشروبات وعبوات وحلويات — أبو جاسم يگلّمك سعر كل شي بابتسامة ما تفارگه.",
    position_x: 47.0,
    position_y: 44.0,
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
  {
    id: "00000000-0000-4000-8000-0000000000c5",
    name: "gemini",
    api_key_encrypted: "MOCK-GEMINI",
    is_active: true,
    priority: 20,
    cost_per_token: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-4000-8000-0000000000c6",
    name: "abacus",
    api_key_encrypted: null,
    is_active: true,
    priority: 1,
    cost_per_token: 0.001,
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
  {
    id: "00000000-0000-4000-8000-0000000000a6",
    spot_id: "00000000-0000-4000-8000-000000000006",
    title: "مطعم السيد — كباب الصدر وفنجان الضحك",
    system_prompt:
      "سيناريو تفاعلي في مطعم شعبي بمدينة الصدر (الرصافة). صاحب المطعم (أبو حيدر) يقدّم كباب على الفحم وكاسات چاي عراقي، ويرحب بكل زبون بأهلاً وسهلاً. الدرس: طلب الوجبة بالعراقي + المصطلحات: پارچة، تمن، كباب، چاي أزرق. كل سطر بترجمة إنجليزية عامية (American slang). نهائياً بسطر «المعنى البغدادي» يشرح له الفرق بين الشعبي والفخم بضحكة.",
    graph_rules: {
      nodes: [
        { id: "n1", npcId: "abu_haydar", order: 1, label_ar: "التحية واختيار المقعد" },
        { id: "n2", npcId: "abu_haydar", order: 2, label_ar: "طلب الكباب والچاي" },
        { id: "n3", npcId: "umm_haydar", order: 3, label_ar: "المساومة والدعابة" },
      ],
      orderErrors: [
        { nodeId: "n2", message_ar: "شلون تطلب الأكل قبل ما تسلّم على أبو حيدر؟ التحية أول شي بهالمطعم الشعبي." },
        { nodeId: "n3", message_ar: "ما تطلب الفاتورة هسه — خليّك چمّي لگعدة الضحك." },
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
    id: "00000000-0000-4000-8000-0000000000a7",
    spot_id: "00000000-0000-4000-8000-000000000007",
    title: "مستشفى بغداد — غيداء والتشخيص العراقي",
    system_prompt:
      "سيناريو في مستشفى بغداد التعليمي. دكتورة غيداء (طبيبة حادة بس مقهورة) تفحصك وتعلّمك مصطلحات صحية عراقية: إحني، سكري، ضيچان، دگّة قلب، ودكتور لازم. الممرض حيدر يهوّن الموقف. الدرس: وصف الألم والفحص + التفاعل المهذب مع الكادر الطبي. كل سطر بترجمة إنجليزية عامية. المعنى البغدادي يشرح «عيييت» و«چفيان» بمرح.",
    graph_rules: {
      nodes: [
        { id: "n1", npcId: "ghaydaa", order: 1, label_ar: "التحية وسؤال الطبيبة" },
        { id: "n2", npcId: "ghaydaa", order: 2, label_ar: "وصف الألم والفحص" },
        { id: "n3", npcId: "haydar", order: 3, label_ar: "تهوين الموقف والروشتة" },
      ],
      orderErrors: [
        { nodeId: "n2", message_ar: "ما تگلّم الدكتورة عن الألم قبل ما تعرف شسمك وشكو عليك!" },
      ],
      interrupts: [
        { fromNodeId: "n3", toNodeId: "n1", trigger_ar: "طلب روشتة وهو لسه بباب العيادة", allowed: false },
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
    id: "00000000-0000-4000-8000-0000000000a8",
    spot_id: "00000000-0000-4000-8000-000000000008",
    title: "كشك أبو جاسم — تبديل الألف ورأس اخترت",
    system_prompt:
      "سيناريو في كشك زجاجي صغير بالرصافة. أبو جاسم (حچّاي سريع كنكاشة) يسلّمك بابتسامة ويدلّك على الأسعار. الدرس: أسماء الحلويات والمشروبات + المساومة الودّية + عبارات الإطراء: زين، عيني عليك، الله يحفظك. كل سطر بترجمة إنجليزية عامية. المعنى البغدادي يشرح «قشطة» و«سندويچ» بضحكة.",
    graph_rules: {
      nodes: [
        { id: "n1", npcId: "abu_jassem", order: 1, label_ar: "التحية وعرض الكشك" },
        { id: "n2", npcId: "abu_jassem", order: 2, label_ar: "اختيار الحلويات والمشروبات" },
        { id: "n3", npcId: "abu_jassem", order: 3, label_ar: "المساومة والوداع" },
      ],
      orderErrors: [
        { nodeId: "n2", message_ar: "تريد تختار من الكشك قبل ما تگلّم أبو جاسم؟ يگلّمك الأول بالتحية!" },
      ],
      interrupts: [
        { fromNodeId: "n3", toNodeId: "n1", trigger_ar: "سأل عن سعر السندويچ وهو جان واقف برّا", allowed: true },
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
    id: "00000000-0000-4000-8000-0000000000e4",
    text_ar: "بغداد بيها حجي.. وسوالف ماتنحجي",
    text_en: "Baghdad never runs out of talk — never. But the realest stories? No cap... those don't get told. They just live in you. Lowkey, that's what hits different. Real ones know.",
    is_active: true,
    sort_order: 0,
    created_at: new Date().toISOString(),
  },
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

/** عبارات جويسم — تُزرع من JWEYSIM_PHRASES (jweysimData.ts) ليتحرك
 *  الماسكوت بالكلام نفسه حتى بالـ local dev database. */
const seededJweysimPhrases: Row[] = [
  { id: "ph-idle-01", state: "idle", ar: "آي بيِن ويتن فور يو فور إيجرز، برو — ماي تي إز كولد، نو جوك.", en_sticker: "My tea's cold", sort_order: 1, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-idle-02", state: "idle", ar: "وونا هير أ سيكرت، برو؟ دس ماب لايك، توكس — بس تو ذا وانز هو أكتشالي ليستن. نو كاپ.", en_sticker: "The map talks", sort_order: 2, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-idle-03", state: "idle", ar: "هيلو؟ هاي برو، وير يو أت؟ آي أم أون ماي واي تو يو — هولد تايت، نو كاپ.", en_sticker: "On my way", sort_order: 3, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-bored-01", state: "bored", ar: "هاي... شلونك؟ أني وياك، مو ماشي.", en_sticker: "I'm here, bro", sort_order: 1, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-bored-02", state: "bored", ar: "دوس على أي مكان، نشوف بغداد سوا.", en_sticker: "Let's roll", sort_order: 2, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-bored-03", state: "bored", ar: "الملل يگعد يگعد... مثل الچاي، بس بلا طعم.", en_sticker: "Bored mode", sort_order: 3, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-sleep-01", state: "sleeping", ar: "هممم... شاورما... هممم...", en_sticker: "Shawarma dreams", sort_order: 1, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-sleep-02", state: "sleeping", ar: "همم... گدحي... لا تاخذه... همم...", en_sticker: "Don't touch my chai", sort_order: 2, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-sleep-03", state: "sleeping", ar: "تثاؤب طويل... وشخير خفيف يطلع من تحت النظارة.", en_sticker: "ZZZ... 🇺🇸🇮🇶", sort_order: 3, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-wake-01", state: "wake", ar: "أيوا! أني گعدت أشتغل! ...شغلت شنو؟ هاي... شغلة.", en_sticker: "I was working!", sort_order: 1, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-wake-02", state: "wake", ar: "اوكي دوكي... صحيت، صحيت. منو؟ آه، إنت. أهلاً.", en_sticker: "OKIE DOKIE 🤠", sort_order: 2, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-wake-03", state: "wake", ar: "گدحي... شكد نام گدحي؟ عيب عليك سويته يصحي قبلي.", en_sticker: "Chai woke up first", sort_order: 3, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-load-01", state: "loading", ar: "گعد أگص زگّاقة للخط... خطك طويل!", en_sticker: "Cutting corners", sort_order: 1, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-load-02", state: "loading", ar: "أدوّر على الشبكة بالزقاق الغلط... لحظة، هسه تطلع.", en_sticker: "WiFi hunting", sort_order: 2, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-load-03", state: "loading", ar: "گعد أچمّع الگصص... بغداد گصصها وايدة.", en_sticker: "Collecting stories", sort_order: 3, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-load-04", state: "loading", ar: "شوية... الچاي يبي يگعد يگعد يجهز.", en_sticker: "Chai needs time", sort_order: 4, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-err-01", state: "error", ar: "غلط... بس شلون تتعلم إلا تغلط؟ ارجع حاول، برو.", en_sticker: "No cap, try again", sort_order: 1, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-err-02", state: "error", ar: "هاي مو هي... بس عادي، عيدها. گصّتك لسه تكتب.", en_sticker: "Round two", sort_order: 2, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-err-03", state: "error", ar: "غلط؟ غلط بغداد؟ بغداد ما عندها غلط... عندها زحمة. ارجع جرب، فور ريل.", en_sticker: "Baghdad has no bugs", sort_order: 3, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-err-04", state: "error", ar: "مو هاي... بس أنا هم مرة گلطت بچايي. كمّل، برو.", en_sticker: "Keep going, bro", sort_order: 4, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-vic-01", state: "victory", ar: "أحسنت! هذي هي — نو كاپ، شلون عرفتها؟", en_sticker: "That's it, bro", sort_order: 1, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-vic-02", state: "victory", ar: "أيوا برو! هذي النتيجة اللي أريدها.", en_sticker: "Yessir!", sort_order: 2, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-vic-03", state: "victory", ar: "You rock!... يعني إنت صخرة، مو زحفة.", en_sticker: "YOU ROCK 🪨", sort_order: 3, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-vic-04", state: "victory", ar: "هسه صرت من أهل بغداد... باقي عليك الچاي والگصّة.", en_sticker: "Native status ⚡", sort_order: 4, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-click-01", state: "click", ar: "ايدك ايدك تره ازعل", en_sticker: "Hands off!", sort_order: 1, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-click-02", state: "click", ar: "عوف الكرش المقدس تعبت حتى خليته بالحجم", en_sticker: "Sacred belly", sort_order: 2, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-click-03", state: "click", ar: "شوف اكو سالفه وره التطبيق بس اني اعرفها", en_sticker: "I know the tea", sort_order: 3, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-walk-01", state: "walk", ar: "اني وين والمشي وين؟ أني بكرشي هذا، ما يتحمل مشي — نو كاپ.", en_sticker: "Belly can't walk", sort_order: 1, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-walk-02", state: "walk", ar: "ماكو كية كوستر تكتك يفوت مني... أخلص من المشي، فور ريل.", en_sticker: "Gimme a ride", sort_order: 2, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-jump-01", state: "jump", ar: "پيپ ذس، پيپ ذس!", en_sticker: "Peep this", sort_order: 1, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-jump-02", state: "jump", ar: "آي گت موڤز، آل ديم — نو كاپ.", en_sticker: "All moves, no cap", sort_order: 2, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-land-01", state: "land", ar: "اااخ! كله صوج الكرش... نو جيم، نو لايف، نو كاپ.", en_sticker: "No gym, no life", sort_order: 1, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ph-land-02", state: "land", ar: "ااااخ! لا تكول لأحد مصار شي! ششش... إت نيڤر هابند.", en_sticker: "It never happened 🤫", sort_order: 2, is_visible: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

/** قصاصات جويسم — من jweysimData.ts (النسخة الأولى للمشروع ١٩ قصاصة):
 *  كل قصاصة بها spotId → مربوط بالپين، أو free بإحداثيات posX/posY صريحة.
 *  تبقى القصاصة السرية (secret-chai-stains) بدون پين. */
const seededJweysimScraps: Row[] = [
  {
    id: "jweysim-scrap-cafe",
    spot_id: "00000000-0000-4000-8000-000000000001",
    title: "فيرست كوفي",
    text: "فيرست تايم إن المنصور، أي فاوند ستريت باريستا. أي جات تو هيم: «هاي برو، واتس أب؟ وات تايبز يو هاف؟» هي ستيرد: «جاست وان كوفي.» أي كت: «نو واي — جيم مي دبل شوت إسبريسو.» هي هاندت مي ذا كاب: «يو أمريكن؟» أي سيد: «يو ناو إت، هوميي.» هي سيد: «أمريكن فروم باب الشرجي!» — أند وي كراكد أب.",
    location_type: "pin",
    pos_x: 25,
    pos_y: 12,
    reward_id: "seed-trace-001",
    is_visible: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "jweysim-scrap-tea",
    spot_id: "00000000-0000-4000-8000-000000000002",
    title: "ماي تي",
    text: "آي نو وات يو ثنكين: «دس گاي هاز أ تي پرابلِم.» نو كاپ؟ إتز ماي إيدنتيتي، برو. ويذاوت ماي تي، أي أم نوت جويسم ذا أمريكن. أي درينك إت تو ريميمبر هو آي أم. داتس نوت إديكشن — داتس ليجاسي. بيريود.",
    location_type: "pin",
    pos_x: 71,
    pos_y: 50,
    reward_id: "seed-trace-004",
    is_visible: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "jweysim-scrap-gym",
    spot_id: "00000000-0000-4000-8000-000000000003",
    title: "أولد سكول",
    text: "آي أم أولد سكول إن دس جيم ستاف — آي تريند فور إيجرز، برو. وين أي ووكد إن، دا كاپتن سكدن مي: «يو تريند بيفور؟» آي كت: «هيل ييه، فور ريل.» هي سيد: «يوَر بللك؟ دات ميكس يو لووك لايك أ فيت ليجند — بس يوَر بللي؟ إت رينز إفريثينغ.» آي شوك ماي بللي لايك أ ماد مان — هي أند هيز كرو وير دايين لافن. آي لافد ويدهيم تو — نو كاپ، بيريود.",
    location_type: "pin",
    pos_x: 83,
    pos_y: 70,
    reward_id: "seed-trace-002",
    is_visible: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "jweysim-scrap-taxi",
    spot_id: "00000000-0000-4000-8000-000000000004",
    title: "درايڤر كريزي",
    text: "وان تايم أي گوت تورد أب — أي هوپد إن أ كاب. دا درايڤر واز دراڤن مي كريزي: إيفري بامپ إن ذا رود، وي هت إت. لايك برو، دس گاي كودن تي سي فور شيت. أند ذا هول رايد؟ هي واز دامپن: گاس إز إكسپنصيڤ، نو جوب، أند آي هاف أ هاوس، كدز، أند إي وايف. وين أي گوت آوت، أي پد هيم دابل — كوز دس گاي بروك ماي هارت، فور ريل.",
    location_type: "pin",
    pos_x: 13,
    pos_y: 80,
    reward_id: "seed-trace-003",
    is_visible: true,
    sort_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "jweysim-scrap-bookshop",
    spot_id: "00000000-0000-4000-8000-000000000005",
    title: "دولمة",
    text: "سَم فوکاز هيت المتنبي فور بوكس. أوذرز شو أب فور پيكس، فور ذا ڤايب. مي؟ أي شو أب إفري داي — فور دولمة فروم أم الدولمة. نو كاپ.",
    location_type: "pin",
    pos_x: 44,
    pos_y: 84,
    reward_id: "seed-vibe-003",
    is_visible: true,
    sort_order: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "jweysim-scrap-sayed",
    spot_id: "00000000-0000-4000-8000-000000000006",
    title: "بللي",
    text: "دس ريسطورنت؟ دس واي أي گوت دس بللي. فور ريل. ماي داي إز نات فينيشد ويذاوت دير فود. تشريب، كباب، كص، دجاج شوي، قوزي — ماي أوتوماتيك، برو. نو بليسينغ أون السيد... فور دس فود. نو كاپ.",
    location_type: "pin",
    pos_x: 88,
    pos_y: 31,
    reward_id: "seed-trace-005",
    is_visible: true,
    sort_order: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "jweysim-scrap-hospital",
    spot_id: "00000000-0000-4000-8000-000000000007",
    title: "شوگر دوك",
    text: "وان تايم آي گوت ماكسد أب — داي توک مي تو ذا هوسبي. دا دوك ووكت إن: «آي سيد ماكس، يوَر شوگر إز فُل أوت أوف ليفل.» آي واز لايك: «داتس كوز يو، سويتي — يو ميد مي ملت!» شي لاكد: «نو كاپ؟ فروم ناو أون: نو شوگر، بيتر تي. بيريود.» آي سيد: «ساي ليس — آي ثنك أوف يو إفري سيب، فور ريل.» شي كپت لافن — أند لَت مي ووك.",
    location_type: "pin",
    pos_x: 16,
    pos_y: 32,
    reward_id: "seed-vibe-005",
    is_visible: true,
    sort_order: 7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "jweysim-scrap-kiosk",
    spot_id: "00000000-0000-4000-8000-000000000008",
    title: "برايس هايك",
    text: "وان تايم أي ونت تو باي سنيكرز أند مونستر — ماي أمامايتز، برو. آي لوكد أت ذا تاگ... فُل أوت أوف ماي رينج. آي كت: «هوي، شو دس؟ دس إز إكسپنصيڤ!» دا گاي إت ذا ستور سيد: «برو، تشيل — دس إز نوتينغ. تومورو، إت ويل بي إيڤن هاير.» آي كت: «هاير؟ هاون؟» هي سيد: «وي آر إن عراق، مان. إنفليشن هير إز لايك أ رن أواي مونستر — نو كاب.»",
    location_type: "pin",
    pos_x: 69,
    pos_y: 34,
    reward_id: "seed-vibe-004",
    is_visible: true,
    sort_order: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "jweysim-scrap-secret",
    spot_id: null,
    title: "أور سيكرت",
    text: "آي گوت أ سيكرت، برو — نو كاپ: آي واز نوت بورن إن أمريكا. آي واز بورن إن باب الشرجي، بغداد — أند ليرند ماي إنجليش إيتر. إفري نايت، آي دريم أوف زيس سيتي. إفري مورنينغ، آي ووك أب هير. داتس واي آي سيد آي أم أمريكن — إتز إيزير لايك دات. بس يو فاوند دس. يو نو ذا تروث ناو. ششش... دونت تل أي ون. دس إز أور سيكرت. فور ريل.",
    location_type: "free",
    pos_x: 50,
    pos_y: 14,
    reward_id: "seed-trace-001",
    is_visible: true,
    sort_order: 9,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
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
  jweysim_scraps: Row[];
  jweysim_phrases: Row[];
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
  "jweysim_scraps",
  "jweysim_phrases",
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
  jweysim_scraps: Row[] | undefined;
  jweysim_phrases: Row[] | undefined;
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
    jweysim_scraps: [...seededJweysimScraps],
    jweysim_phrases: [...seededJweysimPhrases],
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