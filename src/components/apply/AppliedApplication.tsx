import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Clip, Sheet, Tape } from "@/components/paper/Paper";
import { ApplicationProgress } from "@/components/apply/ApplicationProgress";
import { NetworkingSuggestions } from "@/components/apply/NetworkingSuggestions";
import { formatShortDate } from "@/data/apply";
import { cn } from "@/lib/utils";
import type { AppliedApplication as App, AppliedStatus } from "@/types/apply";

const statusStyle: Record<AppliedStatus, string> = {
  waiting: "bg-yellow text-ink",
  interviewing: "bg-purple text-paper",
  rejected: "bg-ink text-paper",
  withdrawn: "bg-paper-2 text-ink",
};

const statuses: AppliedStatus[] = ["waiting", "interviewing", "rejected", "withdrawn"];

export function AppliedApplicationCard({
  app,
  expanded,
  onToggle,
  onStatusChange,
}: {
  app: App;
  expanded: boolean;
  onToggle: () => void;
  onStatusChange: (status: AppliedStatus) => void;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.article
      layout={!reduced}
      className="relative"
      transition={{ duration: 0.2, ease: [0.2, 0.9, 0.2, 1] }}
    >
      <Sheet
        tone={app.tone}
        soft
        shadow="hard-sm"
        edge="corner-cut"
        className="relative px-5 py-5 sm:px-7"
      >
        <Tape className="-left-3 top-6" color={app.tone} angle={-88} width={52} height={22} />

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="focus-ink grid w-full gap-3 text-left outline-none sm:grid-cols-[1fr_auto] sm:items-start"
        >
          <div>
            <h3 className="font-display text-[1.4rem] font-black sm:text-[1.7rem]">
              {app.company}
            </h3>
            <p className="mt-1 text-[0.98rem] text-ink-soft">{app.role}</p>
            <p className="tag mt-2 text-ink-faint">
              Applied {formatShortDate(app.dateApplied)} · {app.resumeVersion}
            </p>
          </div>
          <span
            className={cn(
              "tag w-max border-2 border-ink px-2 py-1 uppercase",
              statusStyle[app.status],
            )}
          >
            {app.status}
          </span>
        </button>

        <div className="mt-4">
          <ApplicationProgress current={app.currentStage} reached={app.stagesReached} />
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={reduced ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduced ? { opacity: 1 } : { height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.2, 0.9, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="relative mt-6 border-t-2 border-ink pt-5">
                <Clip className="absolute -top-8 right-4" size={44} color="blue" angle={-6} />

                <h4 className="font-display text-[1.05rem] font-black uppercase">Materials used</h4>
                <ul className="mt-2 space-y-1 text-[0.95rem] text-ink-soft">
                  <li>Resume: {app.resumeVersion}</li>
                  <li>Cover letter: {app.coverLetter ? app.coverLetter : "None attached"}</li>
                </ul>

                <h4 className="mt-5 font-display text-[1.05rem] font-black uppercase">
                  Application history
                </h4>
                <ol className="mt-2 space-y-2">
                  {app.history.map((h) => (
                    <li key={`${h.date}-${h.note}`} className="flex gap-3 text-[0.92rem]">
                      <span className="tag shrink-0 text-ink-faint">{formatShortDate(h.date)}</span>
                      <span className="text-ink-soft">{h.note}</span>
                    </li>
                  ))}
                </ol>

                <h4 className="mt-5 font-display text-[1.05rem] font-black uppercase">
                  Update status
                </h4>
                <p className="tag mt-1 text-ink-faint">Local UI state only</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {statuses.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onStatusChange(s)}
                      aria-pressed={app.status === s}
                      className={cn(
                        "focus-ink tag border-2 border-ink px-2.5 py-1.5 uppercase outline-none",
                        app.status === s ? statusStyle[s] : "bg-paper hover:bg-blue-wash",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <NetworkingSuggestions contacts={app.contacts} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Sheet>
    </motion.article>
  );
}

export function AppliedStatusFilters({
  value,
  onChange,
  counts,
}: {
  value: "all" | AppliedStatus;
  onChange: (v: "all" | AppliedStatus) => void;
  counts: Record<"all" | AppliedStatus, number>;
}) {
  const options: { id: "all" | AppliedStatus; label: string }[] = [
    { id: "all", label: "All" },
    { id: "waiting", label: "Waiting" },
    { id: "rejected", label: "Rejected" },
    { id: "withdrawn", label: "Withdrawn" },
  ];

  return (
    <div role="tablist" aria-label="Applied status filters" className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={cn(
              "focus-ink border-2 border-ink px-3 py-2 font-display text-sm font-black uppercase outline-none",
              active ? "bg-blue text-paper" : "bg-paper hover:bg-yellow-wash",
            )}
          >
            {opt.label}
            <span className={cn("tag ml-2", active ? "text-paper/80" : "text-ink-faint")}>
              {counts[opt.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
