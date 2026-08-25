import type { SupabaseClient } from "@supabase/supabase-js";
import { ingestJobsFromAdapter } from "@/lib/ingestion/ingestJobs";
import { listRegistry } from "@/lib/ingestion/sourceRegistry";
import type { IngestionSummary, JobSourceType } from "@/lib/ingestion/types";

export type MultiSourceIngestOptions = {
  /** Run only these registry ids */
  ids?: string[];
  /** Run only this source type */
  sourceType?: JobSourceType;
  /** Delay between sources (ms) — politeness / rate limiting */
  delayMs?: number;
  /** Optional progress logger (never logs secrets) */
  onSourceComplete?: (summary: IngestionSummary, index: number, total: number) => void;
};

export type MultiSourceIngestResult = {
  sources: IngestionSummary[];
  totals: {
    sourcesAttempted: number;
    sourcesSucceeded: number;
    sourcesFailed: number;
    recordsParsed: number;
    productJobsFound: number;
    newJobs: number;
    updatedJobs: number;
    duplicatesMerged: number;
    errors: number;
  };
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run enabled adapters with per-source failure isolation.
 * A broken board/tracker must not terminate remaining sources.
 * Does NOT mass-deactivate jobs on fetch failure.
 */
export async function ingestAllSources(
  supabase: SupabaseClient,
  options: MultiSourceIngestOptions = {},
): Promise<MultiSourceIngestResult> {
  const entries = listRegistry({
    enabledOnly: true,
    ...(options.sourceType ? { sourceType: options.sourceType } : {}),
    ...(options.ids ? { ids: options.ids } : {}),
  });
  const delayMs = options.delayMs ?? 350;
  const sources: IngestionSummary[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!;
    let summary: IngestionSummary;
    try {
      const adapter = entry.createAdapter();
      summary = await ingestJobsFromAdapter(adapter, supabase);
      // discover() failures are already caught inside ingestJobsFromAdapter,
      // but adapter construction / unexpected throws are isolated here too.
      if (summary.errorMessage && summary.productJobsFound === 0 && summary.recordsParsed === 0) {
        // keep as failed for totals
      }
    } catch (e) {
      summary = {
        source: entry.label,
        recordsParsed: 0,
        productJobsFound: 0,
        newJobs: 0,
        updatedJobs: 0,
        duplicatesMerged: 0,
        errors: 1,
        errorMessage: e instanceof Error ? e.message : "Source failed",
      };
    }
    sources.push(summary);
    options.onSourceComplete?.(summary, i, entries.length);
    if (i < entries.length - 1 && delayMs > 0) await sleep(delayMs);
  }

  const totals = {
    sourcesAttempted: sources.length,
    sourcesSucceeded: sources.filter((s) => !s.errorMessage || s.recordsParsed > 0).length,
    sourcesFailed: sources.filter((s) => Boolean(s.errorMessage) && s.recordsParsed === 0).length,
    recordsParsed: sources.reduce((n, s) => n + s.recordsParsed, 0),
    productJobsFound: sources.reduce((n, s) => n + s.productJobsFound, 0),
    newJobs: sources.reduce((n, s) => n + s.newJobs, 0),
    updatedJobs: sources.reduce((n, s) => n + s.updatedJobs, 0),
    duplicatesMerged: sources.reduce((n, s) => n + s.duplicatesMerged, 0),
    errors: sources.reduce((n, s) => n + s.errors, 0),
  };

  // Refine succeeded/failed: treat explicit discover failure (errorMessage + 0 parsed) as failed
  totals.sourcesFailed = sources.filter(
    (s) => Boolean(s.errorMessage) && s.recordsParsed === 0 && s.newJobs === 0 && s.updatedJobs === 0,
  ).length;
  totals.sourcesSucceeded = totals.sourcesAttempted - totals.sourcesFailed;

  return { sources, totals };
}
