import { Router } from "express";

import type { EntitlementResponse } from "@be-native/shared";

import { getDb } from "../db.js";
import { computeEntitlementWithBlock } from "../services/collection.js";

/**
 * Public account-status endpoint for the client's entitlement wall.
 * GET /api/entitlement/:id  →  computed trial/paid/expired snapshot
 *   + collection_blocked (overdue unpaid institute code).
 */
export function createEntitlementRouter(): Router {
  const router = Router();

  router.get("/:id", async (req, res, next) => {
    try {
      const db = getDb();
      const { data, error } = await db
        .from("users")
        .select("id, name, credits_balance, current_tier, trial_started_at, trial_ends_at, tier_expires_at, trial_used")
        .eq("id", req.params.id)
        .maybeSingle();
      if (error) throw new Error(`entitlement query failed: ${error.message}`);
      if (!data) {
        res.status(404).json({ error: "USER_NOT_FOUND" });
        return;
      }

      const user = data as unknown as {
        id: string;
        name: string | null;
        credits_balance: number;
        current_tier: "free" | "standard" | "professional";
        trial_started_at: string | null;
        trial_ends_at: string | null;
        tier_expires_at: string | null;
        trial_used: boolean;
      };
      const enriched: EntitlementResponse = await computeEntitlementWithBlock(user as never);
      res.json(enriched);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
