import { useEffect, useState } from "react";

import { api } from "../lib/api";
import { GUEST_USER_ID } from "./GameContext";

// ── minimal module-level store (no external state lib) ─────────────────
// XP is session/persisted progress; energy mirrors the server credits
// balance every time an action consumes it via spend_credits.

export interface UserStoreState {
  xp: number;
  energy: number | null;
}

type Listener = () => void;

const XP_KEY = "be-native.xp";

function loadXp(): number {
  try {
    const raw = Number(window.localStorage.getItem(XP_KEY));
    return Number.isFinite(raw) && raw > 0 ? raw : 0;
  } catch {
    return 0;
  }
}

let state: UserStoreState = { xp: loadXp(), energy: null };
const listeners = new Set<Listener>();

function emit(): void {
  for (const listener of listeners) listener();
}

function persist(): void {
  try {
    window.localStorage.setItem(XP_KEY, String(state.xp));
  } catch {
    // private-mode browsers — XP stays in memory only
  }
}

export const userStore = {
  getState: (): UserStoreState => state,

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  addXP(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) return;
    state = { ...state, xp: state.xp + Math.round(amount) };
    persist();
    emit();
  },

  syncEnergy(balance: number | null): void {
    state = { ...state, energy: balance };
    emit();
  },

  /** Deduct energy server-side (spend_credits); optimistic local fallback. */
  async consumeEnergy(amount: number): Promise<number | null> {
    const optimistic =
      state.energy === null ? null : Math.max(0, state.energy - amount);
    state = { ...state, energy: optimistic };
    emit();
    try {
      const result = await api.consumeEnergy(GUEST_USER_ID, amount);
      state = { ...state, energy: result.balance };
      emit();
      return result.balance;
    } catch {
      return state.energy;
    }
  },

  reset(): void {
    state = { ...state, xp: 0 };
    persist();
    emit();
  },
};

export function useUserStore(): UserStoreState {
  const [snapshot, setSnapshot] = useState<UserStoreState>(state);

  useEffect(() => {
    const unsubscribe = userStore.subscribe(() => setSnapshot({ ...state }));
    setSnapshot({ ...state });
    return unsubscribe;
  }, []);

  return snapshot;
}