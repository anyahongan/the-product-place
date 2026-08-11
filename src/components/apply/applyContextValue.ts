import type { useApplications } from "@/hooks/useApplications";
import type { useProductJobs } from "@/hooks/useProductJobs";

export type ApplyContextValue = ReturnType<typeof useApplications> &
  ReturnType<typeof useProductJobs>;
