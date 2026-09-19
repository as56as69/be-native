import { useCallback, useEffect, useState } from "react";

import type { User } from "@be-native/shared";

import { api } from "../lib/api";
import { Badge, Btn, Empty, NumberInput, Panel } from "./AdminUI";

const TIER_LABEL: Record<string, string> = {
  free: "عادي",
  standard: "معياري",
  professional: "محتري",
};

export function UserTracker() {
  const [users, setUsers] = useState<User[]>([]);
  const [openSpots, setOpenSpots] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [adjusting, setAdjusting] = useState<{ id: string; amount: string } | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await api.adminUsers.list();
      setUsers(res.users);
      setOpenSpots(res.open_spots_global);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const adjust = async (id: string) => {
    if (!adjusting || adjusting.id !== id) return;
    const amount = Math.round(Number(adjusting.amount));
    if (!Number.isFinite(amount) || amount === 0) {
      setError("المبلغ يجب أن يكون رقماً صحيحاً غير صفري");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.adminUsers.adjustCredits(id, amount);
      setAdjusting(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel
      title="المستخدمون والرصيد"
      aside={<Badge tone="ok">{openSpots} نقاط مفتوحة (عام)</Badge>}
    >
      {error && <p className="mb-3 rounded border border-red-400/50 bg-red-900/30 px-3 py-2 text-sm text-red-200">{error}</p>}
      <div className="flex flex-wrap items-center gap-3 pb-3 text-sm text-slatew-300">
        <span>إجمالي المستخدمين: <b className="text-slatew-100">{users.length}</b></span>
        <Btn tone="ghost" onClick={load} disabled={busy}>تحديث</Btn>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slatew-700 font-display text-base text-slatew-300">
              <th className="py-1.5 pe-3 text-start">المستخدِم</th>
              <th className="py-1.5 pe-3 text-start">الرتبة</th>
              <th className="py-1.5 pe-3 text-start">الرصيد</th>
              <th className="py-1.5 pe-3 text-start">تاريخ الإنشاء</th>
              <th className="py-1.5 text-start">ضبط الرصيد</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr><td colSpan={5}><Empty label="ماكو مستخدمين" /></td></tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slatew-800/70">
                <td className="py-2 pe-3">
                  <span className="font-mono text-xs text-slatew-200">{u.phone ?? u.id.slice(0, 12)}…</span>
                </td>
                <td className="py-2 pe-3"><Badge tone="ok">{TIER_LABEL[u.current_tier] ?? u.current_tier}</Badge></td>
                <td className="py-2 pe-3">
                  <b className={u.credits_balance === 0 ? "text-red-300" : "text-kraft-200"}>{u.credits_balance}</b>
                </td>
                <td className="py-2 pe-3 text-xs text-slatew-400">{new Date(u.created_at).toLocaleDateString("ar-EG")}</td>
                <td className="py-2">
                  {adjusting?.id === u.id ? (
                    <div className="flex items-center gap-1.5">
                      <NumberInput
                        value={Number(adjusting.amount)}
                        onChange={(n) => setAdjusting({ id: u.id, amount: String(n) })}
                        className="!w-24"
                      />
                      <Btn tone="primary" onClick={() => adjust(u.id)} disabled={busy} title="تطبيق">
                        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10.5l4 4 8-9" /></svg>
                      </Btn>
                      <Btn tone="ghost" onClick={() => setAdjusting(null)} title="إلغاء">
                        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5.5 5.5l9 9M14.5 5.5l-9 9" /></svg>
                      </Btn>
                    </div>
                  ) : (
                    <Btn tone="ghost" onClick={() => setAdjusting({ id: u.id, amount: "0" })}>
                      ± تعديل
                    </Btn>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slatew-500">القيمة الموجبة مكافأة، السالبة حسم (لا تنزل تحت الصفر).</p>
    </Panel>
  );
}