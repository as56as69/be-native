import type { SupabaseClient } from "@be-native/shared";

export interface AppSettings {
  /** Slow-transit gate delay in milliseconds (default 60s = 60_000). */
  slow_gate_ms: number;
}

const DEFAULT_SETTINGS: AppSettings = { slow_gate_ms: 60_000 };
const KEYS = ["slow_gate_ms"] as const;

export function keys(): string[] {
  return [...KEYS];
}

// In-memory cache; lazily loaded from the `settings` table at startup and
// refreshed by the admin API whenever a knob changes.
let cache: AppSettings = { ...DEFAULT_SETTINGS };

export function getSlowGateMs(): number {
  return cache.slow_gate_ms;
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
  return { ...cache };
}