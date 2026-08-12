import { useCallback, useEffect, useState } from "react";
import type { JobListingView } from "@/lib/apply/types";
import { loadCatalogJobs } from "@/lib/jobs/jobCatalogRepository";

export function useProductJobs() {
  const [jobs, setJobs] = useState<JobListingView[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [catalogSource, setCatalogSource] = useState<"supabase" | "live-github" | null>(null);

  const reload = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const result = await loadCatalogJobs();
      setJobs(result.jobs);
      setWarnings(result.warnings);
      setCatalogSource(result.source);
      setStatus("ready");
    } catch (e) {
      setJobs([]);
      setError(e instanceof Error ? e.message : "Failed to load jobs");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { jobs, status, error, warnings, catalogSource, reload };
}
