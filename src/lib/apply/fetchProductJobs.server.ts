import { createServerFn } from "@tanstack/react-start";
import { loadProductJobs } from "@/lib/apply/repositories/jobRepository";
import type { JobListingView } from "@/lib/apply/types";

export type JobsLoadResult = {
  jobs: JobListingView[];
  errors: string[];
};

export const fetchProductJobsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<JobsLoadResult> => {
    return loadProductJobs();
  },
);
