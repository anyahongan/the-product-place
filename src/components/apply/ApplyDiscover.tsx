import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sheet, Tab } from "@/components/paper/Paper";
import { Reveal } from "@/components/paper/Reveal";
import { ApplicationMode } from "@/components/apply/ApplicationMode";
import { JobFiltersPanel } from "@/components/apply/JobFilters";
import { JobListing } from "@/components/apply/JobListing";
import { JobDetail } from "@/components/apply/JobDetail";
import { useApplyContext } from "@/components/apply/useApplyContext";
import {
  countActiveFilters,
  defaultFilters,
  filterAndSortJobs,
} from "@/components/apply/filterJobs";
import { useAuth } from "@/components/auth/AuthProvider";
import { CatalogIngestButton } from "@/components/apply/CatalogIngestButton";
import { AutoQueuePanel } from "@/components/apply/AutoQueuePanel";
import { QuickApplyPanel } from "@/components/apply/QuickApplyPanel";
import {
  calculateJobMatch,
  matchPercentForSort,
  profileHasMatchInputs,
} from "@/lib/matching";
import { PROFILE_UPDATED_EVENT } from "@/lib/profile/profileEvents";
import { loadProfileBundle } from "@/lib/profile/profileRepository";
import type { ApplicationMode as Mode, JobFiltersState } from "@/types/apply";
import type { JobListingView } from "@/lib/apply/types";
import type { UserProfileBundle } from "@/types/profile";

export function ApplyDiscover({
  mode,
  onModeChange,
}: {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}) {
  const {
    jobs,
    status,
    error,
    warnings,
    reload,
    savedIds,
    apps,
    toggleSaved,
    markApplied,
    addToAutoQueue,
    removeFromAutoQueue,
    queueIds,
  } = useApplyContext();
  const { user, configured } = useAuth();

  const [filters, setFilters] = useState<JobFiltersState>(defaultFilters);
  const [detail, setDetail] = useState<JobListingView | null>(null);
  const [quickApplyJob, setQuickApplyJob] = useState<JobListingView | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [profileBundle, setProfileBundle] = useState<UserProfileBundle | null>(null);
  const [profileStatus, setProfileStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );

  useEffect(() => {
    if (!configured || !user) {
      setProfileBundle(null);
      setProfileStatus("idle");
      return;
    }

    let cancelled = false;

    const load = () => {
      setProfileStatus((prev) => (prev === "ready" ? "ready" : "loading"));
      void loadProfileBundle(user.id)
        .then((bundle) => {
          if (cancelled) return;
          setProfileBundle(bundle);
          setProfileStatus("ready");
        })
        .catch(() => {
          if (cancelled) return;
          setProfileBundle(null);
          setProfileStatus("error");
        });
    };

    load();

    const onProfileUpdated = () => load();
    const onFocus = () => load();
    window.addEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);
      window.removeEventListener("focus", onFocus);
    };
  }, [configured, user]);

  const profileReady = Boolean(
    profileBundle &&
      profileHasMatchInputs({
        roles: profileBundle.targets.roles,
        graduationYear: profileBundle.profile.graduationYear,
        employmentTypes: profileBundle.targets.employmentTypes,
        workModes: profileBundle.targets.workModes,
        locations: profileBundle.targets.locations,
        skills: profileBundle.experiences.flatMap((e) => e.skills),
      }),
  );

  const matchedJobs = useMemo(() => {
    if (!profileBundle || !profileReady) {
      return jobs.map((job) => {
        const { matchResult: _drop, ...rest } = job;
        void _drop;
        return { ...rest, matchPercent: null as number | null, matchResult: null };
      });
    }
    return jobs.map((job) => {
      const matchResult = calculateJobMatch(job, profileBundle);
      return {
        ...job,
        matchPercent: matchPercentForSort(matchResult),
        matchResult,
      };
    });
  }, [jobs, profileBundle, profileReady]);

  const visible = useMemo(
    () => filterAndSortJobs(matchedJobs, filters, savedIds),
    [matchedJobs, filters, savedIds],
  );
  const activeFilterCount = countActiveFilters(filters);
  const appliedJobIds = useMemo(() => new Set(apps.map((a) => a.jobId)), [apps]);

  const queuedJobs = useMemo(
    () =>
      [...queueIds]
        .map((id) => matchedJobs.find((job) => job.id === id))
        .filter((job): job is JobListingView => Boolean(job)),
    [queueIds, matchedJobs],
  );

  const detailJob = useMemo(() => {
    if (!detail) return null;
    return matchedJobs.find((j) => j.id === detail.id) ?? detail;
  }, [detail, matchedJobs]);

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  };

  const openExternal = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const applyAction = (job: JobListingView) => {
    if (mode === "manual") {
      if (!job.applicationUrl) {
        flash("No direct application link available for this role.");
        return;
      }
      openExternal(job.applicationUrl);
      flash(`Opened ${job.company} application in a new tab.`);
      return;
    }
    if (mode === "quick") {
      setQuickApplyJob(job);
      setDetail(null);
      return;
    }
    addToAutoQueue(job);
    flash(`Added ${job.company} to your Auto Queue. Nothing was submitted.`);
  };

  return (
    <div className="space-y-8">
      <Reveal from="up" distance={40}>
        <div>
          <Tab color="blue">Section 02 · Apply</Tab>
          <h2 className="mt-3 font-display text-[clamp(2.4rem,8vw,5rem)] font-black uppercase leading-[0.8]">
            Find your
            <br />
            next role
          </h2>
          <p className="mt-4 text-[1.02rem] text-ink-soft md:whitespace-nowrap">
            Discover product roles, filter the pile, and choose how you want to apply without
            leaving the planner.
          </p>
        </div>
      </Reveal>

      <Reveal from="right" distance={50} delay={0.05}>
        <ApplicationMode value={mode} onChange={onModeChange} />
      </Reveal>

      {mode === "auto" && (
        <Reveal from="up" distance={30} delay={0.06}>
          <AutoQueuePanel
            jobs={queuedJobs}
            onOpenEmployer={(job) => {
              if (!job.applicationUrl) {
                flash("No direct application link available for this role.");
                return;
              }
              openExternal(job.applicationUrl);
              flash(`Opened ${job.company} application in a new tab.`);
            }}
            onRemove={(jobId) => {
              removeFromAutoQueue(jobId);
              flash("Removed from Auto Queue.");
            }}
            onMarkApplied={(job) => {
              markApplied(job);
              removeFromAutoQueue(job.id);
              flash(`Marked ${job.company} as applied and removed from queue.`);
            }}
            onOpenNext={() => {
              const next = queuedJobs.find((job) => job.applicationUrl);
              if (!next?.applicationUrl) {
                flash("No queued roles with a direct application link.");
                return;
              }
              openExternal(next.applicationUrl);
              flash(`Opened ${next.company} application in a new tab.`);
            }}
          />
        </Reveal>
      )}

      <Reveal from="up" distance={30} delay={0.08}>
        <JobFiltersPanel
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters(defaultFilters)}
        />
      </Reveal>

      {configured && user && profileStatus === "ready" && !profileReady && (
        <Sheet tone="yellow" soft shadow="hard-sm" className="px-5 py-4">
          <p className="font-display text-sm font-black uppercase">Limited match ranking</p>
          <p className="mt-1 text-[0.95rem] text-ink-soft">
            Add at least one target role plus graduation year, employment type, work mode,
            locations, or experience skills in Profile to personalize Best Match.
          </p>
          <Link
            to="/profile"
            className="focus-ink mt-3 inline-block border-2 border-ink bg-paper px-3 py-2 font-display text-sm font-black uppercase outline-none hover:bg-ink hover:text-paper"
          >
            Complete Profile
          </Link>
        </Sheet>
      )}

      {!configured || !user ? (
        <p className="tag text-ink-faint">
          Sign in and complete Profile preferences to unlock personalized Best Match ranking.
        </p>
      ) : null}

      <div className="space-y-5">
        {status === "loading" && (
          <Sheet tone="paper-2" shadow="hard-sm" className="px-6 py-10">
            <p className="font-display text-[1.4rem] font-black uppercase">Loading listings</p>
            <p className="mt-2 text-ink-soft">
              Pulling product-relevant internships from the GitHub source…
            </p>
          </Sheet>
        )}

        {status === "error" && (
          <Sheet tone="yellow" soft shadow="hard-sm" className="px-6 py-10">
            <p className="font-display text-[1.4rem] font-black uppercase">Source unavailable</p>
            <p className="mt-2 text-ink-soft">{error}</p>
            <button
              type="button"
              onClick={() => void reload()}
              className="focus-ink mt-4 border-2 border-ink bg-paper px-3 py-2 font-display text-sm font-black uppercase outline-none"
            >
              Try again
            </button>
          </Sheet>
        )}

        {status === "ready" && (
          <>
            <p className="tag text-ink-soft">
              Showing {visible.length} of {jobs.length} product roles
              {activeFilterCount
                ? ` · ${activeFilterCount} filter group${activeFilterCount === 1 ? "" : "s"}`
                : ""}
              {profileReady ? " · matches from your Profile" : ""}
            </p>
            {warnings.length > 0 && (
              <p className="tag text-ink-faint">Partial source load: {warnings.join(" · ")}</p>
            )}
            <CatalogIngestButton onComplete={() => void reload()} />

            {visible.length === 0 ? (
              <Sheet tone="paper-2" shadow="hard-sm" className="px-6 py-10">
                <p className="font-display text-[1.4rem] font-black uppercase">No roles match</p>
                <p className="mt-2 text-ink-soft">
                  {jobs.length === 0
                    ? "No product-relevant internships were found in the current source."
                    : "Loosen a filter or clear the stack."}
                </p>
                {jobs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilters(defaultFilters)}
                    className="focus-ink mt-4 border-2 border-ink bg-yellow px-3 py-2 font-display text-sm font-black uppercase outline-none"
                  >
                    Clear filters
                  </button>
                )}
              </Sheet>
            ) : (
              visible.map((job, index) => (
                <JobListing
                  key={job.id}
                  job={job}
                  index={index}
                  mode={mode}
                  saved={savedIds.has(job.id)}
                  applied={appliedJobIds.has(job.id)}
                  onView={() => setDetail(job)}
                  onSave={() => toggleSaved(job.id)}
                  onApply={() => applyAction(job)}
                  onMarkApplied={() => {
                    markApplied(job);
                    removeFromAutoQueue(job.id);
                    flash(`Marked ${job.company} as applied.`);
                  }}
                />
              ))
            )}
          </>
        )}
      </div>

      <JobDetail
        job={detailJob}
        mode={mode}
        applied={detailJob ? appliedJobIds.has(detailJob.id) : false}
        profileBundle={profileBundle}
        userId={user?.id ?? null}
        onClose={() => setDetail(null)}
        onApply={() => {
          if (detailJob) applyAction(detailJob);
        }}
        onMarkApplied={() => {
          if (!detailJob) return;
          markApplied(detailJob);
          removeFromAutoQueue(detailJob.id);
          flash(`Marked ${detailJob.company} as applied.`);
        }}
      />

      {quickApplyJob && (
        <QuickApplyPanel
          job={quickApplyJob}
          profileBundle={profileBundle}
          userId={user?.id ?? null}
          onClose={() => setQuickApplyJob(null)}
          onOpenEmployer={() => {
            if (!quickApplyJob.applicationUrl) {
              flash("No direct application link available for this role.");
              return;
            }
            openExternal(quickApplyJob.applicationUrl);
            flash(`Opened ${quickApplyJob.company} application in a new tab.`);
          }}
          onMarkApplied={() => {
            markApplied(quickApplyJob);
            removeFromAutoQueue(quickApplyJob.id);
            flash(`Marked ${quickApplyJob.company} as applied.`);
            setQuickApplyJob(null);
          }}
        />
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[60] w-[min(92vw,28rem)] -translate-x-1/2 border-2 border-ink bg-yellow px-4 py-3 text-center font-display text-sm font-black uppercase shadow-hard"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
