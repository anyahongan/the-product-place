import type { ReactNode } from "react";
import { ApplyContext } from "@/components/apply/applyContextInstance";
import { useApplications } from "@/hooks/useApplications";
import { useProductJobs } from "@/hooks/useProductJobs";

export function ApplyProvider({ children }: { children: ReactNode }) {
  const jobsState = useProductJobs();
  const appsState = useApplications();
  return (
    <ApplyContext.Provider value={{ ...jobsState, ...appsState }}>{children}</ApplyContext.Provider>
  );
}
