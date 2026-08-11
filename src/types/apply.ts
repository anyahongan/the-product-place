export type ProductRole =
  | "Product Management"
  | "Product Design"
  | "Product Analysis"
  | "Product Operations"
  | "Product Marketing"
  | "Product Strategy"
  | "Technical Product"
  | "Growth Product"
  | "Other / Unspecified Product";

export type WorkMode = "remote" | "hybrid" | "in-person";

export type EmploymentType = "internship" | "part-time" | "full-time";

export type JobSort =
  "due-date" | "opening-date" | "best-match" | "oldest-opening" | "company" | "newest" | "oldest";

export type ApplicationMode = "manual" | "quick" | "auto";

export type LifecycleTab = "apply" | "applied" | "interviewing";

export type DiscoveryStatus = "open" | "saved" | "queued";

export type ToneName = "blue" | "green" | "pink" | "yellow" | "purple";

export type JobListing = {
  id: string;
  company: string;
  title: string;
  productRole: ProductRole;
  location: string;
  workMode: WorkMode;
  graduationYears: number[];
  employmentType: EmploymentType;
  postedDate: string; // ISO date
  deadline: string | null; // ISO date
  status: DiscoveryStatus;
  matchPercent: number;
  source: string;
  applicationUrl: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  tone: ToneName;
};

export type AppliedStatus = "waiting" | "interviewing" | "rejected" | "withdrawn";

export type ProgressStage = "Submitted" | "Recruiter Screen" | "Interview" | "Final" | "Offer";

export type ContactSuggestion = {
  id: string;
  label: string;
  detail: string;
};

export type AppliedApplication = {
  id: string;
  jobId: string;
  company: string;
  role: string;
  dateApplied: string; // ISO
  status: AppliedStatus;
  currentStage: ProgressStage;
  stagesReached: ProgressStage[];
  resumeVersion: string;
  coverLetter: string | null;
  history: { date: string; note: string }[];
  contacts: ContactSuggestion[];
  tone: ToneName;
};

export type PrepModuleId =
  | "product-sense"
  | "execution"
  | "behavioral"
  | "case-studies"
  | "company"
  | "your-stories"
  | "job-description";

export type PrepModule = {
  id: PrepModuleId;
  title: string;
  prompt: string;
  bullets: string[];
};

export type InterviewItem = {
  id: string;
  applicationId: string;
  company: string;
  role: string;
  stage: string;
  datetime: string; // ISO
  progressStage: ProgressStage;
  tone: ToneName;
  modules: PrepModule[];
};

export type JobFiltersState = {
  query: string;
  savedOnly: boolean;
  productRoles: ProductRole[];
  graduationYears: number[];
  locations: string[];
  locationQuery: string;
  workModes: WorkMode[];
  employmentTypes: EmploymentType[];
  sort: JobSort;
};
