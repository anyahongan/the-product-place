import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ApplicationLifecycleStatus, ApplicationRecord } from "@/lib/apply/types";
import type { JobListingView } from "@/lib/apply/types";
import { INTERVIEW_ELIGIBLE_STATUSES } from "@/lib/apply/types";
import {
  appendStatus,
  createAppliedRecord,
  findApplicationByJobId,
  listApplications,
  listAutoQueueIds,
  listSavedJobIds,
  saveApplications,
  saveAutoQueueIds,
  saveSavedJobIds,
  upsertApplication,
} from "@/lib/apply/repositories/applicationRepository";
import type { Company, ContactApplicationLink } from "@/types/recruiting";
import type { NetworkContact, NetworkNote } from "@/types/network";
import {
  ensureSeedCompanies,
  listCompanies,
  saveCompanies,
  upsertCompanyByName,
} from "@/lib/recruiting/companyRepository";
import {
  hydrateNetworkPersonal,
  saveContactApplicationLinks,
  saveContacts,
  saveNotes,
  syncLinksFromContact,
} from "@/lib/recruiting/networkRepository";
import { RecruitingContext } from "@/components/recruiting/recruitingContextInstance";

export function RecruitingProvider({ children }: { children: ReactNode }) {
  const [apps, setApps] = useState<ApplicationRecord[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [queueIds, setQueueIds] = useState<Set<string>>(new Set());
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<NetworkContact[]>([]);
  const [notes, setNotes] = useState<NetworkNote[]>([]);
  const [links, setLinks] = useState<ContactApplicationLink[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loadedApps = listApplications();
    let companyCatalog = ensureSeedCompanies(listCompanies());

    const normalizedApps = loadedApps.map((app) => {
      const { companies: next, company } = upsertCompanyByName(
        companyCatalog,
        app.company,
        app.tone === "pink" ? "blue" : app.tone,
      );
      companyCatalog = next;
      return {
        ...app,
        companyId: app.companyId || company.id,
      };
    });

    const personal = hydrateNetworkPersonal();
    setApps(normalizedApps);
    setCompanies(companyCatalog);
    setContacts(personal.contacts);
    setNotes(personal.notes);
    setLinks(personal.links);
    setSavedIds(new Set(listSavedJobIds()));
    setQueueIds(new Set(listAutoQueueIds()));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveApplications(apps);
  }, [apps, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveSavedJobIds([...savedIds]);
  }, [savedIds, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveAutoQueueIds([...queueIds]);
  }, [queueIds, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveCompanies(companies);
  }, [companies, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveContacts(contacts);
  }, [contacts, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveNotes(notes);
  }, [notes, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveContactApplicationLinks(links);
  }, [links, hydrated]);

  const ensureCompanyForJob = useCallback((job: JobListingView) => {
    let companyId = "";
    setCompanies((prev) => {
      const { companies: next, company } = upsertCompanyByName(
        prev,
        job.company,
        job.tone === "pink" ? "blue" : job.tone,
      );
      companyId = company.id;
      return next;
    });
    return companyId;
  }, []);

  const toggleSaved = useCallback((jobId: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  }, []);

  const markApplied = useCallback((job: JobListingView) => {
    setCompanies((prevCompanies) => {
      const { companies: nextCompanies, company } = upsertCompanyByName(
        prevCompanies,
        job.company,
        job.tone === "pink" ? "blue" : job.tone,
      );
      setApps((prev) => {
        const existing = findApplicationByJobId(prev, job.id);
        if (existing) {
          return upsertApplication(prev, {
            ...appendStatus(existing, "Applied"),
            companyId: existing.companyId || company.id,
            company: job.company,
          });
        }
        return upsertApplication(prev, createAppliedRecord(job, "Applied", company.id));
      });
      return nextCompanies;
    });
  }, []);

  const addToAutoQueue = useCallback((job: JobListingView) => {
    setQueueIds((prev) => new Set(prev).add(job.id));
    setCompanies((prevCompanies) => {
      const { companies: nextCompanies, company } = upsertCompanyByName(
        prevCompanies,
        job.company,
        job.tone === "pink" ? "blue" : job.tone,
      );
      setApps((prev) => {
        const existing = findApplicationByJobId(prev, job.id);
        if (existing) {
          return upsertApplication(prev, {
            ...existing,
            autoQueued: true,
            companyId: existing.companyId || company.id,
          });
        }
        return upsertApplication(prev, {
          ...createAppliedRecord(job, "Saved", company.id),
          autoQueued: true,
        });
      });
      return nextCompanies;
    });
  }, []);

  const setStatus = useCallback((applicationId: string, status: ApplicationLifecycleStatus) => {
    setApps((prev) =>
      prev.map((app) => (app.applicationId === applicationId ? appendStatus(app, status) : app)),
    );
  }, []);

  const updateContact = useCallback((next: NetworkContact) => {
    setContacts((prev) => prev.map((c) => (c.id === next.id ? next : c)));
    setLinks((prev) => syncLinksFromContact(prev, next));
  }, []);

  const setContactsState = useCallback((next: NetworkContact[] | ((prev: NetworkContact[]) => NetworkContact[])) => {
    setContacts(next);
  }, []);

  const setNotesState = useCallback((next: NetworkNote[] | ((prev: NetworkNote[]) => NetworkNote[])) => {
    setNotes(next);
  }, []);

  const addCompanyToCatalog = useCallback((company: Company) => {
    setCompanies((prev) => (prev.some((c) => c.id === company.id) ? prev : [...prev, company]));
  }, []);

  const interviewingApps = useMemo(
    () => apps.filter((a) => INTERVIEW_ELIGIBLE_STATUSES.includes(a.currentStatus)),
    [apps],
  );

  const stats = useMemo(() => {
    const appliedLike = apps.filter((a) =>
      [
        "Applied",
        "Waiting",
        "Recruiter Screen",
        "Interviewing",
        "Final Round",
        "Offer",
        "Rejected",
        "Withdrawn",
      ].includes(a.currentStatus),
    );
    return {
      total: appliedLike.length,
      waiting: apps.filter((a) => a.currentStatus === "Waiting" || a.currentStatus === "Applied")
        .length,
      interviewing: apps.filter((a) => INTERVIEW_ELIGIBLE_STATUSES.includes(a.currentStatus))
        .length,
      rejected: apps.filter((a) => a.currentStatus === "Rejected").length,
      offers: apps.filter((a) => a.currentStatus === "Offer").length,
    };
  }, [apps]);

  const value = {
    apps,
    savedIds,
    queueIds,
    hydrated,
    interviewingApps,
    stats,
    companies,
    contacts,
    notes,
    links,
    toggleSaved,
    markApplied,
    addToAutoQueue,
    setStatus,
    updateContact,
    setContacts: setContactsState,
    setNotes: setNotesState,
    addCompanyToCatalog,
    ensureCompanyForJob,
  };

  return <RecruitingContext.Provider value={value}>{children}</RecruitingContext.Provider>;
}
