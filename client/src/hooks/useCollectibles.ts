import { useCallback, useState } from "react";

import {
  COLLECTIBLES_ADMIN_KEY,
  COLLECTIBLES_SCENARIO_KEY,
  COLLECTIBLES_UNLOCKED_KEY,
  type AdminCollectibleInput,
  type CollectibleCategory,
  type CollectibleItem,
  type ScenarioCollectibleSeed,
} from "@be-native/shared";

import { DEFAULT_COLLECTIBLES } from "../data/seedData";

/**
 * "Traces / أثر" — local-first collectibles ledger.
 *
 * DUAL-SOURCED:
 *  - SCENARIO items arrive as `ScenarioCollectibleSeed`s from scenario nodes
 *    (registered via `registerScenarioItems`, deduped by phrase+targetSlang).
 *  - ADMIN items are created in the Admin panel via `addAdminItem` and persist
 *    in their own localStorage envelope so they survive reloads.
 *
 * Unlock state is a single id → ISO-timestamp map persisted under
 * `native_slang_unlocked_traces`.
 *
 * NO UI HERE — data contracts + persistence only.
 */

interface UseCollectiblesResult {
  /** Full catalog (scenario + admin) in memory. */
  items: CollectibleItem[];
  /** Marks an item as unlocked and stamps the unlock timestamp. */
  unlockItem: (id: string) => void;
  /** Whether a given trace id is currently unlocked. */
  isUnlocked: (id: string) => boolean;
  /** All unlocked traces with their metadata. */
  getUnlockedItems: () => CollectibleItem[];
  /** Registers an admin-created trace (source: "ADMIN", id auto-generated). */
  addAdminItem: (input: AdminCollectibleInput) => CollectibleItem;
  /** Get-or-create SCENARIO traces from the given seeds; returns resolved items. */
  registerScenarioItems: (seeds: ScenarioCollectibleSeed[]) => CollectibleItem[];
  /** Removes a admin-created trace (admin traces are purged from localStorage too). */
  removeAdminItem: (id: string) => void;
  /** Updates an admin-created trace's phrase/targetSlang/contextNote/category. */
  updateAdminItem: (id: string, patch: Partial<Pick<CollectibleItem, "phrase" | "targetSlang" | "contextNote" | "category">>) => void;
  /**
   * Trace counts for a category — total covers BOTH scenario-seeded items
   * and admin-created items; unlocked reflects the persisted unlock map.
   */
  getCategoryStats: (category: CollectibleCategory) => { total: number; unlocked: number };
  /** A still-locked admin trace inside a category (for scenario seed pools). */
  nextAdminTraceForCategory: (category: CollectibleCategory) => CollectibleItem | null;
  /** Wipes custom overrides and restores the base seed baseline (all unlocked). */
  resetToSeed: () => void;
}

type UnlockMap = Record<string, string>;

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — fail silently, state still works in-memory */
  }
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `trace_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function sameTrace(a: Pick<CollectibleItem, "phrase" | "targetSlang">, b: Pick<CollectibleItem, "phrase" | "targetSlang">) {
  return a.phrase === b.phrase && a.targetSlang === b.targetSlang;
}

/** Seed baseline collapsed into a dedupe key (phrase|targetSlang). */
const SEED_TRACE_KEYS = new Set(
  DEFAULT_COLLECTIBLES.map((trace) => `${trace.phrase}|${trace.targetSlang}`),
);

/** Seeds (unlocked by default) merged under any custom localStorage overrides. */
function hydrateItems(): CollectibleItem[] {
  const scenario = readJSON<CollectibleItem[]>(COLLECTIBLES_SCENARIO_KEY, []).map((item) => ({
    ...item,
    source: "SCENARIO" as const,
  }));
  const admin = readJSON<CollectibleItem[]>(COLLECTIBLES_ADMIN_KEY, []).map((item) => ({
    ...item,
    source: "ADMIN" as const,
  }));
  const custom = [...scenario, ...admin].filter(
    (item) => !SEED_TRACE_KEYS.has(`${item.phrase}|${item.targetSlang}`),
  );
  return [...custom, ...DEFAULT_COLLECTIBLES];
}

/** The base seed state (all seeds unlocked). */
function seedUnlockMap(): UnlockMap {
  return Object.fromEntries(
    DEFAULT_COLLECTIBLES.map((item) => [item.id, item.unlockedAt ?? new Date().toISOString()]),
  );
}

export function useCollectibles(): UseCollectiblesResult {
  const [items, setItems] = useState<CollectibleItem[]>(() => hydrateItems());

  const [unlockedIds, setUnlockedIds] = useState<UnlockMap>(() => ({
    ...seedUnlockMap(),
    ...readJSON<UnlockMap>(COLLECTIBLES_UNLOCKED_KEY, {}),
  }));

  const unlockItem = useCallback((id: string) => {
    const now = new Date().toISOString();
    setUnlockedIds((prev) => {
      if (prev[id]) return prev;
      const next = { ...prev, [id]: now };
      writeJSON(COLLECTIBLES_UNLOCKED_KEY, next);
      return next;
    });
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isUnlocked: true, unlockedAt: now } : item)),
    );
  }, []);

  const isUnlocked = useCallback(
    (id: string): boolean => unlockedIds[id] !== undefined,
    [unlockedIds],
  );

  const getUnlockedItems = useCallback((): CollectibleItem[] => {
    const unlocked = new Set(Object.keys(unlockedIds));
    return items.filter((item) => unlocked.has(item.id) || item.isUnlocked);
  }, [items, unlockedIds]);

  const addAdminItem = useCallback((input: AdminCollectibleInput): CollectibleItem => {
    // Admin traces always ship UNLOCKED so they surface instantly in the
    // global scrapbook drawer the moment they are created.
    const item: CollectibleItem = {
      ...input,
      id: makeId(),
      source: "ADMIN",
      isUnlocked: true,
      unlockedAt: input.unlockedAt ?? new Date().toISOString(),
      createdAt: input.createdAt ?? new Date().toISOString(),
    };
    setItems((prev) => {
      if (prev.some((existing) => existing.source === "ADMIN" && sameTrace(existing, item))) {
        return prev;
      }
      const next = [item, ...prev];
      writeJSON(
        COLLECTIBLES_ADMIN_KEY,
        next.filter((existing) => existing.source === "ADMIN"),
      );
      return next;
    });
    return item;
  }, []);

  const registerScenarioItems = useCallback(
    (seeds: ScenarioCollectibleSeed[]): CollectibleItem[] => {
      const resolved: CollectibleItem[] = [];
      setItems((prev) => {
        let next = prev;
        for (const seed of seeds) {
          let item = next.find((existing) => sameTrace(existing, seed));
          if (!item) {
            item = {
              ...seed,
              id: makeId(),
              source: "SCENARIO",
              isUnlocked: false,
              createdAt: new Date().toISOString(),
            };
            next = [item, ...next];
          }
          resolved.push(item);
        }
        writeJSON(
          COLLECTIBLES_SCENARIO_KEY,
          next.filter((existing) => existing.source === "SCENARIO"),
        );
        return next;
      });
      return resolved;
    },
    [],
  );

  const removeAdminItem = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      writeJSON(
        COLLECTIBLES_ADMIN_KEY,
        next.filter((existing) => existing.source === "ADMIN"),
      );
      return next;
    });
  }, []);

  const updateAdminItem = useCallback(
    (id: string, patch: Partial<Pick<CollectibleItem, "phrase" | "targetSlang" | "contextNote" | "category">>) => {
      setItems((prev) => {
        const next = prev.map((item) => (item.id === id ? { ...item, ...patch } : item));
        writeJSON(
          COLLECTIBLES_ADMIN_KEY,
          next.filter((existing) => existing.source === "ADMIN"),
        );
        return next;
      });
    },
    [],
  );

  const getCategoryStats = useCallback(
    (category: CollectibleCategory): { total: number; unlocked: number } => {
      const unlocked = new Set(Object.keys(unlockedIds));
      const inCategory = items.filter((item) => item.category === category);
      return {
        total: inCategory.length,
        unlocked: inCategory.filter((item) => unlocked.has(item.id) || item.isUnlocked).length,
      };
    },
    [items, unlockedIds],
  );

  const nextAdminTraceForCategory = useCallback(
    (category: CollectibleCategory): CollectibleItem | null => {
      const unlocked = new Set(Object.keys(unlockedIds));
      const candidates = items.filter(
        (item) =>
          item.source === "ADMIN" &&
          item.category === category &&
          !(unlocked.has(item.id) || item.isUnlocked),
      );
      if (candidates.length === 0) return null;
      return candidates[Math.floor(Math.random() * candidates.length)];
    },
    [items, unlockedIds],
  );

  const resetToSeed = useCallback(() => {
    try {
      window.localStorage.removeItem(COLLECTIBLES_SCENARIO_KEY);
      window.localStorage.removeItem(COLLECTIBLES_ADMIN_KEY);
      window.localStorage.removeItem(COLLECTIBLES_UNLOCKED_KEY);
    } catch {
      /* private mode — in-memory reset still applies */
    }
    setItems([...DEFAULT_COLLECTIBLES]);
    setUnlockedIds(seedUnlockMap());
  }, []);

  return {
    items,
    unlockItem,
    isUnlocked,
    getUnlockedItems,
    addAdminItem,
    registerScenarioItems,
    removeAdminItem,
    updateAdminItem,
    getCategoryStats,
    nextAdminTraceForCategory,
    resetToSeed,
  };
}