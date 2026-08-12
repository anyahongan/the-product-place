import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * SERVER-ONLY Supabase admin client.
 *
 * Prefers SUPABASE_SECRET_KEY (new publishable/secret API keys).
 * Optional fallback: SUPABASE_SERVICE_ROLE_KEY (legacy).
 *
 * Both bypass Row Level Security (RLS). Never:
 * - prefix either secret with VITE_
 * - import this module from client components or shared browser modules
 * - log, return, or hardcode the key
 * - commit real values to Git
 *
 * Deployed Edge Functions must read privileged credentials from Supabase
 * project / Deno.env, not from the browser.
 */
export function createServiceSupabase(): SupabaseClient {
  // URL is public; prefer server-only SUPABASE_URL, allow Vite URL as fallback for local DX.
  const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
  const key =
    process.env["SUPABASE_SECRET_KEY"] || process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL (or VITE_SUPABASE_URL) / SUPABASE_SECRET_KEY for server ingestion.",
    );
  }

  if (key === process.env["VITE_SUPABASE_PUBLISHABLE_KEY"]) {
    throw new Error(
      "SUPABASE_SECRET_KEY must be the secret key, not the publishable/anon key.",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
