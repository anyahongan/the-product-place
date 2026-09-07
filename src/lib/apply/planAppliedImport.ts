import { buildRoleDedupeKey, normalizeText } from "@/lib/apply/normalization/dedupe";
import type { ApplicationRecord, JobListingView } from "@/lib/apply/types";
import type { AppliedImportRow } from "@/lib/apply/parseAppliedImport";

export type AppliedImportPreviewRow = {
  row: AppliedImportRow;
  action: "create" | "update" | "skip";
  matchedJobId: string | null;
  reason: string;
};

export type AppliedImportPlan = {
  preview: AppliedImportPreviewRow[];
  createCount: number;
  updateCount: number;
  skipCount: number;
  records: Array<{
    row: AppliedImportRow;
    matchedJob: JobListingView | null;
    existing: ApplicationRecord | undefined;
  }>;
};

function findCatalogJob(row: AppliedImportRow, jobs: JobListingView[]): JobListingView | null {
  const key = buildRoleDedupeKey(row.company, row.title);
  const exact = jobs.find((j) => buildRoleDedupeKey(j.company, j.title) === key);
  if (exact) return exact;

  const companyNorm = normalizeText(row.company);
  const titleNorm = normalizeText(row.title);
  return (
    jobs.find(
      (j) => normalizeText(j.company) === companyNorm && normalizeText(j.title).includes(titleNorm),
    ) ?? null
  );
}

function findExistingApp(
  row: AppliedImportRow,
  matchedJob: JobListingView | null,
  apps: ApplicationRecord[],
): ApplicationRecord | undefined {
  if (matchedJob) {
    const byJob = apps.find((a) => a.jobId === matchedJob.id);
    if (byJob) return byJob;
  }
  const key = buildRoleDedupeKey(row.company, row.title);
  return apps.find((a) => buildRoleDedupeKey(a.company, a.title) === key);
}

export function planAppliedImport(
  rows: AppliedImportRow[],
  jobs: JobListingView[],
  apps: ApplicationRecord[],
): AppliedImportPlan {
  const preview: AppliedImportPreviewRow[] = [];
  const records: AppliedImportPlan["records"] = [];
  let createCount = 0;
  let updateCount = 0;
  let skipCount = 0;

  for (const row of rows) {
    const matchedJob = findCatalogJob(row, jobs);
    const existing = findExistingApp(row, matchedJob, apps);

    if (existing && existing.currentStatus === row.status) {
      preview.push({
        row,
        action: "skip",
        matchedJobId: matchedJob?.id ?? existing.jobId,
        reason: "Already tracked with the same status",
      });
      skipCount++;
      continue;
    }

    if (existing) {
      preview.push({
        row,
        action: "update",
        matchedJobId: matchedJob?.id ?? existing.jobId,
        reason: `Update status to ${row.status}`,
      });
      updateCount++;
      records.push({ row, matchedJob, existing });
      continue;
    }

    preview.push({
      row,
      action: "create",
      matchedJobId: matchedJob?.id ?? null,
      reason: matchedJob ? "Match catalog role · save to tracker" : "Import as saved application",
    });
    createCount++;
    records.push({ row, matchedJob, existing: undefined });
  }

  return { preview, createCount, updateCount, skipCount, records };
}
