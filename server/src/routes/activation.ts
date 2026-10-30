import { Router } from "express";

import type { ActivationRedeemInput, ActivationRedeemResult } from "@be-native/shared";

import { getDb } from "../db.js";

/**
 * Student-side redemption of a partner activation code («أبو الكود»).
 * POST /api/activation/redeem  { user_id, code }
 * Raises the user's tier and sets tier_expires_at (60 days by default).
 */
export function createActivationRouter(): Router {
  const router = Router();

  router.post("/redeem", async (req, res, next) => {
    try {
      const input = req.body as Partial<ActivationRedeemInput>;
      if (!input?.user_id) {
        res.status(422).json({ error: "user_id is required" });
        return;
      }
      const code = (input.code ?? "").trim().toUpperCase();
      if (!code) {
        res.status(422).json({ error: "code is required" });
        return;
      }

      const db = getDb();
      const { data, error } = await db.rpc("redeem_activation_code", {
        p_user_id: input.user_id,
        p_code: code,
      });

      if (error) {
        const message = error.message ?? "";
        if (message.includes("USER_NOT_FOUND")) {
          res.status(404).json({ error: "USER_NOT_FOUND" });
          return;
        }
        if (message.includes("ACTIVATION_INVALID")) {
          res.status(409).json({ error: "ACTIVATION_INVALID" });
          return;
        }
        next(error);
        return;
      }

      const result = data as unknown as ActivationRedeemResult;
      res.json({
        code,
        tier: result.tier,
        duration_days: result.duration_days ?? 60,
        expires_at: result.expires_at,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
