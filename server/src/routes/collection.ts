import { Router } from "express";

import { getDb } from "../db.js";
import {
  buildCollectionLedger,
  isUserCollectionBlocked,
  settleInstitute,
} from "../services/collection.js";

/**
 * Collection ledger routes — «سجل تحصيل المعاهد» (phase 5).
 *
 * GET  /api/admin/collection/ledger
 *   → every institute with generated/redeemed/settled/unsettled/overdue counts,
 *     dues (د.ع), blocked student count, and the per-code list.
 *
 * POST /api/admin/collection/institutes/:id/settle
 *   → after the money arrives (خارج التطبيق), marks ALL redeemed+unsettled
 *     codes of that institute as settled → students are un-blocked instantly.
 */
export function createCollectionRouter(): Router {
  const router = Router();

  // Guard — only present inside the admin-mount (app.ts mounts under /api/admin).
  router.get("/ledger", async (_req, res, next) => {
    try {
      const ledger = await buildCollectionLedger();
      res.json(ledger);
    } catch (err) {
      next(err);
    }
  });

  router.get("/users/:id/blocked", async (req, res, next) => {
    try {
      const blocked = await isUserCollectionBlocked(req.params.id);
      res.json({ user_id: req.params.id, blocked });
    } catch (err) {
      next(err);
    }
  });

  router.post("/institutes/:id/settle", async (req, res, next) => {
    try {
      const db = getDb();
      const { data: institute } = await db
        .from("institutes")
        .select("id")
        .eq("id", req.params.id)
        .maybeSingle();
      if (!institute) {
        res.status(404).json({ error: "INSTITUTE_NOT_FOUND" });
        return;
      }
      const settled = await settleInstitute(req.params.id);
      res.json({ ok: true, settled });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
