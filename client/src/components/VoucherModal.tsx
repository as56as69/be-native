import { useState } from "react";

import { useGame } from "../state/GameContext";
import { UI_GENZ_COPY } from "../data/seedData";
import { StatusChip } from "./StatusChip";

export function VoucherModal() {
  const { user, redeemVoucher, redeemActivation, closeVoucher } = useGame();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ tone: "ok" | "bad" | "warn"; text: string } | null>(null);
  const [mode, setMode] = useState<"voucher" | "activation">("voucher");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setStatus(null);
    try {
      const upper = code.trim().toUpperCase();
      if (mode === "activation") {
        const result = await redeemActivation(upper);
        await refreshUserAfterActivation();
        setStatus({
          tone: "ok",
          text: `تم تفعيل حسابك ${result.tier === "professional" ? "VIP" : "المعياري"} — صالح حتى ${new Date(result.expires_at).toLocaleDateString("ar-IQ")} 🎉`,
        });
      } else {
        const balance = await redeemVoucher(upper);
        setStatus({
          tone: "ok",
          text: `تم الشحن بنجاح — رصيدك الجديد ${balance} طاقة ✨`,
        });
      }
      setCode("");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const tone = message.includes("INVALID") ? "warn" : "bad";
      setStatus({
        tone,
        text:
          message.includes("ACTIVATION_INVALID")
            ? "هالكود مستخدم سابقاً أو ما موجود — تواصل مع معهدك"
            : message.includes("VOUCHER_INVALID")
              ? "هالكوبون مستخدم سابقاً أو ما موجود — جرّب BN-LAUNCH-2026"
              : message,
      });
    } finally {
      setBusy(false);
    }
  };

  const refreshUserAfterActivation = async () => {
    // GameContext refreshUser reads localStorage — call it through the hook
    await new Promise((r) => setTimeout(r, 50));
    // The user profile updates after tier change; we rely on the next refresh
  };

  return (
    <div
      className="animate-modal-in fixed inset-0 z-50 flex items-center justify-center bg-ink-900/30 p-4 backdrop-blur-[1px]"
      onClick={(e) => { if (e.target === e.currentTarget) closeVoucher(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Aura Recharge: شحن الطاقات بكوبون"
    >
      <div className="animate-card-in notebook-card paper-edge w-full max-w-sm -rotate-1 px-5 py-6">
        <span className="tape -top-3 left-1/2 -translate-x-1/2" />
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display flex items-center gap-2 text-3xl leading-none tracking-tight text-ink-700">
            {/* hand-drawn battery doodle — scrapbook kick */}
            <svg viewBox="0 0 24 24" className="size-7 rotate-[-4deg] opacity-80" fill="none" stroke="var(--color-wasabi-600)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 9h11.5a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5H5l-1.2-3z" />
              <path d="M3.4 10.3c1.2.4 4.2 4.2.2M17 11h1.6v2H17" />
            </svg>
            <span dir="ltr" className="inline-block">
              {UI_GENZ_COPY.recharge}
            </span>
          </h2>
          <button
            type="button"
            onClick={closeVoucher}
            className="group grid size-8 rotate-3 place-items-center rounded-full border-2 border-ink-700 bg-kraft-50 text-sm font-bold hover:bg-kraft-200"
            aria-label="إغلاق"
          >
            <span className="relative block h-3 w-3">
              <span className="absolute inset-0 rotate-12 border-t-2 border-ink-700 transition-transform group-hover:rotate-45" />
              <span className="absolute inset-0 -rotate-12 border-t-2 border-ink-700 transition-transform group-hover:-rotate-45" />
            </span>
          </button>
        </div>

        <p className="mt-3 text-base leading-relaxed text-ink-700">
          الزگة للرمز هنا حتى تصير <b className="text-wasabi-600">نيتف من صدك</b> 🔥
        </p>
        <p className="mt-1 text-sm text-ink-500">
          كود التفعيل للحساب — الكوبون لزيادة طاقة الرصيد.
        </p>

        {/* mode switch: activation code vs credit voucher */}
        <div className="mt-4 flex rounded-full border-2 border-ink-700/20 bg-kraft-100 p-1">
          <button
            type="button"
            onClick={() => setMode("activation")}
            className={`flex-1 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
              mode === "activation" ? "bg-ink-700 text-kraft-50" : "text-ink-500 hover:text-ink-700"
            }`}
          >
            كود تفعيل (معهد)
          </button>
          <button
            type="button"
            onClick={() => setMode("voucher")}
            className={`flex-1 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
              mode === "voucher" ? "bg-ink-700 text-kraft-50" : "text-ink-500 hover:text-ink-700"
            }`}
          >
            كوبون رصيد
          </button>
        </div>

        <form onSubmit={submit} className="mt-4 grid gap-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={mode === "activation" ? "ACT-XXXXXXXXXX" : "BN-LAUNCH-2026"}
            className="sketch-input w-full rounded-md bg-kraft-50 px-3 py-3 font-mono text-lg uppercase tracking-widest text-ink-900 outline-none focus:shadow-[0_0_0_3px_var(--color-highlighter)]"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            aria-label="كود التفعيل أو الكوبون"
          />
          <button type="submit" disabled={busy || !code.trim()} className="btn-doodle disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? "جارٍ الإرسال…" : mode === "activation" ? "فعّل حسابك 🗝" : "فكّ الكوبون ✂"}
          </button>
        </form>

        {status && status.tone === "ok" && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <StatusChip tone="ok">{status.text}</StatusChip>
            <span className="done-sticker animate-card-in inline-flex -rotate-3 items-center gap-1 rounded-full border-2 border-ink-700 bg-[#FFFDF7] px-2 py-1 font-display text-sm text-ink-700 shadow-sm">
              Done! ✅
            </span>
          </div>
        )}
        {status && status.tone !== "ok" && <StatusChip tone={status.tone}>{status.text}</StatusChip>}

        <p className="mt-4 text-center text-xs text-ink-500">
          رصيدك الحالي: <b className="text-wasabi-600">{user?.credits_balance ?? "…"}</b> طاقة
        </p>
      </div>
    </div>
  );
}