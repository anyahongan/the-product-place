import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { formatShortDate } from "@/data/apply";
import { getOnlineAssessmentGuide } from "@/lib/apply/onlineAssessmentGuides";
import {
  getOAQuestionsForCompany,
  groupOAQuestionsBySection,
  OA_SECTION_ORDER,
} from "@/lib/apply/onlineAssessmentQuestions";
import type { ApplicationRecord, OnlineAssessmentState } from "@/lib/apply/types";
import { questionFormat } from "@/lib/learning/content";
import { DIFFICULTY_LABELS, PRACTICE_FORMAT_LABELS } from "@/lib/learning/types";

export function OnlineAssessmentModal({
  app,
  open,
  onClose,
  onSave,
}: {
  app: ApplicationRecord;
  open: boolean;
  onClose: () => void;
  onSave: (oa: OnlineAssessmentState, setStatus: boolean) => void;
}) {
  const reduced = useReducedMotion();
  const guide = getOnlineAssessmentGuide(app.company);
  const practiceQuestions = getOAQuestionsForCompany(app.company);
  const grouped = groupOAQuestionsBySection(practiceQuestions);

  const [dueDate, setDueDate] = useState(app.onlineAssessment.dueDate ?? "");
  const [completed, setCompleted] = useState(app.onlineAssessment.completed);

  useEffect(() => {
    if (!open) return;
    setDueDate(app.onlineAssessment.dueDate ?? "");
    setCompleted(app.onlineAssessment.completed);
  }, [open, app.onlineAssessment]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const save = (setStatus: boolean) => {
    onSave(
      {
        dueDate: dueDate.trim() || null,
        completed,
        completedAt: completed ? new Date().toISOString() : null,
      },
      setStatus,
    );
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/70 p-4 sm:items-center"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduced ? { opacity: 1 } : { opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal
            aria-labelledby="oa-modal-title"
            initial={reduced ? false : { y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduced ? { opacity: 1 } : { y: 20, opacity: 0 }}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto border-2 border-ink bg-paper shadow-hard"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b-2 border-ink bg-blue px-5 py-5 sm:px-7">
              <p className="tag text-paper/90">Online assessment</p>
              <h2
                id="oa-modal-title"
                className="mt-1 font-display text-[1.5rem] font-black uppercase text-paper"
              >
                {app.company}
              </h2>
              <p className="mt-1 text-[0.95rem] font-medium text-paper">{guide.oaType}</p>
            </div>

            <div className="px-5 py-5 sm:px-7">
              <div className="border-2 border-ink bg-paper-2 px-4 py-4">
                <p className="text-[0.95rem] leading-relaxed text-ink">{guide.summary}</p>

                <h3 className="mt-4 font-display text-xs font-black uppercase text-ink">
                  What to expect
                </h3>
                <ul className="mt-2 space-y-1.5 text-[0.9rem] text-ink">
                  {guide.expectations.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span aria-hidden className="mt-[0.35rem] h-2 w-2 shrink-0 bg-blue" />
                      {item}
                    </li>
                  ))}
                </ul>

                <h3 className="mt-4 font-display text-xs font-black uppercase text-ink">
                  Prep tips
                </h3>
                <ul className="mt-2 space-y-1.5 text-[0.9rem] text-ink">
                  {guide.prepTips.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span aria-hidden className="font-black text-blue">→</span>
                      {item}
                    </li>
                  ))}
                </ul>

                {OA_SECTION_ORDER.map((section) => {
                  const sectionQuestions = grouped[section];
                  if (sectionQuestions.length === 0) return null;
                  return (
                    <div key={section} className="mt-4">
                      <h3 className="font-display text-xs font-black uppercase text-ink">
                        {section}
                      </h3>
                      <ul className="mt-2 space-y-2">
                        {sectionQuestions.map((q) => (
                          <li key={q.id}>
                            <Link
                              to="/practice"
                              search={{
                                mode: "drill",
                                q: q.id,
                                company: app.company,
                                appId: app.applicationId,
                                oa: "1",
                              }}
                              className="block border-2 border-ink bg-paper px-3 py-2.5 text-left hover:bg-blue-wash"
                            >
                              <span className="font-display text-sm font-black uppercase text-ink">
                                {q.title}
                              </span>
                              <span className="mt-1 block text-[0.85rem] leading-snug text-ink-soft line-clamp-2">
                                {q.prompt}
                              </span>
                              <span className="mt-2 flex flex-wrap gap-2 text-[0.72rem] font-medium uppercase tracking-wide text-ink-faint">
                                <span>{PRACTICE_FORMAT_LABELS[questionFormat(q)]}</span>
                                <span>{DIFFICULTY_LABELS[q.difficulty]}</span>
                                <span>{q.estimatedMinutes} min</span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}

                <h3 className="mt-4 font-display text-xs font-black uppercase text-ink">
                  Community sources
                </h3>
                <ul className="mt-2 space-y-1">
                  {guide.sources.map((source) => (
                    <li key={source.url}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[0.88rem] font-medium text-blue underline-offset-2 hover:underline"
                      >
                        {source.label} →
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 space-y-3 border-2 border-ink bg-yellow-wash px-4 py-4">
                <label className="block">
                  <span className="tag text-ink">Assessment due date</span>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="focus-ink mt-2 w-full border-2 border-ink bg-paper px-3 py-2.5 text-ink outline-none"
                  />
                </label>
                {dueDate && (
                  <p className="text-[0.88rem] text-ink">
                    Adds to Today&apos;s list until completed · due {formatShortDate(dueDate)}
                  </p>
                )}
                <label className="flex cursor-pointer items-center gap-2 text-[0.92rem] font-medium text-ink">
                  <input
                    type="checkbox"
                    checked={completed}
                    onChange={(e) => setCompleted(e.target.checked)}
                    className="h-4 w-4 border-2 border-ink accent-blue"
                  />
                  I completed this online assessment
                </label>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  to="/practice"
                  search={{
                    mode: "oa",
                    company: app.company,
                    appId: app.applicationId,
                    oa: "1",
                  }}
                  className="focus-ink border-2 border-ink bg-yellow px-3 py-2.5 font-display text-xs font-black uppercase text-ink outline-none hover:bg-ink hover:text-paper"
                >
                  Full OA prep →
                </Link>
                <button
                  type="button"
                  onClick={() => save(true)}
                  className="focus-ink border-2 border-ink bg-blue px-3 py-2.5 font-display text-xs font-black uppercase text-paper outline-none hover:bg-ink"
                >
                  Save & set status
                </button>
                <button
                  type="button"
                  onClick={() => save(false)}
                  className="focus-ink border-2 border-ink bg-paper px-3 py-2.5 font-display text-xs font-black uppercase text-ink outline-none hover:bg-blue-wash"
                >
                  Save only
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="focus-ink border-2 border-ink bg-paper px-3 py-2.5 font-display text-xs font-black uppercase text-ink outline-none hover:bg-paper-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
