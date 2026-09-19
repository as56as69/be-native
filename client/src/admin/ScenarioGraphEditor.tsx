import { useEffect, useMemo, useState } from "react";

import type {
  ScenarioCharacter,
  ScenarioGraphDraft,
  ScenarioGraphIssue,
  ScenarioNode,
  ScenarioOption,
} from "@be-native/shared";
import { validateScenarioGraph } from "@be-native/shared";

import { api } from "../lib/api";
import { Badge, Btn, Empty, Field, NumberInput, Panel, TextInput, Toggle } from "./AdminUI";

/** Builds an editable starter draft when the spot has no graph yet. */
function starter(spotId: string): ScenarioGraphDraft {
  return {
    id: (globalThis.crypto?.randomUUID?.() ?? `draft-${Date.now()}`) as string,
    spot_id: spotId,
    title: "سيناريو جديد",
    location: "",
    characters: [{ id: "npc", name_ar: "بغدادي", name_en: "Local" }],
    nodes: [
      {
        id: "n1",
        character: "npc",
        text_en_slang: "Say hi — street English, homie.",
        text_ar_hint: "المقصود بالموقف: رحّب مثل الشارع الأمريكي",
        options: [
          {
            id: "o1",
            text_en_slang: "Yo! What's good, man?",
            text_ar_equivalent: "هلا! شلونك؟",
            is_correct: true,
            xp_reward: 10,
            next_node_id: null,
          },
        ],
      },
    ],
  };
}

const nodeSelectCls =
  "w-full rounded-md border border-slatew-700 bg-slatew-950/70 px-3 py-2 text-sm text-slatew-100 outline-none focus:border-kraft-400 transition-colors";

export function ScenarioGraphEditor({ spotId }: { spotId: string }) {
  const [graph, setGraph] = useState<ScenarioGraphDraft | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [serverIssues, setServerIssues] = useState<ScenarioGraphIssue[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setGraph(null);
    setServerIssues([]);
    setNotice(null);
    setError(null);
    api.adminGraphs
      .get(spotId)
      .then((g) => {
        if (cancelled) return;
        setGraph(g ? (g as ScenarioGraphDraft) : starter(spotId));
        setLoaded(true);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [spotId]);

  const issues = useMemo<ScenarioGraphIssue[]>(
    () => (graph ? validateScenarioGraph(graph) : []),
    [graph]
  );
  const errorCount = issues.filter((i) => i.level === "error").length;
  const warnCount = issues.filter((i) => i.level === "warn").length;
  const blocked = errorCount > 0;

  if (!loaded) {
    return (
      <Panel title="محرّر السيناريو التفاعلي (scenario_graphs)">
        <Empty label="يجلب الرسم البياني…" />
      </Panel>
    );
  }
  if (!graph) {
    return (
      <Panel title="محرّر السيناريو التفاعلي (scenario_graphs)">
        <p className="text-sm text-red-200">{error}</p>
      </Panel>
    );
  }

  const setGraphAt = (patch: Partial<ScenarioGraphDraft>) =>
    setGraph((g) => (g ? { ...g, ...patch } : g));

  const updateNode = (i: number, patch: Partial<ScenarioNode>) =>
    setGraph((g) =>
      g ? { ...g, nodes: g.nodes.map((n, idx) => (idx === i ? { ...n, ...patch } : n)) } : g
    );

  const updateOption = (ni: number, oi: number, patch: Partial<ScenarioOption>) =>
    setGraph((g) =>
      g
        ? {
            ...g,
            nodes: g.nodes.map((n, idx) =>
              idx === ni
                ? { ...n, options: n.options.map((o, j) => (j === oi ? { ...o, ...patch } : o)) }
                : n
            ),
          }
        : g
    );

  const addOption = (ni: number) =>
    setGraph((g) =>
      g
        ? {
            ...g,
            nodes: g.nodes.map((n, idx) =>
              idx === ni
                ? {
                    ...n,
                    options: [
                      ...n.options,
                      {
                        id: `o${n.options.length + 1}`,
                        text_en_slang: "",
                        text_ar_equivalent: "",
                        is_correct: n.options.length === 0,
                        xp_reward: 10,
                        next_node_id: null,
                      },
                    ],
                  }
                : n
            ),
          }
        : g
    );

  const removeOption = (ni: number, oi: number) =>
    setGraph((g) =>
      g
        ? {
            ...g,
            nodes: g.nodes.map((n, idx) =>
              idx === ni ? { ...n, options: n.options.filter((_, j) => j !== oi) } : n
            ),
          }
        : g
    );

  const addCharacter = () =>
    setGraphAt({
      characters: [
        ...graph!.characters,
        {
          id: `ch${graph!.characters.length + 1}`,
          name_ar: "بغدادي",
          name_en: "Local",
        },
      ],
    });

  const nodeIds = graph.nodes.map((n) => n.id);

  const save = async () => {
    if (blocked || !graph) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const out = await api.adminGraphs.save(spotId, graph);
      setGraph(out.data as ScenarioGraphDraft);
      setServerIssues(out.issues ?? []);
      setNotice("حُفظ الرسم البياني ببنية الانغماس الأمريكي الجديدة ✓");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const issueTone = (level: ScenarioGraphIssue["level"]) => (level === "error" ? "bad" : "warn");

  return (
    <Panel
      title="محرّر السيناريو التفاعلي (scenario_graphs)"
      aside={
        <span className="flex items-center gap-2">
          <Badge tone={blocked ? "bad" : "ok"}>
            {errorCount > 0 ? `${errorCount} خطأ` : "سليم"}
          </Badge>
          {warnCount > 0 && <Badge tone="warn">{warnCount} تنبيه</Badge>}
        </span>
      }
    >
      {error && <p className="mb-3 rounded border border-red-400/50 bg-red-900/30 px-3 py-2 text-sm text-red-200">{error}</p>}
      {notice && <p className="mb-3 rounded border border-kraft-500/60 bg-kraft-600/25 px-3 py-2 text-sm text-kraft-200">{notice}</p>}

      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div className="grid gap-4">
          {/* meta */}
          <div className="grid gap-3 rounded-md border border-slatew-700/70 bg-slatew-950/40 p-3 sm:grid-cols-2">
            <Field label="عنوان الرسم البياني">
              <TextInput value={graph.title} onChange={(e) => setGraphAt({ title: e.target.value })} />
            </Field>
            <Field label="location (المنطقة)">
              <TextInput value={graph.location} onChange={(e) => setGraphAt({ location: e.target.value })} />
            </Field>
          </div>

          {/* characters */}
          <div className="grid gap-2 rounded-md border border-slatew-700/70 bg-slatew-950/40 p-3">
            <div className="flex items-center justify-between">
              <span className="font-display text-base text-slatew-300">الشخصيات (characters)</span>
              <Btn tone="ghost" onClick={addCharacter}>+ شخصية</Btn>
            </div>
            {graph.characters.map((ch, i) => (
              <div key={i} className="grid grid-cols-[90px_1fr_1fr_28px] items-center gap-2">
                <TextInput
                  value={ch.id}
                  onChange={(e) =>
                    setGraphAt({
                      characters: graph.characters.map((c, idx) =>
                        idx === i ? { ...c, id: e.target.value } : c
                      ),
                    })
                  }
                  title="id"
                />
                <TextInput
                  value={ch.name_ar}
                  onChange={(e) =>
                    setGraphAt({
                      characters: graph.characters.map((c, idx) =>
                        idx === i ? { ...c, name_ar: e.target.value } : c
                      ),
                    })
                  }
                  title="الاسم بالعربية"
                />
                <TextInput
                  value={ch.name_en}
                  onChange={(e) =>
                    setGraphAt({
                      characters: graph.characters.map((c, idx) =>
                        idx === i ? { ...c, name_en: e.target.value } : c
                      ),
                    })
                  }
                  title="name (en)"
                />
                <Btn
                  tone="danger"
                  onClick={() => setGraphAt({ characters: graph.characters.filter((_, idx) => idx !== i) })}
                >
                  ✕
                </Btn>
              </div>
            ))}
          </div>

          {/* nodes */}
          <div className="grid gap-3">
            {graph.nodes.map((node, ni) => (
              <div key={ni} className="grid gap-3 rounded-md border border-slatew-700 bg-slatew-950/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-base text-slatew-300">عقدة #{ni + 1} — {node.id}</span>
                  <div className="flex gap-2">
                    <Btn tone="ghost" onClick={() => addOption(ni)}>+ خيار</Btn>
                    <Btn
                      tone="danger"
                      onClick={() => setGraphAt({ nodes: graph.nodes.filter((_, idx) => idx !== ni) })}
                    >
                      ✕
                    </Btn>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="النص العامي الأساسي (text_en_slang)">
                    <textarea
                      value={node.text_en_slang}
                      onChange={(e) => updateNode(ni, { text_en_slang: e.target.value })}
                      rows={2}
                      className="w-full rounded-md border border-slatew-700 bg-slatew-950/70 px-3 py-2 text-sm text-slatew-100 outline-none placeholder:text-slatew-500 focus:border-kraft-400"
                      placeholder="NPC line in natural American slang… e.g. What's good, fam?"
                    />
                  </Field>
                  <div className="grid gap-3">
                    <Field label="Context Hint (البغدادي المساعد)">
                      <TextInput
                        value={node.text_ar_hint}
                        onChange={(e) => updateNode(ni, { text_ar_hint: e.target.value })}
                        placeholder="المقصود بالموقف: …"
                      />
                    </Field>
                    <Field label="الشخصية">
                      <select
                        value={node.character}
                        onChange={(e) => updateNode(ni, { character: e.target.value })}
                        className={nodeSelectCls}
                      >
                        {graph.characters.map((ch: ScenarioCharacter) => (
                          <option key={ch.id} value={ch.id}>
                            {ch.name_ar} ({ch.id})
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </div>

                <div className="grid gap-2">
                  {node.options.length === 0 && (
                    <p className="text-xs text-red-300">ماكو خيارات — أضف خياراً واحداً على الأقل.</p>
                  )}
                  {node.options.map((option, oi) => (
                    <div key={oi} className="grid gap-2 rounded-md border border-slatew-700/70 bg-kraft-950/20 p-2.5">
                      <div className="grid grid-cols-[70px_1fr_1fr_32px] items-center gap-2">
                        <TextInput
                          value={option.id}
                          onChange={(e) => updateOption(ni, oi, { id: e.target.value })}
                          title="خيار id"
                        />
                        <TextInput
                          value={option.text_en_slang}
                          onChange={(e) => updateOption(ni, oi, { text_en_slang: e.target.value })}
                          title="American Slang Expression"
                          placeholder="Slang expression…"
                        />
                        <TextInput
                          value={option.text_ar_equivalent}
                          onChange={(e) => updateOption(ni, oi, { text_ar_equivalent: e.target.value })}
                          title="المقابل بالعراقي"
                          placeholder="المقابل بالبغدادي"
                        />
                        <Btn tone="danger" onClick={() => removeOption(ni, oi)}>✕</Btn>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="min-w-[200px] flex-1">
                          <span className="mb-1 block text-[11px] uppercase tracking-wider text-slatew-500">
                            Register — {option.is_correct ? "Native Slang (Correct)" : "Academic/Literal Translation (Distractor)"}
                          </span>
                          <Toggle
                            checked={option.is_correct}
                            onChange={(v) => updateOption(ni, oi, { is_correct: v })}
                            label={option.is_correct ? "عامي أمريكي سليم ✓" : "ترجمة حرفية (مُشتِّت)"}
                          />
                        </div>
                        {option.is_correct && (
                          <Field label="xp_reward">
                            <NumberInput
                              value={option.xp_reward}
                              onChange={(n) => updateOption(ni, oi, { xp_reward: n })}
                            />
                          </Field>
                        )}
                        <Field label="next_node_id">
                          <select
                            value={option.next_node_id ?? ""}
                            onChange={(e) =>
                              updateOption(ni, oi, { next_node_id: e.target.value || null })
                            }
                            className={nodeSelectCls}
                          >
                            <option value="">— نهاية (نهاية الفرع) —</option>
                            {nodeIds
                              .filter((id) => id !== node.id)
                              .map((id) => (
                                <option key={id} value={id}>
                                  {id}
                                </option>
                              ))}
                          </select>
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Btn tone="ghost" onClick={() => setGraphAt({ nodes: [...graph.nodes, {
            id: `n${graph.nodes.length + 1}`,
            character: graph.characters[0]?.id ?? "npc",
            text_en_slang: "",
            text_ar_hint: "المقصود بالموقف: …",
            options: [],
          }] })}>
            + عقدة
          </Btn>
        </div>

        {/* live validation panel */}
        <div className="grid content-start gap-3 rounded-md border border-slatew-700 bg-slatew-950/50 p-3">
          <div className="flex items-center justify-between">
            <span className="font-display text-base text-slatew-300">محرّك التحقق</span>
            <Badge tone={blocked ? "bad" : "ok"}>{blocked ? "لا يُحفظ" : "جاهز للحفظ"}</Badge>
          </div>
          <ul className="grid gap-1.5 text-xs">
            {issues.length === 0 && <li className="text-wasabi-100/80">ماكو ملاحظات — الرسم سليم.</li>}
            {issues.map((issue, i) => (
              <li
                key={`${issue.code}-${issue.nodeId}-${issue.optionId}-${i}`}
                className={`rounded border px-2 py-1.5 leading-relaxed ${
                  issue.level === "error"
                    ? "border-red-500/40 bg-red-900/20 text-red-200"
                    : "border-amber-500/40 bg-amber-900/20 text-amber-200"
                }`}
              >
                <b>{issue.code}</b> — {issue.message_ar}
              </li>
            ))}
          </ul>
          {serverIssues.length > 0 && (
            <ul className="grid gap-1.5 text-xs">
              {serverIssues.map((issue, i) => (
                <li key={`s-${i}`} className={issueTone(issue.level) === "bad" ? "text-red-200" : "text-amber-200"}>
                  {issue.code} — {issue.message_ar}
                </li>
              ))}
            </ul>
          )}
          <Btn tone="primary" onClick={save} disabled={busy || blocked}>
            {busy ? "يحفظ الرسم…" : "حفظ الرسم البياني"}
          </Btn>
          <p className="text-[11px] leading-relaxed text-slatew-500">
            يُحفظ مباشرة إلى جدول <code className="text-slatew-300">scenario_graphs</code> عبر JSONB، مع أخطاء
            الترتيب/الروابط تُفحص قبل الكتابة.
          </p>
        </div>
      </div>
    </Panel>
  );
}