/**
 * Entitlement service — the SINGLE source of truth for how the system
 * treats a user right now: trial active / trial expired / paid / tier expired.
 *
 * Phase 3 (التجربة المجانية المحكومة) turns the previously-static `users`
 * row into a computed entitlement every request:
 *
 *  - Free users get a 3-day trial that starts the moment their account is
 *    created (trial_started_at / trial_ends_at written by registration).
 *  - While the trial is active they may play the FIXED scenarios without
 *    spending any energy (free_fixed_content = true).
 *  - When the trial is over AND there is no paid tier → the client shows
 *    the reactivation wall (requires_activation = true). The map/scenario
 *    gates then lock the paid paths.
 *  - Standard/pro users stay paid until tier_expires_at (60 days from the
 *    activation code); once that passes they automatically fall back to
 *    free + (expired trial) → requires_activation = true again.
 *
 * Nothing here persists — it derives a snapshot from the user row + now.
 */

import type { EntitlementResponse, EntitlementStatus, User, UserTier } from "@be-native/shared";

/** Whole days between two ISO instants (floor at 0). */
export function daysBetween(fromIso: string | null | undefined, toIso: string | null | undefined): number {
  if (!fromIso || !toIso) return 0;
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
  return Math.max(0, Math.floor((to - from) / 86_400_000));
}

export function computeEntitlement(user: User, now: Date = new Date()): EntitlementResponse {
  const nowMs = now.getTime();
  const trialEndMs = user.trial_ends_at ? new Date(user.trial_ends_at).getTime() : NaN;
  const tierEndMs = user.tier_expires_at ? new Date(user.tier_expires_at).getTime() : NaN;

  const trialActive = Number.isFinite(trialEndMs) && trialEndMs > nowMs && user.current_tier === "free";
  const tierActive = Number.isFinite(tierEndMs) && tierEndMs > nowMs;

  let status: EntitlementStatus;
  let tier: UserTier = user.current_tier;
  let requiresActivation = false;

  if (tierActive && (user.current_tier === "standard" || user.current_tier === "professional")) {
    status = "paid";
  } else if (trialActive) {
    status = "trial_active";
  } else if (user.current_tier !== "free" && !tierActive) {
    // Paid tier lapsed → fall back to free and lock.
    status = "tier_expired";
    tier = "free";
    requiresActivation = true;
  } else {
    // Free + trial finished.
    status = "trial_expired";
    requiresActivation = true;
  }

  return {
    user_id: user.id,
    status,
    tier,
    trial_started_at: user.trial_started_at,
    trial_ends_at: user.trial_ends_at,
    trial_days_left: trialActive ? daysBetween(now.toISOString(), user.trial_ends_at) : 0,
    tier_expires_at: user.tier_expires_at,
    tier_days_left: tierActive ? daysBetween(now.toISOString(), user.tier_expires_at) : 0,
    // Free users on an active trial get fixed content WITHOUT burning energy.
    free_fixed_content: status === "trial_active",
    paid_features: status === "paid",
    requires_activation: requiresActivation,
    // Phase 5 — collection_blocked is filled by the routes (requires a DB
    // lookup on activation_codes); the pure derivation leaves it false.
    collection_blocked: false,
    // Phase 6 — whether the one-shot trial pack was bought.
    trial_used: user.trial_used === true,
  };
}
