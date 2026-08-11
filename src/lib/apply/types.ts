import type { EmploymentType, ProductRole, ToneName, WorkMode } from "@/types/apply";

/** Canonical external opportunity — separate from Application */
export type NormalizedJob = {
  id: string;
  company: string;
  title: string;
  productRoleCategory: ProductRole | null;
  location: string | null;
  workMode: WorkMode | null;
  graduationYears: number[] | null;
  employmentType: EmploymentType | null;
  postedDate: string | null;
  firstSeenDate: string | null;
  deadline: string | null;
  source: string;
  sourceUrl: string;
  applyUrl: string | null;
  description: string | null;
  status: "open" | "closed" | "unknown";
  dedupeKey: string;
};

export type ApplicationLifecycleStatus =
  | "Saved"
  | "Preparing"
  | "Applied"
  | "Waiting"
  | "Recruiter Screen"
  | "Interviewing"
  | "Final Round"
  | "Offer"
  | "Rejected"
  | "Withdrawn";

export type StatusEvent = {
  status: ApplicationLifecycleStatus;
  timestamp: string;
};

/** User's personal record of engaging with a Job */
export type ApplicationRecord = {
  applicationId: string;
  jobId: string;
  /** Shared company entity id (`co-*`) — same IDs Network uses */
  companyId: string;
  company: string;
  title: string;
  dateApplied: string | null;
  currentStatus: ApplicationLifecycleStatus;
  statusHistory: StatusEvent[];
  resumeUsed: null;
  coverLetterUsed: null;
  applyUrl: string | null;
  sourceUrl: string | null;
  autoQueued: boolean;
  tone: ToneName;
};

export type JobListingView = {
  id: string;
  company: string;
  title: string;
  productRole: ProductRole;
  location: string;
  workMode: WorkMode | null;
  graduationYears: number[];
  employmentType: EmploymentType | null;
  postedDate: string | null;
  deadline: string | null;
  status: "open" | "saved" | "queued" | "closed" | "unknown";
  matchPercent: number | null;
  source: string;
  sourceUrl: string;
  applicationUrl: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  tone: ToneName;
  closed: boolean;
};

export const INTERVIEW_ELIGIBLE_STATUSES: ApplicationLifecycleStatus[] = [
  "Recruiter Screen",
  "Interviewing",
  "Final Round",
];

export const APPLICATION_STATUSES: ApplicationLifecycleStatus[] = [
  "Saved",
  "Preparing",
  "Applied",
  "Waiting",
  "Recruiter Screen",
  "Interviewing",
  "Final Round",
  "Offer",
  "Rejected",
  "Withdrawn",
];
