import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type {
  ScenarioPayload,
  ScenarioPayloadSource,
  Spot,
  TransitLockedResponse,
  TransitMode,
  TransitStartResponse,
  TransitUnlockedResponse,
} from "@be-native/shared";

import { ApiError, api, type UserProfile } from "../lib/api";

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
  spots: Spot[];
  activeSpot: Spot | null;
  transit: TransitResult | null;
  voucherOpen: boolean;
  apiConnected: boolean;

  boot: () => Promise<void>;
  tapStory: () => void;
  openSpot: (spot: Spot) => void;
  closeSpot: () => void;
  startTransit: (mode: TransitMode) => Promise<TransitStartResponse>;
  enterScene: (response: TransitStartResponse, mode: TransitMode, spotId: string) => void;
  exitScene: () => void;
  refreshUser: () => Promise<void>;
  openVoucher: () => void;
  closeVoucher: () => void;
  redeemVoucher: (code: string) => Promise<number | null>;
}

const GameContext = createContext<GameState | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>("story");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [activeSpot, setActiveSpot] = useState<Spot | null>(null);
  const [transit, setTransit] = useState<TransitResult | null>(null);
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      setUser(await api.user(GUEST_USER_ID));
    } catch {
      // keep last known profile; map still usable offline
    }
  }, []);

  const boot = useCallback(async () => {
    try {
      const status = await api.dbStatus();
      setApiConnected(Boolean(status.healthy) && status.configured);
    } catch {
      setApiConnected(false);
    }
    const [loadedSpots, profile] = await Promise.all([api.spots(), api.user(GUEST_USER_ID)]);
    setSpots(loadedSpots);
    setUser(profile);
  }, []);

  useEffect(() => {
    void boot();
  }, [boot]);

  const tapStory = useCallback(() => setScreen("map"), []);

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
      const response = await api.transitStart({
        user_id: GUEST_USER_ID,
        from_spot_id: from?.id ?? GUEST_USER_ID,
        to_spot_id: to.id ?? GUEST_USER_ID,
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
      const result = await api.redeemVoucher(GUEST_USER_ID, code);
      await refreshUser();
      return result.balance;
    },
    [refreshUser]
  );

  const value = useMemo<GameState>(
    () => ({
      screen,
      user,
      spots,
      activeSpot,
      transit,
      voucherOpen,
      apiConnected,
      boot,
      tapStory,
      openSpot,
      closeSpot,
      startTransit,
      enterScene,
      exitScene,
      refreshUser,
      openVoucher,
      closeVoucher,
      redeemVoucher,
    }),
    [
      screen,
      user,
      spots,
      activeSpot,
      transit,
      voucherOpen,
      apiConnected,
      boot,
      tapStory,
      openSpot,
      closeSpot,
      startTransit,
      enterScene,
      exitScene,
      refreshUser,
      openVoucher,
      closeVoucher,
      redeemVoucher,
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