/**
 * "الفايب فولت" — قيد التطوير حالياً للمستخدم.
 * محرك التوليد شغال فقط من لوحة التحكم للأدمن، والمستخدم يشوف شاشة "قيد التطوير حالياً 🔧".
 */

export function VibeMapperEngine(_props: unknown) {
  return (
    <div className="rounded-xl border-2 border-dashed border-amber-900/30 bg-[#FBF3DC] p-8 text-center shadow-[3px_5px_0_rgb(0_0_0/0.12)]">
      {/* tape — the engine is a stuck-on interactive tool */}
      <span className="tape absolute -top-3 left-1/2 -translate-x-1/2" aria-hidden />

      <h3 className="font-display mb-2 text-xl font-bold leading-none text-amber-950">
        الفايب فولت
      </h3>
      <p className="font-arabic text-base font-bold text-amber-900/80">
        الثقافة البغدادية بروحيه أمريكية 🇮🇶🇺🇸
      </p>
      <p className="font-arabic mt-2 text-xs text-amber-900/50">
        راح يصير متاح قريباً — نعتذر عن الإزعاج.
      </p>
    </div>
  );
}
