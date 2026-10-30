import { Router } from "express";

import { getDb } from "../db.js";

/**
 * Simple registration — name + phone only (NO OTP, NO SMS, NO verification).
 * This is the foundation of the real-account layer: every user gets their own
 * id, their own credits_balance and their own trial window instantly.
 *
 * If a phone already exists → returns the existing user (login by phone).
 * Otherwise → creates a new user and starts the 3-day free trial.
 */

const TRIAL_DAYS = 3;

export function createUserRouter(): Router {
  const router = Router();

  router.post("/register", async (req, res, next) => {
    try {
      const name = typeof req.body?.name === "string" ? req.body.name.trim().slice(0, 80) : "";
      const phone = typeof req.body?.phone === "string" ? req.body.phone.trim().slice(0, 40) : "";

      if (!name) {
        res.status(422).json({ error: "name is required" });
        return;
      }
      if (!phone) {
        res.status(422).json({ error: "phone is required" });
        return;
      }

      const db = getDb();

      // 1. try to find an existing user by phone (simple login by phone)
      const { data: existing, error: findErr } = await db
        .from("users")
        .select("id, name, credits_balance, current_tier, trial_started_at, trial_ends_at, tier_expires_at, trial_used")
        .eq("phone", phone)
        .maybeSingle();

      if (findErr) throw new Error(`user lookup failed: ${findErr.message}`);
      if (existing) {
        res.json({ user: existing, created: false });
        return;
      }

      // 2. create a brand-new user and start the trial window now
      const now = new Date();
      const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

      const { data: created, error: insertErr } = await db
        .from("users")
        .insert({
          name,
          phone,
          credits_balance: 10, // small starter pack for the trial (taste)
          current_tier: "free",
          trial_started_at: now.toISOString(),
          trial_ends_at: trialEnd.toISOString(),
          tier_expires_at: null,
          trial_used: false,
        })
        .select("id, name, credits_balance, current_tier, trial_started_at, trial_ends_at, tier_expires_at, trial_used")
        .single();

      if (insertErr) throw new Error(`user insert failed: ${insertErr.message}`);

      res.status(201).json({ user: created, created: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
