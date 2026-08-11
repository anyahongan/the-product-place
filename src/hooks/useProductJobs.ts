import { useCallback, useEffect, useState } from "react";
import { fetchProductJobsFn } from "@/lib/apply/fetchProductJobs.server";
import { loadProductJobs } from "@/lib/apply/repositories/jobRepository";
import type { JobListingView } from "@/lib/apply/types";

export function useProductJobs() {
  const [jobs, setJobs] = useState<JobListingView[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const reload = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      let result: { jobs: JobListingView[]; errors: string[] };
      try {
        result = await fetchProductJobsFn();
      } catch {
        // Fallback for environments where server functions are unavailable
        result = await loadProductJobs();
      }
      setJobs(result.jobs);
      setWarnings(result.errors);
      setStatus("ready");
    } catch (err) {
      setJobs([]);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not load listings.");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { jobs, status, error, warnings, reload };
}
