import { useCallback, useEffect, useState } from "react";

import type { ApiProvider } from "@be-native/shared";

import { api } from "../lib/api";
import { Badge, Btn, Empty, Field, NumberInput, Panel, TextInput, Toggle } from "./AdminUI";

const PRESET_NAMES = ["openai", "anthropic", "grok", "gemini", "elevenlabs", "MOCK"];

type ProviderDraft = {
  name: string;
  api_key_encrypted: string;
  priority: number;
  cost_per_token: number;
  is_active: boolean;
};

const EMPTY_DRAFT: ProviderDraft = {
  name: "openai",
  api_key_encrypted: "",
  priority: 50,
  cost_per_token: 0.000004,
  is_active: true,
};

export function ProviderManager() {
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [draft, setDraft] = useState<ProviderDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tokensIn, setTokensIn] = useState(10_000);
  const [tokensOut, setTokensOut] = useState(3_000);

  const load = useCallback(async () => {
    try {
      setError(null);
      setProviders(await api.adminProviders.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = <K extends keyof ProviderDraft>(key: K, value: ProviderDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const startEdit = (p: ApiProvider) => {
    setEditingId(p.id);
    setDraft({
      name: p.name,
      api_key_encrypted: p.api_key_encrypted ?? "",
      priority: p.priority,
      cost_per_token: p.cost_per_token,
      is_active: p.is_active,
    });
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (editingId) {
        await api.adminProviders.update(editingId, draft);
      } else {
        await api.adminProviders.create(draft);
      }
      setDraft(EMPTY_DRAFT);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (p: ApiProvider) => {
    try {
      setError(null);
      await api.adminProviders.update(p.id, { is_active: !p.is_active });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const remove = async (p: ApiProvider) => {
    if (!window.confirm(`حذف المزوّد ${p.name}؟`)) return;
    try {
      setError(null);
      await api.adminProviders.remove(p.id);
      if (editingId === p.id) {
        setEditingId(null);
        setDraft(EMPTY_DRAFT);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const estCost = (costPerToken: number) =>
    ((tokensIn + tokensOut) * costPerToken).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 6,
    });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* form */}
      <Panel title={editingId ? "تحرير مزوّد" : "إضافة مزوّد"} aside={editingId && <Badge tone="warn">جاري التعديل</Badge>}>
        {error && <p className="mb-3 rounded border border-red-400/50 bg-red-900/30 px-3 py-2 text-sm text-red-200">{error}</p>}
        <div className="grid gap-3">
          <Field label="الاسم">
            <select
              value={draft.name}
              onChange={(e) => patch("name", e.target.value)}
              className="w-full rounded-md border border-slatew-700 bg-slatew-950/70 px-3 py-2 text-sm text-slatew-100 outline-none focus:border-kraft-400"
            >
              {PRESET_NAMES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
          <Field label="المفتاح (api_key)">
            <TextInput
              value={draft.api_key_encrypted}
              onChange={(e) => patch("api_key_encrypted", e.target.value)}
              placeholder="sk-…"
              type="password"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="الأولوية (كلما صغرت سبقت)">
              <NumberInput min={1} value={draft.priority} onChange={(n) => patch("priority", n)} />
            </Field>
            <Field label="تكلفة/توكن (دولار)">
              <NumberInput min={0} step="0.000001" value={draft.cost_per_token} onChange={(n) => patch("cost_per_token", n)} />
            </Field>
          </div>
          <Toggle
            checked={draft.is_active}
            onChange={(v) => patch("is_active", v)}
            label={draft.is_active ? "فعّال" : "موقوف"}
          />
          <div className="flex flex-wrap gap-2">
            <Btn tone="primary" onClick={submit} disabled={busy || !draft.name}>
              {busy ? "يحفظ…" : editingId ? "حفظ التعديل" : "إضافة مزوّد"}
            </Btn>
            {editingId && (
              <Btn tone="ghost" onClick={() => { setEditingId(null); setDraft(EMPTY_DRAFT); }}>
                إلغاء
              </Btn>
            )}
            <Btn tone="ghost" onClick={load}>تحديث القائمة</Btn>
          </div>
        </div>
      </Panel>

      {/* list + cost estimator */}
      <div className="grid gap-4">
        <Panel title="المزوّدون النشطون">
          <div className="grid gap-2">
            {providers.length === 0 && <Empty label="ماكو مزوّدين بعد" />}
            {providers.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center gap-3 rounded-md border border-slatew-700 bg-slatew-950/40 px-3 py-2 text-sm"
              >
                <span className="font-mono text-slatew-200">#{p.priority}</span>
                <span className="w-28 truncate font-semibold text-slatew-100">{p.name}</span>
                <Badge tone={p.is_active ? "ok" : "bad"}>{p.is_active ? "نشط" : "مطفأ"}</Badge>
                <span className="text-slatew-400">${Number(p.cost_per_token).toExponential(2)}/tok</span>
                <span className="ml-auto flex items-center gap-1.5">
                  <Toggle checked={p.is_active} onChange={() => toggleActive(p)} />
                  <Btn tone="ghost" onClick={() => startEdit(p)} title="تحرير">
                    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 14L3.4 17l3.1-.6L15.8 7.1a1.6 1.6 0 0 0 0-2.3l-.5-.5a1.6 1.6 0 0 0-2.3 0Z" />
                      <path d="M13.5 5.5l1.7 1.7" />
                    </svg>
                  </Btn>
                  <Btn tone="danger" onClick={() => remove(p)} title="حذف">
                    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4.5 5.5h11M8 5.5V4h4v1.5M6.5 5.5l.6 10h5.8l.6-10" />
                      <path d="M8.5 8.5v4.5M11.5 8.5v4.5" />
                    </svg>
                  </Btn>
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="حاسبة التكلفة">
          <div className="grid grid-cols-2 gap-3">
            <Field label="توكن الإدخال (in)">
              <NumberInput min={0} value={tokensIn} onChange={setTokensIn} />
            </Field>
            <Field label="توكن الإخراج (out)">
              <NumberInput min={0} value={tokensOut} onChange={setTokensOut} />
            </Field>
          </div>
          <div className="mt-3 grid gap-1.5">
            {providers.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded border border-slatew-700 px-3 py-1.5 text-sm">
                <span className="text-slatew-200">
                  {p.name} <span className="text-slatew-500">(p{p.priority})</span>
                </span>
                <b className="font-mono text-slatew-100">{estCost(p.cost_per_token)}</b>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-slatew-500">التقدير = (in + out) × تكلفة التوكن الواحد لكل مزوّد.</p>
        </Panel>
      </div>
    </div>
  );
}