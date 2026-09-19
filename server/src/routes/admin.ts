import crypto from "node:crypto";
import { Router } from "express";

import type {
  ContentEntityType,
  ContentHit,
  Scenario,
  ScenarioCharacter,
  ScenarioGraph,
  ScenarioGraphDraft,
  ScenarioNode,
  Spot,
} from "@be-native/shared";
import {
  hasFatalGraphIssues,
  scenarioGraphDraftForSpot,
  validateScenarioGraph,
} from "@be-native/shared";

import { loadSettings, updateSettings } from "../core/config.js";
import { getDb } from "../db.js";
import { generateScenarioPayloadFor } from "../services/scenarioEngine.js";
import { requireAdmin } from "../middleware/adminAuth.js";

function makeCode(prefix: string, length: number): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  const rand = crypto.randomBytes(length);
  let code = prefix;
  for (let i = 0; i < length; i += 1) {
    code += alphabet[rand[i] % alphabet.length];
  }
  return code;
}

function spotFromRow(row: Spot): Spot {
  return row as unknown as Spot;
}

// ── /admin/content : search + edit any in-game text field ─────────────

/** Plain text columns editable on each simple entity (whitelist). */
const CONTENT_SIMPLE_FIELDS: Record<string, readonly string[]> = {
  spot: ["title_ar", "title_en", "vibe_description"],
  scenario: ["title", "system_prompt"],
  opening_quote: ["text_ar", "text_en"],
};

const GRAPH_COLUMN_FIELDS = new Set(["title", "location"]);

/**
 * Validate a dotted JSONB path into a scenario graph and return its
 * segments. Only the concrete text leaves below are accepted, so an admin
 * request can never write into arbitrary graph fields.
 */
function parseGraphPath(path: string): string[] | null {
  const parts = path.split(".");
  if (parts[0] === "characters") {
    if (parts.length === 3 && /^\d+$/.test(parts[1]) && (parts[2] === "name_ar" || parts[2] === "name_en")) {
      return parts;
    }
    return null;
  }
  if (parts[0] === "nodes") {
    if (parts.length === 3 && /^\d+$/.test(parts[1]) && (parts[2] === "text_en_slang" || parts[2] === "text_ar_hint")) {
      return parts;
    }
    if (
      parts.length === 5 &&
      /^\d+$/.test(parts[1]) &&
      parts[2] === "options" &&
      /^\d+$/.test(parts[3]) &&
      (parts[4] === "text_en_slang" || parts[4] === "text_ar_equivalent")
    ) {
      return parts;
    }
  }
  return null;
}

export function createAdminRouter(): Router {
  const router = Router();
  const db = getDb();

  router.use(requireAdmin);

  // ── settings (throttle etc.) ──────────────────────────────────────
  router.get("/settings", async (_req, res, next) => {
    try {
      res.json(await loadSettings(db));
    } catch (err) {
      next(err);
    }
  });

  router.put("/settings", async (req, res, next) => {
    try {
      const raw = Number(req.body?.slow_gate_ms);
      if (!Number.isFinite(raw) || raw <= 0) {
        res.status(422).json({ error: "slow_gate_ms must be a positive number" });
        return;
      }
      res.json(await updateSettings(db, { slow_gate_ms: raw }));
    } catch (err) {
      next(err);
    }
  });

  // ── API providers ─────────────────────────────────────────────────
  router.get("/providers", async (_req, res, next) => {
    try {
      const { data, error } = await db
        .from("api_providers")
        .select("*")
        .order("priority", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  router.post("/providers", async (req, res, next) => {
    try {
      const b = req.body ?? {};
      if (!b.name) {
        res.status(422).json({ error: "name is required" });
        return;
      }
      const { data: created, error } = await db
        .from("api_providers")
        .insert({
          name: String(b.name),
          api_key_encrypted: b.api_key_encrypted != null ? String(b.api_key_encrypted) : null,
          is_active: b.is_active !== false,
          priority: Number(b.priority) || 100,
          cost_per_token: Number(b.cost_per_token) || 0,
        })
        .select("*")
        .single();
      if (error) throw error;
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  router.put("/providers/:id", async (req, res, next) => {
    try {
      const b = req.body ?? {};
      const patch: Record<string, unknown> = {};
      if (b.name !== undefined) patch.name = String(b.name);
      if (b.api_key_encrypted !== undefined) patch.api_key_encrypted = b.api_key_encrypted as never;
      if (b.is_active !== undefined) patch.is_active = Boolean(b.is_active);
      if (b.priority !== undefined) patch.priority = Number(b.priority);
      if (b.cost_per_token !== undefined) patch.cost_per_token = Number(b.cost_per_token);

      const { data: updated, error } = await db
        .from("api_providers")
        .update(patch as never)
        .eq("id", req.params.id)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      if (!updated) {
        res.status(404).json({ error: "PROVIDER_NOT_FOUND" });
        return;
      }
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete("/providers/:id", async (req, res, next) => {
    try {
      const { error } = await db.from("api_providers").delete().eq("id", req.params.id);
      if (error) throw error;
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  // ── spots + scenarios ─────────────────────────────────────────────
  router.get("/spots", async (_req, res, next) => {
    try {
      const { data: spots, error: spotErr } = await db
        .from("spots")
        .select("*")
        .order("created_at", { ascending: true });
      if (spotErr) throw spotErr;

      const { data: scenarios, error: scenErr } = await db.from("scenarios").select("*");
      if (scenErr) throw scenErr;

      const bySpot = new Map<string, Scenario[]>();
      for (const s of scenarios ?? []) {
        const list = bySpot.get((s as unknown as Scenario).spot_id) ?? [];
        list.push(s as unknown as Scenario);
        bySpot.set((s as unknown as Scenario).spot_id, list);
      }

      res.json(
        (spots ?? []).map((spot) => ({
          ...spot,
          scenario: (bySpot.get((spot as unknown as Spot).id) ?? [])[0] ?? null,
        }))
      );
    } catch (err) {
      next(err);
    }
  });

  router.post("/spots", async (req, res, next) => {
    try {
      const b = req.body ?? {};
      if (!b.title_ar || !b.title_en) {
        res.status(422).json({ error: "title_ar and title_en are required" });
        return;
      }
      const { data: created, error } = await db
        .from("spots")
        .insert({
          title_ar: String(b.title_ar),
          title_en: String(b.title_en),
          category: b.category ?? "cafe",
          vibe_description: b.vibe_description ?? null,
          position_x: Number(b.position_x) || 0,
          position_y: Number(b.position_y) || 0,
          is_locked: b.is_locked === true,
        })
        .select("*")
        .single();
      if (error) throw error;

      // Dynamic creation: plant an editable skeleton graph for the new spot
      // straight into the `scenario_graphs` table (JSONB engine).
      const starter = scenarioGraphDraftForSpot(String((created as unknown as Spot).id));
      const { error: graphErr } = await db.from("scenario_graphs").insert({
        id: starter.id,
        spot_id: starter.spot_id,
        title: starter.title,
        location: starter.location,
        characters: starter.characters,
        nodes: starter.nodes,
        is_active: true,
      } as never);
      if (graphErr) throw graphErr;

      res.status(201).json({ ...created, scenario: null });
    } catch (err) {
      next(err);
    }
  });

  router.put("/spots/:id", async (req, res, next) => {
    try {
      const b = req.body ?? {};
      const patch: Record<string, unknown> = {};
      if (b.title_ar !== undefined) patch.title_ar = String(b.title_ar);
      if (b.title_en !== undefined) patch.title_en = String(b.title_en);
      if (b.category !== undefined) patch.category = String(b.category);
      if (b.vibe_description !== undefined) patch.vibe_description = b.vibe_description;
      if (b.position_x !== undefined) patch.position_x = Number(b.position_x);
      if (b.position_y !== undefined) patch.position_y = Number(b.position_y);
      if (b.is_locked !== undefined) patch.is_locked = Boolean(b.is_locked);

      const { data: updated, error } = await db
        .from("spots")
        .update(patch as never)
        .eq("id", req.params.id)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      if (!updated) {
        res.status(404).json({ error: "SPOT_NOT_FOUND" });
        return;
      }
      res.json({ ...updated, scenario: null });
    } catch (err) {
      next(err);
    }
  });

  // ── interactive scenario graph editor (scenario_graphs JSONB engine) ──

  /** Load the active graph for a spot (or null when none exists yet). */
  router.get("/graph/spot/:spotId", async (req, res, next) => {
    try {
      const { data, error } = await db
        .from("scenario_graphs")
        .select("*")
        .eq("spot_id", req.params.spotId)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      res.json(data ?? null);
    } catch (err) {
      next(err);
    }
  });

  /**
   * Save (upsert) the graph for a spot — JSONB characters + nodes.
   * Strict validation: error-level issues REJECT the save (nothing written).
   */
  router.put("/graph/spot/:spotId", async (req, res, next) => {
    try {
      const b = (req.body ?? {}) as Partial<ScenarioGraphDraft>;
      const draft: ScenarioGraphDraft = {
        id: String(b.id ?? crypto.randomUUID()),
        spot_id: String(b.spot_id ?? req.params.spotId),
        title: String(b.title ?? "سيناريو بلا عنوان"),
        location: String(b.location ?? ""),
        characters: Array.isArray(b.characters) ? (b.characters as never[]) : [],
        nodes: Array.isArray(b.nodes) ? (b.nodes as never[]) : [],
      };

      const issues = validateScenarioGraph(draft);
      if (hasFatalGraphIssues(issues)) {
        res.status(422).json({ error: "GRAPH_INVALID", issues });
        return;
      }

      // ensure the graph actually belongs to this spot
      draft.spot_id = req.params.spotId;

      const payload = {
        id: draft.id,
        spot_id: draft.spot_id,
        title: draft.title,
        location: draft.location,
        characters: draft.characters,
        nodes: draft.nodes,
        is_active: true,
      };

      const { data: existing, error: findErr } = await db
        .from("scenario_graphs")
        .select("id")
        .eq("spot_id", req.params.spotId)
        .maybeSingle();
      if (findErr) throw findErr;

      const { data, error } = existing
        ? await db
            .from("scenario_graphs")
            .update(payload as never)
            .eq("id", existing.id)
            .select("*")
            .single()
        : await db
            .from("scenario_graphs")
            .insert(payload as never)
            .select("*")
            .single();
      if (error) throw error;
      res.json({ data, issues });
    } catch (err) {
      next(err);
    }
  });

  // save a scenario for a spot (create if none, else update the first one)
  router.put("/scenarios/spot/:spotId", async (req, res, next) => {
    try {
      const b = req.body ?? {};
      const { data: existing, error: findErr } = await db
        .from("scenarios")
        .select("id")
        .eq("spot_id", req.params.spotId)
        .maybeSingle();
      if (findErr) throw findErr;

      const body = {
        spot_id: req.params.spotId,
        title: String(b.title ?? "سيناريو بلا عنوان"),
        system_prompt: String(b.system_prompt ?? ""),
        graph_rules: (b.graph_rules ?? {}) as never,
        provider_config: (b.provider_config ?? {}) as never,
      };

      let result;
      if (existing?.id) {
        result = await db
          .from("scenarios")
          .update(body as never)
          .eq("id", existing.id)
          .select("*")
          .single();
      } else {
        result = await db.from("scenarios").insert(body as never).select("*").single();
      }
      if (result.error) throw result.error;
      res.json(result.data);
    } catch (err) {
      next(err);
    }
  });

  // sandbox: generate live without persisting anything
  router.post("/sandbox", async (req, res, next) => {
    try {
      const b = req.body ?? {};
      const spot = spotFromRow(b.spot as Spot);
      if (!spot || !spot.id) {
        res.status(422).json({ error: "spot is required" });
        return;
      }
      const scenario = (b.scenario as Scenario | undefined) ?? {
        id: "sandbox",
        spot_id: spot.id,
        title: b.scenarioTitle ?? spot.title_ar,
        system_prompt: String(b.system_prompt ?? ""),
        graph_rules: (b.graph_rules ?? {}) as never,
        provider_config: (b.provider_config ?? {}) as never,
        created_at: new Date().toISOString(),
      };

      const result = await generateScenarioPayloadFor(spot, scenario);
      res.json({ spot_id: spot.id, ...result });
    } catch (err) {
      next(err);
    }
  });

  // ── vouchers ──────────────────────────────────────────────────────
  router.get("/vouchers", async (_req, res, next) => {
    try {
      const { data, error } = await db
        .from("vouchers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  router.post("/vouchers/batch", async (req, res, next) => {
    try {
      const count = Math.min(500, Math.max(1, Math.round(Number(req.body?.count) || 1)));
      const credit_amount = Math.max(1, Math.round(Number(req.body?.credit_amount) || 10));
      const prefix = typeof req.body?.prefix === "string" ? req.body.prefix.slice(0, 6) : "BN-";

      const seen = new Set<string>();
      const rows: Array<{ code: string; credit_amount: number; is_redeemed: boolean }> = [];
      while (rows.length < count) {
        const code = makeCode(prefix.toUpperCase(), 10);
        if (seen.has(code)) continue;
        seen.add(code);
        rows.push({ code, credit_amount, is_redeemed: false });
      }

      const { data, error } = await db
        .from("vouchers")
        .insert(rows as never)
        .select("code, credit_amount, is_redeemed");
      if (error) {
        // possible collision with an existing live row — surface the count
        res.status(409).json({ error: `VOUCHER_BATCH_FAILED: ${error.message}` });
        return;
      }
      res.status(201).json(data);
    } catch (err) {
      next(err);
    }
  });

  // ── opening quotes (dynamic opening-story management) ─────────────
  router.get("/quotes", async (_req, res, next) => {
    try {
      const { data, error } = await db
        .from("opening_quotes")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  router.post("/quotes", async (req, res, next) => {
    try {
      const b = req.body ?? {};
      if (!b.text_ar || !b.text_en) {
        res.status(422).json({ error: "text_ar and text_en are required" });
        return;
      }
      const { data: created, error } = await db
        .from("opening_quotes")
        .insert({
          text_ar: String(b.text_ar),
          text_en: String(b.text_en),
          is_active: b.is_active !== false,
          sort_order: Number.isFinite(Number(b.sort_order)) ? Number(b.sort_order) : 0,
        })
        .select("*")
        .single();
      if (error) throw error;
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  router.put("/quotes/:id", async (req, res, next) => {
    try {
      const b = req.body ?? {};
      const patch: Record<string, unknown> = {};
      if (b.text_ar !== undefined) patch.text_ar = String(b.text_ar);
      if (b.text_en !== undefined) patch.text_en = String(b.text_en);
      if (b.is_active !== undefined) patch.is_active = Boolean(b.is_active);
      if (b.sort_order !== undefined && Number.isFinite(Number(b.sort_order))) {
        patch.sort_order = Number(b.sort_order);
      }

      const { data: updated, error } = await db
        .from("opening_quotes")
        .update(patch as never)
        .eq("id", req.params.id)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      if (!updated) {
        res.status(404).json({ error: "QUOTE_NOT_FOUND" });
        return;
      }
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete("/quotes/:id", async (req, res, next) => {
    try {
      const { error } = await db.from("opening_quotes").delete().eq("id", req.params.id);
      if (error) throw error;
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  // ── users ─────────────────────────────────────────────────────────
  router.get("/users", async (_req, res, next) => {
    try {
      const { data: users, error: userErr } = await db
        .from("users")
        .select("id, phone, auth_id, credits_balance, current_tier, created_at")
        .order("created_at", { ascending: false });
      if (userErr) throw userErr;

      const { count: openSpotsGlobal, error: spotErr } = await db
        .from("spots")
        .select("id", { count: "exact", head: true });
      if (spotErr) throw spotErr;

      res.json({
        open_spots_global: openSpotsGlobal ?? 0,
        users: users ?? [],
      });
    } catch (err) {
      next(err);
    }
  });

  router.post("/users/:id/credits", async (req, res, next) => {
    try {
      const amount = Math.round(Number(req.body?.amount));
      if (!Number.isFinite(amount) || amount === 0) {
        res.status(422).json({ error: "amount must be a non-zero integer" });
        return;
      }
      const { data, error } = await db.rpc("adjust_credits", {
        p_user_id: req.params.id,
        p_delta: amount,
      });
      if (error) {
        const message = error.message ?? "";
        if (message.includes("USER_NOT_FOUND")) {
          res.status(404).json({ error: "USER_NOT_FOUND" });
          return;
        }
        throw error;
      }
      res.json({ user_id: req.params.id, delta: amount, balance: Number(data) });
    } catch (err) {
      next(err);
    }
  });

  // ── dynamic content editor (any in-game text, no redeploy) ────────
  router.get("/content/search", async (req, res, next) => {
    try {
      const q = String(req.query.q ?? "").trim().slice(0, 200);
      if (q.length === 0) {
        res.json([]);
        return;
      }
      const needle = q.toLowerCase();
      const hits: ContentHit[] = [];
      const isMatch = (value: unknown): value is string =>
        typeof value === "string" && value.toLowerCase().includes(needle);
      const push = (
        hit: Omit<ContentHit, "currentText"> & { currentText: string }
      ) => {
        if (hits.length < 200) hits.push(hit);
      };

      const { data: spots, error: spotErr } = await db.from("spots").select("*");
      if (spotErr) throw spotErr;
      for (const raw of spots ?? []) {
        const spot = raw as unknown as Spot;
        for (const fieldName of CONTENT_SIMPLE_FIELDS.spot) {
          const value = (spot as unknown as Record<string, unknown>)[fieldName];
          if (isMatch(value)) {
            push({
              id: spot.id,
              entityType: "spot",
              fieldName,
              currentText: value,
              label: `نقطة · ${spot.title_ar} · ${fieldName}`,
            });
          }
        }
      }

      const { data: scenarios, error: scenErr } = await db.from("scenarios").select("*");
      if (scenErr) throw scenErr;
      for (const raw of scenarios ?? []) {
        const scenario = raw as unknown as Scenario;
        for (const fieldName of CONTENT_SIMPLE_FIELDS.scenario) {
          const value = (scenario as unknown as Record<string, unknown>)[fieldName];
          if (isMatch(value)) {
            push({
              id: scenario.id,
              entityType: "scenario",
              fieldName,
              currentText: value,
              label: `سيناريو · ${scenario.title} · ${fieldName}`,
            });
          }
        }
      }

      const { data: quotes, error: quoteErr } = await db.from("opening_quotes").select("*");
      if (quoteErr) throw quoteErr;
      for (const raw of quotes ?? []) {
        const quote = raw as unknown as { id: string; text_ar: string; text_en: string };
        for (const fieldName of CONTENT_SIMPLE_FIELDS.opening_quote) {
          const value = (quote as unknown as Record<string, unknown>)[fieldName];
          if (isMatch(value)) {
            push({
              id: quote.id,
              entityType: "opening_quote",
              fieldName,
              currentText: value,
              label: `عبارة بداية · ${quote.text_ar.slice(0, 24)} · ${fieldName}`,
            });
          }
        }
      }

      const { data: graphs, error: graphErr } = await db.from("scenario_graphs").select("*");
      if (graphErr) throw graphErr;
      for (const raw of graphs ?? []) {
        const graph = raw as unknown as ScenarioGraph;
        if (isMatch(graph.title)) {
          push({ id: graph.id, entityType: "scenario_graph", fieldName: "title", currentText: graph.title, label: `خريطة · ${graph.title} · title` });
        }
        if (isMatch(graph.location)) {
          push({ id: graph.id, entityType: "scenario_graph", fieldName: "location", currentText: graph.location, label: `خريطة · ${graph.title} · location` });
        }
        (graph.characters ?? []).forEach((character, ci) => {
          const c = character as ScenarioCharacter;
          if (isMatch(c.name_ar)) {
            push({ id: graph.id, entityType: "scenario_graph", fieldName: `characters.${ci}.name_ar`, currentText: c.name_ar, label: `شخصية · ${graph.title} · name_ar` });
          }
          if (isMatch(c.name_en)) {
            push({ id: graph.id, entityType: "scenario_graph", fieldName: `characters.${ci}.name_en`, currentText: c.name_en, label: `شخصية · ${graph.title} · name_en` });
          }
        });
        (graph.nodes ?? []).forEach((node, ni) => {
          const n = node as ScenarioNode;
          if (isMatch(n.text_en_slang)) {
            push({ id: graph.id, entityType: "scenario_graph", fieldName: `nodes.${ni}.text_en_slang`, currentText: n.text_en_slang, label: `عقدة #${ni + 1} · حوار · ${graph.title}` });
          }
          if (isMatch(n.text_ar_hint)) {
            push({ id: graph.id, entityType: "scenario_graph", fieldName: `nodes.${ni}.text_ar_hint`, currentText: n.text_ar_hint, label: `عقدة #${ni + 1} · تلميح · ${graph.title}` });
          }
          (n.options ?? []).forEach((option, oi) => {
            const o = option as { text_en_slang: string; text_ar_equivalent: string };
            if (isMatch(o.text_en_slang)) {
              push({ id: graph.id, entityType: "scenario_graph", fieldName: `nodes.${ni}.options.${oi}.text_en_slang`, currentText: o.text_en_slang, label: `عقدة #${ni + 1} · خيار ${oi + 1} · ${graph.title}` });
            }
            if (isMatch(o.text_ar_equivalent)) {
              push({ id: graph.id, entityType: "scenario_graph", fieldName: `nodes.${ni}.options.${oi}.text_ar_equivalent`, currentText: o.text_ar_equivalent, label: `عقدة #${ni + 1} · خيار ${oi + 1} (عربي) · ${graph.title}` });
            }
          });
        });
      }

      res.json(hits);
    } catch (err) {
      next(err);
    }
  });

  router.patch("/content/update", async (req, res, next) => {
    try {
      const b = req.body ?? {};
      const id = typeof b.id === "string" ? b.id : "";
      const entityType = typeof b.entityType === "string" ? (b.entityType as ContentEntityType) : null;
      const fieldName = typeof b.fieldName === "string" ? b.fieldName : "";
      if (!id || !entityType || !fieldName || typeof b.newText !== "string") {
        res.status(422).json({ error: "id, entityType, fieldName and newText are required" });
        return;
      }
      const newText = b.newText;

      if (entityType === "spot" || entityType === "scenario" || entityType === "opening_quote") {
        const allowed = CONTENT_SIMPLE_FIELDS[entityType];
        if (!allowed.includes(fieldName)) {
          res.status(422).json({ error: "FIELD_NOT_EDITABLE" });
          return;
        }
        const table = entityType === "spot" ? "spots" : entityType === "scenario" ? "scenarios" : "opening_quotes";
        const { error } = await db
          .from(table)
          .update({ [fieldName]: newText } as never)
          .eq("id", id);
        if (error) throw error;
        res.json({ success: true });
        return;
      }

      if (entityType !== "scenario_graph") {
        res.status(422).json({ error: "UNKNOWN_ENTITY_TYPE" });
        return;
      }

      // graph title / location are plain columns
      if (GRAPH_COLUMN_FIELDS.has(fieldName)) {
        const { error } = await db
          .from("scenario_graphs")
          .update({ [fieldName]: newText } as never)
          .eq("id", id);
        if (error) throw error;
        res.json({ success: true });
        return;
      }

      // nested JSONB leaf (characters / nodes / options)
      const parts = parseGraphPath(fieldName);
      if (!parts) {
        res.status(422).json({ error: "FIELD_NOT_EDITABLE" });
        return;
      }

      const { data: raw, error: findErr } = await db
        .from("scenario_graphs")
        .select("characters, nodes")
        .eq("id", id)
        .maybeSingle();
      if (findErr) throw findErr;
      if (!raw) {
        res.status(404).json({ error: "GRAPH_NOT_FOUND" });
        return;
      }

      const row = raw as unknown as Pick<ScenarioGraph, "characters" | "nodes">;
      const collection = parts[0] === "characters" ? "characters" : "nodes";
      const list = (collection === "characters" ? row.characters : row.nodes) as unknown as Array<Record<string, unknown>>;
      const index = Number(parts[1]);
      const target = Array.isArray(list) ? list[index] : undefined;
      if (!target) {
        res.status(404).json({ error: "TARGET_NOT_FOUND" });
        return;
      }

      if (parts.length === 3) {
        target[parts[2]] = newText;
      } else {
        const options = target.options as unknown as Array<Record<string, unknown>> | undefined;
        const option = Array.isArray(options) ? options[Number(parts[3])] : undefined;
        if (!option) {
          res.status(404).json({ error: "TARGET_NOT_FOUND" });
          return;
        }
        option[parts[4]] = newText;
      }

      const { error: updateErr } = await db
        .from("scenario_graphs")
        .update({ [collection]: list } as never)
        .eq("id", id);
      if (updateErr) throw updateErr;
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
}