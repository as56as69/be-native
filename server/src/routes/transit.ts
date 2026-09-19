import { Router } from "express";

import type {
  ScenarioPayloadResult,
  TransitLockedResponse,
  TransitStartInput,
} from "@be-native/shared";

import { TransitGate } from "../core/throttle.js";
import {
  getSlowGateMs,
  getTransitGateMs,
  getFastTransitCost,
  getTransitCost,
  getBypassFirstRequest,
} from "../core/config.js";
import { getDb } from "../db.js";
import { generateScenarioPayload } from "../services/scenarioEngine.js";

const FAST_CREDIT_COST = getFastTransitCost();
const TRANSIT_CREDIT_COST = getTransitCost();
export interface TransitDeps {
  /** Injectable clock + trip registry (tests pass a virtual-c lock gate). */
  transitGate?: TransitGate;
}

export function createTransitRouter(deps: TransitDeps = {}): Router {
  const gate = deps.transitGate ?? new TransitGate();
  const router = Router();

  router.post("/start", async (req, res, next) => {
    try {
      const input = req.body as Partial<TransitStartInput>;
      if (!input?.user_id || !input?.from_spot_id || !input?.to_spot_id) {
        res.status(422).json({ error: "user_id, from_spot_id, to_spot_id and mode are required" });
        return;
      }

      const mode = input.mode === "fast" ? "fast" : input.mode === "transit" ? "transit" : "slow";
      const db = getDb();
      const fastCost = getFastTransitCost();
      const transitCost = getTransitCost();

      if (mode === "fast") {
        const { data: balance } = await db.rpc("spend_credits", {
          p_user_id: input.user_id,
          p_amount: fastCost,
        });
        if (balance === null) {
          res.status(402).json({ error: "INSUFFICIENT_CREDITS", cost: fastCost });
          return;
        }

        const payload = await generateScenarioPayload(input.to_spot_id);
        res.json({
          status: "unlocked",
          mode,
          cost: fastCost,
          balance: Number(balance),
          payload: payload.payload,
          generation: payload.source,
        });
        return;
      }

      if (mode === "transit") {
        const { data: balance } = await db.rpc("spend_credits", {
          p_user_id: input.user_id,
          p_amount: transitCost,
        });
        if (balance === null) {
          res.status(402).json({ error: "INSUFFICIENT_CREDITS", cost: transitCost });
          return;
        }
        const gateMs = getTransitGateMs();
        const gateResult = gate.request(input.user_id, input.from_spot_id, gateMs);
        if (gateResult.phase === "locked") {
          const retry = Math.max(0, Math.ceil((gateResult.unlockAtMs - gate.currentTime()) / 1000));
          const body: TransitLockedResponse = {
            status: "locked",
            mode: "transit",
            cost: transitCost,
            unlock_at: new Date(gateResult.unlockAtMs).toISOString(),
            retry_after_seconds: retry,
          };
          res.status(gateResult.isNew ? 202 : 429).json(body);
          return;
        }
        const payloadResult: ScenarioPayloadResult = await generateScenarioPayload(input.to_spot_id);
        res.json({
          status: "unlocked",
          mode: "transit",
          cost: transitCost,
          payload: payloadResult.payload,
          generation: payloadResult.source,
        });
        return;
      }

      // slow — gate the trip, no credit charged
      const gateMs = getSlowGateMs();
      const bypassFirst = getBypassFirstRequest();

      const gateResult = gate.request(input.user_id, input.from_spot_id, gateMs);

      if (gateResult.phase === "locked") {
        const retry = Math.max(0, Math.ceil((gateResult.unlockAtMs - gate.currentTime()) / 1000));
        const body: TransitLockedResponse = {
          status: "locked",
          mode: "slow",
          cost: 0,
          unlock_at: new Date(gateResult.unlockAtMs).toISOString(),
          retry_after_seconds: retry,
        };
        res.status(gateResult.isNew ? 202 : 429).json(body);
        return;
      }

      const payloadResult: ScenarioPayloadResult = await generateScenarioPayload(input.to_spot_id);
      res.json({
        status: "unlocked",
        mode: "slow",
        cost: 0,
        payload: payloadResult.payload,
        generation: payloadResult.source,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}