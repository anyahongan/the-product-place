import { useState } from "react";
import { ingestCatalogJobsFn } from "@/lib/ingestion/ingestJobs.server";
import type { MultiSourceIngestResult } from "@/lib/ingestion/runIngestion";
import { PinkHoverButton } from "@/components/network/PinkHoverButton";
import { isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Dev-only manual ingestion control. Not scheduled.
 * Runs all enabled registry sources (Vansh + verified ATS boards).
 */
export function CatalogIngestButton() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<MultiSourceIngestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isSupabaseConfigured()) return null;
  if (!import.meta.env.DEV) return null;

  return (
    <div className="mt-4 border-2 border-dashed border-ink/40 bg-paper-2 px-3 py-3">
      <p className="tag text-ink-faint">Dev · job catalog</p>
      <p className="mt-1 text-[0.85rem] text-ink-soft">
        Manual multi-source → Supabase ingest (no schedule). Requires server SUPABASE_SECRET_KEY.
      </p>
      <div className="mt-2">
        <PinkHoverButton
          variant="xs"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            setError(null);
            void ingestCatalogJobsFn()
              .then((r) => setResult(r))
              .catch((e) => setError(e instanceof Error ? e.message : "Ingest failed"))
              .finally(() => setBusy(false));
          }}
        >
          {busy ? "Ingesting…" : "Run catalog ingest"}
        </PinkHoverButton>
      </div>
      {error && <p className="mt-2 text-[0.85rem] text-pink">{error}</p>}
      {result && (
        <div className="mt-2 space-y-1">
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
  );
}
