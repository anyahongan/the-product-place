import { useMemo, useState } from "react";
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
import type { ApplicationMode as Mode, JobFiltersState } from "@/types/apply";
import type { JobListingView } from "@/lib/apply/types";
import { CatalogIngestButton } from "@/components/apply/CatalogIngestButton";

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
  } = useApplyContext();

  const [filters, setFilters] = useState<JobFiltersState>(defaultFilters);
  const [detail, setDetail] = useState<JobListingView | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const visible = useMemo(
    () => filterAndSortJobs(jobs, filters, savedIds),
    [jobs, filters, savedIds],
  );
  const activeFilterCount = countActiveFilters(filters);
  const appliedJobIds = useMemo(() => new Set(apps.map((a) => a.jobId)), [apps]);

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
      flash("Quick Apply tailored materials are coming later. Use Manual to open the link.");
      return;
    }
    addToAutoQueue(job);
    flash(`Added ${job.company} to your local Auto Queue. Nothing was submitted.`);
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

      <Reveal from="up" distance={30} delay={0.08}>
        <JobFiltersPanel
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters(defaultFilters)}
        />
      </Reveal>

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
            </p>
            {warnings.length > 0 && (
              <p className="tag text-ink-faint">Partial source load: {warnings.join(" · ")}</p>
            )}
            <CatalogIngestButton />

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
                    flash(`Marked ${job.company} as applied.`);
                  }}
                />
              ))
            )}
          </>
        )}
      </div>

      <JobDetail
        job={detail}
        mode={mode}
        applied={detail ? appliedJobIds.has(detail.id) : false}
        onClose={() => setDetail(null)}
        onApply={() => {
          if (detail) applyAction(detail);
        }}
        onMarkApplied={() => {
          if (!detail) return;
          markApplied(detail);
          flash(`Marked ${detail.company} as applied.`);
        }}
      />

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
