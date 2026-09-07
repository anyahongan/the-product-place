import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApplicationLifecycleStatus, ApplicationRecord } from "@/lib/apply/types";
import type { JobListingView } from "@/lib/apply/types";
import { INTERVIEW_ELIGIBLE_STATUSES } from "@/lib/apply/types";
import {
  appendStatus,
  createAppliedRecord,
  findApplicationByJobId,
  listApplyListIds,
  listApplications,
  listSavedJobIds,
  saveApplications,
  saveApplyListIds,
  saveSavedJobIds,
  upsertApplication,
} from "@/lib/apply/repositories/applicationRepository";

export function useApplications() {
  const [apps, setApps] = useState<ApplicationRecord[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [queueIds, setQueueIds] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setApps(listApplications());
    setSavedIds(new Set(listSavedJobIds()));
    setQueueIds(new Set(listApplyListIds()));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveApplications(apps);
  }, [apps, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveSavedJobIds([...savedIds]);
  }, [savedIds, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveApplyListIds([...queueIds]);
  }, [queueIds, hydrated]);

  const toggleSaved = useCallback((jobId: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  }, []);

  const markApplied = useCallback((job: JobListingView) => {
    setApps((prev) => {
      const existing = findApplicationByJobId(prev, job.id);
      if (existing) {
        return upsertApplication(prev, appendStatus(existing, "Applied"));
      }
      return upsertApplication(prev, createAppliedRecord(job, "Applied"));
    });
  }, []);

  const addToApplyList = useCallback((job: JobListingView) => {
    setQueueIds((prev) => new Set(prev).add(job.id));
    setSavedIds((prev) => new Set(prev).add(job.id));
  }, []);

  const removeFromApplyList = useCallback((jobId: string) => {
    setQueueIds((prev) => {
      const next = new Set(prev);
      next.delete(jobId);
      return next;
    });
    setApps((prev) =>
      prev.map((app) => (app.jobId === jobId ? { ...app, autoQueued: false } : app)),
    );
  }, []);

  const setStatus = useCallback((applicationId: string, status: ApplicationLifecycleStatus) => {
    setApps((prev) =>
      prev.map((app) => (app.applicationId === applicationId ? appendStatus(app, status) : app)),
    );
  }, []);

  const interviewingApps = useMemo(
    () => apps.filter((a) => INTERVIEW_ELIGIBLE_STATUSES.includes(a.currentStatus)),
    [apps],
  );

  const stats = useMemo(() => {
    const appliedLike = apps.filter((a) =>
      [
        "Applied",
        "Waiting",
        "Recruiter Screen",
        "Interviewing",
        "Final Round",
        "Offer",
        "Rejected",
        "Withdrawn",
      ].includes(a.currentStatus),
    );
    return {
      total: appliedLike.length,
      waiting: apps.filter((a) => a.currentStatus === "Waiting" || a.currentStatus === "Applied")
        .length,
      interviewing: apps.filter((a) => INTERVIEW_ELIGIBLE_STATUSES.includes(a.currentStatus))
        .length,
      rejected: apps.filter((a) => a.currentStatus === "Rejected").length,
      offers: apps.filter((a) => a.currentStatus === "Offer").length,
    };
  }, [apps]);

  return {
    apps,
    savedIds,
    queueIds,
    hydrated,
    interviewingApps,
    stats,
    toggleSaved,
    markApplied,
    addToApplyList,
    removeFromApplyList,
    setStatus,
  };
}
