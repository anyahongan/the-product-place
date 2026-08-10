import { useMemo, useState } from "react";
import { Sheet, Tab, Tape } from "@/components/paper/Paper";
import { Reveal } from "@/components/paper/Reveal";
import {
  AppliedApplicationCard,
  AppliedStatusFilters,
} from "@/components/apply/AppliedApplication";
import { useAppliedDraft } from "@/hooks/useAppliedDraft";
import { sampleApplications } from "@/data/apply";
import type { AppliedStatus } from "@/types/apply";

export function AppliedOverview() {
  const { apps, setStatus } = useAppliedDraft(sampleApplications);
  const [filter, setFilter] = useState<"all" | AppliedStatus>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const waiting = apps.filter((a) => a.status === "waiting").length;
    const interviewing = apps.filter((a) => a.status === "interviewing").length;
    const rejected = apps.filter((a) => a.status === "rejected").length;
    const withdrawn = apps.filter((a) => a.status === "withdrawn").length;
    return {
      total: apps.length,
      waiting,
      interviewing,
      rejected,
      withdrawn,
    };
  }, [apps]);

  const counts = useMemo(
    () => ({
      all: apps.length,
      waiting: stats.waiting,
      interviewing: stats.interviewing,
      rejected: stats.rejected,
      withdrawn: stats.withdrawn,
    }),
    [apps.length, stats],
  );

  const visible = apps.filter((a) => (filter === "all" ? true : a.status === filter));

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
          <p className="mt-4 max-w-[46ch] text-[1.02rem] text-ink-soft">
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
          className="relative grid gap-4 px-5 py-6 sm:grid-cols-4 sm:px-8"
        >
          <Tape className="-top-3 left-10" color="blue" angle={-5} width={120} height={26} />
          <Stat label="Applications" value={stats.total} />
          <Stat label="Waiting" value={stats.waiting} accent="yellow" />
          <Stat label="Interviewing" value={stats.interviewing} accent="purple" />
          <Stat label="Rejected" value={stats.rejected} accent="ink" />
        </Sheet>
      </Reveal>

      <AppliedStatusFilters value={filter} onChange={setFilter} counts={counts} />

      <div className="space-y-5">
        {visible.length === 0 ? (
          <Sheet tone="paper-2" shadow="hard-sm" className="px-6 py-10">
            <p className="font-display text-[1.4rem] font-black uppercase">No matches</p>
            <p className="tag mt-2 text-ink-faint">Try another status filter.</p>
          </Sheet>
        ) : (
          visible.map((app) => (
            <AppliedApplicationCard
              key={app.id}
              app={app}
              expanded={openId === app.id}
              onToggle={() => setOpenId(openId === app.id ? null : app.id)}
              onStatusChange={(status) => setStatus(app.id, status)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "yellow" | "purple" | "ink";
}) {
  return (
    <div className="border-2 border-ink bg-paper px-3 py-3">
      <p className="tag text-ink-faint">{label}</p>
      <p
        className="mt-1 font-display text-[2.4rem] font-black leading-none tracking-[-0.04em]"
        style={
          accent === "yellow"
            ? {
                color: "var(--ink)",
                background: "var(--yellow)",
                display: "inline-block",
                padding: "0 0.25rem",
              }
            : accent === "purple"
              ? {
                  color: "var(--paper)",
                  background: "var(--purple)",
                  display: "inline-block",
                  padding: "0 0.25rem",
                }
              : accent === "ink"
                ? {
                    color: "var(--paper)",
                    background: "var(--ink)",
                    display: "inline-block",
                    padding: "0 0.25rem",
                  }
                : undefined
        }
      >
        {value}
      </p>
    </div>
  );
}
