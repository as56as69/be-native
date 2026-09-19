/**
 * Server-enforced transit gate (slow-mode throttle).
 *
 * A trip starts locked and unlocks after `delayMs`. The payload is handed out
 * exactly once when the gate expires; the next boarding starts a fresh trip.
 * Time is injectable (`now`) so tests can fast-forward without sleeping.
 */

export interface GateRequestResult {
  phase: "locked" | "unlocked";
  unlockAtMs: number;
  /** true when this request just **opened** a new trip (→ HTTP 202). */
  isNew: boolean;
}

type TripKey = string;

interface TripState {
  unlockAtMs: number;
  delivered: boolean;
}

export class TransitGate {
  private trips = new Map<TripKey, TripState>();

  constructor(
    private readonly now: () => number = Date.now
  ) {}

  private key(userId: string, spotId: string): TripKey {
    return `${userId}::${spotId}`;
  }

  currentTime(): number {
    return this.now();
  }

  /**
   * Board a (slow) transit leg. Returns the phase:
   *  - "locked" + isNew=true  → the trip timer was just armed (202).
   *  - "locked" + isNew=false → still waiting for the gate to open (429).
   *  - "unlocked"             → the gate expired, payload may be served (200).
   */
  request(userId: string, spotId: string, delayMs: number): GateRequestResult {
    const key = this.key(userId, spotId);
    const existing = this.trips.get(key);

    if (!existing || (existing.delivered && this.now() >= existing.unlockAtMs)) {
      const unlockAtMs = this.now() + Math.max(0, delayMs);
      this.trips.set(key, { unlockAtMs, delivered: false });
      return { phase: "locked", unlockAtMs, isNew: true };
    }

    if (this.now() >= existing.unlockAtMs) {
      existing.delivered = true;
      return { phase: "unlocked", unlockAtMs: existing.unlockAtMs, isNew: false };
    }

    return { phase: "locked", unlockAtMs: existing.unlockAtMs, isNew: false };
  }
}