import type { ScenarioGraph } from "./types/index.js";

/**
 * Strict validation for interactive scenario graphs (American-slang engine).
 *
 * Rules (matching the production engine contract):
 * - graph has >= 1 node (NO_NODES)
 * - every node has a non-empty `text_en_slang` (EMPTY_NODE_TEXT)
 * - every node has >= 1 option (NO_OPTIONS)
 * - every option has a non-empty `text_en_slang` (EMPTY_OPTION_TEXT)
 * - no duplicate node ids (DUPLICATE_NODE_ID)
 * - no duplicate option ids inside a node (DUPLICATE_OPTION_ID)
 * - every `option.next_node_id` points at an existing node (BROKEN_EDGE)
 * - every node (after the first) is reachable from the root — no isolated nodes
 *   (ISOLATED_NODE)
 * - informational: each node should offer at least one
 *   `is_correct === true` option (NO_CORRECT_OPTION, warn only)
 */
export type ScenarioGraphIssue = {
  level: "error" | "warn";
  code:
    | "NO_NODES"
    | "EMPTY_NODE_TEXT"
    | "NO_OPTIONS"
    | "EMPTY_OPTION_TEXT"
    | "DUPLICATE_NODE_ID"
    | "DUPLICATE_OPTION_ID"
    | "BROKEN_EDGE"
    | "ISOLATED_NODE"
    | "NO_CORRECT_OPTION";
  nodeId?: string;
  optionId?: string;
  message_ar: string;
  message_en?: string;
};

/** A graph that has never been persisted yet (no is_active / created_at). */
export type ScenarioGraphDraft = Omit<ScenarioGraph, "is_active" | "created_at">;

/**
 * Starter graph planted server-side whenever a brand-new spot is created,
 * so the Spot Studio graph editor always has a valid editable skeleton.
 */
export function scenarioGraphDraftForSpot(
  spotId: string,
  title = "سيناريو جديد"
): ScenarioGraphDraft {
  return {
    id: crypto.randomUUID(),
    spot_id: spotId,
    title,
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

/**
 * Pure validator — no I/O. Returns every issue it finds; the server rejects
 * saves that carry any ERROR-level issue, the Studio renders the same list
 * live before the user even hits save.
 */
export function validateScenarioGraph(graph: ScenarioGraphDraft): ScenarioGraphIssue[] {
  const issues: ScenarioGraphIssue[] = [];

  if (!graph.nodes || graph.nodes.length === 0) {
    issues.push({
      level: "error",
      code: "NO_NODES",
      message_ar: "الرسم البياني فاضي — أضف عقدة واحدة على الأقل.",
    });
    return issues;
  }

  const nodeIds = new Set<string>();
  for (const node of graph.nodes) {
    if (nodeIds.has(node.id)) {
      issues.push({
        level: "error",
        code: "DUPLICATE_NODE_ID",
        nodeId: node.id,
        message_ar: `تكرّرت عقدة id: "${node.id}".`,
      });
    }
    nodeIds.add(node.id);
  }

  for (const node of graph.nodes) {
    if (!node.text_en_slang || node.text_en_slang.trim().length === 0) {
      issues.push({
        level: "error",
        code: "EMPTY_NODE_TEXT",
        nodeId: node.id,
        message_ar: `العقدة "${node.id}" بدون نص إنجليزي عاميّ (text_en_slang إلزامي).`,
      });
    }

    if (!Array.isArray(node.options) || node.options.length === 0) {
      issues.push({
        level: "error",
        code: "NO_OPTIONS",
        nodeId: node.id,
        message_ar: `العقدة "${node.id}" ماكو خيارات — خذ خيار واحد على الأقل.`,
      });
      continue;
    }

    const optionIds = new Set<string>();
    let hasCorrect = false;
    for (const option of node.options) {
      if (optionIds.has(option.id)) {
        issues.push({
          level: "error",
          code: "DUPLICATE_OPTION_ID",
          nodeId: node.id,
          optionId: option.id,
          message_ar: `تكرّر خيار id: "${option.id}" داخل العقدة "${node.id}".`,
        });
      }
      optionIds.add(option.id);

      if (!option.text_en_slang || option.text_en_slang.trim().length === 0) {
        issues.push({
          level: "error",
          code: "EMPTY_OPTION_TEXT",
          nodeId: node.id,
          optionId: option.id,
          message_ar: `الخيار "${option.id}" في العقدة "${node.id}" بدون عامية إنجليزية.`,
        });
      }

      if (option.next_node_id !== null && option.next_node_id !== undefined && !nodeIds.has(option.next_node_id)) {
        issues.push({
          level: "error",
          code: "BROKEN_EDGE",
          nodeId: node.id,
          optionId: option.id,
          message_ar: `الخيار "${option.id}" يشير لعقدة غير موجودة: "${option.next_node_id}".`,
        });
      }

      if (option.is_correct) hasCorrect = true;
    }

    if (!hasCorrect) {
      issues.push({
        level: "warn",
        code: "NO_CORRECT_OPTION",
        nodeId: node.id,
        message_ar: `العقدة "${node.id}" بدون أيّ خيار سليم (سجل Native Slang).`,
      });
    }
  }

  // isolated nodes: nothing reachable the root (besides node[0] itself)
  const reachable = new Set<string>([graph.nodes[0].id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of graph.nodes) {
      if (!reachable.has(node.id)) continue;
      for (const option of node.options ?? []) {
        if (option.next_node_id && !reachable.has(option.next_node_id)) {
          reachable.add(option.next_node_id);
          changed = true;
        }
      }
    }
  }
  for (const node of graph.nodes) {
    if (!reachable.has(node.id)) {
      issues.push({
        level: "error",
        code: "ISOLATED_NODE",
        nodeId: node.id,
        message_ar: `العقدة "${node.id}" معزولة — ما إلك طريق يوصلها من البداية.`,
      });
    }
  }

  return issues;
}

/** Convenience: does this graph carry any ERROR-level issue? */
export function hasFatalGraphIssues(issues: ScenarioGraphIssue[]): boolean {
  return issues.some((i) => i.level === "error");
}