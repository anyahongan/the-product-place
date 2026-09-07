import type { ApplicationLifecycleStatus, ApplicationRecord, StatusEvent } from "@/lib/apply/types";
import {
  DEFAULT_MATERIALS_REQUIRED,
  DEFAULT_ONLINE_ASSESSMENT,
} from "@/lib/apply/types";
import type { JobListingView } from "@/lib/apply/types";
import type { ToneName } from "@/types/apply";
import { companyIdFromName } from "@/types/recruiting";
import { migrateApplications } from "@/lib/recruiting/demoApplications";
import { readJson, writeJson } from "@/lib/recruiting/storage";
import { PLACEHOLDER_CONTACTS } from "@/lib/apply/placeholderContacts";
import { buildRoleDedupeKey } from "@/lib/apply/normalization/dedupe";
import type { AppliedImportRow } from "@/lib/apply/parseAppliedImport";
import { applyImportRowToRecord } from "@/lib/apply/parseAppliedImportFields";

const STORAGE_KEY = "tpp.apply.applications.v1";
const SAVED_KEY = "tpp.apply.saved.v1";
const APPLY_LIST_KEY = "tpp.apply.quickList.v1";
const LEGACY_AUTO_QUEUE_KEY = "tpp.apply.autoQueue.v1";

export function normalizeApplicationRecord(app: ApplicationRecord): ApplicationRecord {
  return {
    ...app,
    materialsRequired: app.materialsRequired ?? { ...DEFAULT_MATERIALS_REQUIRED },
    onlineAssessment: app.onlineAssessment ?? { ...DEFAULT_ONLINE_ASSESSMENT },
    experienceNotes: app.experienceNotes ?? "",
  };
}

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

export function listApplyListIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const current = readJson<string[]>(APPLY_LIST_KEY, []);
    if (current.length > 0) return current;
    const legacy = readJson<string[]>(LEGACY_AUTO_QUEUE_KEY, []);
    if (legacy.length > 0) {
      writeJson(APPLY_LIST_KEY, legacy);
      return legacy;
    }
    return [];
  } catch {
    return readJson<string[]>(APPLY_LIST_KEY, []);
  }
}

export function saveApplyListIds(ids: string[]) {
  writeJson(APPLY_LIST_KEY, ids);
}

/** @deprecated Use listApplyListIds */
export const listAutoQueueIds = listApplyListIds;

/** @deprecated Use saveApplyListIds */
export const saveAutoQueueIds = saveApplyListIds;

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
    materialsRequired: { ...DEFAULT_MATERIALS_REQUIRED },
    resumeUsed: null,
    coverLetterUsed: null,
    onlineAssessment: { ...DEFAULT_ONLINE_ASSESSMENT },
    experienceNotes: "",
    applyUrl: job.applicationUrl || null,
    sourceUrl: job.sourceUrl,
    autoQueued: false,
    tone: job.tone === "pink" ? "blue" : (job.tone as ToneName),
    postedDate: job.postedDate ?? null,
    deadline: job.deadline ?? null,
  };
}

export function importedJobId(company: string, title: string): string {
  return `import:${buildRoleDedupeKey(company, title).replace(/^role:/, "")}`;
}

export function createImportedApplicationRecord(
  row: AppliedImportRow,
  matchedJob: JobListingView | null,
  companyId?: string,
): ApplicationRecord {
  const now = new Date().toISOString();
  const status = row.status;
  const jobId = matchedJob?.id ?? importedJobId(row.company, row.title);
  const event: StatusEvent = { status, timestamp: now };
  const created: ApplicationRecord = {
    applicationId: `app-${jobId}-${Date.now()}`,
    jobId,
    companyId: companyId ?? companyIdFromName(row.company),
    company: row.company,
    title: row.title,
    dateApplied:
      row.dateApplied ??
      (status === "Applied" || status === "Waiting" ? now.slice(0, 10) : null),
    currentStatus: status,
    statusHistory: [event],
    materialsRequired: row.materialsRequired
      ? { ...DEFAULT_MATERIALS_REQUIRED, ...row.materialsRequired }
      : { ...DEFAULT_MATERIALS_REQUIRED },
    resumeUsed: null,
    coverLetterUsed: null,
    onlineAssessment: row.onlineAssessmentDue
      ? {
          dueDate: row.onlineAssessmentDue,
          completed: false,
          completedAt: null,
        }
      : { ...DEFAULT_ONLINE_ASSESSMENT },
    experienceNotes: row.experienceNotes ?? "",
    applyUrl: row.applyUrl ?? matchedJob?.applicationUrl ?? null,
    sourceUrl: matchedJob?.sourceUrl ?? null,
    autoQueued: false,
    tone: matchedJob?.tone === "pink" ? "blue" : ((matchedJob?.tone as ToneName) ?? "blue"),
    postedDate: row.postedDate ?? matchedJob?.postedDate ?? null,
    deadline: row.deadline ?? matchedJob?.deadline ?? null,
  };

  return created;
}

export function mergeImportedIntoApp(
  existing: ApplicationRecord,
  row: AppliedImportRow,
  matchedJob: JobListingView | null,
): ApplicationRecord {
  const next =
    existing.currentStatus !== row.status ? appendStatus(existing, row.status) : existing;
  const merged = applyImportRowToRecord(next, row);
  return {
    ...next,
    company: row.company,
    title: row.title,
    dateApplied: row.dateApplied ?? next.dateApplied,
    applyUrl: row.applyUrl ?? next.applyUrl,
    postedDate: row.postedDate ?? matchedJob?.postedDate ?? next.postedDate ?? null,
    deadline: row.deadline ?? matchedJob?.deadline ?? next.deadline ?? null,
    experienceNotes: merged.experienceNotes,
    materialsRequired: merged.materialsRequired,
    onlineAssessment: merged.onlineAssessment,
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
