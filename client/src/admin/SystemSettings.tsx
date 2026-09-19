import { useCallback, useEffect, useState } from "react";

import { api } from "../lib/api";
import { Btn, Field, NumberInput, Panel } from "./AdminUI";

interface SettingsState {
  slow_gate_ms: number;
  transit_gate_ms: number;
  fast_transit_cost: number;
  transit_cost: number;
  bypass_first_request: boolean;
}

export function SystemSettings() {
  const [settings, setSettings] = useState<SettingsState>({
    slow_gate_ms: 60_000,
    transit_gate_ms: 25_000,
    fast_transit_cost: 10,
    transit_cost: 2,
    bypass_first_request: true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const s = await api.adminSettings.get();
      setSettings({
        slow_gate_ms: s.slow_gate_ms,
        transit_gate_ms: s.transit_gate_ms ?? 25_000,
        fast_transit_cost: s.fast_transit_cost ?? 10,
        transit_cost: s.transit_cost ?? 2,
        bypass_first_request: s.bypass_first_request ?? true,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const s = await api.adminSettings.put({
        slow_gate_ms: settings.slow_gate_ms,
        transit_gate_ms: settings.transit_gate_ms,
        fast_transit_cost: settings.fast_transit_cost,
        transit_cost: settings.transit_cost,
        bypass_first_request: settings.bypass_first_request,
      });
      setSettings({
        slow_gate_ms: s.slow_gate_ms,
        transit_gate_ms: s.transit_gate_ms ?? settings.transit_gate_ms,
        fast_transit_cost: s.fast_transit_cost ?? settings.fast_transit_cost,
        transit_cost: s.transit_cost ?? settings.transit_cost,
        bypass_first_request: s.bypass_first_request ?? settings.bypass_first_request,
      });
      setNotice("تم حفظ إعدادات بوابة الترانزيت ✓");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const slowSec = settings.slow_gate_ms / 1000;
  const transitSec = settings.transit_gate_ms / 1000;
  const estimatedSavings = slowSec >= 45 ? "~50-60%" : slowSec >= 25 ? "~30-45%" : "~10-25%";

  return (
    <div className="grid gap-4">
      <Panel title="بوابة الترانزيت (Throttle)">
        <p className="mb-3 text-sm text-slatew-400">
          تحكم كامل بمهلة البوابة وكلفة التكسي — المشي مجاني، النقل العام وسط، والتكسي فوري.
        </p>
        {error && <p className="mb-3 rounded border border-red-400/50 bg-red-900/30 px-3 py-2 text-sm text-red-200">{error}</p>}
        {notice && <p className="mb-3 rounded border border-kraft-500/60 bg-kraft-600/25 px-3 py-2 text-sm text-kraft-200">{notice}</p>}
        {saved && (
          <div className="grid gap-3 md:grid-cols-2">
            <Field label={`المشي / نقل عام — المهلة (${slowSec} ث)`}>
              <NumberInput min={5} max={300} value={slowSec} onChange={(o) => setSettings((p) => ({ ...p, slow_gate_ms: Math.round(o) * 1000 }))} />
            </Field>
            <Field label={`النقل العام (الكيّة) — المهلة (${transitSec} ث)`}>
              <NumberInput min={5} max={120} value={transitSec} onChange={(o) => setSettings((p) => ({ ...p, transit_gate_ms: Math.round(o) * 1000 }))} />
            </Field>
            <Field label={`تكلفة التكسي السريع (طاقة)`}>
              <NumberInput min={0} max={100} value={settings.fast_transit_cost} onChange={(o) => setSettings((p) => ({ ...p, fast_transit_cost: Math.round(o) }))} />
            </Field>
            <Field label={`تكلفة النقل العام (طاقة)`}>
              <NumberInput min={0} max={50} value={settings.transit_cost} onChange={(o) => setSettings((p) => ({ ...p, transit_cost: Math.round(o) }))} />
            </Field>
            <label className="flex items-center gap-2 text-sm text-slatew-300">
              <input
                type="checkbox"
                checked={settings.bypass_first_request}
                onChange={(e) => setSettings((p) => ({ ...p, bypass_first_request: e.target.checked }))}
                className="size-4 accent-kraft-500"
              />
              تجاوز أول طلب (Bypass First Request) — لا تنتظر أول رحلة للمستخدم الجديد
            </label>
            <div className="flex items-end">
              <Btn tone="primary" onClick={save} disabled={busy}>{busy ? "يحفظ…" : "حفظ الإعداد"}</Btn>
            </div>
          </div>
        )}

        {/* expected savings card */}
        <div className="mt-4 rounded-md border border-kraft-600/40 bg-kraft-950/30 p-3">
          <h4 className="font-arabic text-xs font-bold text-kraft-200">تقدير الوفر في الـ API</h4>
          <p className="font-arabic mt-1 text-sm leading-relaxed text-kraft-100">
            ضبط مهلة المشي على <b>{slowSec} ثانية</b> يقلل معدل الاستدعاءات الفورية (Burst Requests)
            بنسبة تُقدّر بـ <b className="text-kraft-300">{estimatedSavings}</b> — ويمنع تجاوز الـ Rate Limits في LLM Providers.
          </p>
        </div>
        <p className="mt-3 text-xs text-slatew-500">
          النطاق: المشي 5–300 ث، النقل العام 5–120 ث. تُحفظ في جدول <code className="rounded bg-slatew-950 px-1 py-0.5 font-mono">settings</code> وتُقرأ مباشرةً عند كل ترانزيت.
        </p>
      </Panel>
    </div>
  );
}