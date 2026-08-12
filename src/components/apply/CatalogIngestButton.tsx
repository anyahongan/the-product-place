import { useState } from "react";
import { ingestGitHubJobsFn } from "@/lib/ingestion/ingestJobs.server";
import type { IngestionSummary } from "@/lib/ingestion/types";
import { PinkHoverButton } from "@/components/network/PinkHoverButton";
import { isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Dev-only manual ingestion control. Not scheduled.
 * Visible when Supabase Vite env is present.
 */
export function CatalogIngestButton() {
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<IngestionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isSupabaseConfigured()) return null;
  if (!import.meta.env.DEV) return null;

  return (
    <div className="mt-4 border-2 border-dashed border-ink/40 bg-paper-2 px-3 py-3">
      <p className="tag text-ink-faint">Dev · job catalog</p>
      <p className="mt-1 text-[0.85rem] text-ink-soft">
        Manual GitHub → Supabase ingest (no schedule). Requires server SUPABASE_SECRET_KEY.
      </p>
      <div className="mt-2">
        <PinkHoverButton
          variant="xs"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            setError(null);
            void ingestGitHubJobsFn()
              .then((s) => setSummary(s))
              .catch((e) => setError(e instanceof Error ? e.message : "Ingest failed"))
              .finally(() => setBusy(false));
          }}
        >
          {busy ? "Ingesting…" : "Run GitHub ingest"}
        </PinkHoverButton>
      </div>
      {error && <p className="mt-2 text-[0.85rem] text-pink">{error}</p>}
      {summary && (
        <p className="tag mt-2 text-ink">
          {summary.source}: parsed {summary.recordsParsed}, product {summary.productJobsFound}, new{" "}
          {summary.newJobs}, updated {summary.updatedJobs}, dupes {summary.duplicatesMerged}, errors{" "}
          {summary.errors}
        </p>
      )}
    </div>
  );
}
