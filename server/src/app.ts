import cors from "cors";
import express from "express";
import type { Express } from "express";

import {
  API_ROUTES,
  APP_NAME,
  buildHelloMessage,
  type DbStatusResponse,
} from "@be-native/shared";

import { getDb, isLocalDev } from "./db.js";
import { createTransitRouter, type TransitDeps } from "./routes/transit.js";
import { createVouchersRouter } from "./routes/vouchers.js";
import { createAdminRouter } from "./routes/admin.js";
import { createScenariosRouter } from "./routes/scenarios.js";

export interface AppDeps extends TransitDeps {}

export function createApp(deps: AppDeps = {}): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get(API_ROUTES.health, (_req, res) => {
    res.json({ ok: true, service: "be-native-api", uptime: process.uptime() });
  });

  app.get(API_ROUTES.hello, (_req, res) => {
    res.json({
      message: buildHelloMessage(APP_NAME),
      service: "be-native-api",
      serverTime: new Date().toISOString(),
    });
  });

  app.get(API_ROUTES.dbStatus, async (_req, res) => {
    if (isLocalDev()) {
      const body: DbStatusResponse = {
        configured: false,
        message:
          "Running on the LOCAL dev database (server/.local-db.json) — copy server/.env.example to server/.env and fill SUPABASE_URL & SUPABASE_ANON_KEY to go remote.",
      };
      res.status(200).json(body);
      return;
    }

    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      const body: DbStatusResponse = { configured: false, message: "Supabase partially configured — both SUPABASE_URL and a key are required." };
      res.status(200).json(body);
      return;
    }

    let healthy = false;
    let projectRef: string | undefined;
    try {
      getDb(); // validate config + build the cached client
      projectRef = new URL(url).hostname.split(".")[0];

      const response = await fetch(`${url}/rest/v1/`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      });
      healthy = response.ok;
    } catch {
      healthy = false;
    }

    const body: DbStatusResponse = {
      configured: true,
      healthy,
      projectRef,
      message: healthy
        ? "Supabase / PostgREST reachable ✓"
        : "Supabase configured but connection failed — check URL/key and network",
    };
    res.status(200).json(body);
  });

  // All spots for the Doodle Map (client renders locked vs unlocked).
  app.get(API_ROUTES.spots, async (_req, res, next) => {
    try {
      const session = getDb();
      const { data, error } = await session
        .from("spots")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw new Error(`spots query failed: ${error.message}`);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  // Public, lightweight profile view for the top status bar.
  app.get(`${API_ROUTES.user}/:id`, async (req, res, next) => {
    try {
      const session = getDb();
      const { data, error } = await session
        .from("users")
        .select("id, credits_balance, current_tier")
        .eq("id", req.params.id)
        .maybeSingle();
      if (error) throw new Error(`user query failed: ${error.message}`);
      if (!data) {
        res.status(404).json({ error: "USER_NOT_FOUND" });
        return;
      }
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  // Active opening-story quotes (the notebook's hero phrases), managed by admin.
  app.get(API_ROUTES.quotes, async (_req, res, next) => {
    try {
      const session = getDb();
      const { data, error } = await session
        .from("opening_quotes")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw new Error(`quotes query failed: ${error.message}`);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.use("/api/transit", createTransitRouter({ transitGate: deps.transitGate }));
  app.use("/api/scenarios", createScenariosRouter());
  app.use("/api/vouchers", createVouchersRouter());
  app.use("/api/admin", createAdminRouter());

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // central error handler: keep envelope predictable for the client
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      const message = err instanceof Error ? err.message : String(err);
      res.status(502).json({ error: message });
    }
  );

  return app;
}