import { useCallback, useEffect, useState } from "react";

import { api } from "../lib/api";
import { Btn, Field, NumberInput, Panel } from "./AdminUI";

export function SystemSettings() {
  const [slowGateMs, setSlowGateMs] = useState(60_000);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const s = await api.adminSettings.get();
      setSlowGateMs(s.slow_gate_ms);
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
      const s = await api.adminSettings.put({ slow_gate_ms: slowGateMs });
      setSlowGateMs(s.slow_gate_ms);
      setNotice(`تم حفظ الحدّ الزمني: ${Math.round(s.slow_gate_ms / 1000)} ثانية ✓`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const seconds = slowGateMs / 1000;

  return (
    <div className="grid gap-4">
      <Panel title="بوابة الترانزيت (Throttle)">
        <p className="mb-3 text-sm text-slatew-400">
          الحدّ الزمني لمسار “مشي / نقل عام” قبل فتح البوابة. كلما زاد، طال الانتظار المجاني؛
          و«التكسي السريع» يتجاوزه فورياً بـ10 طاقات.
        </p>
        {error && <p className="mb-3 rounded border border-red-400/50 bg-red-900/30 px-3 py-2 text-sm text-red-200">{error}</p>}
        {notice && <p className="mb-3 rounded border border-kraft-500/60 bg-kraft-600/25 px-3 py-2 text-sm text-kraft-200">{notice}</p>}
        {saved && (
          <div className="grid gap-3 md:grid-cols-2">
            <Field label={`المدة بالثواني (الحالي: ${seconds} ث)`}>
              <NumberInput min={5} max={300} value={seconds} onChange={(o) => setSlowGateMs(Math.round(o) * 1000)} />
            </Field>
            <div className="flex items-end">
              <Btn tone="primary" onClick={save} disabled={busy}>{busy ? "يحفظ…" : "حفظ الإعداد"}</Btn>
            </div>
          </div>
        )}
        <p className="mt-3 text-xs text-slatew-500">
          النطاق المسموح: 5–300 ثانية. يُحفظ في جدول <code className="rounded bg-slatew-950 px-1 py-0.5 font-mono">settings</code> ويُقرأ مباشرةً عند كل طلب ترانزيت.
        </p>
      </Panel>
    </div>
  );
}