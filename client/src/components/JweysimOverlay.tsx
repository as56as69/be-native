/**
 * JweysimOverlay.tsx — الطبقة التفاعلية لجويسم الأمريكي.
 *
 * مسؤولياتها:
 * 1. إدارة حالة جويسم عبر مؤقتات بسيطة: idle (30ث) → bored (60ث) → sleeping،
 *    ويتوقف كل شي عند أي تفاعل (pointerdown) — حسب الخطة ٥.٢ و٥.٣.
 * 2. تسمع jweysimBus (jweysim:interaction) وتسوّي حالات لحظية:
 *    tap → click، scenario-complete → victory، scenario-error → error.
 * 3. تعرض ستيكر العبارة (en_sticker) بخط Caveat فوق راس جويسم
 *    — يظهر من JWEYSIM_PHRASES ويختفي تلقائياً بعد 2 ثانية.
 * 4. تعرض القصاصات (JWEYSIM_SCRAPS) — hover/click على القصاصة يكبّرها
 *    ويعرض نصها + يطلق حدث jweysim:interaction (kind tap, targetId القصاصة).
 *    المواقع تُؤخذ من PIN_POS (DoodleMap) عبر spotId — فتتبع الپين الفعلي
 *    دائماً بدل posX/posY القديمة اللي كانت ترصّ فوق المواقع.
 *
 * كل النصوص بالعربي، كل شي CSS classes (لا CSS داخل المكوّن — إلا
 * style بسيط للمواقع المئوية)، و pointer-events: none على جسم جويسم
 * ما عدا القصاصات القابلة للنقر (القاعدة الذهبية بالخطة ٢).
 *
 * بلا مكتبات خارجية — React + jweysimBus فقط.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { jweysimBus } from "../core/jweysimBus";
import type { JweysimInteractionEvent } from "../core/jweysimBus";
import { JWEYSIM_PHRASES } from "../data/jweysimData";
import type { JweysimPhrase, JweysimScrap } from "@be-native/shared";
import { api } from "../lib/api";
import type { JweysimState } from "../data/jweysimData";
import JweysimMascot from "./JweysimMascot";
import type { JweysimMascotState } from "./JweysimMascot";
import { PIN_POS } from "./DoodleMap";

/* مدة الخمول قبل الملل — من الخطة ٥.٣ (كانت 30 ثانية — خففناها للظهور السريع). */
const IDLE_TO_BORED_MS = 5_000;
/** مدة الملل قبل النوم — من الخطة ٥.٣ (كانت 60 ثانية). */
const BORED_TO_SLEEP_MS = 45_000;
/** الستيكر يختفي بعد 2 ثانية — من المهمة. */
const STICKER_TTL_MS = 2_000;

/* إزاحة القصاصة عن پين موقعها (نسبة مئوية من عرض/ارتفاع الخريطة) —
  حتى تطلع "بجنب" الپين مو فوقه، وما تحجبه (القاعدة الذهبية بالخطة ٢). */
const SCRAP_OFFSET_X = 4;
const SCRAP_OFFSET_Y = 3;

/* ربط UUID الخاص بالـ spot (المخزون في JWEYSIM_SCRAPS.spotId)
  بعنوان spot الإنجليزي (مفتاح PIN_POS في DoodleMap) — لأن PIN_POS
  مفهرسة بالعناوين مو بالـ UUIDs. مصدر الـ UUIDs من server/db/seed.ts. */
const SPOT_UUID_TO_TITLE: Record<string, string> = {
  "00000000-0000-4000-8000-000000000001": "Al-Mansour Street Cafe",
  "00000000-0000-4000-8000-000000000002": "Karrada Street Tea Vendor",
  "00000000-0000-4000-8000-000000000003": "Ziyouna Gym",
  "00000000-0000-4000-8000-000000000004": "Baghdad Taxi Ride",
  "00000000-0000-4000-8000-000000000005": "Mutanabbi Bookshop",
  "00000000-0000-4000-8000-000000000006": "Al-Sayed Restaurant",
  "00000000-0000-4000-8000-000000000007": "Baghdad Teaching Hospital",
  "00000000-0000-4000-8000-000000000008": "Abu Jassem's Kiosk",
};

/* M1 — تلميحات جويسم لكل مكان (التعلم غمر مو ترجمة — من خطة التخطيط).
   لما المستخدم يفتح پين، جويسم يطلع بتلميح قصير مربوط بالمكان يحسّسك
   بالكلمة قبل أي ترجمة — سلانك + ستيكر مثل القاعدة. */
const SPOT_UUID_TO_HINT: Record<string, { ar: string; en_sticker?: string }> = {
  "00000000-0000-4000-8000-000000000001": { ar: "برو... ريحة القهوة گلّتلي شي. شمّيت؟", en_sticker: "You smell it?" },
  "00000000-0000-4000-8000-000000000002": { ar: "چاي مهيل... ريحته گلّتلي شي. شنو گال لك؟", en_sticker: "Chai's talking" },
  "00000000-0000-4000-8000-000000000003": { ar: "هاي الجيم... أني بس أتفرج. إنت توگف مكاني، برو.", en_sticker: "Your turn, bro" },
  "00000000-0000-4000-8000-000000000004": { ar: "التكسي يرجّ... گلّي، أبو كريم گال لك شي؟", en_sticker: "Listen to him" },
  "00000000-0000-4000-8000-000000000005": { ar: "أكو ريحة ورق قديم بالهواء... الگصص گلنّي أشتغل، إنت اسمع.", en_sticker: "Paper talks, bro" },
  "00000000-0000-4000-8000-000000000006": { ar: "ريحة الكباب... أريدها. بس إنت جاي هنا لشي ثاني، فكر.", en_sticker: "Smell the story" },
  "00000000-0000-4000-8000-000000000007": { ar: "هاي المستشفى... أني گعدت أتذكر اللي طاح. إنت؟ شنو گلّك هاي الزنقة؟", en_sticker: "Remember, bro" },
  "00000000-0000-4000-8000-000000000008": { ar: "الكشك گدامك... كل شي بيه. بس شنو اللي تريد إنت؟ فكر، برو.", en_sticker: "Pick your vibe" },
};

/** يحوّل الـ spotId (UUID) إلى إحداثيات نسبة مئوية على الخريطة من PIN_POS.
 *  نستخدم الـ UUID → title_en mapping ثم نأخذ الموضع من PIN_POS.
 *  القصاصة السرية (secret-chai-stains) ما لها پين — تاخذ وسط الخريطة. */
function spotPos(spotId: string | null): { x: number; y: number } {
  if (!spotId) return { x: 50, y: 50 };
  const title = SPOT_UUID_TO_TITLE[spotId];
  const fixed = title ? PIN_POS[title] : undefined;
  if (fixed) return { x: fixed.x, y: fixed.y };
  // القصاصة بدون پين معروف — حطها بعيد عن كل الپينز (بين النهر وخارج المسارات)
  return { x: 50, y: 93 };
}

export interface JweysimOverlayProps {
  /** هل جويسم ظاهر أصلاً؟ */
  visible?: boolean;
  /** حجم جويسم (يُمرر للماسكوت). */
  size?: number;
  /** قلب أفقي افتراضي — يتغير حسب جهة التفاعل. */
  flip?: boolean;
}

/* M3 — فقاعة تلميح تظهر بجنب الپين المفتوح (التعلم مربوط بالمكان).
   نحفظ الـ spotId + موضعه لحظة فتح الپين حتى نعرض الفقاعة هناك. */
interface SpotHintBubble {
  spotId: string;
  x: number;
  y: number;
}

const stickerCssProps = {
  fontFamily: "'Caveat', 'Tajawal', cursive",
} as const;

/**
 * يختار عبارة عشوائية من مصفوفة عبارات الحالة — بدون تكرار متتالٍ.
 * الأولوية للعبارات الحية من الخادم (لوحة التحكم)؛ عند غيابها يرجع
 * للعبارات الافتراضية من الكود (JWEYSIM_PHRASES).
 */
function pickPhrase(
  state: JweysimState,
  lastPhraseAr: string | null,
  livePhrases: Record<string, JweysimPhrase[]> = {}
) {
  const live = (livePhrases[state] ?? []).filter((p) => p.is_visible);
  const fallback = JWEYSIM_PHRASES[state] ?? JWEYSIM_PHRASES.idle;
  if (!live.length) {
    if (fallback.length <= 1) return fallback[0]!;
    const filtered = fallback.filter((phrase) => phrase.ar !== lastPhraseAr);
    const pool = filtered.length > 0 ? filtered : fallback;
    return pool[Math.floor(Math.random() * pool.length)]!;
  }
  if (live.length <= 1) {
    const first = live[0]!;
    return { ar: first.ar, en_sticker: first.en_sticker ?? undefined };
  }
  const filtered = live
    .map((p) => ({ ar: p.ar, en_sticker: p.en_sticker ?? undefined }))
    .filter((p) => p.ar !== lastPhraseAr);
  const pool = filtered.length > 0 ? filtered : live.map((p) => ({ ar: p.ar, en_sticker: p.en_sticker ?? undefined }));
  return pool[Math.floor(Math.random() * pool.length)]!;
}

/**
 * JweysimOverlay — الماسكوت + الستيكر + القصاصات في طبقة واحدة.
 *
 * مثال:
 *   <JweysimOverlay visible size={96} />
 */
export default function JweysimOverlay({ visible = true, size = 120, flip = false }: JweysimOverlayProps) {
  /* آلة الحالات: idle → bored → sleeping (بمؤقتات) + حالات لحظية (فخ/نصر/خطأ). */
  const [, setState] = useState<JweysimState>("idle");
  const [mascotState, setMascotState] = useState<JweysimMascotState>("idle");
  const [sticker, setSticker] = useState<{ ar: string; en: string | undefined } | null>(null);
  const [activeScrap, setActiveScrap] = useState<string | null>(null);
  const [scraps, setScraps] = useState<JweysimScrap[]>([]);
  const [scrapsError, setScrapsError] = useState<string | null>(null);
  const [phrases, setPhrases] = useState<Record<string, JweysimPhrase[]>>({});
  const [phrasesError, setPhrasesError] = useState<string | null>(null);
  /* M3 — فقاعة التلميح المرتبطة بالمكان (تظهر بجنب الپين المفتوح). */
  const [hintBubble, setHintBubble] = useState<SpotHintBubble | null>(null);

  /* مراجع للمؤقتات — تنظيف تام عند أي تفاعل (الخطة ٥.٢). */
  const timersRef = useRef<number[]>([]);
  const stickerTimerRef = useRef<number | null>(null);
  const lastPhraseRef = useRef<string | null>(null);
  const lastEventRef = useRef<string | null>(null);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
    if (stickerTimerRef.current !== null) {
      window.clearTimeout(stickerTimerRef.current);
      stickerTimerRef.current = null;
    }
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const timer = window.setTimeout(fn, ms);
    timersRef.current.push(timer);
    return timer;
  }, []);

  /* يوقف كل المؤقتات عند أي تفاعل (pointerdown) — القاعدة الذهبية. */
  const stopIdleChain = useCallback(() => {
    clearTimers();
  }, [clearTimers]);

  /* يطلق حدث التفاعل على الـ bus — يسمعه أي مستمع. */
  const poke = useCallback(
    (kind: JweysimInteractionEvent["kind"], targetId?: string) => {
      jweysimBus.interaction(kind, targetId);
    },
    [],
  );

  /* عرض عبارة الحالة كستيكر + تحديث حالة الماسكوت. */
  const sayPhrase = useCallback(
    (next: JweysimState, opts?: { silent?: boolean }) => {
      const phrase = pickPhrase(next, lastPhraseRef.current, phrases);
      lastPhraseRef.current = phrase.ar;
      setSticker({ ar: phrase.ar, en: phrase.en_sticker });
      if (!opts?.silent) {
        setMascotState(next);
      }
      if (stickerTimerRef.current !== null) {
        window.clearTimeout(stickerTimerRef.current);
      }
      stickerTimerRef.current = window.setTimeout(() => setSticker(null), STICKER_TTL_MS);
    },
    [],
  );

  /* سلسلة الخمول: idle (30ث) → bored (60ث) → sleeping. */
  const startIdleChain = useCallback(() => {
    clearTimers();
    setState("idle");
    setMascotState("idle");
    schedule(() => {
      setState("bored");
      sayPhrase("bored", { silent: true });
      schedule(() => {
        setState("sleeping");
        setMascotState("sleeping");
        sayPhrase("sleeping", { silent: true });
      }, BORED_TO_SLEEP_MS);
    }, IDLE_TO_BORED_MS);
    schedule(() => setSticker(null), 4_000);
  }, [clearTimers, sayPhrase, schedule]);

  // أي تفاعل: يوقف الخمول، يصحي جويسم، ويطلق الحدث للـ bus.
  const handlePointerDown = useCallback(() => {
    stopIdleChain();
    poke("tap");
    setState("wake");
    setMascotState("wake");
    sayPhrase("wake");
    schedule(() => startIdleChain(), 2_500);
  }, [poke, sayPhrase, schedule, startIdleChain, stopIdleChain]);

  /* أثناء المشي/التنقل — يظهر جويسم من أول فتح الخريطة ويتحرك بين الزوايا */
  const [jumpSide, setJumpSide] = useState<string>("corner-lb"); // corner-lb | corner-rb | corner-lt | corner-rt
  const jumpTimerRef = useRef<number | null>(null);
  const jumpStateTimerRef = useRef<number | null>(null);

  // حركة حيوية: ينتقل بين زوايا الشاشة كل 8-12 ثانية
  const scheduleJump = useCallback(
    (delay: number) => {
      if (jumpTimerRef.current !== null) window.clearTimeout(jumpTimerRef.current);
      jumpTimerRef.current = window.setTimeout(() => {
        const corners = ["corner-lb", "corner-rb", "corner-lt", "corner-rt"] as const;
        setJumpSide((prev) => {
          const next = corners[Math.floor(Math.random() * corners.length)];
          if (next === prev) return prev === "corner-lb" ? "corner-rb" : "corner-lb";
          return next;
        });
        // قفزة+هبوط قصيرة أثناء التنقل بين الزوايا (Squash & Stretch)
        setMascotState("jump");
        if (jumpStateTimerRef.current !== null) window.clearTimeout(jumpStateTimerRef.current);
        jumpStateTimerRef.current = window.setTimeout(() => {
          setMascotState("land");
          if (jumpStateTimerRef.current !== null) {
            window.clearTimeout(jumpStateTimerRef.current);
            jumpStateTimerRef.current = null;
          }
          jumpStateTimerRef.current = window.setTimeout(() => {
            setMascotState("idle");
          }, 500);
        }, 900);
        scheduleJump(8_000 + Math.random() * 4_000);
      }, delay);
    },
    [],
  );

  // عند الظهور يبدأ التنقل بين الزوايا فوراً (بعد 2 ثانية من أول ظهور)
  useEffect(() => {
    if (!visible) return;
    scheduleJump(2_000);
    return () => {
      if (jumpTimerRef.current !== null) window.clearTimeout(jumpTimerRef.current);
      if (jumpStateTimerRef.current !== null) window.clearTimeout(jumpStateTimerRef.current);
    };
  }, [visible, scheduleJump]);

  /* الاستماع للأحداث الخارجية من jweysimBus (سيناريو/Vibe/شاشات...). */
  useEffect(() => {
    const off = jweysimBus.on("jweysim:interaction", (event) => {
      if (lastEventRef.current === event.timestamp.toFixed(0)) return; // تفاعلنا نفسنا — نتجاهله
      lastEventRef.current = event.timestamp.toFixed(0);
      stopIdleChain();
      if (event.kind === "scenario-complete") {
        setState("victory");
        setMascotState("victory");
        sayPhrase("victory");
      } else if (event.kind === "scenario-error") {
        setState("error");
        setMascotState("error");
        sayPhrase("error");
      } else if (event.kind === "tap" && event.targetId) {
        /* M1/M3 — تلميح جويسم المُربوط بالمكان عند فتح الپين (التعلم غمر مو ترجمة).
           الفقاعة تظهر بجنب الپين المفتوح نفسه — التعلم مربوط بالمكان مو ستيكر عائم. */
        const hint = SPOT_UUID_TO_HINT[event.targetId];
        if (hint) {
          lastPhraseRef.current = hint.ar;
          setSticker({ ar: hint.ar, en: hint.en_sticker });
          setState("click");
          setMascotState("click");
          const fixedPos = PIN_POS[SPOT_UUID_TO_TITLE[event.targetId]];
          setHintBubble(
            fixedPos
              ? { spotId: event.targetId, x: fixedPos.x, y: fixedPos.y }
              : { spotId: event.targetId, x: 20, y: 20 },
          );
          if (stickerTimerRef.current !== null) {
            window.clearTimeout(stickerTimerRef.current);
          }
          stickerTimerRef.current = window.setTimeout(() => {
            setSticker(null);
            setHintBubble(null);
          }, STICKER_TTL_MS);
        } else {
          setState("idle");
          setMascotState("idle");
          sayPhrase("idle");
        }
      } else {
        setState("idle");
        setMascotState("idle");
        sayPhrase("idle");
      }
      schedule(() => startIdleChain(), 4_000);
    });
    return off;
  }, [sayPhrase, schedule, startIdleChain, stopIdleChain]);

  /* بداية التشغيل: الخمول يبدأ فور الظهور. */
  useEffect(() => {
    if (!visible) return;
    startIdleChain();
    return () => {
      clearTimers();
      setSticker(null);
    };
  }, [visible, startIdleChain, clearTimers]);

  /* جلب القصاصات من الخادم (بدل الثابت JWEYSIM_SCRAPS) — أي تعديل في
     لوحة التحكم «جويسم» ينعكس مباشرة على الخريطة بعد تحديث الصفحة. */
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    api
      .scraps()
      .then((rows) => {
        if (cancelled) return;
        setScraps(rows.filter((s) => s.is_visible));
        setScrapsError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setScrapsError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [visible]);

  /* جلب عبارات جويسم من الخادم — تتحكم بگلام الماسكوت من اللوحة.
     إذا طاح السيرفر نرجع للعبارات الافتراضية المكتوبة بالكود. */
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    api
      .phrases()
      .then((rows) => {
        if (cancelled) return;
        const byState: Record<string, JweysimPhrase[]> = {};
        for (const p of rows.filter((x) => x.is_visible)) {
          (byState[p.state] ??= []).push(p);
        }
        setPhrases(byState);
        setPhrasesError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setPhrasesError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="jw-overlay" dir="rtl" aria-label="جويسم الأمريكي — الطبقة التفاعلية">
      {/* ستيكر العبارة فوق راس جويسم — Caveat للإنكليزي، يختفي بعد 2 ثانية */}
      {sticker ? (
        <div key={sticker.en ?? sticker.ar} className="jw-sticker" dir="auto">
          <span className="jw-sticker-ar font-arabic">{sticker.ar}</span>
          {sticker.en ? (
            <span className="jw-sticker-en" style={stickerCssProps}>
              {sticker.en}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* M3 — فقاعة تلميح بجنب الپين المفتوح (التعلم مربوط بالمكان).
          تعرض نفس تلميح جويسم لكن بموقع الپين على الخريطة — المستخدم
          يشوف التلميح من نفس المكان اللي يتعلم منه. */}
      {hintBubble ? (
        <div
          className="jw-hint-bubble pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full"
          style={{ left: `${hintBubble.x}%`, top: `${hintBubble.y - 8}%` }}
          dir="rtl"
        >
          <span className="jw-hint-arrow" aria-hidden />
          {SPOT_UUID_TO_HINT[hintBubble.spotId]?.ar}
          {SPOT_UUID_TO_HINT[hintBubble.spotId]?.en_sticker ? (
            <span className="jw-hint-en" style={stickerCssProps}>
              {SPOT_UUID_TO_HINT[hintBubble.spotId]?.en_sticker}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* جويسم نفسه — يظهر منذ أول فتح الخريطة ويتنقل بين الزوايا */}
      <div
        className={`jw-mascot-wrap jw-corner ${jumpSide}${flip ? " jw-flip" : ""}`}
        onPointerDown={handlePointerDown}
      >
        <JweysimMascot state={mascotState} size={size} flip={flip} />
      </div>

      {/* القصاصات — أزرار حقيقية قابلة للنقر (pointer-events auto) فوق الخريطة،
          موضوعة جنب مواقع الپينز (PIN_POS) بدل القيم القديمة اللي كانت ترصّ فوقها */}
      <div className="jw-scraps" aria-label="قصاصات جويسم">
        {scraps.map((scrap) => {
          const pos =
            scrap.location_type === "free"
              ? { x: scrap.pos_x, y: scrap.pos_y }
              : spotPos(scrap.spot_id);
          return (
            <button
              type="button"
              key={scrap.id}
              className={`jw-scrap${activeScrap === scrap.id ? " jw-scrap-open" : ""}`}
              style={{
                left: `${Math.max(3, Math.min(70, pos.x + SCRAP_OFFSET_X))}%`,
                top: `${Math.max(5, Math.min(66, pos.y + SCRAP_OFFSET_Y))}%`,
              }}
              aria-label={scrap.title}
              title={scrap.title}
              onPointerDown={(event) => {
                event.stopPropagation();
                stopIdleChain();
                poke("tap", scrap.id);
                setActiveScrap(activeScrap === scrap.id ? null : scrap.id); // ضغطة تفتح، ثانية تنسد
                setState("click");
                setMascotState("click");
                sayPhrase("click");
              }}
            >
              <span className="jw-scrap-title font-arabic">{scrap.title}</span>
              {activeScrap === scrap.id ? (
                <span className="jw-scrap-text font-arabic">{scrap.text}</span>
              ) : null}
            </button>
          );
        })}
        {scrapsError && (
          <span className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 rounded border border-red-300/40 bg-red-100/80 px-2 py-0.5 text-[10px] text-red-800">
            قصاصات: {scrapsError}
          </span>
        )}
        {phrasesError && (
          <span className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded border border-amber-300/40 bg-amber-100/80 px-2 py-0.5 text-[10px] text-amber-900">
            عبارات: {phrasesError}
          </span>
        )}
      </div>
    </div>
  );
}
