/**
 * JweysimMascot.tsx — جويسم الأمريكي — النسخة v3 (إعادة بناء كاملة).
 *
 * تصميم كرتوني واضح يُقرأ حتى بحجم 104px على الخريطة:
 *  – راس كبير بلون بشرة معبأ (fill) + خط حبر سميك 2.6
 *  – كاپ أسود كامل (قبة + حافة) عليه «B.S» بخط أحمر واضح
 *  – نظارة دائرية كبيرة بإطار أسود سميك 3px + لمعة زجاج
 *  – حواجب واضحة (مؤشر المشاعر) تتبدل مع كل حالة
 *  – جسم ممتلئ: تيشيرت كريمي بكانتون كحلي ونجوم وخطوط حمر (علم أمريكا)
 *  – شارة </> صفرا على الصدر
 *  – جينز أزرق واضح + حزام + سنيكرز بيضا كبيرة
 *  – گدح چاي باستكان واضح + بخار متحرك
 *
 * المبدأ: أشكال مصمتة (fills) + خطوط عريضة — لا خطوط رفيعة فقط.
 * نفس تقنية الخط المزدوج (شبح + حاد). بلا مكتبات خارجية.
 */

export type JweysimMascotState =
  | "idle"
  | "bored"
  | "sleeping"
  | "wake"
  | "loading"
  | "error"
  | "victory"
  | "click"
  | "walk"
  | "jump"
  | "land";

export interface JweysimMascotProps {
  state?: JweysimMascotState;
  size?: number;
  flip?: boolean;
  label?: string;
}

/* لوحة ألوان ثابتة واضحة — الماسكوت ظاهر بأي مقياس ولا يعتمد كلياً
   على CSS vars (التي قد تتغير بالثيم وتطمس التفاصيل). */
const C = {
  ink: "#4a3628",
  inkDeep: "#2e201b",
  skin: "#f2c79b",
  capBrim: "#1f1612",
  highlight: "#ffe066",
  shirt: "#fbf3e4",
  stripe: "#d6453d",
  jeans: "#4f6fa8",
  jeansDark: "#3d5a8c",
  belt: "#2e201b",
  sneaker: "#fdfcf8",
  sole: "#e6d3ae",
  tea: "#c98f4e",
  steam: "#d9b98a",
  cheek: "#f2a9b8",
  white: "#ffffff",
} as const;

/* ═══════════════════════════ الحواجب ═══════════════════════════ */

function Brows({ state }: { state: JweysimMascotState }) {
  if (state === "victory") {
    return (
      <g className="jw-brows" stroke={C.inkDeep} strokeWidth="2.2" strokeLinecap="round" fill="none">
        <path d="M41 28.8q3.4-2 6.8-0.7" />
        <path d="M52.2 28.1q3.4-2 6.8-0.7" />
      </g>
    );
  }
  if (state === "jump" || state === "land") {
    // حواجب مرفوعة عالياً (تركيز/قفزة) — تعبير مبالغ فيه مقروء بحجم صغير
    return (
      <g className="jw-brows" stroke={C.inkDeep} strokeWidth="2.2" strokeLinecap="round" fill="none">
        <path d="M40.5 26.5q4-2.8 7.6-1.4" />
        <path d="M59.5 26.5q-4-2.8-7.6-1.4" />
      </g>
    );
  }
  if (state === "error" || state === "click") {
    return (
      <g className="jw-brows" stroke={C.inkDeep} strokeWidth="2.2" strokeLinecap="round" fill="none">
        <path d="M40.5 29.5q4-1.4 7.2-0.4" />
        <path d="M59.5 29.5q-4-1.4-7.2-0.4" />
      </g>
    );
  }
  if (state === "bored") {
    return (
      <g className="jw-brows" stroke={C.inkDeep} strokeWidth="2.2" strokeLinecap="round" fill="none">
        <path d="M40.5 30q4-1.6 7.2-0.3" />
        <path d="M59.5 30q-4-1.6-7.2-0.3" />
      </g>
    );
  }
  if (state === "sleeping") {
    return (
      <g className="jw-brows" stroke={C.inkDeep} strokeWidth="2.2" strokeLinecap="round" fill="none">
        <path d="M41 29q3.8-1.6 7-0.4" />
        <path d="M52 28.6q3.8-1.6 7-0.4" />
      </g>
    );
  }
  return (
    <g className="jw-brows" stroke={C.inkDeep} strokeWidth="2.2" strokeLinecap="round" fill="none">
      <path d="M41 29q3.7-1.4 7-0.3" />
      <path d="M52 28.7q3.7-1.4 7-0.3" />
    </g>
  );
}

/* ═══════════════════════════ العيون ═══════════════════════════ */

function Eyes({ state, sleeping }: { state: JweysimMascotState; sleeping: boolean }) {
  if (sleeping) {
    return (
      <g className="jw-eyes-sleep" stroke={C.inkDeep} strokeWidth="2" strokeLinecap="round">
        <path d="M41.3 35.4l5 4.9M46.3 35.4l-5 4.9" />
        <path d="M53.7 35.4l5 4.9M58.7 35.4l-5 4.9" />
      </g>
    );
  }
  if (state === "error" || state === "click") {
    return (
      <g className="jw-eyes-dizzy" stroke={C.inkDeep} strokeWidth="2">
        <circle cx="44" cy="35" r="2.3" />
        <circle cx="56" cy="35" r="2.3" />
      </g>
    );
  }
  if (state === "loading" || state === "walk" || state === "jump" || state === "land") {
    return (
      <g className="jw-eyes-busy" stroke={C.inkDeep} strokeWidth="2.1" strokeLinecap="round">
        <path d="M41.5 35h5M54.5 35h5" />
      </g>
    );
  }
  if (state === "wake") {
    return (
      <g className="jw-eyes-wake" stroke={C.inkDeep} strokeWidth="2">
        <circle cx="44" cy="34.2" r="3.1" />
        <circle cx="56" cy="34.2" r="3.1" />
      </g>
    );
  }
  return (
    <g className="jw-eyes">
      <circle cx="44" cy="35" r="2.7" fill={C.inkDeep} />
      <circle cx="56" cy="35" r="2.7" fill={C.inkDeep} />
      <circle cx="45.1" cy="33.7" r="1.05" fill={C.white} />
      <circle cx="57.1" cy="33.7" r="1.05" fill={C.white} />
    </g>
  );
}

/* ═══════════════════════════ الفم ═══════════════════════════ */

function Mouth({ state, sleeping }: { state: JweysimMascotState; sleeping: boolean }) {
  if (sleeping) {
    return (
      <path className="jw-mouth-sleep" d="M45 44.8q5 1.8 10-0.2" stroke={C.ink} strokeWidth="2" strokeLinecap="round" fill="none" />
    );
  }
  if (state === "victory") {
    return (
      <path className="jw-mouth-happy" d="M43.8 44q6.2 5.4 12.4 0" stroke={C.ink} strokeWidth="2.4" strokeLinecap="round" fill="none" />
    );
  }
  if (state === "bored") {
    return (
      <path className="jw-mouth-bored" d="M45.6 45q1.5-2 3 0t3 0t3 0" stroke={C.ink} strokeWidth="2" strokeLinecap="round" fill="none" />
    );
  }
  if (state === "error") {
    return (
      <path className="jw-mouth-oops" d="M46.4 45.4q1.7 2.2 3.4 0t3.4 0" stroke={C.ink} strokeWidth="2" strokeLinecap="round" fill="none" />
    );
  }
  if (state === "loading" || state === "walk" || state === "jump" || state === "land") {
    return (
      <path className="jw-mouth-busy" d="M47 45.6h6" stroke={C.ink} strokeWidth="2.2" strokeLinecap="round" />
    );
  }
  if (state === "wake") {
    return (
      <path className="jw-mouth-wake" d="M46.6 44.8q3.4 2.6 6.8 0" stroke={C.ink} strokeWidth="2" strokeLinecap="round" fill="none" />
    );
  }
  return (
    <path className="jw-mouth-idle" d="M45.6 44.9q4.4 3.1 8.8 0" stroke={C.ink} strokeWidth="2.2" strokeLinecap="round" fill="none" />
  );
}

/* ═══════════════════════════ الوجه ═══════════════════════════ */

function Face({ state }: { state: JweysimMascotState }) {
  const sleeping = state === "sleeping";
  return (
    <g className="jw-face">
      {/* الحواجب */}
      <Brows state={state} />

      {/* العيون */}
      <Eyes state={state} sleeping={sleeping} />

      {/* النظارة — دائري كبير بإطار سميك */}
      <g className="jw-glasses">
        <circle cx="44" cy="35" r="6.9" fill="rgba(255,255,255,0.15)" stroke={C.inkDeep} strokeWidth="3" />
        <circle cx="56" cy="35" r="6.9" fill="rgba(255,255,255,0.15)" stroke={C.inkDeep} strokeWidth="3" />
        {/* جسر النظارة */}
        <path d="M50.9 35l1.2 0" stroke={C.inkDeep} strokeWidth="2.8" strokeLinecap="round" />
        {/* ذراعا النظارة */}
        <path d="M37.1 33.9q-3.3-0.6-4.4 1.6" stroke={C.inkDeep} strokeWidth="2.6" strokeLinecap="round" fill="none" />
        <path d="M62.9 33.9q3.3-0.6 4.4 1.6" stroke={C.inkDeep} strokeWidth="2.6" strokeLinecap="round" fill="none" />
        {/* لمعة زجاج النظارة */}
        <path d="M39.8 31.3q1.6-1 2.9 0" stroke={C.white} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.85" />
        <path d="M51.8 31.3q1.6-1 2.9 0" stroke={C.white} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.85" />
      </g>

      {/* الأنف — نقطة صغيرة واضحة */}
      <circle cx="50" cy="39" r="1" fill={C.ink} />

      {/* الخدود الوردية */}
      <ellipse cx="37.6" cy="40.6" rx="3" ry="1.7" fill={C.cheek} opacity={state === "victory" ? 0.65 : 0.4} />
      <ellipse cx="62.4" cy="40.6" rx="3" ry="1.7" fill={C.cheek} opacity={state === "victory" ? 0.65 : 0.4} />

      {/* الفم */}
      <Mouth state={state} sleeping={sleeping} />
    </g>
  );
}

/* ═══════════════════════════ الكاپ ═══════════════════════════ */

function Cap() {
  return (
    <g className="jw-cap" transform="rotate(-5 50 25)">
      {/* القبة — تگعد على قمة الراس (فوق العيون تماماً) */}
      <path
        d="M40 26 Q50 12 60 26 L60 28.2 Q50 20.4 40 28.2 Z"
        fill={C.inkDeep}
        stroke={C.ink}
        strokeWidth="2.1"
        strokeLinejoin="round"
      />
      {/* لمعة خفيفة على القماش */}
      <path d="M43.4 26 Q50 16.5 56.6 26 L56.6 27.6 Q50 19.4 43.4 27.6 Z" fill="rgba(255,255,255,0.13)" />
      {/* درزة القبة */}
      <path d="M50 13.4 Q49.6 20.5 50 28" stroke={C.capBrim} strokeWidth="1" fill="none" opacity="0.55" />
      {/* الحافة (الواقي) — عريضة واضحة، تحت القبة مباشرة وما تغطي العيون */}
      <path
        d="M37.6 27 Q50 20.8 62.4 27 L63.6 30 Q50 23.8 36.4 30 Z"
        fill={C.capBrim}
        stroke={C.ink}
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      {/* خط خياطة على الحافة */}
      <path d="M37.8 28.2 Q50 22.3 62.2 28.2" stroke="rgba(255,255,255,0.35)" strokeWidth="0.9" fill="none" />
      {/* زر القبة */}
      <circle cx="50" cy="13.4" r="1.15" fill={C.stripe} stroke={C.ink} strokeWidth="0.6" />
    </g>
  );
}

/** نص «B.S» على واجهة الكاپ — حرفان كبار واضحان بخط عريض. */
function CapBS() {
  return (
    <text
      x="50"
      y="19.4"
      textAnchor="middle"
      transform="rotate(-5 50 25)"
      fontFamily="'Caveat','Tajawal',cursive"
      fontSize="9"
      fontWeight="800"
      letterSpacing="1.2"
      fill={C.stripe}
      className="jw-cap-bs"
    >
      {"B.S"}
    </text>
  );
}

function CodeBadge() {
  return (
    <g className="jw-badge" transform="translate(51.5 72)">
      <rect x="-6" y="-3.4" width="12" height="6.8" rx="3.4" fill={C.highlight} stroke={C.inkDeep} strokeWidth="0.9" />
      <path d="M-1.9-1.6 0.6 0.1 -1.9 1.8" stroke={C.inkDeep} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1.9-1.6-0.6 0.1 1.9 1.8" stroke={C.inkDeep} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

/* ═══════════════════════════ جسم جويسم ═══════════════════════════ */

function JweysimBodyLines({
  state,
}: {
  state: JweysimMascotState;
}) {
  const sleeping = state === "sleeping";
  const victory = state === "victory";
  const lifting = victory || state === "error" || state === "click";
  const headClass = sleeping ? "jw-head jw-head-sleep" : state === "wake" ? "jw-head jw-head-wake" : "jw-head";

  return (
    <g className="jw-lines">
      {/* ظل أرضي خفيف */}
      <ellipse cx="50" cy="96.6" rx="23" ry="2.5" fill={C.ink} opacity="0.1" />

      {/* ── الرقبة ── */}
      <rect x="46" y="49" width="8" height="5.5" rx="2.6" fill={C.skin} stroke={C.ink} strokeWidth="1.8" />

      {/* ── الجسم: تيشيرت ── */}
      <g className="jw-torso">
        <path
          d="M33 56Q50 51.5 67 56L72 66Q73 79 50 83Q27 79 28 66Z"
          fill={C.shirt}
          stroke={C.ink}
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {/* ياقة التيشيرت */}
        <path d="M44.5 55Q50 58.2 55.5 55" stroke={C.ink} strokeWidth="2.2" fill="none" strokeLinecap="round" />

        {/* الكانتون الكحلي (علم أمريكا) */}
        <rect x="30.5" y="59.5" width="11" height="8.5" rx="1.2" fill={C.inkDeep} stroke={C.inkDeep} strokeWidth="1" />
        <path d="M30.5 59.5L41.5 59.5 41.5 68 30.5 68Z" fill="none" stroke={C.ink} strokeWidth="0.6" />

        {/* خطوط حمرا */}
        <g stroke={C.stripe} strokeWidth="2" strokeLinecap="round">
          <path d="M44.2 60.8h20.5" />
          <path d="M43.2 63.6h21.5" />
          <path d="M44.2 66.4h20" />
          <path d="M43.5 69.2h20.8" />
        </g>

        {/* شارة المبرمج */}
        <CodeBadge />
      </g>

      {/* ── الجينز الأزرق ── */}
      <g className="jw-jeans">
        {/* الرجل اليسار */}
        <path d="M34 79.5L30.8 95.5L43 95.5L46.5 80.5Z" fill={C.jeans} stroke={C.ink} strokeWidth="2" strokeLinejoin="round" />
        {/* الرجل اليمين */}
        <path d="M66 79.5L69.2 95.5L57 95.5L53.5 80.5Z" fill={C.jeansDark} stroke={C.ink} strokeWidth="2" strokeLinejoin="round" />
        {/* الحزام */}
        <path d="M33 79.5Q50 77.3 67 79.5" stroke={C.belt} strokeWidth="2.8" fill="none" strokeLinecap="round" />
        {/* الإبزيم */}
        <rect x="47.2" y="77.8" width="5.6" height="3.8" rx="0.9" fill="none" stroke={C.ink} strokeWidth="1.2" />
        {/* درز الجيب الخلفي (يسار) */}
        <path d="M37.5 85.5q0.5 1.6 3 1.7" stroke={C.jeansDark} strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.6" />
      </g>

      {/* ── السنيكرز البيضا ── */}
      <g className="jw-sneakers">
        <g className="jw-sneaker-l">
          <path d="M29 94.4Q31.5 88.4 42 88.4T54 94.4L53.2 97.2Q41.5 98.4 29.4 97Z" fill={C.sneaker} stroke={C.ink} strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M29.3 95.8Q42 97.6 53.4 95.6L53 98.2Q41.4 99.8 29.8 98Z" fill={C.sole} stroke={C.ink} strokeWidth="1.5" strokeLinejoin="round" />
          <g stroke={C.ink} strokeWidth="1.1" strokeLinecap="round">
            <path d="M34 89.6l1.9 2M39 89.5l1.9 2M44 89.5l1.9 2" />
          </g>
        </g>
        <g className="jw-sneaker-r">
          <path d="M46 94.4Q48.5 88.4 59 88.4T71 94.4L70.2 97.2Q58.5 98.4 46.4 97Z" fill={C.sneaker} stroke={C.ink} strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M46.3 95.8Q59 97.6 70.4 95.6L70 98.2Q58.4 99.8 46.8 98Z" fill={C.sole} stroke={C.ink} strokeWidth="1.5" strokeLinejoin="round" />
          <g stroke={C.ink} strokeWidth="1.1" strokeLinecap="round">
            <path d="M51 89.6l1.9 2M56 89.5l1.9 2M61 89.5l1.9 2" />
          </g>
        </g>
      </g>

      {/* ── الأذرع ── */}
      <g className="jw-arms">
        {/* الذراع الأيسر — مرتاح على الجنب */}
        <path className="jw-arm-l" d="M33 57Q22.5 63.5 23 72" stroke={C.ink} strokeWidth="2.8" strokeLinecap="round" fill="none" />
        <circle className="jw-hand-l" cx="23.4" cy="74" r="2.9" fill={C.skin} stroke={C.ink} strokeWidth="1.4" />

        {/* الذراع الأيمن — يرفع الگدح (يرتفع عند النصر/الخطأ/الفخ) */}
        <g className={lifting ? "jw-arm-r jw-arm-lift" : "jw-arm-r"}>
          <path d="M67 57Q77.5 63.5 77.5 71" stroke={C.ink} strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <circle className="jw-hand-r" cx="77.6" cy="73.4" r="2.9" fill={C.skin} stroke={C.ink} strokeWidth="1.4" />

          {/* گدح الچاي — استكان واضح */}
          <g className="jw-tea" transform={lifting ? "translate(0 -4.5)" : "translate(0 0)"}>
            {/* جسم الگدح */}
            <path d="M73 51.5L83.5 51.5 81.5 63 74.5 63Z" fill={C.tea} stroke={C.ink} strokeWidth="1.8" strokeLinejoin="round" />
            {/* لمعة الزجاج */}
            <path d="M74.6 53L82 53 80.6 61 76 61Z" fill={C.white} opacity="0.28" />
            {/* المقبض */}
            <path d="M83.8 53.5Q87 52.8 87.2 56.4Q87.4 60 84 61" stroke={C.ink} strokeWidth="1.4" fill="none" strokeLinecap="round" />
            {/* حافة الفوهة */}
            <path d="M72.6 51.5Q78.3 53.4 83.9 51.5" stroke={C.ink} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {/* البخار */}
            <g className="jw-steam" stroke={C.steam} strokeWidth="1.6" strokeLinecap="round" fill="none">
              <path className="jw-steam-1" d="M75.4 48q1.3-1.8 0-3.6" />
              <path className="jw-steam-2" d="M78.6 48q1.3-1.8 0-3.6" />
              <path className="jw-steam-3" d="M81.8 48q1.3-1.8 0-3.6" />
            </g>
          </g>
        </g>
      </g>

      {/* ── إكسسوار الحالة: عباءة النصر (تظهر بجانب الجسم، بدون كسر draw) ── */}
      {victory ? (
        <g className="jw-cape" transform="translate(50 72)" opacity="0.95">
          <path d="M-9 18Q-26 2-16-11M9 18Q26 2 16-11" stroke={C.stripe} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M-8.6 17.6Q-24.4 2.4-15.2-9.6" stroke={C.ink} strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      ) : null}

      {/* ── شارة المبرمج </> على الكتف/الذراع — تظهر بكل الحالات ── */}
      <g className="jw-code-badge" transform="translate(26.5 60.5)">
        <rect x="-4.6" y="-3" width="9.2" height="6" rx="2.6" fill={C.highlight} stroke={C.inkDeep} strokeWidth="0.8" />
        <path d="M-1.6-1.3L0.8 0.4 -1.6 2.1" stroke={C.inkDeep} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M1.6-1.3L-0.8 0.4 1.6 2.1" stroke={C.inkDeep} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* ── الراس + الوجه + الكاپ ── */}
      <g className={headClass}>
        {/* خصل شعر طايشة تحت الكاپ */}
        <path d="M42 21.5Q36 19.5 35.5 25" stroke={C.ink} strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M58 21.5Q64 19.5 64.5 25" stroke={C.ink} strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* الوجه — دائرة بلون بشرة معبأ وخط سميك */}
        <circle cx="50" cy="37" r="17.4" fill={C.skin} stroke={C.ink} strokeWidth="2.6" />

        {/* ملامح الوجه */}
        <Face state={state} />

        {/* الكاپ فوق الراس */}
        <Cap />
        {/* حروف B.S على الكاپ — واضحة */}
        <CapBS />
      </g>

      {/* الشخير أثناء النوم */}
      {sleeping ? (
        <g className="jw-snore" fill={C.inkDeep} stroke={C.inkDeep} strokeWidth="0.6" strokeLinecap="round">
          <path className="jw-snore-z" d="M62 22l2.6 1 2.6-9.5-2.6 4.7-2.6 2.4z" />
          <path className="jw-snore-z jw-snore-z2" d="M66.4 17.6l2.2 2.2 2.2-7.6" />
        </g>
      ) : null}
    </g>
  );
}

/**
 * جويسم الأمريكي v3 — الماسكوت الكامل.
 * مثال:
 *   <JweysimMascot state="idle" size={104} />
 */
export default function JweysimMascot({
  state = "idle",
  size = 104,
  flip = false,
  label = "جويسم الأمريكي",
}: JweysimMascotProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className={`jw-mascot jw-state-${state}${flip ? " jw-flip" : ""}`}
    >
      {/* شبح الخط المزدوج */}
      <g transform="translate(1.1 1.5)" opacity="0.12">
        <JweysimBodyLines state={state} />
      </g>
      <JweysimBodyLines state={state} />
    </svg>
  );
}
