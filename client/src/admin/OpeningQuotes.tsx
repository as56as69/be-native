import { useCallback, useEffect, useState } from "react";

import type { OpeningQuote } from "@be-native/shared";

import { api } from "../lib/api";
import { Badge, Btn, Empty, Field, Panel, TextInput } from "./AdminUI";

const emptyForm = { text_ar: "", text_en: "", sort_order: 10 };

export function OpeningQuotes() {
  const [quotes, setQuotes] = useState<OpeningQuote[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setQuotes(await api.adminQuotes.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = useCallback(() => {
    setForm(emptyForm);
    setEditingId(null);
  }, []);

  const submit = async () => {
    const textAr = form.text_ar.trim();
    const textEn = form.text_en.trim();
    if (!textAr || !textEn) {
      setError("النص العربي والإنجليزي مطلوبان");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const body = { text_ar: textAr, text_en: textEn, sort_order: form.sort_order || 0 };
      if (editingId) {
        await api.adminQuotes.update(editingId, body);
        setNotice("تم تحديث العبارة ✓");
      } else {
        await api.adminQuotes.create(body);
        setNotice("تمت إضافة العبارة ✓");
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (q: OpeningQuote) => {
    setEditingId(q.id);
    setForm({ text_ar: q.text_ar, text_en: q.text_en, sort_order: q.sort_order });
    setError(null);
    setNotice(null);
  };

  const toggle = async (q: OpeningQuote) => {
    try {
      setError(null);
      await api.adminQuotes.update(q.id, { is_active: !q.is_active });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const remove = async (q: OpeningQuote) => {
    if (!window.confirm(`حذف العبارة: «${q.text_ar}»؟`)) return;
    try {
      setError(null);
      await api.adminQuotes.remove(q.id);
      if (editingId === q.id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const active = quotes.filter((q) => q.is_active).length;

  return (
    <div className="grid gap-4">
      <Panel
        title="إدارة عبارات البداية"
        aside={<Badge tone="ok">{active} مفعّلة من {quotes.length}</Badge>}
      >
        <p className="mb-3 text-sm text-slatew-400">
          العبارات التي تُظهرها شاشة البداية قبل فتح الدفتر (بعربية وإنجليزية). المفعّل منها فقط
          يُقرأ في <code className="rounded bg-slatew-950 px-1 py-0.5 font-mono">GET /api/quotes</code>.
        </p>
        {error && <p className="mb-3 rounded border border-red-400/50 bg-red-900/30 px-3 py-2 text-sm text-red-200">{error}</p>}
        {notice && <p className="mb-3 rounded border border-kraft-500/60 bg-kraft-600/25 px-3 py-2 text-sm text-kraft-200">{notice}</p>}

        {/* add / edit form */}
        <div className="mb-5 grid gap-3 rounded-md border border-dashed border-slatew-600 p-3 md:grid-cols-[1fr_1fr_auto]">
          <Field label={editingId ? "النص العربي (تعديل)" : "النص العربي"}>
            <TextInput
              value={form.text_ar}
              onChange={(e) => setForm({ ...form, text_ar: e.target.value })}
              placeholder="عبارة بالعربية…"
            />
          </Field>
          <Field label={editingId ? "النص الإنجليزي (تعديل)" : "النص الإنجليزي"}>
            <TextInput
              dir="ltr"
              value={form.text_en}
              onChange={(e) => setForm({ ...form, text_en: e.target.value })}
              placeholder="Quote in English…"
            />
          </Field>
          <div className="flex items-end gap-2">
            <Field label="الترتيب">
              <TextInput
                type="number"
                className="w-20"
                value={String(form.sort_order)}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
              />
            </Field>
            <Btn onClick={submit} disabled={busy}>{busy ? "يحفظ…" : editingId ? "حفظ" : "إضافة"}</Btn>
            {editingId && (
              <Btn tone="ghost" onClick={resetForm}>إلغاء</Btn>
            )}
          </div>
        </div>

        {/* quotes table */}
        {quotes.length === 0 ? (
          <Empty label="لا توجد عبارات بعد" />
        ) : (
          <ul className="grid gap-2">
            {quotes.map((q) => (
              <li
                key={q.id}
                className="grid gap-x-3 gap-y-1 rounded-md border border-slatew-700 bg-slatew-950/50 p-3 md:grid-cols-[1fr_1.2fr_auto]"
              >
                <div className="min-w-0">
                  <p className="truncate font-sans text-sm font-semibold leading-relaxed text-slatew-100" title={q.text_ar}>
                    {q.text_ar}
                  </p>
                  <p className="truncate text-xs text-slatew-500" title={q.text_en}>
                    {q.text_en}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={q.is_active ? "ok" : "idle"}>{q.is_active ? "مفعّلة" : "موقوفة"}</Badge>
                  <span className="text-[11px] text-slatew-500">ترتيب {q.sort_order}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
                  <Btn tone="warn" onClick={() => startEdit(q)}>تعديل</Btn>
                  <Btn tone="ghost" onClick={() => toggle(q)}>{q.is_active ? "إيقاف" : "تفعيل"}</Btn>
                  <Btn tone="danger" onClick={() => remove(q)}>حذف</Btn>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}