import { useState } from "react";
import { ingestCatalogJobsFn } from "@/lib/ingestion/ingestJobs.server";
import type { MultiSourceIngestResult } from "@/lib/ingestion/runIngestion";
import { isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Manual catalog refresh — runs multi-source ingest into Supabase when configured.
 * Requires server SUPABASE_SECRET_KEY. After ingest, reload the job list.
 */
export function CatalogIngestButton({ onComplete }: { onComplete?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<MultiSourceIngestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isSupabaseConfigured()) return null;

  const isDev = import.meta.env.DEV;

  return (
    <div className="mt-4 border-2 border-ink bg-blue-wash shadow-hard-sm">
      <div className="flex items-center justify-between gap-3 border-b-2 border-ink bg-blue px-4 py-2 text-paper">
        <span className="font-display text-sm font-black uppercase tracking-[-0.03em]">
          {isDev ? "Dev · job catalog" : "Job catalog"}
        </span>
        <span className="tag text-paper/80">{isDev ? "Manual ingest" : "Refresh listings"}</span>
      </div>
      <div className="px-4 py-4">
        <p className="text-[0.9rem] text-ink-soft">
          {isDev
            ? "Multi-source → Supabase ingest (no schedule). Requires server SUPABASE_SECRET_KEY."
            : "Pull the latest product roles from configured sources into the shared catalog, then reload listings."}
        </p>
        <div className="mt-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              setError(null);
              void ingestCatalogJobsFn()
                .then((r) => {
                  setResult(r);
                  onComplete?.();
                })
                .catch((e) => setError(e instanceof Error ? e.message : "Ingest failed"))
                .finally(() => setBusy(false));
            }}
            className="focus-ink border-2 border-ink bg-blue px-4 py-2.5 font-display text-sm font-black uppercase text-paper shadow-hard-sm outline-none transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Refreshing…" : isDev ? "Run catalog ingest" : "Refresh job catalog"}
          </button>
        </div>
        {error && <p className="mt-2 text-[0.85rem] text-pink">{error}</p>}
        {result && (
          <div className="mt-3 space-y-1 border-2 border-ink bg-paper px-3 py-3">
            <p className="tag text-ink">
              TOTAL: sources {result.totals.sourcesSucceeded}/{result.totals.sourcesAttempted} ok ·
              parsed {result.totals.recordsParsed} · product {result.totals.productJobsFound} · new{" "}
              {result.totals.newJobs} · updated {result.totals.updatedJobs} · errors{" "}
              {result.totals.errors}
            </p>
            {result.sources
              .filter((s) => s.productJobsFound > 0 || s.errorMessage)
              .slice(0, 12)
              .map((s) => (
                <p key={s.source} className="tag text-ink-faint">
                  {s.source}: product {s.productJobsFound}, new {s.newJobs}, upd {s.updatedJobs}
                  {s.errorMessage ? ` · ${s.errorMessage}` : ""}
                </p>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
