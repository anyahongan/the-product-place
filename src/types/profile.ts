import type { EmploymentType, ProductRole, WorkMode } from "@/types/apply";

export type WorkAuthorizationStatus =
  | "US_CITIZEN"
  | "PERMANENT_RESIDENT"
  | "AUTHORIZED_TO_WORK"
  | "NEEDS_SPONSORSHIP"
  | "PREFER_NOT_TO_SAY"
  | "OTHER"
  | "";

export type ExperienceType =
  | "work"
  | "internship"
  | "project"
  | "leadership"
  | "research"
  | "extracurricular"
  | "volunteer"
  | "other";

export type ResumeDocumentType = "MASTER_RESUME" | "TAILORED_RESUME";

export type ProfileBasics = {
  preferredName: string;
  school: string;
  major: string;
  minor: string;
  graduationYear: number | null;
  currentLocation: string;
};

export type ProfileApplicationDetails = {
  preferredEmail: string;
  phone: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  websiteUrl: string;
  workAuthorizationStatus: WorkAuthorizationStatus;
  requiresSponsorship: boolean | null;
};

export type ProfileRecord = ProfileBasics &
  ProfileApplicationDetails & {
    id: string;
    updatedAt: string;
  };

export type ProfileTargets = {
  roles: ProductRole[];
  locations: { id: string; label: string; sortOrder: number }[];
  workModes: WorkMode[];
  employmentTypes: EmploymentType[];
};

export type StandardApplicationAnswer = {
  id: string;
  label: string;
  answer: string;
  category: string | null;
  sortOrder: number;
  updatedAt: string;
};

export type ResumeDocument = {
  id: string;
  documentType: ResumeDocumentType;
  storagePath: string;
  originalFilename: string;
  mimeType: string;
  byteSize: number | null;
  uploadedAt: string;
  isCurrent: boolean;
};

export type ExperienceMetric = {
  id: string;
  label: string;
  value: string;
  context: string | null;
  sortOrder: number;
};

export type ExperienceBullet = {
  id: string;
  content: string;
  sortOrder: number;
};

export type ExperienceRecord = {
  id: string;
  experienceType: ExperienceType;
  organization: string;
  title: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  summary: string | null;
  skills: string[];
  projectUrl: string | null;
  githubUrl: string | null;
  caseStudyUrl: string | null;
  productType: string | null;
  projectStatus: string | null;
  sortOrder: number;
  bullets: ExperienceBullet[];
  metrics: ExperienceMetric[];
};

export type UserProfileBundle = {
  profile: ProfileRecord;
  targets: ProfileTargets;
  answers: StandardApplicationAnswer[];
  masterResume: ResumeDocument | null;
  experiences: ExperienceRecord[];
};

export const TARGET_PRODUCT_ROLES: ProductRole[] = [
  "Product Management",
  "Product Design",
  "Product Operations",
  "Product Marketing",
  "Product Strategy",
  "Technical Product",
  "Growth Product",
  "Other / Unspecified Product",
];

export const EXPERIENCE_TYPE_LABELS: Record<ExperienceType, string> = {
  work: "Work",
  internship: "Internship",
  project: "Project",
  leadership: "Leadership",
  research: "Research",
  extracurricular: "Extracurricular",
  volunteer: "Volunteer",
  other: "Other",
};

export const WORK_AUTH_OPTIONS: { value: WorkAuthorizationStatus; label: string }[] = [
  { value: "", label: "Not specified" },
  { value: "US_CITIZEN", label: "U.S. citizen" },
  { value: "PERMANENT_RESIDENT", label: "Permanent resident" },
  { value: "AUTHORIZED_TO_WORK", label: "Authorized to work" },
  { value: "NEEDS_SPONSORSHIP", label: "Will need sponsorship" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
  { value: "OTHER", label: "Other" },
];

export const DEFAULT_ANSWER_PROMPTS = [
  { label: "Why are you interested in product?", category: "motivation" },
  { label: "Tell us about yourself", category: "intro" },
  { label: "Why this type of role?", category: "motivation" },
  { label: "Leadership example", category: "behavioral" },
  { label: "Teamwork example", category: "behavioral" },
  { label: "Conflict / challenge example", category: "behavioral" },
  { label: "Favorite project", category: "story" },
  { label: "Anything else", category: "other" },
] as const;

export const RESUME_MAX_BYTES = 10 * 1024 * 1024;
export const RESUME_ALLOWED_MIME = ["application/pdf"] as const;
