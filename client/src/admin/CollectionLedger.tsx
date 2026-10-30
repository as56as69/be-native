import { useCallback, useEffect, useState } from "react";

import type { CollectionLedgerResponse, InstituteLedgerRow } from "@be-native/shared";

import { api } from "../lib/api";
import { Badge, Btn, Empty, Panel } from "./AdminUI";

/**
 * لوحة سجل التحصيل (المرحلة 5) — «منو باع لمن، ومتى نحصّل».
 * تعرض لكل معهد/شريك: عدد الأكواد، المفعّلة، المحصّلة، المتأخرة،
 * المستحقات بالدينار، وعدد الطلاب المحجوزين بسبب التأخر عن الدفع.
 * زر «تحصيل» يعلّم المعهد كمحصّل (دفع المبلغ خارج التطبيق) → يُفك الحجز فورًا.
 */
export function CollectionLedger() {
  const [ledger, setLedger] = useState<CollectionLedgerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [settling, setSettling] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      setError(null);
      setBusy(true);
      const res = await api.adminCollection.ledger();
      setLedger(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const settle = async (inst: InstituteLedgerRow) => {
    if (settling) return;
    setSettling(inst.institute.id);
    setError(null);
    try {
      await api.adminCollection.settle(inst.institute.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSettling(null);
    }
  };

  const fmt = (n: number) => n.toLocaleString("en-US");

  return (
    <div className="flex flex-col gap-4">
      <Panel title="سجل التحصيل (المعاهد/الشركاء)">
        {error && (
          <p className="mb-3 rounded border border-red-400/50 bg-red-900/30 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 pb-3 text-sm text-slatew-300">
          <Btn tone="ghost" onClick={load} disabled={busy} className="mr-auto">
            {busy ? "جارٍ التحديث…" : "تحديث السجل"}
          </Btn>
        </div>

        {!ledger ? (
          <Empty label="لا شريك بعد أو جارٍ التحميل" />
        ) : (
          <>
            {/* إجمالي المستحقات */}
            <div className="mb-3 grid gap-2 sm:grid-cols-6">
              {[
                { label: "أكواد", v: ledger.totals.generated },
                { label: "مفعّلة", v: ledger.totals.redeemed },
                { label: "محصّلة", v: ledger.totals.settled },
                { label: "غير محصّلة", v: ledger.totals.unsettled },
                { label: "متأخرة 24h", v: ledger.totals.overdue },
                { label: "المستحقات (د.ع)", v: ledger.totals.dues },
              ].map((c) => (
                <div key={c.label} className="rounded border border-slatew-700 bg-slatew-950/60 px-2 py-1.5 text-center">
                  <div className="text-lg font-bold text-kraft-200">{fmt(c.v)}</div>
                  <div className="text-[10px] uppercase tracking-wider text-slatew-400">{c.label}</div>
                </div>
              ))}
            </div>

            {ledger.institutes.length === 0 && <Empty label="لا معاهد بعد — أضف أول شريك في تبويب «الشركاء والتفعيل»" />}

            {ledger.institutes.map((inst) => (
              <div key={inst.institute.id} className="mb-5 rounded-lg border border-slatew-700 bg-slatew-900/50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slatew-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg text-kraft-200">{inst.institute.name}</span>
                    {inst.institute.contact && (
                      <span className="text-xs text-slatew-500">{inst.institute.contact}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slatew-200">
                      مستحقات: <b className="text-kraft-100">{fmt(inst.dues)}</b> د.ع
                    </span>
                    {inst.overdue > 0 && (
                      <Badge tone="bad">{inst.overdue} متأخرة • {inst.blocked_students} طالب محجوز</Badge>
                    )}
                    {inst.overdue === 0 && inst.unsettled > 0 && (
                      <Badge tone="warn">{inst.unsettled} غير محصّلة</Badge>
                    )}
                    {inst.overdue === 0 && inst.unsettled === 0 && inst.generated > 0 && (
                      <Badge tone="ok">مقتفية ✓</Badge>
                    )}
                    <Btn
                      tone={inst.unsettled > 0 ? "warn" : "ghost"}
                      disabled={inst.unsettled === 0 || settling !== null}
                      onClick={() => settle(inst)}
                    >
                      {settling === inst.institute.id ? "جارٍ…" : `تحصيل (${inst.unsettled})`}
                    </Btn>
                  </div>
                </div>

                <div className="mt-2 grid gap-1.5 text-sm text-slatew-400 sm:grid-cols-2">
                  <span>مفعّلة: <b className="text-slatew-200">{inst.redeemed}</b> / {inst.generated}</span>
                  <span>محصّلة: <b className="text-slatew-200">{inst.settled}</b> | غير محصّلة: <b className="text-slatew-200">{inst.unsettled}</b> | متأخرة: <b className="text-red-300">{inst.overdue}</b></span>
                  <span>طلاب محجوزون: <b className="text-red-300">{inst.blocked_students}</b></span>
                  <span className="text-[11px] text-slatew-500">الدفع خارج التطبيق — هذا السجل يتابع متى وصله</span>
                </div>

                {inst.codes.length > 0 && (
                  <div className="mt-2 grid max-h-44 gap-1 overflow-y-auto md:grid-cols-2">
                    {inst.codes.map((c) => (
                      <div
                        key={c.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded border border-slatew-800 bg-slatew-950/40 px-2 py-1"
                      >
                        <div className="flex flex-col">
                          <span dir="ltr" className="font-mono text-xs text-slatew-200">{c.code}</span>
                          <span className="text-[10px] text-slatew-500">
                            {c.redeemed_at ? new Date(c.redeemed_at).toLocaleDateString("ar-EG") : "غير مسترد"}
                            {c.redeemed_at && !c.is_settled && c.overdue && (
                              <span className="text-red-300"> — متأخر</span>
                            )}
                            {c.redeemed_at && !c.is_settled && (
                              <span className="text-slatew-500"> — باقي {c.hours_left}h</span>
                            )}
                          </span>
                        </div>
                        <Badge tone={c.is_settled ? "ok" : c.overdue ? "bad" : "warn"}>
                          {c.is_settled ? "مُحصل" : c.overdue ? "متأخر" : "غير محصل"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </Panel>
    </div>
  );
}
