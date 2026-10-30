import { Router } from "express";

import { getDb } from "../db.js";

/**
 * السلاح السري (Phase 6) — رزمة تجربة تُباع للفضولي مرة وحدة.
 *
 * الفكرة من غرفة التخطيط:
 *   الفضولي/المجاني بعد ما تنتهي تجربته → بدل ما يودع على طول،
 *   نقدر نبيعه رزمة تجربة (مدة + رصيد) كدفعة صغيرة (فلوس مبكرة).
 *   لكن **مرة واحدة فقط** — `users.trial_used` هو العلم اللي يمنع التكرار.
 *
 * الدفع/تحصيل المبلغ خارج التطبيق تماماً (مثل التحصيل)، هذا الـ endpoint
 * يسجّل فقط صفقة الشراء: يرفع الرصيد ويمدّد التجربة ويعلّم trial_used = true.
 *
 * POST /api/user/trial-pack/buy  { user_id }
 *  - إذا trial_used بالفعل → 409 TRIAL_PACK_ALREADY_USED (منع التكرار)
 *  - غير ذلك → يرفع الرصيد المبدئي ويطوّل التجربة الحالية ويعلّمها مستخدمة
 */

const STARTER_ENERGY = 15; // رصيد البداية للطب (تذوق المحتوى المدفوع)

export function createTrialPackRouter(): Router {
  const router = Router();

  router.post("/buy", async (req, res, next) => {
    try {
      const userId = typeof req.body?.user_id === "string" ? req.body.user_id.trim() : "";
      if (!userId) {
        res.status(422).json({ error: "user_id is required" });
        return;
      }

      const db = getDb();

      // 1. لو حساب مؤهل — paid/مدفوع؟ الرزمة للمجاني فقط
      const { data: user, error: userErr } = await db
        .from("users")
        .select("id, credits_balance, current_tier, trial_started_at, trial_ends_at, tier_expires_at, trial_used")
        .eq("id", userId)
        .maybeSingle();
      if (userErr) {
        next(new Error(`user lookup failed: ${userErr.message}`));
        return;
      }
      if (!user) {
        res.status(404).json({ error: "USER_NOT_FOUND" });
        return;
      }

      // 2. منع الشراء المتكرر — الهدف الأساسي للسلاح السري
      if (user.trial_used) {
        res.status(409).json({ error: "TRIAL_PACK_ALREADY_USED", trial_used: true });
        return;
      }

      // 3. الرزمة للمجاني (free) فقط — المدفوع ما يحتاجها
      if (user.current_tier !== "free") {
        res.status(409).json({ error: "NOT_FREE_USER" });
        return;
      }

      // 4. تنفيذ الصفقة: مدّد التجربة + أضف رصيد + عَلّم trial_used
      const now = new Date();
      // مدّد التجربة 3 أيام جديدة من لحظة الشراء (تجربة جديدة كاملة)
      const trialEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const oldBalance = Number(user.credits_balance) || 0;

      const { data: updated, error: updErr } = await db
        .from("users")
        .update({
          trial_used: true,
          trial_started_at: now.toISOString(),
          trial_ends_at: trialEnd.toISOString(),
          credits_balance: oldBalance + STARTER_ENERGY,
        })
        .eq("id", userId)
        .select("id, credits_balance, current_tier, trial_started_at, trial_ends_at, trial_used")
        .single();
      if (updErr) {
        next(new Error(`trial pack update failed: ${updErr.message}`));
        return;
      }

      res.json({
        ok: true,
        user: updated,
        added_energy: STARTER_ENERGY,
        balance: updated.credits_balance,
        trial_ends_at: updated.trial_ends_at,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
