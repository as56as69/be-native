/**
 * Collection ledger — «سجل تحصيل المعاهد» (phase 5).
 *
 * The business rule (من غرفة التخطيط):
 *   - Every activation-code redemption starts an UNSETTLED collection item.
 *   - The institute has COLLECTION_HOURS (24h) to transfer the dues.
 *   - If the code stays unsettled past the window, the student's account is
 *     AUTO-BLOCKED (treated as free/requires_activation) so the paid tier
 *     can't be enjoyed until the admin settles the institute's share.
 *   - Settlement is manual (الدفع خارج التطبيق) — the admin clicks «تحصيل»
 *     after receiving the money, which un-blocks every student of that code.
 *
 * Everything here is DERIVED from activation_codes + institutes — no new
 * tables. Settlement only writes the two columns on activation_codes.
 */

import {
  COLLECTION_HOURS,
  type ActivationCode,
  type CollectionLedgerResponse,
  type Institute,
  type InstituteLedgerCode,
  type InstituteLedgerRow,
} from "@be-native/shared";

import { getDb } from "../db.js";
import { computeEntitlement } from "./entitlement.js";
import type { User, EntitlementResponse } from "@be-native/shared";

/**
 * Compute a user's entitlement and enrich with collection block status.
 * Phase 5 — an overdue unpaid code freezes the paid tier until settled.
 */
export async function computeEntitlementWithBlock(
  user: User,
  now: Date = new Date()
): Promise<EntitlementResponse> {
  const base = computeEntitlement(user, now);
  const blocked = await isUserCollectionBlocked(user.id, now);
  return { ...base, collection_blocked: blocked };
}

/** The 24-hour settlement window in milliseconds. */
export const WINDOW_MS = COLLECTION_HOURS * 60 * 60 * 1000;

/** Whole hours left before a redeemed-unsettled code goes overdue (0 = none). */
export function hoursLeftFor(redeemedAtIso: string | null, now: Date): number {
  if (!redeemedAtIso) return 0;
  const redeemedMs = new Date(redeemedAtIso).getTime();
  if (!Number.isFinite(redeemedMs)) return 0;
  return Math.max(0, Math.floor((redeemedMs + WINDOW_MS - now.getTime()) / 3_600_000));
}

/** True when the code was redeemed but never settled and its 24h window passed. */
export function isCodeOverdue(code: Pick<ActivationCode, "is_redeemed" | "is_settled" | "redeemed_at">, now: Date): boolean {
  return Boolean(code.is_redeemed && !code.is_settled && code.redeemed_at &&
    now.getTime() - new Date(code.redeemed_at).getTime() > WINDOW_MS);
}

/**
 * True when the user has ANY redeemed activation code that is unsettled AND
 * past its 24h window → the paid tier must be treated as blocked.
 */
export async function isUserCollectionBlocked(userId: string, now: Date = new Date()): Promise<boolean> {
  const db = getDb();
  const { data, error } = await db
    .from("activation_codes")
    .select("redeemed_at, is_settled")
    .eq("redeemed_by_user_id", userId)
    .eq("is_redeemed", true);
  if (error || !data) return false;
  return (data as unknown as Pick<ActivationCode, "redeemed_at" | "is_settled">[]).some((c) =>
    isCodeOverdue({ is_redeemed: true, is_settled: c.is_settled, redeemed_at: c.redeemed_at }, now)
  );
}

/** Get the distinct student ids currently auto-blocked by overdue codes. */
export async function blockedStudentIds(now: Date = new Date()): Promise<Set<string>> {
  const db = getDb();
  const { data, error } = await db
    .from("activation_codes")
    .select("redeemed_by_user_id, redeemed_at, is_settled")
    .eq("is_redeemed", true);
  const ids = new Set<string>();
  if (error || !data) return ids;
  for (const c of data as unknown as Pick<ActivationCode, "redeemed_by_user_id" | "redeemed_at" | "is_settled">[]) {
    if (c.redeemed_by_user_id &&
        isCodeOverdue({ is_redeemed: true, is_settled: c.is_settled, redeemed_at: c.redeemed_at }, now)) {
      ids.add(c.redeemed_by_user_id);
    }
  }
  return ids;
}

/** The full collection ledger — every institute with its generated/redeemed/unsettled codes. */
export async function buildCollectionLedger(now: Date = new Date()): Promise<CollectionLedgerResponse> {
  const db = getDb();
  const [instRes, codeRes] = await Promise.all([
    db.from("institutes").select("*").order("created_at", { ascending: false }),
    db.from("activation_codes").select("*"),
  ]);
  const institutes = (instRes.data ?? []) as unknown as Institute[];
  const codes = (codeRes.data ?? []) as unknown as ActivationCode[];

  const byInstitute = new Map<string, ActivationCode[]>();
  for (const c of codes) {
    if (!c.institute_id) continue;
    const arr = byInstitute.get(c.institute_id) ?? [];
    arr.push(c);
    byInstitute.set(c.institute_id, arr);
  }

  const rows: InstituteLedgerRow[] = institutes.map((inst) => {
    const instCodes = byInstitute.get(inst.id) ?? [];
    const redeemed = instCodes.filter((c) => c.is_redeemed);
    const settled = redeemed.filter((c) => c.is_settled);
    const unsettled = redeemed.filter((c) => !c.is_settled);
    const overdue = unsettled.filter((c) => isCodeOverdue(c, now));

    const blocked = new Set<string>();
    for (const c of overdue) if (c.redeemed_by_user_id) blocked.add(c.redeemed_by_user_id);

    const ledgerCodes: InstituteLedgerCode[] = redeemed.map((c) => ({
      id: c.id,
      code: c.code,
      redeemed_by_user_id: c.redeemed_by_user_id,
      redeemed_at: c.redeemed_at,
      is_settled: c.is_settled,
      settled_at: c.settled_at,
      overdue: isCodeOverdue(c, now),
      hours_left: hoursLeftFor(c.redeemed_at, now),
    })).sort((a, b) =>
      a.overdue === b.overdue
        ? (Number(b.is_settled) - Number(a.is_settled)) || (a.hours_left - b.hours_left)
        : b.overdue ? 1 : -1
    );

    return {
      institute: inst,
      generated: instCodes.length,
      redeemed: redeemed.length,
      settled: settled.length,
      unsettled: unsettled.length,
      overdue: overdue.length,
      dues: redeemed.reduce((sum, c) => sum + (inst.share_per_code || 0), 0),
      blocked_students: blocked.size,
      codes: ledgerCodes,
    };
  });

  const totals = rows.reduce(
    (acc, r) => ({
      generated: acc.generated + r.generated,
      redeemed: acc.redeemed + r.redeemed,
      settled: acc.settled + r.settled,
      unsettled: acc.unsettled + r.unsettled,
      overdue: acc.overdue + r.overdue,
      dues: acc.dues + r.dues,
    }),
    { generated: 0, redeemed: 0, settled: 0, unsettled: 0, overdue: 0, dues: 0 }
  );

  return { institutes: rows, totals };
}

/**
 * Marks every unsettled redeemed code of the institute as settled (now).
 * Returns the number of codes settled (and thus students un-blocked).
 * The actual money transfer happens OUTSIDE the app — this is the ledger act.
 */
export function settleInstitute(instituteId: string, now: Date = new Date()): Promise<number> {
  return (async () => {
    const db = getDb();
    const dbAny = db as unknown as {
      from: (t: string) => {
        update: (patch: Record<string, unknown>) => {
          eq: (col: string, v: unknown) => {
            eq: (col2: string, v2: unknown) => {
              eq: (col3: string, v3: unknown) => {
                select: (cols?: string | string[]) => Promise<{ data: unknown; error: unknown }>;
              };
            };
          };
        };
      };
    };
    const { data, error } = await dbAny
      .from("activation_codes")
      .update({ is_settled: true, settled_at: now.toISOString() })
      .eq("institute_id", instituteId)
      .eq("is_redeemed", true)
      .eq("is_settled", false)
      .select("*");
    if (error) throw new Error(error instanceof Error ? error.message : String(error));
    return Array.isArray(data) ? data.length : 0;
  })();
}
