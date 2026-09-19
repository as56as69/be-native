import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ScenarioCollectibleSeed, ScenarioGraph, ScenarioNode, ScenarioOption } from "@be-native/shared";

import { useCollectibles } from "../hooks/useCollectibles";
import { api, ApiError } from "../lib/api";
import { useGame } from "../state/GameContext";
import { useUserStore, userStore } from "../state/useUserStore";
import { themeForCategory } from "../themeConfig";
import { ScenarioCanvas, type ScenarioFeedback } from "./ScenarioCanvas";
import { TraceDrawer } from "./TraceDrawer";
import { TraceNotificationToast } from "./TraceNotificationToast";

const ENERGY_COST = 5;

/**
 * LOGIC ORCHESTRATOR ONLY.
 * All state, graph navigation, evaluation API calls and the energy/XP bookkeeping
 * live here; every pixel is delegated to <ScenarioCanvas />.
 */
export function ScenarioViewer() {
  const { transit, user, spots, exitScene, refreshUser } = useGame();
  const store = useUserStore();
  const {
    registerScenarioItems,
    unlockItem,
    getUnlockedItems,
    items,
    nextAdminTraceForCategory,
  } = useCollectibles();

  const spotId = transit?.spotId;

  const [graph, setGraph] = useState<ScenarioGraph | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorText, setErrorText] = useState("");
  const [nodeId, setNodeId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ScenarioFeedback | null>(null);
  const [freeText, setFreeText] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [complete, setComplete] = useState(false);
  const busyRef = useRef(false);
  const [toast, setToast] = useState<{ phrase: string; key: number } | null>(null);
  const [collectiblesOpen, setCollectiblesOpen] = useState(false);

  // mirror the server balance into the store once we know the profile
  useEffect(() => {
    if (user) userStore.syncEnergy(user.credits_balance);
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setGraph(null);
    setNodeId(null);
    setFeedback(null);
    setFreeText("");
    setComplete(false);
    setXpGained(0);
    if (!spotId) {
      setStatus("error");
      setErrorText("ماكو سيناريو لسه — العب من الخريطة أول.");
      return;
    }
    api
      .scenario(spotId)
      .then((g) => {
        if (cancelled || !g?.nodes?.length) {
          if (!cancelled) {
            setStatus("error");
            setErrorText("ماكو سيناريو جاهز لهذه النقطة بعد — شيّك عليها المس فلّيت.");
          }
          return;
        }
        setGraph(g);
        setNodeId(g.nodes[0].id);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus("error");
        const isMissing =
          err instanceof ApiError &&
          (err.status === 404 || String(err.code ?? err.message).includes("SCENARIO_GRAPH_NOT_FOUND"));
        setErrorText(
          isMissing
            ? "ماكو سيناريو مولّد لهذه النقطة بعد — نرجع الخريطة ونبلّش غيرها."
            : "انقطع الاتصال بخادم بغداد — تحقق من شبكتك ورابع."
        );
      });
    return () => {
      cancelled = true;
    };
  }, [spotId]);

  const node = useMemo<ScenarioNode | null>(
    () => graph?.nodes.find((n) => n.id === nodeId) ?? null,
    [graph, nodeId]
  );

  const nodeIndex = useMemo(
    () => (graph ? graph.nodes.findIndex((n) => n.id === nodeId) : -1),
    [graph, nodeId]
  );

  const speaker = useMemo(
    () => graph?.characters.find((c) => c.id === node?.character) ?? null,
    [graph, node]
  );

  /** Contextual visual engine — resolved once per spot, falls back gracefully. */
  const spot = useMemo(() => spots.find((s) => s.id === spotId) ?? null, [spots, spotId]);
  const theme = useMemo(() => themeForCategory(spot?.category), [spot]);

  const stageTitle = spot?.title_en ?? graph?.title ?? "Baghdad";
  const stageLocation = spot?.title_ar ?? graph?.location ?? "بغداد";

  /** Resolve + unlock a trace triggered by a correct evaluation; pops the toast. */
  const unlockTrace = useCallback(
    (seed: ScenarioCollectibleSeed) => {
      const [item] = registerScenarioItems([seed]);
      if (!item) return;
      unlockItem(item.id);
      // mix admin-created traces of the same category into the live pool —
      // one still-locked admin trace unlocks alongside each good evaluation.
      const bonus = nextAdminTraceForCategory(seed.category);
      if (bonus) unlockItem(bonus.id);
      setToast({ phrase: item.phrase, key: Date.now() });
    },
    [registerScenarioItems, unlockItem, nextAdminTraceForCategory]
  );

  /** Re-arm the ink stamp whenever a fresh evaluation lands. */
  const prevFeedback = useRef<ScenarioFeedback | null>(null);
  const [slamKey, setSlamKey] = useState(0);
  useEffect(() => {
    if (feedback && !prevFeedback.current) setSlamKey((k) => k + 1);
    prevFeedback.current = feedback;
  }, [feedback]);

  const pickOption = useCallback(
    (option: ScenarioOption) => {
      if (busyRef.current || !node) return;
      busyRef.current = true;
      setFeedback({ kind: "option", option, correct: option.is_correct });
      if (option.is_correct) {
        setXpGained((x) => x + option.xp_reward);
        userStore.addXP(option.xp_reward);
        void userStore.consumeEnergy(ENERGY_COST).finally(() => void refreshUser());
        unlockTrace({
          phrase: option.text_ar_equivalent || node.text_ar_hint,
          targetSlang: option.text_en_slang,
          contextNote: node.text_ar_hint,
          category: theme.layoutType,
        });
      }
      window.setTimeout(() => {
        busyRef.current = false;
      }, 250);
    },
    [node, refreshUser, theme.layoutType, unlockTrace]
  );

  const submitFreeText = useCallback(async () => {
    const text = freeText.trim();
    if (!graph || !node || !text || evaluating) return;
    setEvaluating(true);
    try {
      const result = await api.evaluateScenario({
        scenario_id: graph.id,
        node_id: node.id,
        text,
      });
      setFeedback({ kind: "evaluate", result });
      if (result.is_correct) {
        setXpGained((x) => x + result.xp_reward);
        userStore.addXP(result.xp_reward);
        void userStore.consumeEnergy(ENERGY_COST).finally(() => void refreshUser());
        unlockTrace({
          phrase: result.text_ar_equivalent || node.text_ar_hint,
          targetSlang: result.text_en_slang,
          contextNote: node.text_ar_hint,
          category: theme.layoutType,
        });
      }
      setFreeText("");
    } catch {
      // keep the draft so the learner can tweak their line
    } finally {
      setEvaluating(false);
    }
  }, [freeText, graph, node, evaluating, refreshUser, theme.layoutType, unlockTrace]);

  const advance = useCallback(() => {
    if (!feedback) return;
    const nextId =
      feedback.kind === "option"
        ? feedback.option.next_node_id
        : feedback.result.next_node_id;
    if (nextId && graph?.nodes.some((n) => n.id === nextId)) {
      setNodeId(nextId);
      setFeedback(null);
    } else {
      setComplete(true);
      setFeedback(null);
    }
  }, [feedback, graph]);

  const retry = useCallback(() => {
    setFeedback(null);
  }, []);

  const energyDisplay = store.energy ?? user?.credits_balance ?? "…";

  const unlockedTraces = getUnlockedItems();
  const collectibleCount = unlockedTraces.length;
  const collectibleTotal = items.length;

  const fbCorrect =
    feedback !== null && (feedback.kind === "option" ? feedback.correct : feedback.result.is_correct);
  const fbXp =
    feedback === null
      ? 0
      : feedback.kind === "option"
        ? feedback.option.xp_reward
        : feedback.result.xp_reward ?? 0;

  return (
    <>
      <ScenarioCanvas
        theme={theme}
        status={status}
        errorText={errorText}
        complete={complete}
        graph={graph}
        currentNode={node}
        progressStats={{
          step: Math.max(1, nodeIndex + 1),
          total: graph?.nodes.length ?? 1,
        }}
        speaker={speaker}
        evaluation={feedback}
        fbCorrect={fbCorrect}
        fbXp={fbXp}
        freeText={freeText}
        evaluating={evaluating}
        xpGained={xpGained}
        energyCost={ENERGY_COST}
        xpDisplay={store.xp}
        energyDisplay={energyDisplay}
        stageTitle={stageTitle}
        stageLocation={stageLocation}
        slamKey={slamKey}
        collectibleCount={collectibleCount}
        onOpenCollectibles={() => setCollectiblesOpen(true)}
        onSelectOption={pickOption}
        onSubmitFreeText={() => void submitFreeText()}
        onContinue={advance}
        onRetry={retry}
        onFreeTextChange={setFreeText}
        onBackToMap={exitScene}
      />
      {toast && (
        <TraceNotificationToast
          key={toast.key}
          phrase={toast.phrase}
          onDismiss={() => setToast(null)}
        />
      )}
      <TraceDrawer
        isOpen={collectiblesOpen}
        onClose={() => setCollectiblesOpen(false)}
        unlockedItems={unlockedTraces}
        total={collectibleTotal}
      />
    </>
  );
}