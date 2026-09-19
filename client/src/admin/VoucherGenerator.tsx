import { useCallback, useEffect, useState } from "react";

import type { Voucher } from "@be-native/shared";

import { api } from "../lib/api";
import { Badge, Btn, Empty, Field, NumberInput, Panel, TextInput } from "./AdminUI";

type StatusFilter = "all" | "active" | "redeemed";

export function VoucherGenerator() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [count, setCount] = useState(10);
  const [credit, setCredit] = useState(100);
  const [prefix, setPrefix] = useState("BN-");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [created, setCreated] = useState<Array<{ code: string; credit_amount: number }>>([]);

  const load = useCallback(async () => {
    try {
      setError(null);
      setVouchers(await api.adminVouchers.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const generate = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    setCreated([]);
    try {
      const rows = await api.adminVouchers.batch(count, credit, prefix);
      setCreated(rows);
      setNotice(`تم توليد ${rows.length} كوبون ✓`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const visible = vouchers.filter((v) =>
    filter === "all" ? true : filter === "redeemed" ? v.is_redeemed : !v.is_redeemed
  );

  const toCSV = () =>
    ["code,credit_amount,status,redeemed_by,redeemed_at"].concat(
      visible.map((v) =>
        [v.code, v.credit_amount, v.is_redeemed ? "redeemed" : "active", v.redeemed_by_user_id ?? "", v.redeemed_at ?? ""]
          .map((c) => `"${String(c).replaceAll('"', '""')}"`)
          .join(",")
      )
    ).join("\n");

  const download = (mime: string, body: string, ext: string) => {
    const blob = new Blob([body], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `be-native-vouchers.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-4">
      <Panel title="مولّد الكوبونات">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <Field label="العدد">
            <NumberInput min={1} max={500} value={count} onChange={setCount} />
          </Field>
          <Field label="قيمة الكوبون (طاقة)">
            <NumberInput min={1} value={credit} onChange={setCredit} />
          </Field>
          <Field label="البداية">
            <TextInput value={prefix} onChange={(e) => setPrefix(e.target.value)} maxLength={6} />
          </Field>
          <div className="flex items-end">
            <Btn tone="primary" onClick={generate} disabled={busy}>
              {busy ? "يولّد…" : "توليد"}
            </Btn>
          </div>
        </div>
        {error && <p className="mt-3 rounded border border-red-400/50 bg-red-900/30 px-3 py-2 text-sm text-red-200">{error}</p>}
        {notice && <p className="mt-3 rounded border border-kraft-500/60 bg-kraft-600/25 px-3 py-2 text-sm text-kraft-200">{notice}</p>}
        {created.length > 0 && (
          <div className="mt-3">
            <span className="font-display text-base text-slatew-300">أحدث الأكواد:</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {created.map((c) => (
                <code key={c.code} className="rounded border border-slatew-600 bg-slatew-950/70 px-2 py-1 font-mono text-xs text-kraft-200">
                  {c.code} <span className="text-slatew-500">={c.credit_amount}</span>
                </code>
              ))}
            </div>
          </div>
        )}
      </Panel>

      <Panel
        title="جدول الكوبونات"
        aside={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1">
              {(["all", "active", "redeemed"] as StatusFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded border px-2 py-0.5 text-xs ${filter === f ? "border-kraft-500 text-kraft-200" : "border-slatew-600 text-slatew-400"}`}
                >
                  {f === "all" ? "الكل" : f === "active" ? "فعّال" : "مستخدَم"}
                </button>
              ))}
            </div>
            <Btn tone="ghost" onClick={() => download("text/csv", toCSV(), "csv")}>CSV ⇩</Btn>
            <Btn tone="ghost" onClick={() => download("application/json", JSON.stringify(visible, null, 2), "json")}>JSON ⇩</Btn>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slatew-700 text-start font-display text-base text-slatew-300">
                <th className="py-1.5 pe-3 text-start">الكود</th>
                <th className="py-1.5 pe-3 text-start">الطاقة</th>
                <th className="py-1.5 pe-3 text-start">الحالة</th>
                <th className="py-1.5 pe-3 text-start">المستخدِم</th>
                <th className="py-1.5 text-start">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr><td colSpan={5}><Empty label="ماكو كوبونات" /></td></tr>
              )}
              {visible.map((v) => (
                <tr key={v.id} className="border-b border-slatew-800/70">
                  <td className="py-1.5 pe-3 font-mono text-xs text-slatew-200">{v.code}</td>
                  <td className="py-1.5 pe-3 text-slatew-200">{v.credit_amount}</td>
                  <td className="py-1.5 pe-3">
                    <Badge tone={v.is_redeemed ? "bad" : "ok"}>{v.is_redeemed ? "مستخدَم" : "فعّال"}</Badge>
                  </td>
                  <td className="py-1.5 pe-3 font-mono text-[10px] text-slatew-400">{v.redeemed_by_user_id ?? "—"}</td>
                  <td className="py-1.5 text-xs text-slatew-400">{v.redeemed_at ? new Date(v.redeemed_at).toLocaleString("ar-EG") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slatew-500">الإجمالي المعروض: {visible.length} كوبون.</p>
      </Panel>
    </div>
  );
}