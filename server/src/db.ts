import "dotenv/config";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import WebSocket from "ws";

import { createSupabaseClient, type Database } from "@be-native/shared";

import { localDatabase, localDbMode } from "./db/local.js";

const RealtimeWebSocket = WebSocket as unknown as WebSocketLikeConstructor;

let cached: SupabaseClient<Database> | null = null;

/**
 * Lazily-initialized typed client.
 *
 * When Supabase credentials are configured (server/.env) the real Supabase
 * client is built. Otherwise the LOCAL dev database is used — a memory-backed
 * PostgREST-shaped store seeded with the same content as `db/seed.ts`,
 * persisted to `server/.local-db.json`.
 */
export function getDb(): SupabaseClient<Database> {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL ?? "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";

  if (url && key) {
    cached = createSupabaseClient(url, key, {
      realtime: { transport: RealtimeWebSocket },
    }) as unknown as SupabaseClient<Database>;
    return cached;
  }

  console.warn(
    "⚠  Supabase not configured — falling back to the LOCAL dev database " +
      "(server/.local-db.json). Copy server/.env.example to server/.env and " +
      "set SUPABASE_URL + a key to go remote."
  );
  cached = localDatabase() as unknown as SupabaseClient<Database>;
  return cached;
}

/** True when the server answered from the local dev database. */
export function isLocalDev(): boolean {
  return localDbMode() === "local";
}