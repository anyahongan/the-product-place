import { createContext } from "react";
import type { ApplicationLifecycleStatus, ApplicationRecord } from "@/lib/apply/types";
import type { JobListingView } from "@/lib/apply/types";
import type { Company, ContactApplicationLink } from "@/types/recruiting";
import type { NetworkContact, NetworkNote } from "@/types/network";
import type { LinkedInImportPlan } from "@/lib/network/mergeLinkedInConnections";
import type { AppliedImportPlan } from "@/lib/apply/planAppliedImport";

export type RecruitingContextValue = {
  apps: ApplicationRecord[];
  savedIds: Set<string>;
  queueIds: Set<string>;
  hydrated: boolean;
  interviewingApps: ApplicationRecord[];
  stats: {
    total: number;
    waiting: number;
    interviewing: number;
    rejected: number;
    offers: number;
  };
  companies: Company[];
  contacts: NetworkContact[];
  notes: NetworkNote[];
  links: ContactApplicationLink[];
  toggleSaved: (jobId: string) => void;
  markApplied: (job: JobListingView) => void;
  addToApplyList: (job: JobListingView) => void;
  removeFromApplyList: (jobId: string) => void;
  setStatus: (applicationId: string, status: ApplicationLifecycleStatus) => void;
  updateApplication: (
    applicationId: string,
    patch: Partial<
      Pick<
        ApplicationRecord,
        "materialsRequired" | "onlineAssessment" | "experienceNotes"
      >
    >,
  ) => void;
  updateContact: (next: NetworkContact) => void;
  setContacts: (
    next: NetworkContact[] | ((prev: NetworkContact[]) => NetworkContact[]),
  ) => void;
  setNotes: (next: NetworkNote[] | ((prev: NetworkNote[]) => NetworkNote[])) => void;
  addCompanyToCatalog: (company: Company) => void;
  ensureCompanyForJob: (job: JobListingView) => string;
  importLinkedInConnections: (plan: LinkedInImportPlan) => Promise<void>;
  importAppliedApplications: (plan: AppliedImportPlan) => Promise<void>;
};

export const RecruitingContext = createContext<RecruitingContextValue | null>(null);
