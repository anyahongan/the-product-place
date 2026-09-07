import { useEffect, useMemo, useState } from "react";
import { Sheet, Tab, Tape } from "@/components/paper/Paper";
import { Reveal } from "@/components/paper/Reveal";
import {
  AppliedApplicationCard,
  AppliedStatusFilters,
} from "@/components/apply/AppliedApplication";
import { AppliedImportPanel } from "@/components/apply/AppliedImportPanel";
import { useApplyContext } from "@/components/apply/useApplyContext";
import type { ApplicationLifecycleStatus } from "@/lib/apply/types";

export function AppliedOverview({
  focusApplicationId,
}: {
  focusApplicationId?: string;
}) {
  const { apps, stats, setStatus, hydrated, jobs, importAppliedApplications } = useApplyContext();
  const [filter, setFilter] = useState<"all" | ApplicationLifecycleStatus>("all");
  const [openId, setOpenId] = useState<string | null>(focusApplicationId ?? null);
  const [importBusy, setImportBusy] = useState(false);

  const jobById = useMemo(() => new Map(jobs.map((j) => [j.id, j])), [jobs]);

  useEffect(() => {
    if (focusApplicationId) setOpenId(focusApplicationId);
  }, [focusApplicationId]);

  const counts = useMemo(() => {
    const base: Record<"all" | ApplicationLifecycleStatus, number> = {
      all: apps.length,
      Saved: 0,
      Preparing: 0,
      Applied: 0,
      Waiting: 0,
      "Recruiter Screen": 0,
      Interviewing: 0,
      "Final Round": 0,
      Offer: 0,
      Rejected: 0,
      Withdrawn: 0,
    };
    for (const app of apps) base[app.currentStatus] += 1;
    return base;
  }, [apps]);

  const visible = apps.filter((a) => (filter === "all" ? true : a.currentStatus === filter));

  return (
    <div className="space-y-8">
      <Reveal from="up" distance={40}>
        <div className="relative">
          <Tab color="blue">Applied tracker</Tab>
          <h2 className="mt-3 font-display text-[clamp(2.2rem,7vw,4.2rem)] font-black uppercase leading-[0.82]">
            Your
            <br />
            applications
          </h2>
          <p className="mt-4 max-w-[42ch] text-[1.02rem] leading-relaxed text-ink-soft">
            Manage submitted roles, see where things stand, and find people worth a nudge.
          </p>
        </div>
      </Reveal>

      <Reveal from="left" distance={60} rotate={-1.5}>
        <Sheet
          tone="blue"
          soft
          pattern="grid"
          shadow="hard"
          className="relative grid grid-cols-2 gap-3 px-4 py-5 sm:grid-cols-3 sm:gap-4 sm:px-6 lg:grid-cols-5 lg:px-8 lg:py-6"
        >
          <Tape className="-top-3 left-10" color="blue" angle={-5} width={120} height={26} />
          <Stat label="Applications" value={stats.total} />
          <Stat label="Waiting" value={stats.waiting} />
          <Stat label="Interviewing" value={stats.interviewing} />
          <Stat label="Rejected" value={stats.rejected} />
          <Stat label="Offers" value={stats.offers} />
        </Sheet>
      </Reveal>

      <AppliedStatusFilters value={filter} onChange={setFilter} counts={counts} />

      <Reveal from="up" distance={24} delay={0.04}>
        <AppliedImportPanel
          jobs={jobs}
          apps={apps}
          busy={importBusy}
          onImport={async (plan) => {
            setImportBusy(true);
            try {
              await importAppliedApplications(plan);
            } finally {
              setImportBusy(false);
            }
          }}
        />
      </Reveal>

      <div className="space-y-5">
        {!hydrated ? (
          <Sheet tone="paper-2" shadow="hard-sm" className="px-6 py-10">
            <p className="font-display text-[1.4rem] font-black uppercase">Loading applications</p>
          </Sheet>
        ) : visible.length === 0 ? (
          <Sheet tone="paper-2" shadow="hard-sm" className="px-6 py-10">
            <p className="font-display text-[1.4rem] font-black uppercase">
              {apps.length === 0 ? "No applications yet" : "No matches"}
            </p>
            <p className="tag mt-2 text-ink-faint">
              {apps.length === 0
                ? "Mark a role as applied from the Apply tab to see it here."
                : "Try another status filter."}
            </p>
          </Sheet>
        ) : (
          visible.map((app) => {
            const job = jobById.get(app.jobId);
            return (
              <AppliedApplicationCard
                key={app.applicationId}
                app={app}
                postedDate={job?.postedDate ?? app.postedDate}
                deadline={job?.deadline ?? app.deadline}
                expanded={openId === app.applicationId}
                onToggle={() => setOpenId(openId === app.applicationId ? null : app.applicationId)}
                onStatusChange={(status) => setStatus(app.applicationId, status)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 overflow-hidden border-2 border-ink bg-paper px-2.5 py-3 sm:px-3">
      <p className="tag break-words hyphens-auto text-ink-faint leading-snug tracking-[0.12em] sm:tracking-[0.16em] lg:tracking-[0.2em]">
        {label}
      </p>
      <p className="mt-1 font-display text-[clamp(1.7rem,3.5vw,2.4rem)] font-black leading-none tracking-[-0.04em]">
        {value}
      </p>
    </div>
  );
}
