import { useCallback, useEffect, useState } from "react";

import type { OpeningQuote } from "@be-native/shared";

import { api } from "../lib/api";
import { Badge, Btn, Empty, Field, Panel, TextInput } from "./AdminUI";

const emptyForm = { text_ar: "", text_en: "", sort_order: 10 };

/** Gen Z slang grouped by usage — clickable in the highlight preview. */
const SLANG_GROUPS: { label: string; emoji: string; words: string[] }[] = [
  { label: "مرح / حماس", emoji: "🔥", words: ["let him cook", "ate that", "sheesh", "slay", "goated", "bet", "straight up", "keep it 100", "no cap"] },
  { label: "دهشة / صدمة", emoji: "😱", words: ["that's crazy", "no way", "no shot", "deadass", "on god", "sheesh", "it's giving"] },
  { label: "حزن / كآبة", emoji: "😔", words: ["fell off", "mid", "it's giving sad vibes", "lowkey depressed", "heavy", "down bad", "lost aura", "dry", "crash out"] },
  { label: "غضب / انزعاج", emoji: "😤", words: ["crash out", "pressed", "heated", "mad", "big mad", "on sight", "no chill", "unhinged"] },
  { label: "اشمئزاز / استهجان", emoji: "🤢", words: ["ick", "sus", "cringe", "mid", "nasty", "gross", "stale", "not it"] },
  { label: "حب / حنية", emoji: "❤️", words: ["pookie", "real one", "main character", "my person", "lowkey love this", "hits different", "golden retriever energy"] },
  { label: "دلع / دلال", emoji: "🥰", words: ["pookie", "babygirl", "cutie patootie", "sweetie pie", "snuggle bug", "good vibes only"] },
  { label: "غزل / إعجاب", emoji: "💘", words: ["you're giving", "gorgeous", "main character energy", "look at you", "star of the show", "w rizz", "rizz"] },
  { label: "تأكيد / صدق", emoji: "🤝", words: ["no cap", "fr", "on god", "deadass", "for real", "keep it 100", "say less", "bet", "straight up"] },
  { label: "عام / حياة", emoji: "🌆", words: ["vibing", "touch grass", "delulu", "lurking", "understood the assignment", "glow up", "based", "living rent free"] },
];

export function OpeningQuotes() {
  const [quotes, setQuotes] = useState<OpeningQuote[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(SLANG_GROUPS[0].label);

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

  const appendSlang = (word: string) => {
    setForm((f) => ({ ...f, text_en: f.text_en.trim() ? `${f.text_en.trim()} ${word}` : word }));
    setError(null);
  };

  const active = quotes.filter((q) => q.is_active).length;
  const editingActive = editingId ? quotes.find((q) => q.id === editingId)?.is_active ?? false : false;
  const previewQuote: OpeningQuote = {
    id: "preview",
    text_ar: form.text_ar.trim() || "عبارة البداية… (اكتب أعلاه)",
    text_en: form.text_en.trim() || "Your opening quote will appear here…",
    is_active: true,
    sort_order: form.sort_order || 0,
    created_at: "",
  };

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
            <Field label="الترتيب (الأصغر أولاً) — نصيحة: القيمة الأصغر تظهر أولاً">
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

        {/* live phone preview */}
        <div className="mb-5 grid gap-3 md:grid-cols-2">
          <div className="flex justify-center rounded-md border border-slatew-700 bg-slatew-950/40 p-4">
            <div className="w-full max-w-[260px] rounded-[28px] border-4 border-slatew-600 bg-kraft-100 p-8 shadow-2xl">
              {/* phone notch */}
              <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-slatew-600/80" aria-hidden />
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="stamp rotate-2 text-[9px]">Be Native • دليل بغداد الورقي</span>
                <p className="font-sans text-lg font-semibold leading-[1.8] text-ink-900">
                  {previewQuote.text_ar}
                </p>
                <p dir="ltr" className="font-display text-sm leading-relaxed text-marker-700">
                  <mark className="slash-highlight">{previewQuote.text_en}</mark>
                </p>
                {(editingActive || !editingId) && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-green-700/50 bg-green-100/90 px-2 py-0.5 text-[10px] font-bold text-green-800">
                    <span className="inline-block size-1.5 rounded-full bg-green-600 animate-pulse" aria-hidden />
                    مفعّلة الآن
                  </span>
                )}
              </div>
            </div>
            <span className="sr-only">معاينة حية على شاشة الهاتف</span>
          </div>
          <div className="rounded-md border border-slatew-700 bg-slatew-950/40 p-4">
            <h4 className="mb-2 text-sm font-bold text-slatew-100">مشاهدة تأثير التمييز</h4>
            <p className="mb-3 text-xs leading-relaxed text-slatew-400">
              سلانغ الـ Gen Z مصنّف حسب الاستخدام — اضغط أي كلمة لتضيفها إلى النص الإنجليزي (بتظليل قلم التمييز داخل شاشة الهاتف أعلاه مباشرة).
            </p>
            <div className="space-y-1.5">
              {SLANG_GROUPS.map((group) => {
                const isOpen = openGroup === group.label;
                return (
                  <div key={group.label} className="overflow-hidden rounded-md border border-slatew-700/80">
                    <button
                      type="button"
                      onClick={() => setOpenGroup(isOpen ? null : group.label)}
                      className="flex w-full items-center justify-between gap-2 bg-slatew-900/80 px-3 py-2 text-left transition-colors hover:bg-slatew-800"
                      aria-expanded={isOpen}
                    >
                      <span className="text-xs font-bold text-slatew-200">
                        {group.emoji} {group.label}
                      </span>
                      <span className={`text-slatew-500 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden>
                        ▾
                      </span>
                    </button>
                    {isOpen && (
                      <div className="flex flex-wrap items-center gap-2 bg-slatew-950/60 p-2">
                        {group.words.map((word) => (
                          <button
                            key={word}
                            type="button"
                            onClick={() => appendSlang(word)}
                            dir="ltr"
                            className="slash-highlight inline-block cursor-pointer rounded px-1.5 py-0.5 font-mono text-sm font-bold text-ink-900 transition-transform hover:scale-105 hover:shadow-sm active:scale-95"
                            title={`أضف "${word}" إلى النص الإنجليزي`}
                          >
                            {word} +
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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