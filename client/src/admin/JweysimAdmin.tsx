import { useCallback, useEffect, useMemo, useState } from "react";

import type { JweysimPhrase, JweysimPhraseInput, JweysimScrap, JweysimScrapInput, Spot, SpotWithScenario } from "@be-native/shared";

import { api } from "../lib/api";
import { Badge, Btn, Empty, Field, NumberInput, Panel, TextInput, Toggle } from "./AdminUI";

/** شكل مسودة القصاصة في النموذج — يطابق JweysimScrapInput. */
type ScrapDraft = JweysimScrapInput;

const EMPTY_DRAFT: ScrapDraft = {
  spot_id: null,
  title: "",
  text: "",
  location_type: "pin",
  pos_x: 50,
  pos_y: 50,
  reward_id: null,
  is_visible: true,
  sort_order: 0,
};

/** الحالات التسعة لعبارات جويسم — بالترتيب المعروض. */
const PHRASE_STATES = [
  "idle",
  "bored",
  "sleeping",
  "wake",
  "loading",
  "error",
  "victory",
  "click",
  "walk",
] as const;

const STATE_LABELS: Record<string, string> = {
  idle: "ساكن (idle)",
  bored: "ملل",
  sleeping: "نايم",
  wake: "صحى",
  loading: "تحميل",
  error: "خطأ",
  victory: "نصر",
  click: "انكب",
  walk: "ماشي",
};

/** عناوين قصيرة معروفة للأثر/القاموس (rewardId) — للعرض فقط في اللوحة. */
const REWARD_LABELS: Record<string, string> = {
  "seed-trace-001": "أثر · انطي الخبز لخبازه",
  "seed-trace-002": "أثر · يده ثقيلة",
  "seed-trace-003": "أثر · طابكة عنده",
  "seed-trace-004": "أثر · ريحت بالي",
  "seed-trace-005": "أثر · هاي زين",
  "seed-vibe-003": "قاموس · الأصل غطّى",
  "seed-vibe-004": "قاموس · يلوع بيك",
  "seed-vibe-005": "قاموس · انقلبت المواجيز",
};

function PhraseEditor({
  phrases,
  onChanged,
}: {
  phrases: JweysimPhrase[];
  onChanged: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [newState, setNewState] = useState<(typeof PHRASE_STATES)[number]>("idle");
  const [newAr, setNewAr] = useState("");
  const [newEn, setNewEn] = useState("");

  const create = async () => {
    if (creating || !newAr.trim()) return;
    setCreating(true);
    setError(null);
    setNotice(null);
    try {
      const max = phrases.filter((p) => p.state === newState).reduce((m, p) => Math.max(m, p.sort_order), 0);
      await api.adminJweysim.createPhrase({
        state: newState,
        ar: newAr.trim(),
        en_sticker: newEn.trim() ? newEn.trim() : null,
        sort_order: max + 1,
        is_visible: true,
      });
      setNewAr("");
      setNewEn("");
      setNotice("تمت إضافة العبارة ✓");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  };

  const patchPhrase = async (id: string, patch: Partial<JweysimPhraseInput>) => {
    setBusyId(id);
    setError(null);
    setNotice(null);
    try {
      await api.adminJweysim.updatePhrase(id, patch);
      setNotice("تم تحديث العبارة ✓");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  const removePhrase = async (id: string) => {
    setBusyId(id);
    setError(null);
    setNotice(null);
    try {
      await api.adminJweysim.removePhrase(id);
      setNotice("تم حذف العبارة ✓");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Panel title="عبارات جويسم (الگلام اللي يگوله)" aside={<Badge tone="ok">{phrases.length}</Badge>}>
      {error && <p className="mb-2 rounded border border-red-400/50 bg-red-900/30 px-3 py-2 text-sm text-red-200">{error}</p>}
      {notice && <p className="mb-2 rounded border border-kraft-500/60 bg-kraft-600/25 px-3 py-2 text-sm text-kraft-200">{notice}</p>}

      {/* إضافة عبارة جديدة */}
      <div className="mb-4 grid gap-2 rounded-md border border-slatew-700 bg-slatew-950/40 p-3 sm:grid-cols-[140px_1fr_1fr_auto]">
        <Field label="الحالة">
          <select
            value={newState}
            onChange={(e) => setNewState(e.target.value as (typeof PHRASE_STATES)[number])}
            className="w-full rounded-md border border-slatew-700 bg-slatew-950/70 px-3 py-2 text-sm text-slatew-100 outline-none focus:border-kraft-400"
          >
            {PHRASE_STATES.map((s) => <option key={s} value={s}>{STATE_LABELS[s]}</option>)}
          </select>
        </Field>
        <Field label="النص (عربي)">
          <TextInput value={newAr} onChange={(e) => setNewAr(e.target.value)} placeholder="عبارة جويسم الجديدة" />
        </Field>
        <Field label="الستيكر (إنجليزي)">
          <TextInput value={newEn} onChange={(e) => setNewEn(e.target.value)} placeholder="Sticker (اختياري)" />
        </Field>
        <div className="flex items-end">
          <Btn tone="primary" onClick={create} disabled={creating || !newAr.trim()}>
            {creating ? "…" : "+ إضافة"}
          </Btn>
        </div>
      </div>

      {/* قائمة العبارات مجمّعة حسب الحالة */}
      {PHRASE_STATES.map((state) => {
        const items = phrases.filter((p) => p.state === state).sort((a, b) => a.sort_order - b.sort_order);
        if (items.length === 0) return null;
        return (
          <div key={state} className="mb-3 rounded-md border border-slatew-800 bg-slatew-950/30 p-2">
            <h4 className="mb-1.5 px-1 font-display text-sm text-kraft-300">{STATE_LABELS[state]}</h4>
            <div className="grid gap-2">
              {items.map((p) => (
                <div key={p.id} className="grid items-center gap-2 rounded-md border border-slatew-700 bg-slatew-900/60 p-2 sm:grid-cols-[1fr_1fr_64px_32px]">
                  <TextInput
                    value={p.ar}
                    onChange={(e) => patchPhrase(p.id, { ar: e.target.value })}
                    className="font-arabic"
                  />
                  <TextInput
                    value={p.en_sticker ?? ""}
                    onChange={(e) => patchPhrase(p.id, { en_sticker: e.target.value || null })}
                    placeholder="ستيكر"
                  />
                  <NumberInput
                    value={p.sort_order}
                    onChange={(n) => patchPhrase(p.id, { sort_order: n })}
                    min={0}
                    title="الترتيب"
                  />
                  <button
                    type="button"
                    title="حذف"
                    disabled={busyId === p.id}
                    onClick={() => removePhrase(p.id)}
                    className="grid size-8 place-items-center rounded-md border border-red-500/60 bg-red-900/30 text-red-200 transition-colors hover:bg-red-800/50 disabled:opacity-40"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <p className="mt-2 text-[11px] leading-relaxed text-slatew-500">
        ملاحظة: تعديل العبارات هنا ينعكس مباشرة على الخريطة (بدون إعادة تشغيل).
      </p>
    </Panel>
  );
}

export function JweysimAdmin() {
  const [scraps, setScraps] = useState<JweysimScrap[]>([]);
  const [phrases, setPhrases] = useState<JweysimPhrase[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ScrapDraft | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [scrapList, phraseList, spotList] = await Promise.all([
        api.adminJweysim.list(),
        api.adminJweysim.listPhrases(),
        api.adminSpots.list(),
      ]);
      setScraps(scrapList);
      setPhrases(phraseList);
      setSpots(
        (spotList as SpotWithScenario[]).map(({ scenario: _scenario, ...spot }) => spot)
      );
      setSelectedId((cur) => cur ?? scrapList[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** صبّ القصاصة المختارة في النموذج. */
  useEffect(() => {
    const scrap = scraps.find((s) => s.id === selectedId);
    if (!scrap) return;
    setDraft({
      spot_id: scrap.spot_id,
      title: scrap.title,
      text: scrap.text,
      location_type: scrap.location_type,
      pos_x: scrap.pos_x,
      pos_y: scrap.pos_y,
      reward_id: scrap.reward_id,
      is_visible: scrap.is_visible,
      sort_order: scrap.sort_order,
    });
  }, [selectedId, scraps]);

  const selected = scraps.find((s) => s.id === selectedId);

  const patch = <K extends keyof ScrapDraft>(key: K, value: ScrapDraft[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const save = async () => {
    if (!draft || !selectedId || busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api.adminJweysim.update(selectedId, draft);
      setNotice("تم تحديث القصاصة ✓");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const create = async () => {
    if (creating || !draft?.title.trim()) return;
    setCreating(true);
    setError(null);
    setNotice(null);
    try {
      const made = await api.adminJweysim.create({
        ...draft,
        title: draft.title.trim(),
        sort_order: scraps.length ? Math.max(...scraps.map((s) => s.sort_order)) + 1 : 1,
      });
      setNotice(`القصاصة «${made.title}» أُنشئت ✓`);
      setDraft({ ...EMPTY_DRAFT, is_visible: true, sort_order: made.sort_order + 1 });
      await load();
      setSelectedId(made.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  };

  const remove = async () => {
    if (!selectedId || busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api.adminJweysim.remove(selectedId);
      setNotice("تم حذف القصاصة ✓");
      setSelectedId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const spotLabel = useMemo(() => {
    const map = new Map(spots.map((s) => [s.id, s.title_ar]));
    return (id: string | null) => (id ? (map.get(id) ?? id) : "بدون پين");
  }, [spots]);

  const spotOptions = useMemo(
    () =>
      spots.map((s) => (
        <option key={s.id} value={s.id}>
          {s.title_ar} — {s.title_en}
        </option>
      )),
    [spots]
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      {/* قائمة القصاصات */}
      <Panel title="قصاصات جويسم" aside={<Badge tone="ok">{scraps.length}</Badge>}>
        <div className="grid gap-1.5">
          {scraps.length === 0 && <Empty label="ماكو قصاصات" />}
          {scraps.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedId(s.id)}
              className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-start text-sm transition-colors ${
                s.id === selectedId
                  ? "border-kraft-500 bg-kraft-600/20 text-kraft-200"
                  : "border-slatew-700 text-slatew-300 hover:bg-slatew-800/60"
              }`}
            >
              <span className="truncate font-arabic">{s.title}</span>
              <Badge tone={s.is_visible ? "ok" : "idle"}>
                {s.location_type === "pin" ? "پين" : "حر"}
              </Badge>
            </button>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4">
        {error && <p className="rounded border border-red-400/50 bg-red-900/30 px-3 py-2 text-sm text-red-200">{error}</p>}
        {notice && <p className="rounded border border-kraft-500/60 bg-kraft-600/25 px-3 py-2 text-sm text-kraft-200">{notice}</p>}

        {/* إنشاء قصاصة جديدة */}
        <Panel title="إنشاء قصاصة جديدة">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_170px_110px_110px_auto]">
            <Field label="العنوان">
              <TextInput value={draft?.title ?? ""} onChange={(e) => setDraft((d) => ({ ...(d ?? EMPTY_DRAFT), title: e.target.value }))} placeholder="عنوان القصاصة" />
            </Field>
            <Field label="النص">
              <TextInput value={draft?.text ?? ""} onChange={(e) => setDraft((d) => ({ ...(d ?? EMPTY_DRAFT), text: e.target.value }))} placeholder="نص القصاصة" />
            </Field>
            <Field label="الموقع">
              <select
                value={draft?.location_type ?? "pin"}
                onChange={(e) => setDraft((d) => ({ ...(d ?? EMPTY_DRAFT), location_type: e.target.value as JweysimScrap["location_type"] }))}
                className="w-full rounded-md border border-slatew-700 bg-slatew-950/70 px-3 py-2 text-sm text-slatew-100 outline-none focus:border-kraft-400"
              >
                <option value="pin">مربوط بپين</option>
                <option value="free">حر (نسب مئوية)</option>
              </select>
            </Field>
            <Field label="X %">
              <NumberInput value={draft?.pos_x ?? 50} onChange={(n) => setDraft((d) => ({ ...(d ?? EMPTY_DRAFT), pos_x: n }))} min={0} max={100} />
            </Field>
            <Field label="Y %">
              <NumberInput value={draft?.pos_y ?? 50} onChange={(n) => setDraft((d) => ({ ...(d ?? EMPTY_DRAFT), pos_y: n }))} min={0} max={100} />
            </Field>
            <div className="flex items-end">
              <Btn tone="primary" onClick={create} disabled={creating || !draft?.title.trim()}>
                {creating ? "ينشئ…" : "إنشاء"}
              </Btn>
            </div>
          </div>
        </Panel>

        {/* تعديل القصاصة المختارة */}
        {selected && draft && selectedId ? (
          <Panel title={`تعديل — ${selected.title}`} aside={<Badge tone={draft.is_visible ? "ok" : "idle"}>{draft.is_visible ? "ظاهرة" : "مخفية"}</Badge>}>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="العنوان">
                  <TextInput value={draft.title} onChange={(e) => patch("title", e.target.value)} />
                </Field>
                <Field label="الترتيب">
                  <NumberInput value={draft.sort_order} onChange={(n) => patch("sort_order", n)} />
                </Field>
              </div>
              <Field label="النص">
                <textarea
                  value={draft.text}
                  onChange={(e) => patch("text", e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-slatew-700 bg-slatew-950/70 px-3 py-2 text-sm text-slatew-100 outline-none focus:border-kraft-400"
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
                <Field label="مكان القصاصة">
                  <select
                    value={draft.location_type}
                    onChange={(e) => patch("location_type", e.target.value as JweysimScrap["location_type"])}
                    className="w-full rounded-md border border-slatew-700 bg-slatew-950/70 px-3 py-2 text-sm text-slatew-100 outline-none focus:border-kraft-400"
                  >
                    <option value="pin">مربوط بپين موقع</option>
                    <option value="free">حر (أحدد الإحداثيات يدويًا)</option>
                  </select>
                </Field>
                <Field label={draft.location_type === "pin" ? "النقطة (الپين)" : "الإحداثيات الحرة"}>
                  {draft.location_type === "pin" ? (
                    <select
                      value={draft.spot_id ?? ""}
                      onChange={(e) => patch("spot_id", e.target.value || null)}
                      className="w-full rounded-md border border-slatew-700 bg-slatew-950/70 px-3 py-2 text-sm text-slatew-100 outline-none focus:border-kraft-400"
                    >
                      <option value="">— بدون پين —</option>
                      {spotOptions}
                    </select>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <NumberInput value={draft.pos_x} onChange={(n) => patch("pos_x", n)} min={0} max={100} title="X %" />
                      <NumberInput value={draft.pos_y} onChange={(n) => patch("pos_y", n)} min={0} max={100} title="Y %" />
                    </div>
                  )}
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="الأثر/القاموس (rewardId)">
                  <select
                    value={draft.reward_id ?? ""}
                    onChange={(e) => patch("reward_id", e.target.value || null)}
                    className="w-full rounded-md border border-slatew-700 bg-slatew-950/70 px-3 py-2 text-sm text-slatew-100 outline-none focus:border-kraft-400"
                  >
                    <option value="">— بدون مكافأة —</option>
                    {Object.entries(REWARD_LABELS).map(([id, label]) => (
                      <option key={id} value={id}>{label}</option>
                    ))}
                  </select>
                </Field>
                <div className="flex items-end">
                  <Toggle checked={draft.is_visible} onChange={(v) => patch("is_visible", v)} label="ظاهرة على الخريطة" />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Btn tone="primary" onClick={save} disabled={busy}>{busy ? "يحفظ…" : "حفظ التعديلات"}</Btn>
                <Btn tone="danger" onClick={remove} disabled={busy}>حذف القصاصة</Btn>
              </div>
              <p className="text-[11px] leading-relaxed text-slatew-500">
                الموقع الحالي: {draft.location_type === "pin" ? spotLabel(draft.spot_id) : `${draft.pos_x}% , ${draft.pos_y}%`}
              </p>
            </div>
          </Panel>
        ) : (
          <Panel title="اختر قصاصة"><Empty label="اختر قصاصة من الجهة اليسرى أو أنشئ واحدة جديدة" /></Panel>
        )}

        {/* قسم عبارات جويسم — يتحكم بگلام الماسكوت */}
        <PhraseEditor phrases={phrases} onChanged={load} />
      </div>
    </div>
  );
}
