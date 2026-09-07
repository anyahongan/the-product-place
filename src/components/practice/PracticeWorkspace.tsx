import { useAuth } from "@/components/auth/AuthProvider";
import { Clip, Tab } from "@/components/paper/Paper";
import { Reveal } from "@/components/paper/Reveal";
import { OpenOnlineAssessmentsPanel } from "@/components/apply/OpenOnlineAssessmentsPanel";
import { useRecruiting } from "@/components/recruiting/useRecruiting";
import { OAPrepWorkspace } from "@/components/practice/OAPrepWorkspace";
import { DrillSession, roleFromJobTitle } from "@/components/practice/DrillSession";
import { MockInterviewWorkspace } from "@/components/practice/MockInterview";
import {
  practiceBtn,
  practiceBtnAccent,
  practiceBtnBlock,
  practiceBtnBlockActive,
  practiceBtnCard,
  practiceBtnSm,
  practiceHeadingYellow,
  practiceTitleYellow,
} from "@/components/practice/practiceUi";
import {
  PRACTICE_QUESTIONS,
  filterPracticeQuestions,
  pickQuickDrillQuestion,
  questionFormat,
} from "@/lib/learning/content";
import { resolveDrillQuestion, isOAQuestionId } from "@/lib/apply/onlineAssessmentQuestions";
import { normalizePracticeCategory } from "@/lib/apply/onlineAssessmentGuides";

import { listPracticeAttempts } from "@/lib/learning/repositories/practiceAttemptRepository";
import type {
  PracticeAnswerFormat,
  PracticeAttemptRecord,
  PracticeCategory,
  PracticeDifficulty,
} from "@/lib/learning/types";
import {
  DIFFICULTY_LABELS,
  PRACTICE_CATEGORY_LABELS,
  PRACTICE_FORMAT_LABELS,
} from "@/lib/learning/types";
import { useEffect, useMemo, useState } from "react";

export type PracticeSearch = {
  mode?: "home" | "quick" | "bank" | "drill" | "mock" | "oa";
  q?: string;
  category?: PracticeCategory | "surprise" | "all";
  format?: PracticeAnswerFormat | "any";
  track?: "technical" | "behavioral";
  company?: string;
  appId?: string;
  oa?: string;
};

export function PracticeWorkspace({
  search,
  navigate,
}: {
  search: PracticeSearch;
  navigate: (opts: { search: PracticeSearch; replace?: boolean }) => void;
}) {
  const { user, ready } = useAuth();
  const { apps } = useRecruiting();
  const mode = search.mode ?? "home";
  const [attempts, setAttempts] = useState<PracticeAttemptRecord[]>([]);

  useEffect(() => {
    if (!user) {
      setAttempts([]);
      return;
    }
    let cancelled = false;
    listPracticeAttempts(user.id)
      .then((rows) => {
        if (!cancelled) setAttempts(rows);
      })
      .catch(() => {
        if (!cancelled) setAttempts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const practicedIds = useMemo(
    () => new Set(attempts.filter((a) => a.completedAt).map((a) => a.questionId)),
    [attempts],
  );
  const completedDrills = practicedIds.size;

  const counts = useMemo(() => {
    const open = PRACTICE_QUESTIONS.filter((q) => questionFormat(q) === "open").length;
    const mc = PRACTICE_QUESTIONS.filter((q) => questionFormat(q) === "multiple-choice").length;
    const cb = PRACTICE_QUESTIONS.filter((q) => questionFormat(q) === "checkbox").length;
    return { open, mc, cb, total: PRACTICE_QUESTIONS.length };
  }, []);

  const featured = useMemo(
    () => PRACTICE_QUESTIONS.filter((q) => questionFormat(q) !== "open").slice(0, 6),
    [],
  );

  const openSamples = useMemo(
    () => PRACTICE_QUESTIONS.filter((q) => questionFormat(q) === "open").slice(0, 8),
    [],
  );

  const oaApplication = useMemo(
    () => (search.appId ? apps.find((a) => a.applicationId === search.appId) : null),
    [apps, search.appId],
  );

  const drillInitialTarget = useMemo(() => {
    if (!search.company) return undefined;
    const role = oaApplication?.title ? roleFromJobTitle(oaApplication.title) : "";
    return {
      company: search.company,
      ...(role ? { role } : {}),
      ...(isOAQuestionId(search.q ?? "") ? { interviewType: "technical" } : {}),
    };
  }, [search.company, search.q, oaApplication?.title]);

  const drillBack = () => {
    const fromOa =
      search.company &&
      (search.oa === "1" || (search.q != null && isOAQuestionId(search.q)));
    if (fromOa) {
      navigate({
        search: {
          mode: "oa",
          company: search.company,
          appId: search.appId,
          oa: "1",
        },
      });
      return;
    }
    navigate({ search: { mode: "bank" } });
  };

  if (mode === "drill" && search.q) {
    const question = resolveDrillQuestion(search.q, search.company);
    if (!question) {
      return (
        <main className="px-5 py-16 sm:px-8">
          <p>Question not found.</p>
          <button
            type="button"
            className={`mt-4 ${practiceBtn}`}
            onClick={drillBack}
          >
            ← {search.oa === "1" ? "OA prep" : "Question bank"}
          </button>
        </main>
      );
    }
    return (
      <DrillSession
        question={question}
        userId={user?.id ?? null}
        authReady={ready}
        onBack={drillBack}
        initialTarget={drillInitialTarget}
        onSaved={(row) =>
          setAttempts((prev) => {
            const rest = prev.filter((a) => a.id !== row.id);
            return [row, ...rest];
          })
        }
      />
    );
  }

  if (mode === "quick") {
    return (
      <QuickDrillPicker
        initialFormat={search.format ?? "any"}
        onStart={(category, format) => {
          const q = pickQuickDrillQuestion(category, practicedIds, format);
          navigate({
            search: {
              mode: "drill",
              q: q.id,
              category,
              format: format === "any" ? questionFormat(q) : format,
            },
          });
        }}
        onBack={() => navigate({ search: { mode: "home" } })}
      />
    );
  }

  if (mode === "oa" && search.company) {
    return (
      <OAPrepWorkspace
        company={search.company}
        application={oaApplication}
        onOpenQuestion={(id) =>
          navigate({
            search: {
              mode: "drill",
              q: id,
              company: search.company,
              appId: search.appId,
              oa: "1",
            },
          })
        }
        onBack={() => navigate({ search: { mode: "home" } })}
      />
    );
  }

  if (mode === "bank") {
    return (
      <QuestionBank
        practicedIds={practicedIds}
        initialFormat={
          search.format && search.format !== "any" ? search.format : "all"
        }
        initialCategory={
          search.category && search.category !== "surprise"
            ? normalizePracticeCategory(search.category)
            : "all"
        }
        onOpen={(id) => navigate({ search: { mode: "drill", q: id } })}
        onBack={() => navigate({ search: { mode: "home" } })}
      />
    );
  }

  if (mode === "mock") {
    return <MockInterviewWorkspace onBack={() => navigate({ search: {} })} />;
  }

  return (
    <main className="relative overflow-hidden px-5 pb-28 pt-14 sm:px-8">
      <div aria-hidden className="gridpaper pointer-events-none absolute inset-0 -z-10 opacity-50" />
      <div className="mx-auto max-w-[1320px]">
        <Reveal from="down" distance={24}>
          <Tab color="yellow">Section 05 · Practice</Tab>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-display text-[clamp(2.6rem,10vw,6.5rem)] font-black uppercase leading-[0.82] text-ink">
              Practice
            </h1>
            <p className="tag text-yellow-ink-deep">
              {user
                ? `${completedDrills} drills completed`
                : `${counts.total} prompts · ${counts.mc + counts.cb} tap-to-answer`}
            </p>
          </div>
          <p className="mt-4 max-w-[56ch] text-[1.05rem] text-ink-soft">
            Write, speak, or tap — AI-graded essays, multiple choice, select-all checkboxes, and full
            mock loops for the interview you’re prepping for.
          </p>
        </Reveal>

        <OpenOnlineAssessmentsPanel apps={apps} className="mt-10" />

        {/* Formats — large primary strip */}
        <section className="mt-12">
          <h2
            className={`font-display text-sm font-extrabold uppercase tracking-wide ${practiceHeadingYellow}`}
          >
            Answer formats
          </h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <FormatPanel
              title="Write / speak"
              count={counts.open}
              body="Full interview answers. Type or use Speak live — the coach talks back, then grades thoroughly."
              cta="Start open drill"
              onClick={() => navigate({ search: { mode: "quick", format: "open" } })}
            />
            <FormatPanel
              title="Multiple choice"
              count={counts.mc}
              body="One best answer. Instant coach feedback when you don’t want to type a wall of text."
              cta="Start MC drill"
              onClick={() => navigate({ search: { mode: "quick", format: "multiple-choice" } })}
            />
            <FormatPanel
              title="Select all that apply"
              count={counts.cb}
              body="Checkbox drills for diagnosis checklists, closers, and tradeoff instincts."
              cta="Start checkbox drill"
              onClick={() => navigate({ search: { mode: "quick", format: "checkbox" } })}
            />
          </div>
        </section>

        {/* Modes */}
        <section className="mt-14">
          <h2
            className={`font-display text-sm font-extrabold uppercase tracking-wide ${practiceHeadingYellow}`}
          >
            Modes
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ModeCard
              title="Quick Drill"
              body="Pick a format + category (or surprise). Ideal for a 3–12 minute rep."
              onClick={() => navigate({ search: { mode: "quick" } })}
            />
            <ModeCard
              title="Question Bank"
              body="Browse every prompt. Filter by format, category, difficulty, practiced."
              onClick={() => navigate({ search: { mode: "bank" } })}
            />
            <ModeCard
              title="Mock · Technical"
              body="APIs, metrics, tradeoffs — speak live with a coach that reads the prompt aloud."
              onClick={() => navigate({ search: { mode: "mock" } })}
            />
            <ModeCard
              title="Mock · Behavioral"
              body="Stories + closing menu quick guide. Same live mic and graded feedback."
              onClick={() => navigate({ search: { mode: "mock" } })}
            />
          </div>
        </section>

        {/* Categories */}
        <section className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2
              className={`font-display text-sm font-extrabold uppercase tracking-wide ${practiceHeadingYellow}`}
            >
              Jump by category
            </h2>
            <button
              type="button"
              className={practiceBtnAccent}
              onClick={() => navigate({ search: { mode: "bank" } })}
            >
              Full bank →
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {(Object.keys(PRACTICE_CATEGORY_LABELS) as PracticeCategory[]).map((c) => {
              const n = PRACTICE_QUESTIONS.filter((q) => q.category === c).length;
              return (
                <button
                  key={c}
                  type="button"
                  className={practiceBtnAccent}
                  onClick={() => {
                    const q = pickQuickDrillQuestion(c, practicedIds, "any");
                    navigate({ search: { mode: "drill", q: q.id, category: c } });
                  }}
                >
                  {PRACTICE_CATEGORY_LABELS[c]} · {n}
                </button>
              );
            })}
            <button
              type="button"
              className={practiceBtnAccent}
              onClick={() => {
                const q = pickQuickDrillQuestion("surprise", practicedIds, "any");
                navigate({ search: { mode: "drill", q: q.id, category: "surprise" } });
              }}
            >
              Surprise me
            </button>
          </div>
        </section>

        {/* Tap-to-answer preview */}
        <section className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                className={`font-display text-sm font-extrabold uppercase tracking-wide ${practiceHeadingYellow}`}
              >
                Tap-to-answer preview
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                Multiple choice and checkbox — no typing required.
              </p>
            </div>
            <button
              type="button"
              className={practiceBtnAccent}
              onClick={() => navigate({ search: { mode: "bank", format: "multiple-choice" } })}
            >
              See all choice drills →
            </button>
          </div>
          <ul className="mt-5 grid gap-3 md:grid-cols-2">
            {featured.map((q) => (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => navigate({ search: { mode: "drill", q: q.id } })}
                  className={`${practiceBtnBlock} min-h-[7.5rem]`}
                >
                  <span className="flex flex-wrap gap-2 text-[0.65rem] font-sans font-bold uppercase tracking-wide text-ink-faint">
                    <span>{PRACTICE_FORMAT_LABELS[questionFormat(q)]}</span>
                    <span>{PRACTICE_CATEGORY_LABELS[q.category]}</span>
                    <span>{DIFFICULTY_LABELS[q.difficulty]}</span>
                  </span>
                  <span className="mt-2 block font-display text-base font-extrabold uppercase leading-tight">
                    {q.title}
                  </span>
                  <span className="mt-2 block text-sm font-sans font-normal normal-case tracking-normal text-ink-soft line-clamp-2">
                    {q.prompt}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Open answer samples */}
        <section className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                className={`font-display text-sm font-extrabold uppercase tracking-wide ${practiceHeadingYellow}`}
              >
                Open-answer samples
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                Classic interview prompts — write, speak, get graded.
              </p>
            </div>
            <button
              type="button"
              className={practiceBtnAccent}
              onClick={() => navigate({ search: { mode: "bank", format: "open" } })}
            >
              Browse open bank →
            </button>
          </div>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {openSamples.map((q, i) => (
              <li key={q.id} className="relative">
                <Clip
                  className="absolute -top-3 right-3 z-10"
                  color="yellow"
                  size={30}
                  angle={i % 2 === 0 ? 7 : -5}
                />
                <button
                  type="button"
                  onClick={() => navigate({ search: { mode: "drill", q: q.id } })}
                  className={`${practiceBtnBlock} h-full min-h-[8rem]`}
                >
                  <span className="font-display text-sm font-extrabold uppercase leading-tight">
                    {q.title}
                  </span>
                  <span className="mt-2 block text-xs font-sans font-normal normal-case tracking-normal text-ink-soft line-clamp-3">
                    {q.prompt}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

function FormatPanel({
  title,
  count,
  body,
  cta,
  onClick,
}: {
  title: string;
  count: number;
  body: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <div className="border-2 border-ink bg-paper px-6 py-7 shadow-[var(--shadow-hard-sm)]">
      <div className="flex items-baseline justify-between gap-3">
        <h3
          className={`font-display text-2xl font-black uppercase leading-none ${practiceTitleYellow}`}
        >
          {title}
        </h3>
        <span className="tag bg-yellow-wash">{count}</span>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-ink/85">{body}</p>
      <button type="button" onClick={onClick} className={`mt-6 ${practiceBtn}`}>
        {cta}
      </button>
    </div>
  );
}

function ModeCard({
  title,
  body,
  onClick,
}: {
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={`${practiceBtnCard} min-h-[10rem] w-full`}>
      <h2 className="font-display text-xl font-extrabold uppercase group-hover:text-paper">
        {title}
      </h2>
      <p className="mt-3 text-sm font-sans font-normal normal-case tracking-normal text-ink-soft group-hover:text-paper/90">
        {body}
      </p>
    </button>
  );
}

function QuickDrillPicker({
  onStart,
  onBack,
  initialFormat = "any",
}: {
  onStart: (category: PracticeCategory | "surprise", format: PracticeAnswerFormat | "any") => void;
  onBack: () => void;
  initialFormat?: PracticeAnswerFormat | "any";
}) {
  const [format, setFormat] = useState<PracticeAnswerFormat | "any">(initialFormat);
  const cats = Object.keys(PRACTICE_CATEGORY_LABELS) as PracticeCategory[];

  return (
    <main className="relative px-5 pb-28 pt-14 sm:px-8">
      <div className="mx-auto max-w-[820px]">
        <button type="button" className={practiceBtnSm} onClick={onBack}>
          ← Practice home
        </button>
        <h1 className={`mt-6 font-display text-4xl font-black uppercase ${practiceHeadingYellow}`}>
          Quick Drill
        </h1>
        <p className="mt-3 text-ink-soft">
          Choose how you want to answer, then a lane — or let us pick.
        </p>

        <h2
          className={`mt-10 font-display text-xs font-extrabold uppercase tracking-wide ${practiceHeadingYellow}`}
        >
          Answer format
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(
            [
              ["any", "Any format"],
              ["open", "Write / speak"],
              ["multiple-choice", "Multiple choice"],
              ["checkbox", "Select all that apply"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFormat(id)}
              className={`${format === id ? practiceBtnBlockActive : practiceBtnBlock} font-display font-bold uppercase tracking-wide`}
            >
              {label}
            </button>
          ))}
        </div>

        <h2
          className={`mt-10 font-display text-xs font-extrabold uppercase tracking-wide ${practiceHeadingYellow}`}
        >
          Category
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          <li className="sm:col-span-2">
            <button
              type="button"
              onClick={() => onStart("surprise", format)}
              className={`${practiceBtnBlock} font-display font-bold uppercase tracking-wide`}
            >
              Surprise me
            </button>
          </li>
          {cats.map((c) => (
            <li key={c}>
              <button
                type="button"
                onClick={() => onStart(c, format)}
                className={`${practiceBtnBlock} font-display font-bold uppercase tracking-wide`}
              >
                {PRACTICE_CATEGORY_LABELS[c]}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

function QuestionBank({
  practicedIds,
  onOpen,
  onBack,
  initialFormat = "all",
  initialCategory = "all",
}: {
  practicedIds: Set<string>;
  onOpen: (id: string) => void;
  onBack: () => void;
  initialFormat?: PracticeAnswerFormat | "all";
  initialCategory?: PracticeCategory | "all";
}) {
  const [category, setCategory] = useState<PracticeCategory | "all">(initialCategory);
  const [difficulty, setDifficulty] = useState<PracticeDifficulty | "all">("all");
  const [format, setFormat] = useState<PracticeAnswerFormat | "all">(initialFormat);
  const [practiced, setPracticed] = useState<"all" | "practiced" | "not-practiced">("all");

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  const filtered = filterPracticeQuestions({
    category,
    difficulty,
    format,
    practiced,
    practicedIds,
  });

  return (
    <main className="relative px-5 pb-28 pt-14 sm:px-8">
      <div className="mx-auto max-w-[1000px]">
        <button type="button" className={practiceBtnSm} onClick={onBack}>
          ← Practice home
        </button>
        <h1 className={`mt-6 font-display text-4xl font-black uppercase ${practiceHeadingYellow}`}>
          Question Bank
        </h1>

        <div className="mt-6 flex flex-wrap gap-3">
          <label className="text-sm">
            <span className="tag mr-2">Format</span>
            <select
              className="border-2 border-ink bg-paper px-2 py-1 focus-ink"
              value={format}
              onChange={(e) => setFormat(e.target.value as PracticeAnswerFormat | "all")}
            >
              <option value="all">All</option>
              {(Object.keys(PRACTICE_FORMAT_LABELS) as PracticeAnswerFormat[]).map((f) => (
                <option key={f} value={f}>
                  {PRACTICE_FORMAT_LABELS[f]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="tag mr-2">Category</span>
            <select
              className="border-2 border-ink bg-paper px-2 py-1 focus-ink"
              value={category}
              onChange={(e) => setCategory(e.target.value as PracticeCategory | "all")}
            >
              <option value="all">All</option>
              {(Object.keys(PRACTICE_CATEGORY_LABELS) as PracticeCategory[]).map((c) => (
                <option key={c} value={c}>
                  {PRACTICE_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="tag mr-2">Difficulty</span>
            <select
              className="border-2 border-ink bg-paper px-2 py-1 focus-ink"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as PracticeDifficulty | "all")}
            >
              <option value="all">All</option>
              {(Object.keys(DIFFICULTY_LABELS) as PracticeDifficulty[]).map((d) => (
                <option key={d} value={d}>
                  {DIFFICULTY_LABELS[d]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="tag mr-2">Status</span>
            <select
              className="border-2 border-ink bg-paper px-2 py-1 focus-ink"
              value={practiced}
              onChange={(e) => setPracticed(e.target.value as typeof practiced)}
            >
              <option value="all">All</option>
              <option value="practiced">Practiced</option>
              <option value="not-practiced">Not practiced</option>
            </select>
          </label>
        </div>

        <p className="mt-4 text-sm text-ink-soft">{filtered.length} questions</p>

        <ul className="mt-6 space-y-3">
          {filtered.map((q) => (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => onOpen(q.id)}
                className={`${practiceBtnBlock} flex flex-col sm:flex-row sm:items-center sm:justify-between`}
              >
                <span>
                  <span className="font-display text-base font-extrabold uppercase">{q.title}</span>
                  <span className="mt-1 block text-sm font-sans font-normal normal-case tracking-normal text-ink-soft line-clamp-2">
                    {q.prompt}
                  </span>
                </span>
                <span className="mt-3 flex shrink-0 flex-wrap gap-2 text-xs font-sans font-normal uppercase tracking-wide text-ink-faint sm:mt-0 sm:ml-4">
                  <span>{PRACTICE_FORMAT_LABELS[questionFormat(q)]}</span>
                  <span>{PRACTICE_CATEGORY_LABELS[q.category]}</span>
                  <span>{DIFFICULTY_LABELS[q.difficulty]}</span>
                  <span>{q.estimatedMinutes} min</span>
                  {practicedIds.has(q.id) && <span className="text-green">Practiced</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
