import type { ReactNode } from "react";
import { ApplyContext } from "@/components/apply/applyContextInstance";
import { useProductJobs } from "@/hooks/useProductJobs";
import { useRecruiting } from "@/components/recruiting/useRecruiting";

export function ApplyProvider({ children }: { children: ReactNode }) {
  const jobsState = useProductJobs();
  const recruiting = useRecruiting();
  return (
    <ApplyContext.Provider
      value={{
        ...jobsState,
        apps: recruiting.apps,
        savedIds: recruiting.savedIds,
        queueIds: recruiting.queueIds,
        hydrated: recruiting.hydrated,
        interviewingApps: recruiting.interviewingApps,
        stats: recruiting.stats,
        toggleSaved: recruiting.toggleSaved,
        markApplied: recruiting.markApplied,
        addToAutoQueue: recruiting.addToAutoQueue,
        removeFromAutoQueue: recruiting.removeFromAutoQueue,
        setStatus: recruiting.setStatus,
        updateApplication: recruiting.updateApplication,
        importAppliedApplications: recruiting.importAppliedApplications,
      }}
    >
      {children}
    </ApplyContext.Provider>
  );
}
