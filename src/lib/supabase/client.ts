import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-safe env only. Never read SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY
 * (or any non-VITE_ secret) here.
 * The publishable/anon key is designed for client use and is constrained by RLS.
 * process.env fallback supports local Node verification scripts / SSR without leaking
 * secrets (Vite still inlines only VITE_* into the client bundle).
 */
const viteEnv =
  (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
const url = viteEnv["VITE_SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
const key =
  viteEnv["VITE_SUPABASE_PUBLISHABLE_KEY"] || process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];

/** True when browser env is configured for Supabase. */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && key);
}

let browserClient: SupabaseClient | null = null;

/** Centralized browser client (publishable/anon key only — never service role). */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!browserClient) {
    browserClient = createClient(url!, key!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return browserClient;
}
