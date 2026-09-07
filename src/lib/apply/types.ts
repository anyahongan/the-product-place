import type { EmploymentType, ProductRole, ToneName, WorkMode } from "@/types/apply";
import type { JobMatchResult } from "@/lib/matching/matchTypes";

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
  /** Shared catalog companies.id when loaded from Supabase jobs.company_id */
  catalogCompanyId?: string | null;
};

export type ApplicationLifecycleStatus =
  | "Saved"
  | "Preparing"
  | "Applied"
  | "Waiting"
  | "Online Assessment"
  | "Recruiter Screen"
  | "Interviewing"
  | "Final Round"
  | "Offer"
  | "Rejected"
  | "Withdrawn";

export type ApplicationMaterialsRequired = {
  resume: boolean;
  coverLetter: boolean;
  transcript: boolean;
  gpa: boolean;
};

export type OnlineAssessmentState = {
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
};

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
  /** What the application portal asked the candidate to submit. */
  materialsRequired: ApplicationMaterialsRequired;
  resumeUsed: null;
  coverLetterUsed: null;
  /** Online assessment tracking (due date syncs to Today's list). */
  onlineAssessment: OnlineAssessmentState;
  /** Free-form notes on this application process. */
  experienceNotes: string;
  applyUrl: string | null;
  sourceUrl: string | null;
  autoQueued: boolean;
  tone: ToneName;
  /** Role posted/open date (from catalog or import). */
  postedDate?: string | null;
  /** Application deadline (from catalog or import). */
  deadline?: string | null;
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
  /** Internal relevance score for Best Match sort; null when not personalized */
  matchPercent: number | null;
  /** Explainable match result (coverage-aware display lives here) */
  matchResult?: JobMatchResult | null;
  source: string;
  sourceUrl: string;
  applicationUrl: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  tone: ToneName;
  closed: boolean;
  /** Shared catalog companies.id when this listing came from Supabase */
  catalogCompanyId?: string | null;
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
  "Online Assessment",
  "Recruiter Screen",
  "Interviewing",
  "Final Round",
  "Offer",
  "Rejected",
  "Withdrawn",
];

export const DEFAULT_MATERIALS_REQUIRED: ApplicationMaterialsRequired = {
  resume: false,
  coverLetter: false,
  transcript: false,
  gpa: false,
};

export const DEFAULT_ONLINE_ASSESSMENT: OnlineAssessmentState = {
  dueDate: null,
  completed: false,
  completedAt: null,
};
