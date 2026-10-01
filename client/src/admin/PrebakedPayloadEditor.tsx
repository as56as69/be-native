import { useEffect, useState } from "react";

import type {
  DialogueLine,
  HintCard,
  ScenarioPayload,
  ScenarioRenderMode,
} from "@be-native/shared";

import { api } from "../lib/api";
import { Btn, TextInput } from "./AdminUI";

//
// Phase 2 — manual prebaked payload editor
// Edit the FIXED scenario payload by hand: dialogue lines, cultural bridge,
// render mode, hints. No LLM involved — it saves straight into graph_rules.prebaked.
//

const RENDER_MODES: ScenarioRenderMode[] = ["TIKTOK_REELS", "COMIC_MEME", "CARD_MODE"];

const RENDER_LABELS: Record<ScenarioRenderMode, string> = {
  TIKTOK_REELS: "TikTok Reels",
  COMIC_MEME: "Comic Meme",
  CARD_MODE: "Card Mode",
};

interface Props {
  scenarioId: string | null;
}

export function PrebakedPayloadEditor({ scenarioId }: Props) {
  const [payload, setPayload] = useState<ScenarioPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setPayload(null);
    setError(null);
    setNotice(null);
    if (!scenarioId) return;
    let cancelled = false;
    setBusy(true);
    api.adminScenarios
      .payload(scenarioId)
      .then(({ payload: p }) => {
        if (cancelled) return;
        setPayload(p);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) {
          setBusy(false);
          setLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [scenarioId]);

  if (!scenarioId) {
    return (
      <section className="rounded-lg border border-slatew-700 bg-slatew-900/80 p-4 shadow-[3px_4px_0_rgb(0_0_0/0.35)]">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl leading-none tracking-tight text-kraft-300">
            محرّر النقطة الثابتة (prebaked)
          </h2>
        </header>
        <p className="py-6 text-center text-sm text-slatew-500">
          — اختر نقطة لتحرير ناتجها الثابت —
        </p>
      </section>
    );
  }

  const patchPayload = (patch: Partial<ScenarioPayload>) =>
    setPayload((p) => (p ? { ...p, ...patch } : p));

  const patchLine = (i: number, patch: Partial<DialogueLine>) =>
    setPayload((p) =>
      p ? { ...p, dialogue: p.dialogue.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) } : p
    );

  const patchHint = (i: number, patch: Partial<HintCard>) =>
    setPayload((p) =>
      p
        ? {
            ...p,
            hints: p.hints.map((h, idx) => (idx === i ? { ...h, ...patch } : h)),
          }
        : p
    );

  const newEmpty = () =>
    setPayload({
      dialogue: [{ speaker: "Local", line: "" }],
      cultural_bridge: "",
      render_mode: "CARD_MODE",
      hints: [{ id: "h1", title: "", text: "" }],
    });

  const save = async () => {
    if (!scenarioId || !payload) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api.adminScenarios.prebake(scenarioId, payload);
      setNotice("حُفظ الناتج الثابت ✓ — النقطة تخدم هذا النص مباشرة بدون LLM");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    if (!scenarioId) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api.adminScenarios.clearPrebake(scenarioId);
      setPayload(null);
      setNotice("أُزيل التثبيت — النقطة ستعود للتوليد الحي بالـ LLM");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-lg border border-slatew-700 bg-slatew-900/80 p-4 shadow-[3px_4px_0_rgb(0_0_0/0.35)]">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-2xl leading-none tracking-tight text-kraft-300">
          محرّر النقطة الثابتة (prebaked)
        </h2>
        <span className={`rounded border border-slatew-600 px-2 py-0.5 text-xs text-slatew-300`}>
          {payload ? "مثبّتة" : "غير مثبّتة"}
        </span>
      </header>

      {error && <p className="mb-2 rounded border border-red-400/50 bg-red-900/30 px-3 py-2 text-sm text-red-200">{error}</p>}
      {notice && <p className="mb-2 rounded border border-kraft-500/60 bg-kraft-600/25 px-3 py-2 text-sm text-kraft-200">{notice}</p>}

      {!loaded && <p className="py-6 text-center text-sm text-slatew-500">— يحمّل… —</p>}

      {loaded && !payload && (
        <div className="grid gap-3">
          <p className="text-sm text-slatew-400">
            لا يوجد ناتج ثابت لهذه النقطة. يمكنك تحرير النص يدوياً ثم حفظه — أو توليده أولاً من
            الساندبوكس ثم الضغط على «📌 حفظ كنقطة ثابتة».
          </p>
          <Btn tone="primary" onClick={newEmpty} disabled={busy}>
            ✍️ تحرير ناتج يدوي جديد
          </Btn>
        </div>
      )}

      {payload && (
        <div className="grid gap-4">
          {/* dialogue */}
          <div className="grid gap-2">
            <h3 className="font-display text-lg text-slatew-200">الحوار</h3>
            {payload.dialogue.map((line, i) => (
              <div key={i} className="grid gap-2 rounded-md border border-slatew-800 bg-slatew-950/50 p-3">
                <div className="grid gap-1">
                  <span className="text-xs text-slatew-400">المتحدث</span>
                  <TextInput
                    value={line.speaker ?? ""}
                    onChange={(e) => patchLine(i, { speaker: e.target.value })}
                    placeholder="Local"
                  />
                </div>
                <div className="grid gap-1">
                  <span className="text-xs text-slatew-400">السطر</span>
                  <textarea
                    value={line.line}
                    onChange={(e) => patchLine(i, { line: e.target.value })}
                    rows={2}
                    className="w-full rounded-md border border-slatew-700 bg-slatew-950/70 px-3 py-2 text-sm text-slatew-100 outline-none focus:border-kraft-400"
                  />
                </div>
                <div className="flex gap-2">
                  <Btn
                    tone="ghost"
                    onClick={() =>
                      setPayload((p) =>
                        p ? { ...p, dialogue: p.dialogue.filter((_, idx) => idx !== i) } : p
                      )
                    }
                  >
                    حذف
                  </Btn>
                  <Btn
                    tone="ghost"
                    onClick={() =>
                      setPayload((p) =>
                        p
                          ? { ...p, dialogue: [...p.dialogue.slice(0, i + 1), { speaker: "Local", line: "" }, ...p.dialogue.slice(i + 1)] }
                          : p
                      )
                    }
                  >
                    إدراج سطر بعد
                  </Btn>
                </div>
              </div>
            ))}
            <Btn
              tone="ghost"
              onClick={() =>
                setPayload((p) =>
                  p ? { ...p, dialogue: [...p.dialogue, { speaker: "Local", line: "" }] } : p
                )
              }
            >
              + إضافة سطر
            </Btn>
          </div>

          {/* cultural bridge */}
          <div className="grid gap-1">
            <span className="font-display text-base text-slatew-300">الجسر الثقافي</span>
            <textarea
              value={payload.cultural_bridge}
              onChange={(e) => patchPayload({ cultural_bridge: e.target.value })}
              rows={2}
              className="w-full rounded-md border border-slatew-700 bg-slatew-950/70 px-3 py-2 text-sm text-slatew-100 outline-none focus:border-kraft-400"
            />
          </div>

          {/* render mode */}
          <div className="grid gap-1">
            <span className="font-display text-base text-slatew-300">نمط العرض</span>
            <select
              value={payload.render_mode}
              onChange={(e) => patchPayload({ render_mode: e.target.value as ScenarioRenderMode })}
              className="w-full rounded-md border border-slatew-700 bg-slatew-950/70 px-3 py-2 text-sm text-slatew-100 outline-none focus:border-kraft-400"
            >
              {RENDER_MODES.map((m) => (
                <option key={m} value={m}>{RENDER_LABELS[m]}</option>
              ))}
            </select>
          </div>

          {/* hints */}
          <div className="grid gap-2">
            <h3 className="font-display text-lg text-slatew-200">بطاقات التلميح</h3>
            {payload.hints.map((hint, i) => (
              <div key={hint.id ?? i} className="grid gap-2 rounded-md border border-slatew-800 bg-slatew-950/50 p-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-1">
                    <span className="text-xs text-slatew-400">المعرف</span>
                    <TextInput value={hint.id} onChange={(e) => patchHint(i, { id: e.target.value })} />
                  </div>
                  <div className="grid gap-1">
                    <span className="text-xs text-slatew-400">العنوان</span>
                    <TextInput value={hint.title} onChange={(e) => patchHint(i, { title: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-1">
                  <span className="text-xs text-slatew-400">النص</span>
                  <textarea
                    value={hint.text}
                    onChange={(e) => patchHint(i, { text: e.target.value })}
                    rows={2}
                    className="w-full rounded-md border border-slatew-700 bg-slatew-950/70 px-3 py-2 text-sm text-slatew-100 outline-none focus:border-kraft-400"
                  />
                </div>
                <div className="flex gap-2">
                  <Btn
                    tone="ghost"
                    onClick={() =>
                      setPayload((p) =>
                        p ? { ...p, hints: p.hints.filter((_, idx) => idx !== i) } : p
                      )
                    }
                  >
                    حذف
                  </Btn>
                </div>
              </div>
            ))}
            <Btn
              tone="ghost"
              onClick={() =>
                setPayload((p) =>
                  p
                    ? {
                        ...p,
                        hints: [
                          ...p.hints,
                          { id: `h${p.hints.length + 1}`, title: "", text: "" },
                        ],
                      }
                    : p
                )
              }
            >
              + إضافة تلميح
            </Btn>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-slatew-800 pt-3">
            <Btn tone="primary" onClick={save} disabled={busy}>
              {busy ? "…يحفظ" : "💾 حفظ الناتج الثابت"}
            </Btn>
            <Btn tone="danger" onClick={clear} disabled={busy}>
              إزالة التثبيت (عودة للـ LLM الحي)
            </Btn>
          </div>
        </div>
      )}
    </section>
  );
}
