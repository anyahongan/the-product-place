import { createServerFn } from "@tanstack/react-start";
import { ingestJobsFromAdapter } from "@/lib/ingestion/ingestJobs";
import { Vansh2027GitHubAdapter } from "@/lib/ingestion/adapters/vansh2027Adapter";
import { createServiceSupabase } from "@/lib/supabase/serviceClient.server";
import type { IngestionSummary } from "@/lib/ingestion/types";

/**
 * Manual server-side ingestion trigger (no schedule yet).
 *
 * Privileged credential: SUPABASE_SECRET_KEY (preferred) or legacy
 * SUPABASE_SERVICE_ROLE_KEY — server env only.
 * Bypasses RLS — never expose to the browser, never use a VITE_ prefix.
 * Client code may call this RPC; the handler runs only on the server.
 */
export const ingestGitHubJobsFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<IngestionSummary> => {
    const supabase = createServiceSupabase();
    return ingestJobsFromAdapter(new Vansh2027GitHubAdapter(), supabase);
  },
);
