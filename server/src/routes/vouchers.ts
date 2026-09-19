import { Router } from "express";

import type { VoucherRedeemInput } from "@be-native/shared";

import { getDb } from "../db.js";

export function createVouchersRouter(): Router {
  const router = Router();

  router.post("/redeem", async (req, res, next) => {
    try {
      const input = req.body as Partial<VoucherRedeemInput>;
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
      const { data, error } = await db.rpc("redeem_voucher", {
        p_user_id: input.user_id,
        p_code: code,
      });

      if (error) {
        const message = error.message ?? "";
        if (message.includes("USER_NOT_FOUND")) {
          res.status(404).json({ error: "USER_NOT_FOUND" });
          return;
        }
        if (message.includes("VOUCHER_INVALID")) {
          res.status(409).json({ error: "VOUCHER_INVALID" });
          return;
        }
        next(error);
        return;
      }

      res.json({ code, balance: Number(data) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}