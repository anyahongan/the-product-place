import type { ApplicationLifecycleStatus, ApplicationRecord, StatusEvent } from "@/lib/apply/types";
import type { JobListingView } from "@/lib/apply/types";
import type { ToneName } from "@/types/apply";
import { companyIdFromName } from "@/types/recruiting";
import { migrateApplications } from "@/lib/recruiting/demoApplications";
import { readJson, writeJson } from "@/lib/recruiting/storage";
import { PLACEHOLDER_CONTACTS } from "@/lib/apply/placeholderContacts";

const STORAGE_KEY = "tpp.apply.applications.v1";
const SAVED_KEY = "tpp.apply.saved.v1";
const QUEUE_KEY = "tpp.apply.autoQueue.v1";

export function listApplications(): ApplicationRecord[] {
  return migrateApplications(readJson<ApplicationRecord[]>(STORAGE_KEY, []));
}

export function saveApplications(apps: ApplicationRecord[]) {
  writeJson(STORAGE_KEY, apps);
}

export function listSavedJobIds(): string[] {
  return readJson<string[]>(SAVED_KEY, []);
}

export function saveSavedJobIds(ids: string[]) {
  writeJson(SAVED_KEY, ids);
}

export function listAutoQueueIds(): string[] {
  return readJson<string[]>(QUEUE_KEY, []);
}

export function saveAutoQueueIds(ids: string[]) {
  writeJson(QUEUE_KEY, ids);
}

export function createAppliedRecord(
  job: JobListingView,
  status: ApplicationLifecycleStatus = "Applied",
  companyId?: string,
): ApplicationRecord {
  const now = new Date().toISOString();
  const event: StatusEvent = { status, timestamp: now };
  return {
    applicationId: `app-${job.id}-${Date.now()}`,
    jobId: job.id,
    companyId: companyId ?? companyIdFromName(job.company),
    company: job.company,
    title: job.title,
    dateApplied: status === "Applied" || status === "Waiting" ? now.slice(0, 10) : null,
    currentStatus: status,
    statusHistory: [event],
    resumeUsed: null,
    coverLetterUsed: null,
    applyUrl: job.applicationUrl || null,
    sourceUrl: job.sourceUrl,
    autoQueued: false,
    tone: job.tone === "pink" ? "blue" : (job.tone as ToneName),
  };
}

export function appendStatus(
  app: ApplicationRecord,
  status: ApplicationLifecycleStatus,
): ApplicationRecord {
  if (app.currentStatus === status) return app;
  const timestamp = new Date().toISOString();
  const next: ApplicationRecord = {
    ...app,
    currentStatus: status,
    statusHistory: [...app.statusHistory, { status, timestamp }],
  };
  if ((status === "Applied" || status === "Waiting") && !app.dateApplied) {
    next.dateApplied = timestamp.slice(0, 10);
  }
  return next;
}

export function upsertApplication(
  apps: ApplicationRecord[],
  next: ApplicationRecord,
): ApplicationRecord[] {
  const idx = apps.findIndex(
    (a) => a.applicationId === next.applicationId || a.jobId === next.jobId,
  );
  if (idx === -1) return [next, ...apps];
  const copy = [...apps];
  copy[idx] = next;
  return copy;
}

export function findApplicationByJobId(
  apps: ApplicationRecord[],
  jobId: string,
): ApplicationRecord | undefined {
  return apps.find((a) => a.jobId === jobId);
}

export { PLACEHOLDER_CONTACTS };
