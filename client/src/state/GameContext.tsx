import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type {
  ActivationRedeemResult,
  EntitlementResponse,
  EntitlementStatus,
  ScenarioPayload,
  ScenarioPayloadSource,
  Spot,
  TransitLockedResponse,
  TransitMode,
  TransitStartResponse,
  TransitUnlockedResponse,
  TrialPackBuyResult,
} from "@be-native/shared";

import { ApiError, api, type UserProfile } from "../lib/api";

export interface UserProfileWithEntitlement extends UserProfile {
  status?: EntitlementStatus;
  requires_activation?: boolean;
  trial_days_left?: number;
  tier_days_left?: number;
}

// Demo guest — seeded by server/db/seed.ts (50 credits, standard tier).
export const GUEST_USER_ID = "00000000-0000-4000-8000-0000000000b1";

export type Screen = "story" | "map" | "scene";

export interface TransitResult {
  payload: ScenarioPayload;
  source: ScenarioPayloadSource;
  mode: TransitMode;
  token: number;
  spotId: string;
}

interface GameState {
  screen: Screen;
  user: UserProfile | null;
  entitlement: EntitlementResponse | null;
  spots: Spot[];
  activeSpot: Spot | null;
  transit: TransitResult | null;
  voucherOpen: boolean;
  apiConnected: boolean;
  authChecked: boolean;

  boot: () => Promise<void>;
  register: (input: { name: string; phone: string }) => Promise<UserProfile>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshEntitlement: () => Promise<void>;
  tapStory: () => void;
  openSpot: (spot: Spot) => void;
  closeSpot: () => void;
  startTransit: (mode: TransitMode) => Promise<TransitStartResponse>;
  enterScene: (response: TransitStartResponse, mode: TransitMode, spotId: string) => void;
  exitScene: () => void;
  openVoucher: () => void;
  closeVoucher: () => void;
  redeemVoucher: (code: string) => Promise<number | null>;
  redeemActivation: (code: string) => Promise<ActivationRedeemResult>;
  buyTrialPack: () => Promise<TrialPackBuyResult>;
}

const GameContext = createContext<GameState | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>("story");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [entitlement, setEntitlement] = useState<EntitlementResponse | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [activeSpot, setActiveSpot] = useState<Spot | null>(null);
  const [transit, setTransit] = useState<TransitResult | null>(null);
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const stored = localStorage.getItem("benative.user.id");
      if (stored) setUser(await api.user(stored));
    } catch {
      // keep last known profile; map still usable offline
    }
  }, []);

  const refreshEntitlement = useCallback(async () => {
    try {
      const stored = localStorage.getItem("benative.user.id");
      if (stored) setEntitlement(await api.entitlement(stored));
    } catch {
      // entitlement unavailable — the client keeps whatever it saw last
    }
  }, []);

  const boot = useCallback(async () => {
    try {
      const status = await api.dbStatus();
      setApiConnected(Boolean(status.healthy) && status.configured);
    } catch {
      setApiConnected(false);
    }
    const stored = localStorage.getItem("benative.user.id");
    const [loadedSpots, profile] = await Promise.all([
      api.spots(),
      stored ? api.user(stored) : Promise.resolve(null),
    ]);
    setSpots(loadedSpots);
    if (profile) setUser(profile);
    if (stored) {
      try {
        setEntitlement(await api.entitlement(stored));
      } catch {
        // non-blocking
      }
    }
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    void boot();
  }, [boot]);

  const tapStory = useCallback(() => setScreen("map"), []);

  const register = useCallback(async (input: { name: string; phone: string }) => {
    const { user: created } = await api.register(input);
    localStorage.setItem("benative.user.id", created.id);
    setUser(created);
    try {
      setEntitlement(await api.entitlement(created.id));
    } catch {
      // non-blocking
    }
    return created;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("benative.user.id");
    setUser(null);
    setEntitlement(null);
    setScreen("story");
  }, []);

  /** Clicking a map marker opens the ScenarioViewer DIRECTLY — no gate hop.
   *  The viewer only needs `transit.spotId` to fetch the graph, so we plant a
   *  lightweight entry here and flip to the scene screen. */
  const openSpot = useCallback((spot: Spot) => {
    const entry: TransitResult = {
      payload: { dialogue: [], cultural_bridge: "", render_mode: "CARD_MODE", hints: [] },
      source: "synthesis",
      mode: "slow",
      token: 0,
      spotId: spot.id,
    };
    setTransit(entry);
    setActiveSpot(null);
    setScreen("scene");
  }, []);
  const closeSpot = useCallback(() => setActiveSpot(null), []);

  const startTransit = useCallback(
    async (mode: TransitMode): Promise<TransitStartResponse> => {
      const from = spots.find((s) => !s.is_locked) ?? spots[0];
      const to = activeSpot ?? from;
      const stored = localStorage.getItem("benative.user.id") ?? GUEST_USER_ID;
      const response = await api.transitStart({
        user_id: stored,
        from_spot_id: from?.id ?? stored,
        to_spot_id: to.id ?? stored,
        mode,
      });
      if (response.status === "unlocked") {
        await refreshUser();
      }
      return response;
    },
    [spots, activeSpot, refreshUser]
  );

  const enterScene = useCallback(
    (response: TransitStartResponse, mode: TransitMode, spotId: string) => {
      if (response.status !== "unlocked") return;
      const unlocked = response as TransitUnlockedResponse;
      const entry: TransitResult = {
        payload: unlocked.payload,
        source: unlocked.generation,
        mode,
        token: unlocked.balance ?? 0,
        spotId,
      };
      setTransit(entry);
      setActiveSpot(null);
      setScreen("scene");
    },
    []
  );

  const exitScene = useCallback(() => {
    // transit stays in memory so the crossfading scene keeps its reels on the
    // way out; any new entry overwrites it (enterScene sets a fresh payload).
    setScreen("map");
  }, []);

  const openVoucher = useCallback(() => setVoucherOpen(true), []);
  const closeVoucher = useCallback(() => setVoucherOpen(false), []);

  const redeemVoucher = useCallback(
    async (code: string): Promise<number | null> => {
      const stored = localStorage.getItem("benative.user.id");
      if (!stored) throw new ApiError(401, "سجّل دخولك أولاً", "NO_SESSION");
      const result = await api.redeemVoucher(stored, code);
      await refreshUser();
      return result.balance;
    },
    [refreshUser]
  );

  const redeemActivation = useCallback(
    async (code: string): Promise<ActivationRedeemResult> => {
      const stored = localStorage.getItem("benative.user.id");
      if (!stored) throw new ApiError(401, "سجّل دخولك أولاً", "NO_SESSION");
      const result = await api.redeemActivation(stored, code);
      await refreshUser();
      await refreshEntitlement();
      return result;
    },
    [refreshUser, refreshEntitlement]
  );

  const buyTrialPack = useCallback(async (): Promise<TrialPackBuyResult> => {
    const stored = localStorage.getItem("benative.user.id");
    if (!stored) throw new ApiError(401, "سجّل دخولك أولاً", "NO_SESSION");
    const result = await api.buyTrialPack(stored);
    await refreshUser();
    await refreshEntitlement();
    return result;
  }, [refreshUser, refreshEntitlement]);

  const value = useMemo<GameState>(
    () => ({
      screen,
      user,
      entitlement,
      spots,
      activeSpot,
      transit,
      voucherOpen,
      apiConnected,
      authChecked,
      boot,
      tapStory,
      register,
      logout,
      refreshUser,
      refreshEntitlement,
      openSpot,
      closeSpot,
      startTransit,
      enterScene,
      exitScene,
      openVoucher,
      closeVoucher,
      redeemVoucher,
      redeemActivation,
      buyTrialPack,
    }),
    [
      screen,
      user,
      entitlement,
      spots,
      activeSpot,
      transit,
      voucherOpen,
      apiConnected,
      authChecked,
      boot,
      tapStory,
      register,
      logout,
      refreshUser,
      refreshEntitlement,
      openSpot,
      closeSpot,
      startTransit,
      enterScene,
      exitScene,
      openVoucher,
      closeVoucher,
      redeemVoucher,
      redeemActivation,
      buyTrialPack,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameState {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside <GameProvider>");
  return ctx;
}

export function isLockedResponse(r: TransitStartResponse): r is TransitLockedResponse {
  return r.status === "locked";
}

export { ApiError };