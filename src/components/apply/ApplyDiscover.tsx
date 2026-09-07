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
import { QuickApplyListPanel } from "@/components/apply/QuickApplyListPanel";
import { QuickApplyPanel } from "@/components/apply/QuickApplyPanel";
import {
  calculateJobMatch,
  matchPercentForSort,
  profileHasMatchInputs,
} from "@/lib/matching";
import { buildRoleDedupeKey } from "@/lib/apply/normalization/dedupe";
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
    addToApplyList,
    removeFromApplyList,
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

  const trackedRoleKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const app of apps) {
      keys.add(buildRoleDedupeKey(app.company, app.title));
    }
    return keys;
  }, [apps]);

  const appliedJobIds = useMemo(() => new Set(apps.map((a) => a.jobId)), [apps]);

  const discoverJobs = useMemo(
    () =>
      matchedJobs.filter(
        (job) =>
          !appliedJobIds.has(job.id) &&
          !trackedRoleKeys.has(buildRoleDedupeKey(job.company, job.title)),
      ),
    [matchedJobs, appliedJobIds, trackedRoleKeys],
  );

  const visible = useMemo(
    () => filterAndSortJobs(discoverJobs, filters, savedIds),
    [discoverJobs, filters, savedIds],
  );

  const activeFilterCount = countActiveFilters(filters);

  const applyListJobs = useMemo(
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

  const openQuickApply = (job: JobListingView) => {
    setQuickApplyJob(job);
    setDetail(null);
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
    openQuickApply(job);
  };

  const toggleApplyList = (job: JobListingView) => {
    if (queueIds.has(job.id)) {
      removeFromApplyList(job.id);
      flash(`Removed ${job.company} from apply list.`);
      return;
    }
    addToApplyList(job);
    flash(`Added ${job.company} to your apply list.`);
  };

  const quickApplyListPosition = (job: JobListingView) => {
    const index = applyListJobs.findIndex((j) => j.id === job.id);
    if (index < 0) return null;
    return { index: index + 1, total: applyListJobs.length };
  };

  const nextApplyListJob = (afterJobId?: string) => {
    const list =
      afterJobId != null
        ? applyListJobs.filter((j) => j.id !== afterJobId)
        : applyListJobs;
    return list[0] ?? null;
  };

  const finishApplied = (job: JobListingView, advanceToNext: boolean) => {
    markApplied(job);
    removeFromApplyList(job.id);
    if (advanceToNext) {
      const next = nextApplyListJob(job.id);
      if (next) {
        setQuickApplyJob(next);
        flash(`Marked ${job.company} applied. Next: ${next.company}.`);
        return;
      }
      setQuickApplyJob(null);
      flash(`Marked ${job.company} applied. Apply list complete.`);
      return;
    }
    flash(`Marked ${job.company} as applied.`);
    setQuickApplyJob(null);
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
          <p className="mt-4 max-w-[42ch] text-[1.02rem] leading-relaxed text-ink-soft">
            Discover product roles, filter the pile, and choose how you want to apply without
            leaving the planner.
          </p>
        </div>
      </Reveal>

      <Reveal from="right" distance={50} delay={0.05}>
        <ApplicationMode value={mode} onChange={onModeChange} />
      </Reveal>

      {mode === "quick" && (
        <Reveal from="up" distance={30} delay={0.06}>
          <QuickApplyListPanel
            jobs={applyListJobs}
            onPrepare={openQuickApply}
            onRemove={(jobId) => {
              removeFromApplyList(jobId);
              flash("Removed from apply list.");
            }}
            onStartNext={() => {
              const next = nextApplyListJob();
              if (!next) {
                flash("Apply list is empty.");
                return;
              }
              openQuickApply(next);
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
              Showing {visible.length} of {discoverJobs.length} product roles
              {apps.length > 0 && discoverJobs.length < matchedJobs.length
                ? ` · ${matchedJobs.length - discoverJobs.length} already in your tracker`
                : ""}
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
                  {discoverJobs.length === 0
                    ? apps.length > 0
                      ? "Every role in the catalog is already in your tracker. Import more or clear filters."
                      : "No product-relevant internships were found in the current source."
                    : "Loosen a filter or clear the stack."}
                </p>
                {discoverJobs.length > 0 && (
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
                  onApplyList={queueIds.has(job.id)}
                  onView={() => setDetail(job)}
                  onSave={() => toggleSaved(job.id)}
                  onApply={() => applyAction(job)}
                  onAddToApplyList={mode === "quick" ? () => toggleApplyList(job) : undefined}
                  onMarkApplied={() => {
                    finishApplied(job, false);
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
        onApplyList={detailJob ? queueIds.has(detailJob.id) : false}
        profileBundle={profileBundle}
        userId={user?.id ?? null}
        onClose={() => setDetail(null)}
        onApply={() => {
          if (detailJob) applyAction(detailJob);
        }}
        onAddToApplyList={
          detailJob && mode === "quick" ? () => toggleApplyList(detailJob) : undefined
        }
        onMarkApplied={() => {
          if (!detailJob) return;
          finishApplied(detailJob, false);
        }}
      />

      {quickApplyJob && (
        <QuickApplyPanel
          job={quickApplyJob}
          profileBundle={profileBundle}
          userId={user?.id ?? null}
          listPosition={quickApplyListPosition(quickApplyJob)}
          hasNextInList={Boolean(nextApplyListJob(quickApplyJob.id))}
          onClose={() => setQuickApplyJob(null)}
          onOpenEmployer={() => {
            if (!quickApplyJob.applicationUrl) {
              flash("No direct application link available for this role.");
              return;
            }
            openExternal(quickApplyJob.applicationUrl);
            flash(`Opened ${quickApplyJob.company} application in a new tab.`);
          }}
          onMarkAppliedAndNext={() =>
            finishApplied(quickApplyJob, Boolean(nextApplyListJob(quickApplyJob.id)))
          }
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
