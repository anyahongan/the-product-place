import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Clip, Sheet, Tape } from "@/components/paper/Paper";
import { ApplyMaterialsSection } from "@/components/apply/ApplyMaterialsSection";
import { EMPLOYMENT_TYPE_LABELS, formatShortDate, WORK_MODE_LABELS } from "@/data/apply";
import { MatchBadge, WhyThisMatch } from "@/components/apply/MatchExplain";
import { modeCta } from "@/components/apply/modeCta";
import { generateMaterialsForJob } from "@/lib/apply/generateMaterialsForJob";
import type { ApplyMaterialsResult } from "@/lib/apply/generateApplyMaterials";
import { cn } from "@/lib/utils";
import type { ApplicationMode } from "@/types/apply";
import type { JobListingView } from "@/lib/apply/types";
import type { UserProfileBundle } from "@/types/profile";

export function JobDetail({
  job,
  mode,
  applied,
  profileBundle,
  userId,
  onClose,
  onApply,
  onMarkApplied,
}: {
  job: JobListingView | null;
  mode: ApplicationMode;
  applied: boolean;
  profileBundle: UserProfileBundle | null;
  userId: string | null;
  onClose: () => void;
  onApply: () => void;
  onMarkApplied: () => void;
}) {
  const reduced = useReducedMotion();
  const applyDisabled = job ? job.closed || (mode === "manual" && !job.applicationUrl) : true;
  const [materials, setMaterials] = useState<ApplyMaterialsResult | null>(null);
  const [materialsBusy, setMaterialsBusy] = useState(false);
  const [materialsError, setMaterialsError] = useState<string | null>(null);

  useEffect(() => {
    setMaterials(null);
    setMaterialsError(null);
  }, [job?.id]);

  useEffect(() => {
    if (!job) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [job, onClose]);

  return (
    <AnimatePresence>
      {job && (
        <motion.div
          className="fixed inset-0 z-50 flex items-stretch justify-end bg-ink/45"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduced ? { opacity: 1 } : { opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal
            aria-labelledby="job-detail-title"
            initial={reduced ? false : { x: "100%" }}
            animate={{ x: 0 }}
            exit={reduced ? { x: 0 } : { x: "100%" }}
            transition={{ duration: 0.28, ease: [0.2, 0.9, 0.2, 1] }}
            className="relative h-full w-full max-w-xl overflow-y-auto border-l-2 border-ink bg-paper shadow-hard"
            onClick={(e) => e.stopPropagation()}
          >
            <Sheet
              tone={job.tone}
              soft
              bordered={false}
              shadow="none"
              className="min-h-full px-6 pb-16 pt-8 sm:px-8"
            >
              <Clip className="absolute -top-1 right-10 z-20" angle={8} color={job.tone} />
              <Tape className="-top-3 left-8" color="yellow" angle={-4} width={110} height={26} />

              <button
                type="button"
                onClick={onClose}
                className="focus-ink tag mb-6 border-2 border-ink bg-paper px-2 py-1 outline-none hover:bg-ink hover:text-paper"
              >
                Close ×
              </button>

              <p className="tag text-ink-soft">{job.source}</p>
              <h2
                id="job-detail-title"
                className="mt-2 font-display text-[clamp(1.8rem,5vw,2.6rem)] font-black uppercase leading-[0.85]"
              >
                {job.company}
              </h2>
              <p className="mt-3 text-[1.05rem] text-ink-soft">{job.title}</p>

              {job.matchResult?.personalized ? (
                <div className="mt-4 flex items-start gap-3">
                  <div
                    className="flex w-max flex-col border-2 border-ink px-3 py-2"
                    style={{ background: `var(--${job.tone})` }}
                  >
                    <MatchBadge
                      match={job.matchResult}
                      toneLight={job.tone === "yellow" || job.tone === "green"}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-black uppercase">{job.matchResult.tier}</p>
                    {!job.matchResult.showNumeric && !job.matchResult.hardMismatch ? (
                      <p className="tag mt-1 text-ink-faint">Limited job data — score is directional</p>
                    ) : null}
                    <WhyThisMatch match={job.matchResult} />
                  </div>
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="tag border-2 border-ink bg-blue px-2 py-1 text-paper">
                  {job.productRole}
                </span>
                <span className="tag border-2 border-ink bg-paper px-2 py-1">
                  {job.location} ·{" "}
                  {job.workMode ? WORK_MODE_LABELS[job.workMode] : "Work mode unknown"}
                </span>
                <span className="tag border-2 border-ink bg-paper px-2 py-1">
                  {job.employmentType ? EMPLOYMENT_TYPE_LABELS[job.employmentType] : "Type unknown"}
                </span>
              </div>

              <dl className="mt-6 grid gap-2 border-y-2 border-ink py-4 text-[0.95rem]">
                <div className="flex justify-between gap-4">
                  <dt className="tag text-ink-faint">Posted</dt>
                  <dd>{formatShortDate(job.postedDate)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="tag text-ink-faint">Deadline</dt>
                  <dd>{job.deadline ? formatShortDate(job.deadline) : "Not specified"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="tag text-ink-faint">Eligibility</dt>
                  <dd>
                    {job.graduationYears.length
                      ? `’${job.graduationYears.map((y) => String(y).slice(2)).join(" / ’")}`
                      : "Not specified"}
                  </dd>
                </div>
              </dl>

              <section className="mt-6">
                <h3 className="font-display text-[1.15rem] font-black uppercase">Description</h3>
                <p className="mt-2 text-[0.98rem] leading-relaxed text-ink-soft">
                  {job.description}
                </p>
              </section>

              {job.responsibilities.length > 0 && (
                <section className="mt-6">
                  <h3 className="font-display text-[1.15rem] font-black uppercase">
                    Responsibilities
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {job.responsibilities.map((item) => (
                      <li key={item} className="flex gap-3 text-[0.95rem] text-ink-soft">
                        <span aria-hidden className="mt-[0.4rem] h-2.5 w-2.5 shrink-0 bg-blue" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <div className="mt-8 grid gap-2">
                <button
                  type="button"
                  onClick={onApply}
                  disabled={applyDisabled}
                  className="focus-ink border-2 border-ink bg-yellow px-4 py-3 font-display text-base font-black uppercase outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {modeCta(mode)}
                </button>
                <button
                  type="button"
                  onClick={onMarkApplied}
                  className={cn(
                    "focus-ink border-2 border-ink px-4 py-3 font-display text-base font-black uppercase outline-none",
                    applied ? "bg-green text-paper" : "bg-paper hover:bg-green-wash",
                  )}
                >
                  {applied ? "Marked applied" : "Mark applied"}
                </button>
                <p className="tag text-ink-faint">
                  {mode === "manual"
                    ? "Manual mode opens the employer link. Nothing is auto-submitted."
                    : mode === "quick"
                      ? "Quick mode opens a materials packet from Profile, then the employer link."
                      : "Auto mode adds roles to your local queue. Nothing is auto-submitted."}
                </p>
              </div>

              <ApplyMaterialsSection
                materials={materials}
                busy={materialsBusy}
                error={materialsError}
                onGenerate={() => {
                  if (!job) return;
                  setMaterialsBusy(true);
                  setMaterialsError(null);
                  void generateMaterialsForJob({ userId, profileBundle, job })
                    .then(setMaterials)
                    .catch((e) =>
                      setMaterialsError(
                        e instanceof Error ? e.message : "Could not generate materials",
                      ),
                    )
                    .finally(() => setMaterialsBusy(false));
                }}
              />
            </Sheet>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
