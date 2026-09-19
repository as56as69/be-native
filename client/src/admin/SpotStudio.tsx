import { useCallback, useEffect, useState } from "react";

import type {
  SandboxResponse,
  SpotCategory,
  SpotWithScenario,
} from "@be-native/shared";

import { api } from "../lib/api";
import { Badge, Btn, Empty, Field, NumberInput, Panel, TextInput, Toggle } from "./AdminUI";
import { ScenarioGraphEditor } from "./ScenarioGraphEditor";

/** Dynamic 50-Locations categories: Gym, Street, Govt Office, Airport,
 * Coffee Shop, University, Taxi, Hospital (+ legacy cafe/restaurant/bookshop). */
const CATEGORIES: SpotCategory[] = [
  "cafe",
  "gym",
  "street_vendor",
  "govt_office",
  "airport",
  "university",
  "taxi_delivery",
  "hospital",
  "restaurant",
  "bookshop",
];

const CATEGORY_LABELS: Record<SpotCategory, string> = {
  cafe: "مقهى (Coffee Shop)",
  restaurant: "مطعم",
  gym: "صالة رياضة (Gym)",
  taxi_delivery: "تكسي (Taxi)",
  university: "جامعة (University)",
  street_vendor: "كشك شارع (Street)",
  bookshop: "مكتبة",
  govt_office: "مكتب حكومي (Govt Office)",
  airport: "مطار (Airport)",
  hospital: "مستشفى (Hospital)",
};

type SpotDraft = {
  title_ar: string;
  title_en: string;
  category: SpotCategory;
  vibe_description: string;
  position_x: number;
  position_y: number;
  is_locked: boolean;
};

type NewSpotDraft = Pick<SpotDraft, "title_ar" | "title_en" | "category" | "position_x" | "position_y">;

const EMPTY_NEW: NewSpotDraft = {
  title_ar: "",
  title_en: "",
  category: "cafe",
  position_x: 50,
  position_y: 50,
};

export function SpotStudio() {
  const [spots, setSpots] = useState<SpotWithScenario[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [spotDraft, setSpotDraft] = useState<SpotDraft | null>(null);
  const [newSpot, setNewSpot] = useState<NewSpotDraft>(EMPTY_NEW);

  // legacy sandbox config (kept working — untouched by the graph rewrite)
  const [scenarioTitle, setScenarioTitle] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [sandbox, setSandbox] = useState<SandboxResponse | null>(null);
  const [sandboxBusy, setSandboxBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const list = await api.adminSpots.list();
      setSpots(list);
      setSelectedId((cur) => cur ?? list[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const spot = spots.find((s) => s.id === selectedId);
    if (!spot) return;
    setSpotDraft({
      title_ar: spot.title_ar,
      title_en: spot.title_en,
      category: spot.category,
      vibe_description: spot.vibe_description ?? "",
      position_x: spot.position_x,
      position_y: spot.position_y,
      is_locked: spot.is_locked,
    });
    setScenarioTitle(spot.scenario?.title ?? "");
    setSystemPrompt(spot.scenario?.system_prompt ?? "");
    setSandbox(null);
  }, [selectedId, spots]);

  const patchSpot = <K extends keyof SpotDraft>(key: K, value: SpotDraft[K]) =>
    setSpotDraft((d) => (d ? { ...d, [key]: value } : d));

  const saveSpot = async () => {
    if (!spotDraft || !selectedId) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api.adminSpots.update(selectedId, spotDraft);
      setNotice("تم تحديث النقطة ✓");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  /** Dynamic creation: POST /admin/spots also writes an initial graph
   *  straight into `scenario_graphs` (JSONB engine) server-side. */
  const createSpot = async () => {
    if (creating || !newSpot.title_ar.trim() || !newSpot.title_en.trim()) return;
    setCreating(true);
    setError(null);
    setNotice(null);
    try {
      const made = await api.adminSpots.create({
        title_ar: newSpot.title_ar.trim(),
        title_en: newSpot.title_en.trim(),
        category: newSpot.category,
        vibe_description: null,
        position_x: newSpot.position_x,
        position_y: newSpot.position_y,
        is_locked: false,
      });
      setNewSpot(EMPTY_NEW);
      setNotice(`النقطة «${made.title_ar}» أُنشئت + graph مبدئي جاهز للتعديل ✓`);
      await load();
      setSelectedId(made.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  };

  const runSandbox = async () => {
    if (!spotDraft || !selectedId || sandboxBusy) return;
    setSandboxBusy(true);
    setSandbox(null);
    setError(null);
    try {
      const spot = spots.find((s) => s.id === selectedId)!;
      const result = await api.adminScenarios.sandbox({
        spot: { ...spot, ...spotDraft },
        scenario: {
          id: "sandbox",
          spot_id: spot.id,
          title: scenarioTitle || spot.title_ar,
          system_prompt: systemPrompt,
          graph_rules: { nodes: [], orderErrors: [], interrupts: [] } as never,
          provider_config: {},
          created_at: new Date().toISOString(),
        } as never,
      });
      setSandbox(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSandboxBusy(false);
    }
  };

  const selected = spots.find((s) => s.id === selectedId);

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      {/* spot list */}
      <Panel title="النقاط">
        <div className="grid gap-1.5">
          {spots.length === 0 && <Empty label="ماكو نقاط" />}
          {spots.map((s) => (
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
              <span className="truncate">{s.title_ar}</span>
              <Badge tone={s.scenario ? "ok" : "idle"}>
                {CATEGORY_LABELS[s.category] ?? s.category}
              </Badge>
            </button>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4">
        {error && <p className="rounded border border-red-400/50 bg-red-900/30 px-3 py-2 text-sm text-red-200">{error}</p>}
        {notice && <p className="rounded border border-kraft-500/60 bg-kraft-600/25 px-3 py-2 text-sm text-kraft-200">{notice}</p>}

        {/* ── dynamic spot creation ───────────────────────────────── */}
        <Panel title="إنشاء نقطة جديدة (50 Locations)">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_160px_110px_110px_auto]">
            <Field label="العنوان (عربي)"><TextInput value={newSpot.title_ar} onChange={(e) => setNewSpot({ ...newSpot, title_ar: e.target.value })} placeholder="مقهى المتنبي" /></Field>
            <Field label="العنوان (إنجليزي)"><TextInput value={newSpot.title_en} onChange={(e) => setNewSpot({ ...newSpot, title_en: e.target.value })} placeholder="Mutanabbi Cafe" /></Field>
            <Field label="التصنيف">
              <select
                value={newSpot.category}
                onChange={(e) => setNewSpot({ ...newSpot, category: e.target.value as SpotCategory })}
                className="w-full rounded-md border border-slatew-700 bg-slatew-950/70 px-3 py-2 text-sm text-slatew-100 outline-none focus:border-kraft-400"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </Field>
            <Field label="X"><NumberInput value={newSpot.position_x} onChange={(n) => setNewSpot({ ...newSpot, position_x: n })} /></Field>
            <Field label="Y"><NumberInput value={newSpot.position_y} onChange={(n) => setNewSpot({ ...newSpot, position_y: n })} /></Field>
            <div className="flex items-end">
              <Btn tone="primary" onClick={createSpot} disabled={creating}>
                {creating ? "ينشئ + graph…" : "إنشاء النقطة"}
              </Btn>
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slatew-500">
            إنشاء النقطة يكتبها في <code className="text-slatew-300">spots</code> ويُجهّز لها graph مبدئي في{" "}
            <code className="text-slatew-300">scenario_graphs</code> (JSONB) — عدّله من المحرّر بالأسفل.
          </p>
        </Panel>

        {selected && spotDraft && selectedId ? (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="النقطة — الأساسيات" aside={<Badge tone={spotDraft.is_locked ? "bad" : "ok"}>{spotDraft.is_locked ? "مقفلة" : "مفتوحة"}</Badge>}>
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="العنوان (عربي)"><TextInput value={spotDraft.title_ar} onChange={(e) => patchSpot("title_ar", e.target.value)} /></Field>
                    <Field label="العنوان (إنجليزي)"><TextInput value={spotDraft.title_en} onChange={(e) => patchSpot("title_en", e.target.value)} /></Field>
                  </div>
                  <Field label="التصنيف">
                    <select
                      value={spotDraft.category}
                      onChange={(e) => patchSpot("category", e.target.value as SpotCategory)}
                      className="w-full rounded-md border border-slatew-700 bg-slatew-950/70 px-3 py-2 text-sm text-slatew-100 outline-none focus:border-kraft-400"
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                    </select>
                  </Field>
                  <Field label="وصف الأجواء (vibe)">
                    <textarea
                      value={spotDraft.vibe_description}
                      onChange={(e) => patchSpot("vibe_description", e.target.value)}
                      rows={2}
                      className="w-full rounded-md border border-slatew-700 bg-slatew-950/70 px-3 py-2 text-sm text-slatew-100 outline-none focus:border-kraft-400"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="X (إحداثية)"><NumberInput value={spotDraft.position_x} onChange={(n) => patchSpot("position_x", n)} /></Field>
                    <Field label="Y (إحداثية)"><NumberInput value={spotDraft.position_y} onChange={(n) => patchSpot("position_y", n)} /></Field>
                  </div>
                  <Toggle checked={spotDraft.is_locked} onChange={(v) => patchSpot("is_locked", v)} label="مقفلة (تحتاج ترانزيت)" />
                  <div className="flex gap-2">
                    <Btn tone="primary" onClick={saveSpot} disabled={busy}>{busy ? "يحفظ…" : "حفظ النقطة"}</Btn>
                  </div>
                </div>
              </Panel>

              <Panel title={`الساندبوكس — تجربة حية (${selected.title_ar})`} aside={sandbox && <Badge tone={sandbox.source === "llm" ? "ok" : "warn"}>{sandbox.source}</Badge>}>
                <p className="mb-3 text-sm text-slatew-400">توليد فوري تجريبي بالنقطة + إعداد السيناريو قبل النشر (بدون حفظ للرسم).</p>
                <div className="grid gap-3">
                  <Field label="عنوان السيناريو (تجريبي)">
                    <TextInput value={scenarioTitle} onChange={(e) => setScenarioTitle(e.target.value)} />
                  </Field>
                  <Field label="system_prompt (تجريبي)">
                    <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={3}
                      className="w-full rounded-md border border-slatew-700 bg-slatew-950/70 px-3 py-2 text-sm text-slatew-100 outline-none focus:border-kraft-400" />
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <Btn tone="warn" onClick={runSandbox} disabled={sandboxBusy}>
                      {sandboxBusy ? "…يولّد" : "⏵ شغّل السندبوكس"}
                    </Btn>
                  </div>
                </div>
                {sandbox && (
                  <pre className="mt-3 max-h-72 overflow-auto rounded-md border border-slatew-800 bg-slatew-950/40 p-3 text-xs leading-relaxed text-slatew-200">
                    {JSON.stringify(sandbox.payload, null, 2)}
                  </pre>
                )}
              </Panel>
            </div>

            {/* ── immersive scenario graph editor (scenario_graphs JSONB) ── */}
            <ScenarioGraphEditor spotId={selectedId} />
          </>
        ) : (
          <Panel title="اختر نقطة"><Empty label="اختر نقطة من الجهة اليسرى" /></Panel>
        )}
      </div>
    </div>
  );
}