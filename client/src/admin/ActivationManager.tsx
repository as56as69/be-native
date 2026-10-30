import { useCallback, useEffect, useState } from "react";

import type {
  ActivationCodeWithInstitute,
  Institute,
} from "@be-native/shared";

import { api } from "../lib/api";
import { Badge, Btn, Empty, Field, NumberInput, Panel, TextInput } from "./AdminUI";

/**
 * لوحة التفعيل والشركاء — إدارة المعاهد وأكواد التفعيل «أبو الكود».
 * القاعدة: بلا اسم معهد ← لا توليد أكواد.
 */
export function ActivationManager() {
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [codes, setCodes] = useState<ActivationCodeWithInstitute[]>([]);

  const [newName, setNewName] = useState("");
  const [contact, setContact] = useState("");
  const [share, setShare] = useState(50000);

  const [count, setCount] = useState(10);
  const [tier, setTier] = useState<"standard" | "professional">("standard");
  const [durationDays, setDurationDays] = useState(60);
  const [selectedInstitute, setSelectedInstitute] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [created, setCreated] = useState<Array<{ code: string; tier: string }>>([]);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [insts, codeRows] = await Promise.all([
        api.adminActivation.listInstitutes(),
        api.adminActivation.listCodes(),
      ]);
      setInstitutes(insts);
      setCodes(codeRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createInstitute = async () => {
    if (!newName.trim() || busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api.adminActivation.createInstitute({
        name: newName.trim(),
        contact: contact.trim() || null,
        share_per_code: share,
      });
      setNewName("");
      setContact("");
      setNotice(`تمت إضافة المعهد ✓`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const generateCodes = async () => {
    if (!selectedInstitute || busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    setCreated([]);
    try {
      const rows = await api.adminActivation.batch(
        count,
        selectedInstitute,
        tier,
        durationDays
      );
      setCreated(rows);
      setNotice(`تم توليد ${rows.length} كود تفعيل ✓`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Panel title="الشركاء (المعاهد/المدرسون/المؤثرون)">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="اسم المعهد">
            <TextInput
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="مثال: معهد بغداد للغات"
              dir="rtl"
            />
          </Field>
          <Field label="جهة الاتصال (اختياري)">
            <TextInput
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="رقم/بريد/ملاحظة"
              dir="rtl"
            />
          </Field>
          <Field label="حصة الشريك لكل كود (د.ع)">
            <NumberInput value={share} onChange={(n) => setShare(n)} />
          </Field>
          <div className="flex items-end">
            <Btn onClick={createInstitute} disabled={busy || !newName.trim()}>
              {busy ? "..." : "+ إضافة المعهد"}
            </Btn>
          </div>
        </div>

        {institutes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {institutes.map((inst) => (
              <Badge key={inst.id} tone={inst.is_active ? "ok" : "warn"}>
                {inst.name} — {inst.share_per_code.toLocaleString("en")} د.ع
              </Badge>
            ))}
          </div>
        )}
        {institutes.length === 0 && <Empty label="لا معاهد بعد — أضف أول معهد" />}
      </Panel>

      <Panel title="توليد أكواد التفعيل (أبو الكود)">
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="المعهد (إلزامي)">
            <select
              value={selectedInstitute}
              onChange={(e) => setSelectedInstitute(e.target.value)}
              className="w-full rounded-sm border border-amber-900/30 bg-[#FFFDF7] px-3 py-2 text-sm text-amber-950 outline-none"
            >
              <option value="">— اختر المعهد —</option>
              {institutes.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="العدد">
            <NumberInput value={count} onChange={(n) => setCount(n)} />
          </Field>
          <Field label="النوع">
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as "standard" | "professional")}
              className="w-full rounded-sm border border-amber-900/30 bg-[#FFFDF7] px-3 py-2 text-sm text-amber-950 outline-none"
            >
              <option value="standard">عادي (150K)</option>
              <option value="professional">خاص VIP (250K)</option>
            </select>
          </Field>
          <Field label="المدة (يوم)">
            <NumberInput value={durationDays} onChange={(n) => setDurationDays(n)} />
          </Field>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <Btn onClick={generateCodes} disabled={busy || !selectedInstitute}>
            {busy ? "..." : "توليد الأكواد"}
          </Btn>
          {!selectedInstitute && (
            <span className="text-xs text-amber-900/60">
              بلا اسم معهد ← لا توليد
            </span>
          )}
        </div>

        {created.length > 0 && (
          <div className="mt-3 rounded-sm border border-amber-900/20 bg-[#FFFDF7] p-3">
            <p className="mb-2 text-xs font-bold text-amber-950">أكواد جديدة:</p>
            <div className="grid max-h-40 gap-1 overflow-y-auto font-mono text-xs text-amber-900 md:grid-cols-2">
              {created.map((c) => (
                <div key={c.code} className="flex items-center justify-between rounded bg-amber-100/60 px-2 py-1">
                  <span dir="ltr">{c.code}</span>
                  <span className="text-[10px] text-amber-900/60">{c.tier}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>

      {error && (
        <div className="rounded-sm border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-sm border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
          {notice}
        </div>
      )}

      <Panel title="سجل أكواد التفعيل">
        {codes.length === 0 ? (
          <Empty label="لا أكواد تفعيل بعد" />
        ) : (
          <div className="grid gap-1.5 md:grid-cols-2">
            {codes.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-slatew-700/50 bg-slatew-900/40 px-3 py-2"
              >
                <div className="flex flex-col">
                  <span dir="ltr" className="font-mono text-sm text-slatew-100">
                    {c.code}
                  </span>
                  <span className="text-xs text-slatew-400">
                    {c.institute_name ?? "—"} • {c.duration_days} يوم • {c.tier}
                  </span>
                </div>
                <Badge tone={c.is_redeemed ? "warn" : "ok"}>
                  {c.is_redeemed ? "مستخدم" : "متاح"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
