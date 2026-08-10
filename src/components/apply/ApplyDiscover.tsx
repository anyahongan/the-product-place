import { useMemo, useState } from "react";
import { Sheet, Tab } from "@/components/paper/Paper";
import { Reveal } from "@/components/paper/Reveal";
import { ApplicationMode } from "@/components/apply/ApplicationMode";
import { JobFiltersPanel } from "@/components/apply/JobFilters";
import { JobListing } from "@/components/apply/JobListing";
import { JobDetail } from "@/components/apply/JobDetail";
import {
  countActiveFilters,
  defaultFilters,
  filterAndSortJobs,
} from "@/components/apply/filterJobs";
import { sampleJobs } from "@/data/apply";
import type { ApplicationMode as Mode, JobFiltersState, JobListing as Job } from "@/types/apply";

export function ApplyDiscover({
  mode,
  onModeChange,
}: {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}) {
  const [filters, setFilters] = useState<JobFiltersState>(defaultFilters);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<Job | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const jobs = useMemo(
    () => filterAndSortJobs(sampleJobs, filters, saved),
    [filters, saved],
  );
  const activeFilterCount = countActiveFilters(filters);

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  const applyAction = (job: Job) => {
    if (mode === "manual") {
      flash(`Manual mode: would open ${job.company} application (demo).`);
      return;
    }
    if (mode === "quick") {
      flash(`Quick apply staged for ${job.company} (demo, not submitted).`);
      return;
    }
    flash(`Added ${job.company} to auto queue (demo, not submitted).`);
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
            Discover product roles, filter the pile, and choose how you want to apply without leaving the planner.
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
        <p className="tag text-ink-soft">
          Showing {jobs.length} of {sampleJobs.length}
          {activeFilterCount ? ` · ${activeFilterCount} filter group${activeFilterCount === 1 ? "" : "s"}` : ""}
        </p>

        {jobs.length === 0 ? (
          <Sheet tone="paper-2" shadow="hard-sm" className="px-6 py-10">
            <p className="font-display text-[1.4rem] font-black uppercase">No roles match</p>
            <p className="mt-2 text-ink-soft">Loosen a filter or clear the stack.</p>
            <button
              type="button"
              onClick={() => setFilters(defaultFilters)}
              className="focus-ink mt-4 border-2 border-ink bg-yellow px-3 py-2 font-display text-sm font-black uppercase outline-none"
            >
              Clear filters
            </button>
          </Sheet>
        ) : (
          jobs.map((job, index) => (
            <JobListing
              key={job.id}
              job={job}
              index={index}
              mode={mode}
              saved={saved.has(job.id)}
              onView={() => setDetail(job)}
              onSave={() => {
                setSaved((prev) => {
                  const next = new Set(prev);
                  if (next.has(job.id)) next.delete(job.id);
                  else next.add(job.id);
                  return next;
                });
              }}
              onApply={() => applyAction(job)}
            />
          ))
        )}
      </div>

      <JobDetail
        job={detail}
        mode={mode}
        onClose={() => setDetail(null)}
        onApply={() => {
          if (detail) applyAction(detail);
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
