import { getDb } from "../src/db.js";
import { seededScenarioGraphs } from "../src/data/scenarios.js";

const db = getDb();

const VOUCHER_ID = "00000000-0000-4000-8000-0000000000f1";
const DEMO_USER_ID = "00000000-0000-4000-8000-0000000000b1";

const seededUsers = [
  {
    id: DEMO_USER_ID,
    phone: "+964000000001",
    auth_id: null,
    credits_balance: 50,
    current_tier: "standard",
    created_at: new Date().toISOString(),
  },
];

const seededProviders = [
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

// Five living districts of Baghdad, each with a multi-NPC dialogue graph,
// order errors, interrupts, and a prompt that forces the engine to produce a
// "المعنى البغدادي" cultural bridge line for the visiting tourist.
const SCENARIO_BLUEPRINTS = [
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
        {
          fromNodeId: "n2",
          toNodeId: "n1",
          trigger_ar: "سأل عن السعر وهو جان واقف على الباب",
          allowed: true,
        },
      ],
    },
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
        {
          fromNodeId: "n3",
          toNodeId: "n2",
          trigger_ar: "حاول يدفع بدون ما يتذوّق الكاسة",
          allowed: true,
        },
      ],
    },
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
        {
          fromNodeId: "n3",
          toNodeId: "n1",
          trigger_ar: "سأل عن سعر الاشتراك وهو لسه بباب القاعة",
          allowed: false,
        },
      ],
    },
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
        {
          fromNodeId: "n2",
          toNodeId: "n1",
          trigger_ar: "ركب وبرا ما گال وين يريد يروح",
          allowed: false,
        },
      ],
    },
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
        {
          fromNodeId: "n3",
          toNodeId: "n2",
          trigger_ar: "سأل عن ثمن القصيدة وهدية القراءة",
          allowed: true,
        },
      ],
    },
  },
];

const seededScenarios = SCENARIO_BLUEPRINTS.map((s) => ({
  id: s.id,
  spot_id: s.spot_id,
  title: s.title,
  system_prompt: s.system_prompt,
  graph_rules: s.graph_rules,
  provider_config: {
    primary: { provider: "MOCK", model: "mock-1" },
    tts: { provider: "ElevenLabs", voice: "arabi" },
    temperature: 0.7,
    maxTokens: 800,
  },
  created_at: new Date().toISOString(),
}));

// Production-ready interactive graphs: strict node/option JSON for the
// Scenario Engine (one active graph per spot). `next_node_id` "null" = terminal.

// Deterministic ids so the seed stays a no-op-safe upsert across runs.
const seededSpots = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    title_ar: "مقهى المنصور",
    title_en: "Al-Mansour Street Cafe",
    category: "cafe" as const,
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
    category: "street_vendor" as const,
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
    category: "gym" as const,
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
    category: "taxi_delivery" as const,
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
    category: "bookshop" as const,
    vibe_description:
      "رفوف الكتب إلى السقف، رائحة الورق القديم، وركن القصائد تحت ضوء نافذة غبارها ذهبي.",
    position_x: 42.0,
    position_y: 62.0,
    is_locked: false,
    created_at: new Date().toISOString(),
  },
];

async function seed() {
  console.log("🔥 Seed: upserting demo user, spots, voucher, providers & scenario…");

  const { data: users, error: userError } = await db
    .from("users")
    .upsert(seededUsers, { onConflict: "id" })
    .select("id, current_tier, credits_balance");
  if (userError) throw new Error(`users upsert failed: ${userError.message}`);
  const demoUser = users?.[0];
  console.log(`  ✓ user: ${demoUser?.id} (${demoUser?.current_tier}, ${demoUser?.credits_balance} credits)`);

  const { data: spots, error: spotError } = await db.from("spots").upsert(seededSpots, { onConflict: "id" }).select("id, title_en, category");
  if (spotError) throw new Error(`spots upsert failed: ${spotError.message}`);
  console.log(`  ✓ spots: ${spots?.length ?? 0}`);

  const { data: voucher, error: voucherError } = await db
    .from("vouchers")
    .upsert(
      {
        id: VOUCHER_ID,
        code: "BN-LAUNCH-2026",
        credit_amount: 50,
        is_redeemed: false,
        redeemed_by_user_id: null,
        redeemed_at: null,
        created_at: new Date().toISOString(),
      },
      { onConflict: "code" }
    )
    .select("code, credit_amount")
    .single();
  if (voucherError) throw new Error(`voucher upsert failed: ${voucherError.message}`);
  console.log(`  ✓ voucher: ${voucher?.code} (${voucher?.credit_amount} credits)`);

  const { data: providers, error: providerError } = await db
    .from("api_providers")
    .upsert(seededProviders, { onConflict: "id" })
    .select("id, name, priority, is_active");
  if (providerError) throw new Error(`providers upsert failed: ${providerError.message}`);
  console.log(`  ✓ providers: ${providers ? providers.map((p) => `${p.name}#${p.priority}`).join(", ") : 0}`);

  const { data: scenarios, error: scenarioError } = await db
    .from("scenarios")
    .upsert(seededScenarios, { onConflict: "id" })
    .select("id, title");
  if (scenarioError) throw new Error(`scenario upsert failed: ${scenarioError.message}`);
  console.log(`  ✓ scenarios: ${scenarios ? scenarios.map((s) => s.title).join(" | ") : 0}`);

  const { data: graphs, error: graphError } = await db
    .from("scenario_graphs")
    .upsert(seededScenarioGraphs, { onConflict: "spot_id" })
    .select("id, title");
  if (graphError) throw new Error(`scenario graphs upsert failed: ${graphError.message}`);
  console.log(`  ✓ scenario graphs: ${graphs ? graphs.map((g) => g.title).join(" | ") : 0}`);

  const { count: spotsCount, error: countError } = await db
    .from("spots")
    .select("id", { count: "exact", head: true });
  if (countError) throw new Error(`count failed: ${countError.message}`);

  const { count: userCount, error: userCountError } = await db
    .from("users")
    .select("id", { count: "exact", head: true });
  if (userCountError) throw new Error(`count failed: ${userCountError.message}`);

  const { count: voucherCount, error: voucherCountError } = await db
    .from("vouchers")
    .select("id", { count: "exact", head: true });
  if (voucherCountError) throw new Error(`count failed: ${voucherCountError.message}`);

  const { count: scenarioCount, error: scenarioCountError } = await db
    .from("scenarios")
    .select("id", { count: "exact", head: true });
  if (scenarioCountError) throw new Error(`count failed: ${scenarioCountError.message}`);

  const { count: providerCount, error: providerCountError } = await db
    .from("api_providers")
    .select("id", { count: "exact", head: true });
  if (providerCountError) throw new Error(`count failed: ${providerCountError.message}`);

  const { count: graphCount, error: graphCountError } = await db
    .from("scenario_graphs")
    .select("id", { count: "exact", head: true });
  if (graphCountError) throw new Error(`count failed: ${graphCountError.message}`);

  console.log("══════════════════════════════════════════");
  console.log(`  total users    : ${userCount}`);
  console.log(`  total spots    : ${spotsCount}`);
  console.log(`  total vouchers : ${voucherCount}`);
  console.log(`  total scenarios: ${scenarioCount}`);
  console.log(`  total providers: ${providerCount}`);
  console.log(`  total graphs   : ${graphCount}`);
  console.log("══════════════════════════════════════════");

  process.exit(0);
}

seed().catch((err: unknown) => {
  console.error("✗ Seed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});