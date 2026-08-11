import { useMemo, useState } from "react";
import { Sheet, Tab, Tape } from "@/components/paper/Paper";
import { Reveal } from "@/components/paper/Reveal";
import {
  AppliedApplicationCard,
  AppliedStatusFilters,
} from "@/components/apply/AppliedApplication";
import { useApplyContext } from "@/components/apply/useApplyContext";
import type { ApplicationLifecycleStatus } from "@/lib/apply/types";

export function AppliedOverview() {
  const { apps, stats, setStatus, hydrated } = useApplyContext();
  const [filter, setFilter] = useState<"all" | ApplicationLifecycleStatus>("all");
  const [openId, setOpenId] = useState<string | null>(null);

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
          <p className="mt-4 text-[1.02rem] text-ink-soft md:whitespace-nowrap">
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
          className="relative grid gap-4 px-5 py-6 sm:grid-cols-5 sm:px-8"
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
          visible.map((app) => (
            <AppliedApplicationCard
              key={app.applicationId}
              app={app}
              expanded={openId === app.applicationId}
              onToggle={() => setOpenId(openId === app.applicationId ? null : app.applicationId)}
              onStatusChange={(status) => setStatus(app.applicationId, status)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-2 border-ink bg-paper px-3 py-3">
      <p className="tag text-ink-faint">{label}</p>
      <p className="mt-1 font-display text-[2.4rem] font-black leading-none tracking-[-0.04em]">
        {value}
      </p>
    </div>
  );
}
