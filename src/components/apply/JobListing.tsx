import { motion, useReducedMotion } from "motion/react";
import { Sheet, Tape } from "@/components/paper/Paper";
import { Reveal } from "@/components/paper/Reveal";
import { formatShortDate, EMPLOYMENT_TYPE_LABELS, WORK_MODE_LABELS } from "@/data/apply";
import { eligibilityLabel } from "@/lib/apply/normalization/roleEligibility";
import { MatchBadge, WhyThisMatch } from "@/components/apply/MatchExplain";
import { modeCta, applyListCta } from "@/components/apply/modeCta";
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
  onApplyList = false,
  onView,
  onSave,
  onApply,
  onAddToApplyList,
  onMarkApplied,
}: {
  job: JobListingView;
  index: number;
  mode: ApplicationMode;
  saved: boolean;
  applied: boolean;
  onApplyList?: boolean;
  onView: () => void;
  onSave: () => void;
  onApply: () => void;
  onAddToApplyList?: () => void;
  onMarkApplied: () => void;
}) {
  const reduced = useReducedMotion();
  const light = job.tone === "yellow" || job.tone === "green";
  const offset = offsets[index % offsets.length] ?? "";
  const metaParts = [
    job.location !== "Location not specified" ? job.location : null,
    job.workMode ? WORK_MODE_LABELS[job.workMode] : null,
    job.employmentType ? EMPLOYMENT_TYPE_LABELS[job.employmentType] : null,
    job.closed ? "Closed" : null,
  ].filter(Boolean);
  const gradLabel = eligibilityLabel(job);
  const applyDisabled =
    job.closed || (mode === "manual" && !job.applicationUrl);

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
            <MatchBadge match={job.matchResult} toneLight={light} />
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

            {metaParts.length > 0 && (
              <p className="tag mt-3 text-ink-faint">{metaParts.join(" · ")}</p>
            )}
            <p className="tag mt-1 text-ink-faint">
              Posted {formatShortDate(job.postedDate)}
              {job.deadline ? ` · Due ${formatShortDate(job.deadline)}` : ""}
              {gradLabel ? ` · ${gradLabel}` : ""}
            </p>

            <WhyThisMatch match={job.matchResult} />

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
                disabled={applyDisabled}
                className="focus-ink border-2 border-ink bg-yellow px-3 py-2 font-display text-sm font-black uppercase outline-none hover:translate-x-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {modeCta(mode)}
              </button>
              {onAddToApplyList ? (
                <button
                  type="button"
                  onClick={onAddToApplyList}
                  aria-pressed={onApplyList}
                  className={cn(
                    "focus-ink border-2 border-ink px-3 py-2 font-display text-sm font-black uppercase outline-none",
                    onApplyList ? "bg-blue text-paper" : "bg-paper hover:bg-blue-wash",
                  )}
                >
                  {onApplyList ? "On apply list" : applyListCta()}
                </button>
              ) : null}
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
