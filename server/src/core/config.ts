import type { SupabaseClient } from "@be-native/shared";

export interface AppSettings {
  /** Slow-transit gate delay in milliseconds (default 60s = 60_000). */
  slow_gate_ms: number;
  /** Public-transit gate delay in milliseconds (default 25s). */
  transit_gate_ms: number;
  /** Fast taxi energy cost (default 10). */
  fast_transit_cost: number;
  /** Taxi cost for public-transit mode (default 2). */
  transit_cost: number;
  /** Bypass the slow gate for a brand-new user's very first trip. */
  bypass_first_request: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  slow_gate_ms: 60_000,
  transit_gate_ms: 25_000,
  fast_transit_cost: 10,
  transit_cost: 2,
  bypass_first_request: true,
};
const KEYS = [
  "slow_gate_ms",
  "transit_gate_ms",
  "fast_transit_cost",
  "transit_cost",
  "bypass_first_request",
] as const;

export function keys(): string[] {
  return [...KEYS];
}

// In-memory cache; lazily loaded from the `settings` table at startup and
// refreshed by the admin API whenever a knob changes.
let cache: AppSettings = { ...DEFAULT_SETTINGS };

export function getSlowGateMs(): number {
  return cache.slow_gate_ms;
}

export function getTransitGateMs(): number {
  return cache.transit_gate_ms;
}

export function getFastTransitCost(): number {
  return cache.fast_transit_cost;
}

export function getTransitCost(): number {
  return cache.transit_cost;
}

export function getBypassFirstRequest(): boolean {
  return cache.bypass_first_request;
}

/** Load persisted settings from DB (idempotent; keeps defaults on failure). */
export async function loadSettings(db: SupabaseClient): Promise<AppSettings> {
  try {
    const { data, error } = await db.from("settings").select("key, value");
    if (error) throw error;
    const fresh: AppSettings = { ...DEFAULT_SETTINGS };
    for (const row of data ?? []) {
      if (row.key === "slow_gate_ms") {
        const value = (row.value as { slow_gate_ms?: number } | number | null);
        if (value && typeof value === "number") fresh.slow_gate_ms = value;
      }
      if (row.key === "transit_gate_ms") {
        const value = (row.value as { transit_gate_ms?: number } | number | null);
        if (value && typeof value === "number") fresh.transit_gate_ms = value;
      }
      if (row.key === "fast_transit_cost") {
        const value = (row.value as { fast_transit_cost?: number } | number | null);
        if (value && typeof value === "number") fresh.fast_transit_cost = value;
      }
      if (row.key === "transit_cost") {
        const value = (row.value as { transit_cost?: number } | number | null);
        if (value && typeof value === "number") fresh.transit_cost = value;
      }
      if (row.key === "bypass_first_request") {
        const value = (row.value as { bypass_first_request?: boolean } | boolean | null);
        if (value !== null && value !== undefined) fresh.bypass_first_request = Boolean(value);
      }
    }
    cache = fresh;
  } catch {
    // keep the in-memory default — server still boots safely
  }
  return { ...cache };
}

/** Apply a partial settings update: persist + refresh the in-memory cache. */
export async function updateSettings(
  db: SupabaseClient,
  patch: Partial<AppSettings>
): Promise<AppSettings> {
  if (patch.slow_gate_ms !== undefined) {
    const ms = Math.max(5_000, Math.min(300_000, Math.round(patch.slow_gate_ms)));
    await db
      .from("settings")
      .upsert({ key: "slow_gate_ms", value: ms as never, updated_at: new Date().toISOString() });
    cache.slow_gate_ms = ms;
  }
  if (patch.transit_gate_ms !== undefined) {
    const ms = Math.max(5_000, Math.min(120_000, Math.round(patch.transit_gate_ms)));
    await db
      .from("settings")
      .upsert({ key: "transit_gate_ms", value: ms as never, updated_at: new Date().toISOString() });
    cache.transit_gate_ms = ms;
  }
  if (patch.fast_transit_cost !== undefined) {
    const cost = Math.max(0, Math.min(100, Math.round(patch.fast_transit_cost)));
    await db
      .from("settings")
      .upsert({ key: "fast_transit_cost", value: cost as never, updated_at: new Date().toISOString() });
    cache.fast_transit_cost = cost;
  }
  if (patch.transit_cost !== undefined) {
    const cost = Math.max(0, Math.min(50, Math.round(patch.transit_cost)));
    await db
      .from("settings")
      .upsert({ key: "transit_cost", value: cost as never, updated_at: new Date().toISOString() });
    cache.transit_cost = cost;
  }
  if (patch.bypass_first_request !== undefined) {
    await db
      .from("settings")
      .upsert({ key: "bypass_first_request", value: Boolean(patch.bypass_first_request) as never, updated_at: new Date().toISOString() });
    cache.bypass_first_request = Boolean(patch.bypass_first_request);
  }
  return { ...cache };
}