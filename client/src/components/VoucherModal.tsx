import { useState } from "react";

import { useGame } from "../state/GameContext";
import { UI_GENZ_COPY } from "../data/seedData";
import { StatusChip } from "./StatusChip";

export function VoucherModal() {
  const { user, redeemVoucher, closeVoucher } = useGame();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ tone: "ok" | "bad" | "warn"; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setStatus(null);
    try {
      const balance = await redeemVoucher(code.trim().toUpperCase());
      setStatus({
        tone: "ok",
        text: `تم الشحن بنجاح — رصيدك الجديد ${balance} طاقة ✨`,
      });
      setCode("");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const tone =
        message.includes("VOUCHER_INVALID") ? "warn" : "bad";
      setStatus({
        tone,
        text:
          message.includes("VOUCHER_INVALID")
            ? "هالكوبون مستخدم سابقاً أو ما موجود — جرّب BN-LAUNCH-2026"
            : message,
      });
    } finally {
      setBusy(false);
    }
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
          <h2 className="font-display text-3xl leading-none tracking-tight text-ink-700">
            <span dir="ltr" className="inline-block">
              {UI_GENZ_COPY.recharge}
            </span>
          </h2>
          <button
            type="button"
            onClick={closeVoucher}
            className="grid size-8 rotate-2 place-items-center rounded-full border-2 border-ink-700 bg-kraft-50 text-sm font-bold hover:bg-kraft-200"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        <p className="mt-2 text-sm text-ink-500">
          اكتب كود من الودادية… مثلاً <b className="text-wasabi-600">BN-LAUNCH-2026</b> يضيف 50 طاقة لرصيدك.
        </p>

        <form onSubmit={submit} className="mt-4 grid gap-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="BN-LAUNCH-2026"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className="w-full rounded-md border-2 border-dashed border-kraft-600 bg-kraft-50 px-3 py-2.5 font-mono text-lg uppercase tracking-widest text-ink-900 outline-none focus:border-wasabi-600"
            aria-label="كود الكوبون"
          />
          <button type="submit" disabled={busy || !code.trim()} className="btn-doodle disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? "جارٍ الشحن…" : "فكّ الكوبون ✂"}
          </button>
        </form>

        {status && <StatusChip tone={status.tone}>{status.text}</StatusChip>}

        <p className="mt-4 text-center text-xs text-ink-500">
          رصيدك الحالي: <b className="text-wasabi-600">{user?.credits_balance ?? "…"}</b> طاقة
        </p>
      </div>
    </div>
  );
}