import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Clip } from "@/components/paper/Paper";
import { ApplyMaterialsSection } from "@/components/apply/ApplyMaterialsSection";
import {
  applyBlueBtn,
  applyBlueBtnLg,
  applyBlueBtnSm,
  applyBlueCard,
  applyBlueGhostBtn,
  applyBlueGhostBtnSm,
  applyBlueSectionHeader,
} from "@/components/apply/applyUi";
import { generateMaterialsForJob } from "@/lib/apply/generateMaterialsForJob";
import type { ApplyMaterialTemplates } from "@/lib/apply/applyMaterialTemplates";
import type { ApplyMaterialsResult } from "@/lib/apply/generateApplyMaterials";
import { buildQuickApplyPacket } from "@/lib/apply/quickApplyPacket";
import { cn } from "@/lib/utils";
import type { JobListingView } from "@/lib/apply/types";
import type { UserProfileBundle } from "@/types/profile";

export function QuickApplyPanel({
  job,
  profileBundle,
  userId,
  onClose,
  onOpenEmployer,
  onMarkApplied,
}: {
  job: JobListingView;
  profileBundle: UserProfileBundle | null;
  userId: string | null;
  onClose: () => void;
  onOpenEmployer: () => void;
  onMarkApplied: () => void;
}) {
  const reduced = useReducedMotion();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [materials, setMaterials] = useState<ApplyMaterialsResult | null>(null);
  const [materialsBusy, setMaterialsBusy] = useState(false);
  const [materialsError, setMaterialsError] = useState<string | null>(null);
  const packet = useMemo(
    () => buildQuickApplyPacket(profileBundle, Boolean(job.applicationUrl)),
    [profileBundle, job.applicationUrl],
  );

  const copyAnswer = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[55] flex items-stretch justify-end bg-ink/45"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduced ? { opacity: 1 } : { opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal
          aria-labelledby="quick-apply-title"
          initial={reduced ? false : { x: "100%" }}
          animate={{ x: 0 }}
          exit={reduced ? { x: 0 } : { x: "100%" }}
          transition={{ duration: 0.28, ease: [0.2, 0.9, 0.2, 1] }}
          className="relative flex h-full w-full max-w-xl flex-col overflow-hidden border-l-2 border-ink bg-blue-wash shadow-hard"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={applyBlueSectionHeader}>
            <Clip className="absolute -top-1 right-8 z-20" angle={8} color="blue" />
            <button
              type="button"
              onClick={onClose}
              className={cn(applyBlueGhostBtnSm, "mb-4 bg-paper/95 hover:bg-ink hover:text-paper")}
            >
              Close ×
            </button>
            <p className="tag text-paper/80">Quick Apply · materials packet</p>
            <h2
              id="quick-apply-title"
              className="mt-2 font-display text-[clamp(1.8rem,5vw,2.4rem)] font-black uppercase leading-[0.9] text-paper"
            >
              {job.company}
            </h2>
            <p className="mt-2 text-[1.02rem] text-paper/90">{job.title}</p>
            <p className="mt-3 text-[0.95rem] text-paper/85">
              Uses only facts already in your Profile. Nothing is invented or auto-submitted —
              you review, copy, and send on the employer site.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-16 pt-6 sm:px-8">
            <div className={applyBlueCard}>
              <p className="font-display text-sm font-black uppercase text-blue">
                Ready {packet.readyCount}/{packet.totalCount}
              </p>
              <ul className="mt-3 space-y-2">
                {packet.checks.map((check) => (
                  <li key={check.id} className="flex items-start justify-between gap-3 text-[0.92rem]">
                    <span className={cn(check.ready ? "text-ink" : "text-ink-faint")}>
                      {check.ready ? "✓" : "○"} {check.label}
                    </span>
                    <span className="tag max-w-[55%] truncate text-right text-ink-faint">
                      {check.detail}
                    </span>
                  </li>
                ))}
              </ul>
              {!profileBundle && (
                <Link to="/profile" className={cn(applyBlueBtn, "mt-3 inline-block")}>
                  Complete Profile →
                </Link>
              )}
            </div>

            {packet.answers.length > 0 && (
              <section className="mt-6">
                <h3 className="font-display text-[1.1rem] font-black uppercase text-ink">
                  Copy standard answers
                </h3>
                <ul className="mt-3 space-y-3">
                  {packet.answers.map((answer) => (
                    <li key={answer.id} className={applyBlueCard}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-display text-xs font-black uppercase">{answer.label}</p>
                        <button
                          type="button"
                          onClick={() => void copyAnswer(answer.id, answer.answer)}
                          className={applyBlueGhostBtnSm}
                        >
                          {copiedId === answer.id ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-[0.9rem] text-ink-soft">
                        {answer.answer}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {packet.experienceHighlights.length > 0 && (
              <section className="mt-6">
                <h3 className="font-display text-[1.1rem] font-black uppercase text-ink">
                  Experience highlights
                </h3>
                <ul className="mt-3 space-y-3">
                  {packet.experienceHighlights.map((exp) => (
                    <li key={exp.id} className={applyBlueCard}>
                      <p className="font-display text-sm font-black uppercase">{exp.title}</p>
                      <p className="tag mt-1 text-ink-faint">{exp.organization}</p>
                      {exp.bullets.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {exp.bullets.map((bullet) => (
                            <li key={bullet} className="flex gap-2 text-[0.9rem] text-ink-soft">
                              <span aria-hidden className="mt-[0.4rem] h-2 w-2 shrink-0 bg-blue" />
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <ApplyMaterialsSection
              materials={materials}
              busy={materialsBusy}
              error={materialsError}
              userId={userId}
              onGenerate={(templateState: ApplyMaterialTemplates) => {
                if (!profileBundle) {
                  setMaterialsError("Complete your Profile first to generate materials.");
                  return;
                }
                setMaterialsBusy(true);
                setMaterialsError(null);
                void generateMaterialsForJob({
                  userId,
                  profileBundle,
                  job,
                  templates: {
                    resumeTemplate: templateState.resumeTemplate,
                    coverLetterTemplate: templateState.coverLetterTemplate,
                  },
                })
                  .then(setMaterials)
                  .catch((e) =>
                    setMaterialsError(e instanceof Error ? e.message : "Could not generate materials"),
                  )
                  .finally(() => setMaterialsBusy(false));
              }}
            />

            <div className="mt-8 grid gap-2">
              <button
                type="button"
                disabled={!packet.canOpenEmployer}
                onClick={onOpenEmployer}
                className={applyBlueBtnLg}
              >
                Open employer application →
              </button>
              <button type="button" onClick={onMarkApplied} className={applyBlueGhostBtn}>
                Mark applied
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
