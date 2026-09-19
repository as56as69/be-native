import type { ScenarioGraph } from "@be-native/shared";

/**
 * Seed data for the Interactive Scenario Engine — FULL American Slang
 * immersion. The NPC speaks native US street-English; the learner must reply
 * in the right American-slang register. Arabic appears ONLY as a small hint
 * / equivalent helper, never as the main narrative.
 *
 * Wrong options model a broken REGISTER (stiff, translated "textbook"
 * English) so the learner trains ear + tone, not vocabulary alone.
 */
export type SeedScenarioGraph = Omit<ScenarioGraph, "is_active" | "created_at">;

export const seededScenarioGraphs: SeedScenarioGraph[] = [
  {
    id: "00000000-0000-4000-8000-0000000000e1",
    spot_id: "00000000-0000-4000-8000-000000000001",
    title: "المنصور — طگّة العجّة وأول قهوة",
    location: "الكرخ — شارع المنصور",
    characters: [
      { id: "amir", name_ar: "أمير", name_en: "Amir" },
      { id: "baba_amin", name_ar: "بابا أمين", name_en: "Baba Amin" },
    ],
    nodes: [
      {
        id: "n1",
        character: "amir",
        text_en_slang: "Yo, welcome to Baghdad! So what's it gonna be — liquid fire tea or a real arabic brew?",
        text_ar_hint: "المقصود بالموقف: البائع يستقبلك بعرض واضح",
        options: [
          {
            id: "o1",
            text_en_slang: "Yo Amir! Hook me up with that blazing tea, stat.",
            text_ar_equivalent: "هلا أمير! عطني چاي مهيل حرّاق",
            is_correct: true,
            xp_reward: 15,
            next_node_id: "n2",
          },
          {
            id: "o2",
            text_en_slang: "I would like to purchase a cup of tea, please, as quickly as possible.",
            text_ar_equivalent: "أريد شراء كاسة شاي من فضلك في أسرع وقت",
            is_correct: false,
            xp_reward: 0,
            next_node_id: null,
          },
        ],
      },
      {
        id: "n2",
        character: "amir",
        text_en_slang: "Here you go, fam — still steaming. Anyway, how was the trip? You look wiped.",
        text_ar_hint: "المقصود بالموقف: يسأل عن السفر لأنك شكلّك تعبان",
        options: [
          {
            id: "o1",
            text_en_slang: "Bro, I'm fried — that flight hit different.",
            text_ar_equivalent: "أنا محروق — الرحلة طگّة",
            is_correct: true,
            xp_reward: 15,
            next_node_id: "n3",
          },
          {
            id: "o2",
            text_en_slang: "The journey was quite tiring; I require sleep and a large meal.",
            text_ar_equivalent: "السفر كان مرهقاً وأحتاج نوم ووجبة كبيرة",
            is_correct: false,
            xp_reward: 0,
            next_node_id: null,
          },
        ],
      },
      {
        id: "n3",
        character: "baba_amin",
        text_en_slang: "Omelet comin' up! Tomatoes in? First one's on the house — my treat.",
        text_ar_hint: "المقصود بالموقف: بابا أمين يقدّم العجة مجاناً كضيافة",
        options: [
          {
            id: "o1",
            text_en_slang: "You're the man, Baba Amin! Load it up with tomatoes.",
            text_ar_equivalent: "سلمت يمّك! حطّلي ويا الطماطة",
            is_correct: true,
            xp_reward: 20,
            next_node_id: null,
          },
          {
            id: "o2",
            text_en_slang: "Could you please consider reducing the price for new customers?",
            text_ar_equivalent: "هل يمكن تخفيض السعر للزبائن الجدد؟",
            is_correct: false,
            xp_reward: 0,
            next_node_id: null,
          },
        ],
      },
    ],
  },
  {
    id: "00000000-0000-4000-8000-0000000000e2",
    spot_id: "00000000-0000-4000-8000-000000000002",
    title: "كرادة — چاي مهيل وسعر التعارف",
    location: "الرصافة — شارع كرادة",
    characters: [{ id: "abu_saleh", name_ar: "أبو صالح", name_en: "Abu Saleh" }],
    nodes: [
      {
        id: "n1",
        character: "abu_saleh",
        text_en_slang: "Heard you out here! Street's loud — you gotta shout it, buddy. What's good?",
        text_ar_hint: "المقصود بالموقف: الشارع زحمة، لازم ترفع صوتك وتسلم سلام الشارع",
        options: [
          {
            id: "o1",
            text_en_slang: "Yo Abu Saleh! What's good, man — how's that fire tea game today?",
            text_ar_equivalent: "هلا أبو صالح! شلونك وشلون الگوري اليوم؟",
            is_correct: true,
            xp_reward: 15,
            next_node_id: "n2",
          },
          {
            id: "o2",
            text_en_slang: "Greetings, sir. I am interested in your menu's price list.",
            text_ar_equivalent: "تحية طيبة؛ أريد قائمة الأسعار الخاصة بكم",
            is_correct: false,
            xp_reward: 0,
            next_node_id: null,
          },
        ],
      },
      {
        id: "n2",
        character: "abu_saleh",
        text_en_slang: "There you go — cup's in your hand, homie. Price? Say it chill and we cool.",
        text_ar_hint: "المقصود بالموقف: رخّص السعر بطريقة ودّية",
        options: [
          {
            id: "o1",
            text_en_slang: "My bad, boss — thought we were straight-up homies.",
            text_ar_equivalent: "المعذرة! گلت أحنا صاحبين",
            is_correct: true,
            xp_reward: 15,
            next_node_id: "n3",
          },
          {
            id: "o2",
            text_en_slang: "That is excessively expensive. I shall take my business elsewhere.",
            text_ar_equivalent: "هذا غالٍ جداً وسأنتقل إلى مكان آخر",
            is_correct: false,
            xp_reward: 0,
            next_node_id: null,
          },
        ],
      },
      {
        id: "n3",
        character: "abu_saleh",
        text_en_slang: "Enough small talk! This cup's a gift from the street to your fam — way to roll.",
        text_ar_hint: "المقصود بالموقف: الگاصة هدية لك من الشارع",
        options: [
          {
            id: "o1",
            text_en_slang: "Much love, man! Best tea in town — catch you tomorrow.",
            text_ar_equivalent: "شكراً! أشهى چاي — بكرة اكو عندك",
            is_correct: true,
            xp_reward: 20,
            next_node_id: null,
          },
          {
            id: "o2",
            text_en_slang: "I must settle the transaction immediately as I have other obligations.",
            text_ar_equivalent: "يجب أن أدفع فوراً، لدي التزامات أخرى",
            is_correct: false,
            xp_reward: 0,
            next_node_id: null,
          },
        ],
      },
    ],
  },
  {
    id: "00000000-0000-4000-8000-0000000000e3",
    spot_id: "00000000-0000-4000-8000-000000000003",
    title: "زيونة — أوزان وأعداد بالعراقي",
    location: "الرصافة — حي زيونة",
    characters: [
      { id: "amjad", name_ar: "أمجد", name_en: "Amjad" },
      { id: "habib", name_ar: "حبيب", name_en: "Habib" },
    ],
    nodes: [
      {
        id: "n1",
        character: "amjad",
        text_en_slang: "What's up, new blood! Before you touch the iron, what you got for me?",
        text_ar_hint: "المقصود بالموقف: المدرب يبي تحية قبل التمرين",
        options: [
          {
            id: "o1",
            text_en_slang: "Yo Amjad, what it do?! Here to get shredded — what we runnin' today?",
            text_ar_equivalent: "هلا أمجد! جاي أتمرّن — شنو برنامج اليوم؟",
            is_correct: true,
            xp_reward: 15,
            next_node_id: "n2",
          },
          {
            id: "o2",
            text_en_slang: "Good afternoon. I would like to know the membership fee prior to commencing.",
            text_ar_equivalent: "مساء الخير؛ أريد معرفة رسوم الاشتراك قبل البدء",
            is_correct: false,
            xp_reward: 0,
            next_node_id: null,
          },
        ],
      },
      {
        id: "n2",
        character: "amjad",
        text_en_slang: "Sick! First machine — bang out ten reps and tell me when you done. Packin' heat!",
        text_ar_hint: "المقصود بالموقف: أمجد يشجعك تكمل العدّات",
        options: [
          {
            id: "o1",
            text_en_slang: "Say less, coach! I'm dying but I ain't quitting.",
            text_ar_equivalent: "عيني وياك! تعبان بس ما گلت گُلّة",
            is_correct: true,
            xp_reward: 15,
            next_node_id: "n3",
          },
          {
            id: "o2",
            text_en_slang: "This equipment is somewhat challenging; I require a break.",
            text_ar_equivalent: "هذا الجهاز صعب قليلاً وأحتاج للراحة",
            is_correct: false,
            xp_reward: 0,
            next_node_id: null,
          },
        ],
      },
      {
        id: "n3",
        character: "habib",
        text_en_slang: "We made it, champ! Dig deep — tomorrow we runnin' it back at noon.",
        text_ar_hint: "المقصود بالموقف: حبيب يحمّسك لجلسة بكرة",
        options: [
          {
            id: "o1",
            text_en_slang: "Bet, Habib! I'm all in — tomorrow's rematch. No cap.",
            text_ar_equivalent: "شدّ حيلك! بكرة جاي معاك بلا خدعة",
            is_correct: true,
            xp_reward: 20,
            next_node_id: null,
          },
          {
            id: "o2",
            text_en_slang: "I appreciate the session. Let me confirm my schedule for tomorrow.",
            text_ar_equivalent: "أشكرك على الحصة؛ سأراجع جدولي لليوم القادم",
            is_correct: false,
            xp_reward: 0,
            next_node_id: null,
          },
        ],
      },
    ],
  },
  {
    id: "00000000-0000-4000-8000-0000000000e4",
    spot_id: "00000000-0000-4000-8000-000000000004",
    title: "تكسي بغداد — مساومة الأجرة وشارع الرصافة",
    location: "الكرخ والرصافة — خطّ التكاسي",
    characters: [{ id: "abu_kareem", name_ar: "أبو كريم", name_en: "Abu Kareem" }],
    nodes: [
      {
        id: "n1",
        character: "abu_kareem",
        text_en_slang: "Where to, chief? Point me a street and name the district, don't be shy.",
        text_ar_hint: "المقصود بالموقف: أبو كريم يبي الوجهة كاملة: الشارع والمحلة",
        options: [
          {
            id: "o1",
            text_en_slang: "Yo Abu Kareem! Drop me at Mutanabbi Street, if that's not a hassle.",
            text_ar_equivalent: "هلا أبو كريم! خلّيها شارع المتنبي",
            is_correct: true,
            xp_reward: 15,
            next_node_id: "n2",
          },
          {
            id: "o2",
            text_en_slang: "Excuse me, could you kindly state the fare before we depart?",
            text_ar_equivalent: "المعذرة، أرجو ذكر الأجرة قبل الانطلاق",
            is_correct: false,
            xp_reward: 0,
            next_node_id: null,
          },
        ],
      },
      {
        id: "n2",
        character: "abu_kareem",
        text_en_slang: "Mutanabbi! Jam-packed today. Market rate: a five. Deal or no deal?",
        text_ar_hint: "المقصود بالموقف: المساومة مقبولة — ردّ بعرضك",
        options: [
          {
            id: "o1",
            text_en_slang: "Aight — a four and you narrate the streets on the way. That's the deal.",
            text_ar_equivalent: "أزين — أربعة وكلّك يشرح الشوارع على الطريق",
            is_correct: true,
            xp_reward: 15,
            next_node_id: "n3",
          },
          {
            id: "o2",
            text_en_slang: "Very well. I shall pay the sum after thoroughly inspecting the exit.",
            text_ar_equivalent: "حسناً، سأدفع المبلغ بعد فحص المخرج جيداً",
            is_correct: false,
            xp_reward: 0,
            next_node_id: null,
          },
        ],
      },
      {
        id: "n3",
        character: "abu_kareem",
        text_en_slang: "Poem Square, baby! Grab your spirit — you just touched the other side of the river.",
        text_ar_hint: "المقصود بالموقف: وصلت ساحة المتنبي — كمل بقمّة التعامل",
        options: [
          {
            id: "o1",
            text_en_slang: "You the GOAT, Abu Kareem! Keep the whole five — my treat.",
            text_ar_equivalent: "خوش زلمة! خذ الخمسة كلها",
            is_correct: true,
            xp_reward: 20,
            next_node_id: null,
          },
          {
            id: "o2",
            text_en_slang: "Thank you. I shall now compute the appropriate gratuity.",
            text_ar_equivalent: "شكراً؛ سأحتسب الآن البقشيش المناسب",
            is_correct: false,
            xp_reward: 0,
            next_node_id: null,
          },
        ],
      },
    ],
  },
  {
    id: "00000000-0000-4000-8000-0000000000e5",
    spot_id: "00000000-0000-4000-8000-000000000005",
    title: "المتنبي — دفتر الدخول لساحة القصيدة",
    location: "الرصافة — شارع المتنبي",
    characters: [
      { id: "abu_yusuf", name_ar: "أبو اليوسف", name_en: "Abu Yusuf" },
      { id: "sadiq", name_ar: "صادق", name_en: "Sadiq" },
    ],
    nodes: [
      {
        id: "n1",
        character: "abu_yusuf",
        text_en_slang: "Bookworm alert! You walked into my shop and Baghdad just got sweeter. What you huntin'?",
        text_ar_hint: "المقصود بالموقف: ترحيب صاحب المكتبة + سؤالك عن المطلوب",
        options: [
          {
            id: "o1",
            text_en_slang: "Yo, bookman! I'm huntin' a Shahrazad collection — hook me up.",
            text_ar_equivalent: "هلا! أدوّر على ديوان شهرزاد",
            is_correct: true,
            xp_reward: 15,
            next_node_id: "n2",
          },
          {
            id: "o2",
            text_en_slang: "Kindly direct me to the section of classical poetry, please.",
            text_ar_equivalent: "أرجو إرشادي إلى قسم الشعر الكلاسيكي",
            is_correct: false,
            xp_reward: 0,
            next_node_id: null,
          },
        ],
      },
      {
        id: "n2",
        character: "abu_yusuf",
        text_en_slang: "Shahrazad? My pride and joy! Let's find the spine — straight from the heart.",
        text_ar_hint: "المقصود بالموقف: أبواليوسف فرحان بديوانك",
        options: [
          {
            id: "o1",
            text_en_slang: "Then hook me up at the real price — from the heart, like you said.",
            text_ar_equivalent: "خلّها بسعرها الأصلي — خذها من گلبي",
            is_correct: true,
            xp_reward: 15,
            next_node_id: "n3",
          },
          {
            id: "o2",
            text_en_slang: "I should like a discount, being a student of limited means.",
            text_ar_equivalent: "أودّ تخفيضاً كوني طالباً",
            is_correct: false,
            xp_reward: 0,
            next_node_id: null,
          },
        ],
      },
      {
        id: "n3",
        character: "sadiq",
        text_en_slang: "So much talk up in here… take this poem — little gift from the square's corner.",
        text_ar_hint: "المقصود بالموقف: صادق يهديك قصيدة من الساحة",
        options: [
          {
            id: "o1",
            text_en_slang: "Ayy, say less, Sadiq! Tomorrow I'm readin' it in the corner spot.",
            text_ar_equivalent: "شكراً صادق! بكرة أكعد بالركن وأقراها",
            is_correct: true,
            xp_reward: 20,
            next_node_id: null,
          },
          {
            id: "o2",
            text_en_slang: "I accept the gift but require a written receipt of its valuation.",
            text_ar_equivalent: "أقبل الهدية وأحتاج إيصال تقدير مكتوباً",
            is_correct: false,
            xp_reward: 0,
            next_node_id: null,
          },
        ],
      },
    ],
  },
];