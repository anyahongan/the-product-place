import type { ApplicationLifecycleStatus, ApplicationRecord, StatusEvent } from "@/lib/apply/types";
import { networkApplications, networkCompanies } from "@/data/network";
import { companyIdFromName } from "@/types/recruiting";

/** Demo Network applications migrated into the shared ApplicationRecord store. */
export function demoApplicationRecords(): ApplicationRecord[] {
  return networkApplications.map((na) => {
    const status = mapNetworkStatus(na.status);
    const timestamp = `${na.dateApplied ?? "2026-08-01"}T12:00:00.000Z`;
    const event: StatusEvent = { status, timestamp };
    const companyName =
      networkCompanies.find((c) => c.id === na.companyId)?.name ?? na.companyId;
    return {
      applicationId: na.id,
      jobId: `demo-job-${na.id}`,
      companyId: na.companyId,
      company: companyName,
      title: na.role,
      dateApplied: na.dateApplied,
      currentStatus: status,
      statusHistory: [event],
      resumeUsed: null,
      coverLetterUsed: null,
      applyUrl: null,
      sourceUrl: null,
      autoQueued: false,
      tone: "blue",
    };
  });
}

function mapNetworkStatus(
  status: "Preparing" | "Applied" | "Waiting" | "Interviewing" | "Offer" | "Rejected",
): ApplicationLifecycleStatus {
  if (status === "Preparing") return "Preparing";
  if (status === "Applied") return "Applied";
  if (status === "Waiting") return "Waiting";
  if (status === "Interviewing") return "Interviewing";
  if (status === "Offer") return "Offer";
  return "Rejected";
}

/** Ensure every application has companyId; merge missing demo apps by stable id. */
export function migrateApplications(apps: ApplicationRecord[]): ApplicationRecord[] {
  const withIds = apps.map((app) =>
    app.companyId
      ? app
      : {
          ...app,
          companyId: companyIdFromName(app.company),
        },
  );
  const byId = new Map(withIds.map((a) => [a.applicationId, a]));
  for (const demo of demoApplicationRecords()) {
    if (!byId.has(demo.applicationId)) {
      byId.set(demo.applicationId, demo);
    }
  }
  return [...byId.values()];
}
