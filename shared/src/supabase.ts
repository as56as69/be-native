import { createClient, type SupabaseClient, type SupabaseClientOptions } from "@supabase/supabase-js";

/**
 * Creates a Supabase/PostgreSQL client from explicit credentials.
 * The server passes SUPABASE_URL / SUPABASE_ANON_KEY (from server/.env);
 * the browser build can pass VITE_* equivalents if needed.
 */
export function createSupabaseClient(
  url: string,
  anonKey: string,
  options?: SupabaseClientOptions<any>
): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error(
      "Supabase URL and anon key are required. Set SUPABASE_URL & SUPABASE_ANON_KEY."
    );
  }
  if (!/^https?:\/\//.test(url)) {
    throw new Error(`Supabase URL must start with http(s):// — got: "${url}"`);
  }
  return createClient(url, anonKey, options);
}

export type { SupabaseClient };