import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-safe env only. Never read SUPABASE_SERVICE_ROLE_KEY (or any non-VITE_ secret) here.
 * The publishable/anon key is designed for client use and is constrained by RLS.
 */
const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined;

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
