import { questionFormat } from "@/lib/learning/content";
import {
  DIFFICULTY_LABELS,
  PRACTICE_FORMAT_LABELS,
} from "@/lib/learning/types";
import { getOnlineAssessmentGuide } from "@/lib/apply/onlineAssessmentGuides";
import {
  getOAQuestionsForCompany,
  groupOAQuestionsBySection,
  OA_SECTION_ORDER,
} from "@/lib/apply/onlineAssessmentQuestions";
import type { ApplicationRecord } from "@/lib/apply/types";
import {
  practiceBtn,
  practiceBtnBlock,
  practiceBtnSm,
  practiceHeadingYellow,
} from "@/components/practice/practiceUi";

export function OAPrepWorkspace({
  company,
  application,
  onOpenQuestion,
  onBack,
}: {
  company: string;
  application?: ApplicationRecord | null;
  onOpenQuestion: (questionId: string) => void;
  onBack: () => void;
}) {
  const guide = getOnlineAssessmentGuide(company);
  const questions = getOAQuestionsForCompany(company);
  const grouped = groupOAQuestionsBySection(questions);

  return (
    <main className="relative px-5 pb-28 pt-14 sm:px-8">
      <div className="mx-auto max-w-[900px]">
        <button type="button" className={practiceBtnSm} onClick={onBack}>
          ← Practice home
        </button>

        <div className="mt-6 border-2 border-ink bg-blue px-5 py-5">
          <p className="tag text-paper/90">Online assessment prep</p>
          <h1 className="mt-1 font-display text-[clamp(1.8rem,5vw,2.6rem)] font-black uppercase text-paper">
            {company}
          </h1>
          {application && (
            <p className="mt-1 text-[0.95rem] font-medium text-paper/90">{application.title}</p>
          )}
          <p className="mt-2 text-[0.92rem] leading-relaxed text-paper/95">{guide.oaType}</p>
        </div>

        <div className="mt-5 border-2 border-ink bg-yellow-wash px-4 py-4">
          <p className="text-[0.92rem] leading-relaxed text-ink">{guide.summary}</p>
          <p className="tag mt-3 text-ink-faint">
            {questions.length} company-specific prompts · timed MC, written, and work-style formats
          </p>
        </div>

        {OA_SECTION_ORDER.map((section) => {
          const sectionQuestions = grouped[section];
          if (sectionQuestions.length === 0) return null;
          return (
            <section key={section} className="mt-8">
              <h2 className={`font-display text-sm font-extrabold uppercase tracking-wide ${practiceHeadingYellow}`}>
                {section}
              </h2>
              <ul className="mt-3 space-y-3">
                {sectionQuestions.map((q) => (
                  <li key={q.id}>
                    <button
                      type="button"
                      onClick={() => onOpenQuestion(q.id)}
                      className={`${practiceBtnBlock} flex flex-col sm:flex-row sm:items-center sm:justify-between`}
                    >
                      <span className="text-left">
                        <span className="font-display text-base font-extrabold uppercase">{q.title}</span>
                        <span className="mt-1 block text-sm font-sans font-normal normal-case tracking-normal text-ink-soft line-clamp-3">
                          {q.prompt}
                        </span>
                      </span>
                      <span className="mt-3 flex shrink-0 flex-wrap gap-2 text-xs font-sans font-normal uppercase tracking-wide text-ink-faint sm:mt-0 sm:ml-4">
                        <span>{PRACTICE_FORMAT_LABELS[questionFormat(q)]}</span>
                        <span>{DIFFICULTY_LABELS[q.difficulty]}</span>
                        <span>{q.estimatedMinutes} min</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        <div className="mt-8">
          <button type="button" className={practiceBtn} onClick={onBack}>
            ← Back to practice home
          </button>
        </div>
      </div>
    </main>
  );
}
