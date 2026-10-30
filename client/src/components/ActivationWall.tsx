import { useState } from "react";

import { useGame } from "../state/GameContext";

/**
 * جدار التفعيل — يظهر لما تنتهي التجربة المجانية (3 أيام) أو ينتهي الحساب
 * الدائمي (شهرين) ولا يوجد تفعيل ساري.
 *
 * الطبقة 3 من المنتج النهائي: المجاني "تجربة محسوبة مو صدقة" — لما تخلص،
 * يا يفعّل كود معهده، يا يشتري رصيد (كوبون)، يا يودع.
 */
export function ActivationWall({ onRecharge, onClose }: { onRecharge: () => void; onClose: () => void }) {
  const { entitlement, redeemActivation, refreshUser, refreshEntitlement, buyTrialPack } = useGame();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ tone: "ok" | "bad" | "warn"; text: string } | null>(null);
  const [packBusy, setPackBusy] = useState(false);
  const [packStatus, setPackStatus] = useState<{ tone: "ok" | "bad" | "warn"; text: string } | null>(null);
  const packEnergy = 15;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setStatus(null);
    try {
      const result = await redeemActivation(code.trim().toUpperCase());
      await refreshUser();
      await refreshEntitlement();
      setStatus({
        tone: "ok",
        text: `تم تفعيل حسابك ${result.tier === "professional" ? "VIP" : "المعياري"} — صالح حتى ${new Date(result.expires_at).toLocaleDateString("ar-IQ")} 🎉`,
      });
      setCode("");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setStatus({
        tone: message.includes("INVALID") ? "warn" : "bad",
        text:
          message.includes("ACTIVATION_INVALID")
            ? "هالكود مستخدم سابقاً أو ما موجود — تواصل مع معهدك"
            : message,
      });
    } finally {
      setBusy(false);
    }
  };

  const trialNote =
    entitlement?.status === "trial_expired"
      ? "انتهت تجربتك المجانية (3 أيام)."
      : entitlement?.status === "tier_expired"
        ? `انتهت مدة حسابك الدائمي (شهرين).`
        : "حسابك مو فعّال حالياً.";

  const onBuyTrialPack = async () => {
    if (packBusy) return;
    setPackBusy(true);
    setPackStatus(null);
    try {
      const result = await buyTrialPack();
      setPackStatus({
        tone: "ok",
        text: `مبارك! رزمة التجربة انفكّت — ${result.added_energy} طاقة، صالحة حتى ${new Date(result.trial_ends_at).toLocaleDateString("ar-IQ")} 🎉`,
      });
      setStatus(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setPackStatus({
        tone: message.includes("ALREADY_USED") ? "warn" : "bad",
        text:
          message.includes("ALREADY_USED")
            ? "هاي الرزمة انشرتها قبل — مرة واحدة فقط للفضولي."
            : message.includes("NOT_FREE")
              ? "حسابك أصلاً مدفوع — ما تحتاج رزمة."
              : message,
      });
    } finally {
      setPackBusy(false);
    }
  };

  return (
    <div
      className="animate-modal-in fixed inset-0 z-[60] flex items-center justify-center bg-ink-900/40 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="فعّل حسابك"
    >
      <div className="animate-card-in notebook-card paper-edge w-full max-w-md -rotate-1 px-5 py-6">
        <span className="tape -top-3 left-1/2 -translate-x-1/2" />

        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display flex items-center gap-2 text-3xl leading-none tracking-tight text-ink-700">
            <svg viewBox="0 0 24 24" className="size-7 rotate-[-4deg] opacity-80" fill="none" stroke="var(--color-wasabi-600)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="5" y="10" width="14" height="10" rx="1" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              <circle cx="12" cy="14.5" r="1.6" />
              <path d="M11.4 15.6l.6 1.4h.8l.6-1.4" />
            </svg>
            التجربة انتهت
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 rotate-3 place-items-center rounded-full border-2 border-ink-700 bg-kraft-50 text-sm font-bold hover:bg-kraft-200"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        <p className="mt-3 text-base leading-relaxed text-ink-700">{trialNote}</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-500">
          بغداد مو صدقة — يا تتفعّل بكود معهدك، يا تشحن بكوبون، يا تودع. اختر طريقك:
        </p>

        {/* Phase 6 — السلاح السري: رزمة تجربة للمجاني مرة وحدة */}
        {!entitlement?.collection_blocked && entitlement?.trial_used === false && (
          <div className="mt-4 rounded-md border-2 border-dashed border-wasabi-600/50 bg-wasabi-50/60 p-3">
            <p className="text-sm font-semibold text-wasabi-800">
              🔥 رزمة التجربة الذهبية — مرة وحدة فقط
            </p>
            <p className="mt-1 text-xs leading-relaxed text-wasabi-700">
              فضولي بغداد؟ خذ رزمة صغيرة: تجربة جديدة 3 أيام + {packEnergy} طاقة.
              خصيصاً لأول مرة، والحساب الذهبي بيدك.
            </p>
            <button
              type="button"
              onClick={onBuyTrialPack}
              disabled={packBusy}
              className="btn-doodle mt-2 w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {packBusy ? "جارٍ الشراء…" : "اشتري الرزمة 🔥"}
            </button>
            {packStatus && (
              <p className={`mt-2 text-center text-xs ${packStatus.tone === "ok" ? "text-wasabi-700" : "text-red-700"}`}>
                {packStatus.text}
              </p>
            )}
          </div>
        )}

        <form onSubmit={submit} className="mt-4 grid gap-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="ACT-XXXXXXXXXX"
            className="sketch-input w-full rounded-md bg-kraft-50 px-3 py-3 font-mono text-lg uppercase tracking-widest text-ink-900 outline-none focus:shadow-[0_0_0_3px_var(--color-highlighter)]"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            aria-label="كود التفعيل من معهدك"
          />
          <button type="submit" disabled={busy || !code.trim()} className="btn-doodle disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? "جارٍ التفعيل…" : "فعّل حسابك 🗝"}
          </button>
        </form>

        {status && status.tone === "ok" && (
          <p className="mt-3 rounded-md border border-wasabi-600/40 bg-wasabi-50 p-3 text-center text-sm text-wasabi-800">
            {status.text}
          </p>
        )}
        {status && status.tone !== "ok" && (
          <p className={`mt-3 rounded-md border p-3 text-center text-sm ${status.tone === "warn" ? "border-amber-600/40 bg-amber-50 text-amber-800" : "border-red-700/40 bg-red-50 text-red-800"}`}>
            {status.text}
          </p>
        )}

        <div className="mt-4 flex flex-col gap-2">
          <button type="button" onClick={onRecharge} className="btn-doodle flex w-full items-center justify-center gap-2 text-sm">
            <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 6h14v8H3z" />
              <path d="M12.5 8.5v3" />
            </svg>
            شحن بكوبون رصيد
          </button>
        </div>
      </div>
    </div>
  );
}
