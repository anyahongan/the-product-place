import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ApplicationLifecycleStatus, ApplicationRecord } from "@/lib/apply/types";
import type { JobListingView } from "@/lib/apply/types";
import { INTERVIEW_ELIGIBLE_STATUSES } from "@/lib/apply/types";
import {
  appendStatus,
  createAppliedRecord,
  createImportedApplicationRecord,
  findApplicationByJobId,
  listApplyListIds,
  listApplications,
  listSavedJobIds,
  mergeImportedIntoApp,
  normalizeApplicationRecord,
  saveApplications,
  saveApplyListIds,
  saveSavedJobIds,
  upsertApplication,
} from "@/lib/apply/repositories/applicationRepository";
import {
  completeOnlineAssessmentTask,
  syncOnlineAssessmentTask,
} from "@/lib/apply/applicationTaskSync";
import type { AppliedImportPlan } from "@/lib/apply/planAppliedImport";
import type { Company, ContactApplicationLink } from "@/types/recruiting";
import type { NetworkContact, NetworkNote } from "@/types/network";
import type { LinkedInImportPlan } from "@/lib/network/mergeLinkedInConnections";
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
import { useAuth } from "@/components/auth/AuthProvider";
import { loadPersonalFromSupabase } from "@/lib/supabase/personalDataRepository";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  importAppliedApplicationsBatch,
  markJobApplied,
  persistApplicationFields,
  persistContactChange,
  persistNotesDiff,
  saveJob,
  setSavedAutoQueue,
  unsaveJob,
  updateApplicationStatus,
} from "@/lib/supabase/personalWrites";

type PersistenceMode = "local" | "supabase";

export function RecruitingProvider({ children }: { children: ReactNode }) {
  const { user, migrationStatus } = useAuth();
  const [apps, setApps] = useState<ApplicationRecord[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [queueIds, setQueueIds] = useState<Set<string>>(new Set());
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<NetworkContact[]>([]);
  const [notes, setNotes] = useState<NetworkNote[]>([]);
  const [links, setLinks] = useState<ContactApplicationLink[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [persistenceMode, setPersistenceMode] = useState<PersistenceMode>("local");
  const [cloudReady, setCloudReady] = useState(false);
  const [persistError, setPersistError] = useState<string | null>(null);

  const hydrateLocal = useCallback(() => {
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
    setQueueIds(new Set(listApplyListIds()));
    setPersistenceMode("local");
    setCloudReady(false);
    setHydrated(true);
  }, []);

  // Signed-out / unconfigured: local mode
  useEffect(() => {
    if (user && isSupabaseConfigured()) return;
    hydrateLocal();
  }, [user, hydrateLocal]);

  // Authenticated: wait for migration, then load Supabase as source of truth (even if empty).
  useEffect(() => {
    if (!isSupabaseConfigured() || !user) return;
    if (migrationStatus === "running" || migrationStatus === "idle") {
      setCloudReady(false);
      return;
    }
    if (migrationStatus === "error") {
      setPersistError("Local data migration failed; personal cloud sync paused.");
      setCloudReady(false);
      return;
    }

    let cancelled = false;
    setCloudReady(false);
    void loadPersonalFromSupabase(user.id).then((remote) => {
      if (cancelled) return;
      if (!remote) {
        setPersistError("Could not load personal data from Supabase.");
        setCloudReady(false);
        return;
      }
      // Keep local company catalog for Network UI chrome; personal records from remote only.
      // Recommended (unsaved) contact suggestions remain local chrome until the user saves them.
      const localRecommended = hydrateNetworkPersonal().contacts.filter((c) => c.isRecommended);
      const remoteIds = new Set(remote.contacts.map((c) => c.id));
      const remoteNames = new Set(remote.contacts.map((c) => `${c.companyId}::${c.name}`.toLowerCase()));
      const suggestions = localRecommended.filter(
        (c) =>
          !remoteIds.has(c.id) &&
          !remoteNames.has(`${c.companyId}::${c.name}`.toLowerCase()),
      );
      setCompanies(ensureSeedCompanies(listCompanies()));
      setApps(remote.apps);
      setContacts([...remote.contacts, ...suggestions]);
      setNotes(remote.notes);
      setLinks(remote.links);
      setSavedIds(new Set(remote.savedIds));
      setQueueIds(new Set(remote.queueIds));
      setPersistenceMode("supabase");
      setPersistError(null);
      setCloudReady(true);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user, migrationStatus]);

  // Sign out → clear private in-memory state, restore local prototype (not previous user's cloud).
  useEffect(() => {
    if (user) return;
    if (!hydrated) return;
    if (persistenceMode === "supabase") hydrateLocal();
  }, [user, hydrated, persistenceMode, hydrateLocal]);

  // localStorage writes ONLY in local mode (never overwrite while authenticated to Supabase).
  useEffect(() => {
    if (!hydrated || persistenceMode !== "local") return;
    saveApplications(apps);
  }, [apps, hydrated, persistenceMode]);

  useEffect(() => {
    if (!hydrated || persistenceMode !== "local") return;
    saveSavedJobIds([...savedIds]);
  }, [savedIds, hydrated, persistenceMode]);

  useEffect(() => {
    if (!hydrated || persistenceMode !== "local") return;
    saveApplyListIds([...queueIds]);
  }, [queueIds, hydrated, persistenceMode]);

  useEffect(() => {
    if (!hydrated) return;
    // Company catalog chrome can stay local in both modes.
    saveCompanies(companies);
  }, [companies, hydrated]);

  useEffect(() => {
    if (!hydrated || persistenceMode !== "local") return;
    saveContacts(contacts);
  }, [contacts, hydrated, persistenceMode]);

  useEffect(() => {
    if (!hydrated || persistenceMode !== "local") return;
    saveNotes(notes);
  }, [notes, hydrated, persistenceMode]);

  useEffect(() => {
    if (!hydrated || persistenceMode !== "local") return;
    saveContactApplicationLinks(links);
  }, [links, hydrated, persistenceMode]);

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

  const toggleSaved = useCallback(
    (jobId: string) => {
      const wasSaved = savedIds.has(jobId);
      const nextSaved = new Set(savedIds);
      if (wasSaved) nextSaved.delete(jobId);
      else nextSaved.add(jobId);
      setSavedIds(nextSaved);

      if (persistenceMode !== "supabase" || !user) return;

      void (async () => {
        try {
          if (wasSaved) await unsaveJob(user.id, jobId);
          else await saveJob(user.id, jobId, queueIds.has(jobId));
          setPersistError(null);
        } catch (e) {
          setSavedIds(savedIds);
          setPersistError(e instanceof Error ? e.message : "Failed to update saved job");
        }
      })();
    },
    [savedIds, queueIds, persistenceMode, user],
  );

  const markApplied = useCallback(
    (job: JobListingView) => {
      setCompanies((prevCompanies) => {
        const { companies: nextCompanies, company } = upsertCompanyByName(
          prevCompanies,
          job.company,
          job.tone === "pink" ? "blue" : job.tone,
        );

        if (persistenceMode !== "supabase" || !user) {
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
        }

        const existing = findApplicationByJobId(apps, job.id);
        void markJobApplied(user.id, job, existing ? { ...existing, companyId: existing.companyId || company.id } : undefined)
          .then((saved) => {
            setApps((prev) => upsertApplication(prev, { ...saved, companyId: saved.companyId || company.id }));
            setSavedIds((prev) => new Set(prev).add(job.id));
            void saveJob(user.id, job.id, queueIds.has(job.id)).catch(() => undefined);
            setPersistError(null);
          })
          .catch((e) => {
            setPersistError(e instanceof Error ? e.message : "Failed to mark applied");
          });

        return nextCompanies;
      });
    },
    [persistenceMode, user, apps, queueIds],
  );

  const addToApplyList = useCallback(
    (job: JobListingView) => {
      setQueueIds((prev) => new Set(prev).add(job.id));
      setSavedIds((prev) => new Set(prev).add(job.id));

      if (persistenceMode !== "supabase" || !user) return;

      void setSavedAutoQueue(user.id, job.id, true)
        .then(() => setPersistError(null))
        .catch((e) =>
          setPersistError(e instanceof Error ? e.message : "Failed to update apply list"),
        );
    },
    [persistenceMode, user],
  );

  const removeFromApplyList = useCallback(
    (jobId: string) => {
      setQueueIds((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
      setApps((prev) =>
        prev.map((app) => (app.jobId === jobId ? { ...app, autoQueued: false } : app)),
      );
      if (persistenceMode === "supabase" && user) {
        void setSavedAutoQueue(user.id, jobId, false)
          .then(() => setPersistError(null))
          .catch((e) =>
            setPersistError(e instanceof Error ? e.message : "Failed to update apply list"),
          );
      }
    },
    [persistenceMode, user],
  );

  const setStatus = useCallback(
    (applicationId: string, status: ApplicationLifecycleStatus) => {
      const app = apps.find((a) => a.applicationId === applicationId);
      if (!app) return;

      if (persistenceMode !== "supabase" || !user) {
        setApps((prev) =>
          prev.map((a) => (a.applicationId === applicationId ? appendStatus(a, status) : a)),
        );
        return;
      }

      const snapshot = apps;
      void updateApplicationStatus(user.id, app, status)
        .then((next) => {
          setApps((prev) => prev.map((a) => (a.applicationId === applicationId ? next : a)));
          setPersistError(null);
        })
        .catch((e) => {
          setApps(snapshot);
          setPersistError(e instanceof Error ? e.message : "Failed to update status");
        });
    },
    [apps, persistenceMode, user],
  );

  const updateApplication = useCallback(
    (
      applicationId: string,
      patch: Partial<
        Pick<ApplicationRecord, "materialsRequired" | "onlineAssessment" | "experienceNotes">
      >,
    ) => {
      setApps((prev) => {
        const next = prev.map((a) => {
          if (a.applicationId !== applicationId) return a;
          return normalizeApplicationRecord({ ...a, ...patch });
        });
        saveApplications(next);
        const updated = next.find((a) => a.applicationId === applicationId);
        if (updated) {
          syncOnlineAssessmentTask(updated);
          if (patch.onlineAssessment?.completed) {
            completeOnlineAssessmentTask(applicationId);
          }
        }
        return next;
      });

      if (persistenceMode !== "supabase" || !user) return;

      const app = apps.find((a) => a.applicationId === applicationId);
      if (!app) return;
      const merged = normalizeApplicationRecord({ ...app, ...patch });
      void persistApplicationFields(user.id, merged)
        .then(() => setPersistError(null))
        .catch((e) => {
          setPersistError(e instanceof Error ? e.message : "Failed to save application details");
        });
    },
    [apps, persistenceMode, user],
  );

  const updateContact = useCallback(
    (next: NetworkContact) => {
      const prev = contacts.find((c) => c.id === next.id);
      setContacts((list) => list.map((c) => (c.id === next.id ? next : c)));
      setLinks((prevLinks) => syncLinksFromContact(prevLinks, next));

      if (persistenceMode !== "supabase" || !user) return;
      // Skip pure recommended (unsaved) contacts until promoted / outreach
      if (next.isRecommended && (!prev || prev.isRecommended)) return;

      void persistContactChange(user.id, prev, { ...next, isRecommended: false }, links)
        .then(({ contact, links: nextLinks }) => {
          setContacts((list) =>
            list.map((c) => (c.id === next.id || c.id === contact.id ? contact : c)),
          );
          setLinks(nextLinks);
          setNotes((ns) =>
            ns.map((n) => (n.contactId === next.id && contact.id !== next.id ? { ...n, contactId: contact.id } : n)),
          );
          setPersistError(null);
        })
        .catch((e) => {
          if (prev) setContacts((list) => list.map((c) => (c.id === next.id ? prev : c)));
          setPersistError(e instanceof Error ? e.message : "Failed to save contact");
        });
    },
    [contacts, links, persistenceMode, user],
  );

  const setContactsState = useCallback(
    (next: NetworkContact[] | ((prev: NetworkContact[]) => NetworkContact[])) => {
      setContacts((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        if (persistenceMode === "supabase" && user) {
          // Persist contacts that were promoted or mutated vs prev
          const prevById = new Map(prev.map((c) => [c.id, c]));
          for (const c of resolved) {
            const before = prevById.get(c.id);
            const promoted = before?.isRecommended && !c.isRecommended;
            const mutated = before && JSON.stringify(before) !== JSON.stringify(c);
            if (promoted || (mutated && !c.isRecommended)) {
              void persistContactChange(user.id, before, c, links)
                .then(({ contact, links: nextLinks }) => {
                  setContacts((list) =>
                    list.map((x) => (x.id === c.id || x.id === contact.id ? contact : x)),
                  );
                  setLinks(nextLinks);
                  setNotes((ns) =>
                    ns.map((n) =>
                      n.contactId === c.id && contact.id !== c.id
                        ? { ...n, contactId: contact.id }
                        : n,
                    ),
                  );
                })
                .catch((e) =>
                  setPersistError(e instanceof Error ? e.message : "Failed to sync contacts"),
                );
            }
          }
        }
        return resolved;
      });
    },
    [persistenceMode, user, links],
  );

  const setNotesState = useCallback(
    (next: NetworkNote[] | ((prev: NetworkNote[]) => NetworkNote[])) => {
      setNotes((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        if (persistenceMode === "supabase" && user) {
          void persistNotesDiff(user.id, prev, resolved)
            .then((synced) => {
              setNotes(synced);
              setPersistError(null);
            })
            .catch((e) => {
              setNotes(prev);
              setPersistError(e instanceof Error ? e.message : "Failed to sync notes");
            });
        }
        return resolved;
      });
    },
    [persistenceMode, user],
  );

  const addCompanyToCatalog = useCallback((company: Company) => {
    setCompanies((prev) => (prev.some((c) => c.id === company.id) ? prev : [...prev, company]));
  }, []);

  const importLinkedInConnections = useCallback(
    async (plan: LinkedInImportPlan) => {
      setCompanies(plan.nextCompanies);

      if (persistenceMode !== "supabase" || !user) {
        setContacts(plan.nextContacts);
        return;
      }

      let nextLinks = links;
      let nextContactList = plan.nextContacts;

      try {
        for (const { prev, next } of plan.changedContacts) {
          const result = await persistContactChange(user.id, prev, next, nextLinks);
          nextLinks = result.links;
          nextContactList = nextContactList.map((c) =>
            c.id === next.id || c.id === result.contact.id ? result.contact : c,
          );
        }
        setContacts(nextContactList);
        setLinks(nextLinks);
        setPersistError(null);
      } catch (e) {
        setPersistError(e instanceof Error ? e.message : "LinkedIn import failed to sync");
        throw e;
      }
    },
    [links, persistenceMode, user],
  );

  const importAppliedApplications = useCallback(
    async (plan: AppliedImportPlan) => {
      let nextApps = apps;
      let nextSaved = new Set(savedIds);
      let nextCompanies = companies;

      for (const { row, matchedJob, existing } of plan.records) {
        const { companies: updatedCompanies, company } = upsertCompanyByName(
          nextCompanies,
          row.company,
          matchedJob?.tone === "pink" ? "blue" : matchedJob?.tone ?? "blue",
        );
        nextCompanies = updatedCompanies;

        const record = existing
          ? mergeImportedIntoApp(existing, row, matchedJob)
          : createImportedApplicationRecord(row, matchedJob, company.id);

        nextApps = upsertApplication(nextApps, { ...record, companyId: company.id });
        if (matchedJob) nextSaved.add(matchedJob.id);
      }

      setCompanies(nextCompanies);
      setApps(nextApps);
      setSavedIds(nextSaved);
      saveApplications(nextApps);
      saveSavedJobIds([...nextSaved]);

      if (persistenceMode !== "supabase" || !user) return;

      try {
        const synced = await importAppliedApplicationsBatch(user.id, plan.records);
        setApps((prev) => {
          let merged = prev;
          for (const app of synced) {
            merged = upsertApplication(merged, app);
          }
          return merged;
        });
        setPersistError(null);
      } catch (e) {
        setPersistError(e instanceof Error ? e.message : "Application import failed to sync");
        throw e;
      }
    },
    [apps, companies, persistenceMode, savedIds, user],
  );

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
    hydrated: hydrated && (!user || !isSupabaseConfigured() || cloudReady || migrationStatus === "error"),
    interviewingApps,
    stats,
    companies,
    contacts,
    notes,
    links,
    toggleSaved,
    markApplied,
    addToApplyList,
    removeFromApplyList,
    setStatus,
    updateApplication,
    updateContact,
    setContacts: setContactsState,
    setNotes: setNotesState,
    addCompanyToCatalog,
    ensureCompanyForJob,
    importLinkedInConnections,
    importAppliedApplications,
  };

  return (
    <RecruitingContext.Provider value={value}>
      {persistError && (
        <div className="fixed bottom-3 left-1/2 z-[90] max-w-lg -translate-x-1/2 border-2 border-ink bg-yellow-wash px-4 py-2 text-center text-[0.85rem] text-ink shadow-hard-sm">
          Sync error: {persistError}
          <button
            type="button"
            className="ml-3 underline"
            onClick={() => setPersistError(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      {children}
    </RecruitingContext.Provider>
  );
}
