import { motion, useReducedMotion } from "motion/react";
import { Sheet, Tape } from "@/components/paper/Paper";
import { Reveal } from "@/components/paper/Reveal";
import { formatShortDate, EMPLOYMENT_TYPE_LABELS, WORK_MODE_LABELS } from "@/data/apply";
import { modeCta } from "@/components/apply/modeCta";
import { cn } from "@/lib/utils";
import type { ApplicationMode } from "@/types/apply";
import type { JobListingView } from "@/lib/apply/types";

const offsets = ["lg:ml-0", "lg:ml-[6%]", "lg:ml-[2%]", "lg:ml-[10%]"];

export function JobListing({
  job,
  index,
  mode,
  saved,
  applied,
  onView,
  onSave,
  onApply,
  onMarkApplied,
}: {
  job: JobListingView;
  index: number;
  mode: ApplicationMode;
  saved: boolean;
  applied: boolean;
  onView: () => void;
  onSave: () => void;
  onApply: () => void;
  onMarkApplied: () => void;
}) {
  const reduced = useReducedMotion();
  const light = job.tone === "yellow" || job.tone === "green";
  const offset = offsets[index % offsets.length] ?? "";
  const workLabel = job.workMode ? WORK_MODE_LABELS[job.workMode] : "Work mode unknown";
  const empLabel = job.employmentType ? EMPLOYMENT_TYPE_LABELS[job.employmentType] : "Type unknown";

  return (
    <Reveal
      from={index % 2 ? "right" : "left"}
      distance={90}
      rotate={index % 2 ? 2.5 : -2.5}
      delay={Math.min(index * 0.06, 0.3)}
      amount={0.25}
      className={offset}
    >
      <motion.article
        whileHover={reduced ? {} : { x: 6, y: -3 }}
        transition={{ duration: 0.18, ease: [0.2, 0.9, 0.2, 1] }}
        className="group relative"
      >
        <Sheet
          tone={job.tone}
          soft
          shadow="hard-sm"
          edge="corner-cut"
          tilt={index % 2 ? 0.5 : -0.6}
          className="relative grid gap-4 px-5 py-5 sm:grid-cols-[auto_1fr] sm:gap-6 sm:px-7"
        >
          <div
            className="flex w-max flex-col border-2 border-ink px-3 py-2"
            style={{ background: `var(--${job.tone})` }}
          >
            <span className={cn("tag", light ? "text-ink" : "text-paper")}>
              {job.matchPercent != null ? "Match" : "Role"}
            </span>
            <span
              className={cn(
                "font-display text-[1.35rem] font-black leading-none tracking-[-0.04em]",
                light ? "text-ink" : "text-paper",
              )}
            >
              {job.matchPercent != null ? (
                <>
                  {job.matchPercent}
                  <span className="text-[1rem]">%</span>
                </>
              ) : (
                <span className="text-[0.95rem] uppercase">Open</span>
              )}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate font-display text-[1.35rem] font-black sm:text-[1.65rem]">
                  {job.company}
                </h3>
                <p className="mt-1 text-[0.98rem] text-ink-soft">{job.title}</p>
              </div>
              <span className="tag border-2 border-ink bg-paper px-2 py-1">{job.productRole}</span>
            </div>

            <p className="tag mt-3 text-ink-faint">
              {job.location} · {workLabel} · {empLabel}
              {job.closed ? " · Closed" : ""}
            </p>
            <p className="tag mt-1 text-ink-faint">
              Posted {formatShortDate(job.postedDate)}
              {job.deadline ? ` · Due ${formatShortDate(job.deadline)}` : ""}
              {job.graduationYears.length
                ? ` · ’${job.graduationYears.map((y) => String(y).slice(2)).join(" / ’")}`
                : " · Grad year unknown"}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onView}
                className="focus-ink border-2 border-ink bg-paper px-3 py-2 font-display text-sm font-black uppercase outline-none hover:bg-ink hover:text-paper"
              >
                View role
              </button>
              <button
                type="button"
                onClick={onSave}
                aria-pressed={saved}
                className={cn(
                  "focus-ink border-2 border-ink px-3 py-2 font-display text-sm font-black uppercase outline-none",
                  saved ? "bg-yellow text-ink" : "bg-paper hover:bg-yellow-wash",
                )}
              >
                {saved ? "Saved" : "Save"}
              </button>
              <button
                type="button"
                onClick={onApply}
                disabled={job.closed || !job.applicationUrl}
                className="focus-ink border-2 border-ink bg-yellow px-3 py-2 font-display text-sm font-black uppercase outline-none hover:translate-x-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {modeCta(mode)}
              </button>
              <button
                type="button"
                onClick={onMarkApplied}
                aria-pressed={applied}
                className={cn(
                  "focus-ink border-2 border-ink px-3 py-2 font-display text-sm font-black uppercase outline-none",
                  applied ? "bg-green text-paper" : "bg-paper hover:bg-green-wash",
                )}
              >
                {applied ? "Applied" : "Mark applied"}
              </button>
            </div>
          </div>

          <Tape className="-right-4 top-3" color={job.tone} angle={90} width={58} height={24} />
        </Sheet>
      </motion.article>
    </Reveal>
  );
}
