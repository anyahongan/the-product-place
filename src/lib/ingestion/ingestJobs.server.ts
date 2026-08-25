import { createServerFn } from "@tanstack/react-start";
import { ingestJobsFromAdapter } from "@/lib/ingestion/ingestJobs";
import { Vansh2027GitHubAdapter } from "@/lib/ingestion/adapters/vansh2027Adapter";
import { ingestAllSources, type MultiSourceIngestResult } from "@/lib/ingestion/runIngestion";
import { createServiceSupabase } from "@/lib/supabase/serviceClient.server";
import type { IngestionSummary } from "@/lib/ingestion/types";

/**
 * Manual server-side ingestion triggers (no schedule yet).
 * Privileged credential: SUPABASE_SECRET_KEY — server env only.
 */

/** Back-compat: Vansh tracker only. */
export const ingestGitHubJobsFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<IngestionSummary> => {
    const supabase = createServiceSupabase();
    return ingestJobsFromAdapter(new Vansh2027GitHubAdapter(), supabase);
  },
);

/** Multi-source catalog ingest (registry-driven). */
export const ingestCatalogJobsFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<MultiSourceIngestResult> => {
    const supabase = createServiceSupabase();
    return ingestAllSources(supabase, { delayMs: 400 });
  },
);
