import { createContext } from "react";
import type { ApplicationLifecycleStatus, ApplicationRecord } from "@/lib/apply/types";
import type { JobListingView } from "@/lib/apply/types";
import type { Company, ContactApplicationLink } from "@/types/recruiting";
import type { NetworkContact, NetworkNote } from "@/types/network";

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
  addToAutoQueue: (job: JobListingView) => void;
  setStatus: (applicationId: string, status: ApplicationLifecycleStatus) => void;
  updateContact: (next: NetworkContact) => void;
  setContacts: (
    next: NetworkContact[] | ((prev: NetworkContact[]) => NetworkContact[]),
  ) => void;
  setNotes: (next: NetworkNote[] | ((prev: NetworkNote[]) => NetworkNote[])) => void;
  addCompanyToCatalog: (company: Company) => void;
  ensureCompanyForJob: (job: JobListingView) => string;
};

export const RecruitingContext = createContext<RecruitingContextValue | null>(null);
