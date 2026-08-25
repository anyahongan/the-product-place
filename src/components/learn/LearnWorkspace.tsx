import { Link } from "@tanstack/react-router";
import { useAuth } from "@/components/auth/AuthProvider";
import { CheckpointQuiz } from "@/components/learn/CheckpointQuiz";
import { ImportLessonPanel } from "@/components/learn/ImportLessonPanel";
import { LessonVisual } from "@/components/learn/LessonVisual";
import { Clip, Sheet, Tab, Tape } from "@/components/paper/Paper";
import { Reveal } from "@/components/paper/Reveal";
import { SaveStatus, type SaveState } from "@/components/profile/SaveStatus";
import { COMPETENCY_GROUPS, getCompetency } from "@/lib/learning/competencies";
import {
  FURTHER_RESOURCES,
  GLOSSARY_TERMS,
  LESSONS,
  getCreateTemplate,
  getLesson as getStaticLesson,
  getPracticeQuestion,
} from "@/lib/learning/content";
import { articleForLesson } from "@/lib/learning/content/lessonArticles";
import type { CustomLesson } from "@/lib/learning/generateLessonFromSource";
import {
  isMissingRelationError,
  localDeleteCustomLesson,
  localGetCustomLesson,
  localListCustomLessons,
  localListLessonProgress,
  localMarkLessonComplete,
  localTouchLesson,
} from "@/lib/learning/localStore";
import {
  listLessonProgress,
  markLessonComplete,
  markLessonIncomplete,
  touchLessonProgress,
} from "@/lib/learning/repositories/lessonProgressRepository";
import type { Lesson, LessonArticleBlock, LessonProgressRecord } from "@/lib/learning/types";
import { useEffect, useMemo, useState } from "react";

export type LearnSearch = {
  lesson?: string;
  view?: "glossary" | "resources" | "import";
};

function mergeProgress(
  remote: LessonProgressRecord[],
  local: LessonProgressRecord[],
): LessonProgressRecord[] {
  const m = new Map<string, LessonProgressRecord>();
  for (const p of [...local, ...remote]) {
    const prev = m.get(p.lessonId);
    if (!prev) {
      m.set(p.lessonId, p);
      continue;
    }
    m.set(p.lessonId, {
      id: prev.id.startsWith("local:") ? p.id : prev.id,
      lessonId: p.lessonId,
      startedAt: prev.startedAt <= p.startedAt ? prev.startedAt : p.startedAt,
      lastOpenedAt: prev.lastOpenedAt >= p.lastOpenedAt ? prev.lastOpenedAt : p.lastOpenedAt,
      completedAt: prev.completedAt || p.completedAt,
    });
  }
  return [...m.values()];
}

function isCustomLesson(l: Lesson): l is CustomLesson {
  return "isCustom" in l && (l as CustomLesson).isCustom === true;
}

export function LearnWorkspace({
  search,
  navigate,
}: {
  search: LearnSearch;
  navigate: (opts: { search: LearnSearch; replace?: boolean }) => void;
}) {
  const { user, ready } = useAuth();
  const [customLessons, setCustomLessons] = useState<CustomLesson[]>(() => localListCustomLessons());
  const [progress, setProgress] = useState<LessonProgressRecord[]>(() => localListLessonProgress());
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const allLessons = useMemo(() => [...LESSONS, ...customLessons], [customLessons]);

  function resolveLesson(id: string | undefined): Lesson | undefined {
    if (!id) return undefined;
    return getStaticLesson(id) ?? localGetCustomLesson(id) ?? customLessons.find((l) => l.id === id);
  }

  const lessonId = search.lesson;
  const lesson = resolveLesson(lessonId);

  useEffect(() => {
    setCustomLessons(localListCustomLessons());
  }, [search.view, search.lesson]);

  useEffect(() => {
    const local = localListLessonProgress();
    if (!user) {
      setProgress(local);
      return;
    }
    let cancelled = false;
    listLessonProgress(user.id)
      .then((rows) => {
        if (!cancelled) setProgress(mergeProgress(rows, local));
      })
      .catch(() => {
        if (!cancelled) setProgress(local);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!lesson) return;
    let cancelled = false;
    const localRow = localTouchLesson(lesson.id);
    setProgress((prev) => {
      const rest = prev.filter((p) => p.lessonId !== localRow.lessonId);
      return [...rest, localRow];
    });
    if (!user) return;
    touchLessonProgress(user.id, lesson.id)
      .then((row) => {
        if (cancelled) return;
        setProgress((prev) => {
          const rest = prev.filter((p) => p.lessonId !== row.lessonId);
          return [...rest, row];
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, lesson?.id]);

  const progressByLesson = useMemo(() => {
    const m = new Map<string, LessonProgressRecord>();
    for (const p of progress) m.set(p.lessonId, p);
    return m;
  }, [progress]);

  const completedLessons = useMemo(
    () => allLessons.filter((l) => progressByLesson.get(l.id)?.completedAt),
    [allLessons, progressByLesson],
  );
  const completedIds = useMemo(
    () => new Set(completedLessons.map((l) => l.id)),
    [completedLessons],
  );
  const completedCount = completedLessons.length;
  const totalCount = allLessons.length;
  const progressPct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const continueLesson = useMemo(() => {
    const open = progress
      .filter((p) => !p.completedAt)
      .sort((a, b) => b.lastOpenedAt.localeCompare(a.lastOpenedAt))[0];
    if (open) {
      const found = allLessons.find((l) => l.id === open.lessonId);
      if (found && !completedIds.has(found.id)) return found;
    }
    return allLessons.find((l) => !completedIds.has(l.id)) ?? null;
  }, [progress, allLessons, completedIds]);

  async function toggleComplete(l: Lesson) {
    setSaveState("saving");
    setSaveError(null);
    const current = progressByLesson.get(l.id);
    const makingComplete = !current?.completedAt;
    try {
      const localRow = localMarkLessonComplete(l.id, makingComplete);
      setProgress((prev) => {
        const rest = prev.filter((p) => p.lessonId !== localRow.lessonId);
        return [...rest, localRow];
      });

      if (user) {
        try {
          const row = makingComplete
            ? await markLessonComplete(user.id, l.id)
            : await markLessonIncomplete(user.id, l.id);
          setProgress((prev) => {
            const rest = prev.filter((p) => p.lessonId !== row.lessonId);
            return [...rest, row];
          });
        } catch (e) {
          if (!isMissingRelationError(e)) {
            setSaveError(
              e instanceof Error
                ? `${e.message} (saved on this device)`
                : "Cloud sync failed — saved on this device",
            );
          }
        }
      }
      setSaveState("saved");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Error saving");
      setSaveState("error");
    }
  }

  if (search.view === "glossary") {
    return (
      <GlossaryView
        onBack={() => navigate({ search: {} })}
        onOpenLesson={(id) => navigate({ search: { lesson: id } })}
        resolveLesson={resolveLesson}
      />
    );
  }
  if (search.view === "resources") {
    return <ResourcesView onBack={() => navigate({ search: {} })} />;
  }
  if (search.view === "import") {
    return (
      <ImportLessonPanel
        onBack={() => navigate({ search: {} })}
        onCreated={(id) => {
          setCustomLessons(localListCustomLessons());
          navigate({ search: { lesson: id }, replace: true });
        }}
      />
    );
  }

  if (lesson) {
    const deleteHandler = isCustomLesson(lesson)
      ? () => {
          if (!confirm("Delete this imported lesson?")) return;
          localDeleteCustomLesson(lesson.id);
          setCustomLessons(localListCustomLessons());
          navigate({ search: {} });
        }
      : undefined;
    return (
      <LessonReader
        lesson={lesson}
        progress={progressByLesson.get(lesson.id)}
        signedIn={Boolean(user)}
        authReady={ready}
        saveState={saveState}
        saveError={saveError}
        onBack={() => navigate({ search: {} })}
        onToggleComplete={() => toggleComplete(lesson)}
        onOpenLesson={(id) => navigate({ search: { lesson: id } })}
        {...(deleteHandler ? { onDeleteCustom: deleteHandler } : {})}
        resolveLesson={(id) => resolveLesson(id)}
      />
    );
  }

  const roadmap = getStaticLesson("lesson-weeks-1-3-roadmap");
  const openCustom = customLessons.filter((l) => !completedIds.has(l.id));

  return (
    <main className="relative overflow-hidden px-5 pb-28 pt-14 sm:px-8">
      <div aria-hidden className="grid-bold pointer-events-none absolute inset-0 -z-10 opacity-50" />
      <div className="mx-auto max-w-[1320px]">
        <Reveal from="down" distance={24}>
          <Tab color="green">Section 03 · Learn</Tab>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-display text-[clamp(2.6rem,10vw,6.5rem)] font-black uppercase leading-[0.82]">
              Learn
            </h1>
            <p className="tag text-ink-soft">
              {completedCount} / {totalCount} completed
              {!user ? " · this device" : ""}
            </p>
          </div>
          <p className="mt-4 max-w-[48ch] text-[1.05rem] text-ink-soft">
            A Product field guide for recruiting and craft — roadmap, technical literacy, frameworks,
            and interview prep.
          </p>

          <ProgressBar completed={completedCount} total={totalCount} pct={progressPct} />

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              className="border-2 border-ink bg-paper px-3 py-2 font-display text-xs font-bold uppercase focus-ink hover:bg-green-wash"
              onClick={() => navigate({ search: { view: "glossary" } })}
            >
              PM glossary
            </button>
            <button
              type="button"
              className="border-2 border-ink bg-paper px-3 py-2 font-display text-xs font-bold uppercase focus-ink hover:bg-green-wash"
              onClick={() => navigate({ search: { view: "resources" } })}
            >
              Resources
            </button>
            <button
              type="button"
              className="border-2 border-ink bg-green px-3 py-2 font-display text-xs font-bold uppercase focus-ink hover:bg-ink hover:text-green"
              onClick={() => navigate({ search: { view: "import" } })}
            >
              + Add lesson
            </button>
          </div>
        </Reveal>

        {roadmap && !completedIds.has(roadmap.id) && (
          <Reveal from="left" distance={40} className="mt-10">
            <Sheet tone="green" soft pattern="ruled" shadow="hard" className="relative px-6 py-7 sm:px-8">
              <Tape className="-top-3 left-8" color="green" angle={-4} width={120} />
              <p className="tag text-ink">Weeks 1–3 · Study roadmap</p>
              <h2 className="mt-3 font-display text-2xl font-extrabold uppercase leading-tight">
                {roadmap.title}
              </h2>
              <p className="mt-2 max-w-[54ch] text-ink-soft">{roadmap.idea}</p>
              <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-ink-soft">
                <li>Technical literacy (~30 min/week framing)</li>
                <li>PM cores — sense, prioritization, OKRs/JTBD, research, stakeholders</li>
                <li>Non-technical strengths as differentiators</li>
              </ol>
              <button
                type="button"
                className="mt-5 border-2 border-ink bg-ink px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-paper hover:bg-green hover:text-ink focus-ink"
                onClick={() => navigate({ search: { lesson: roadmap.id } })}
              >
                Open roadmap · {roadmap.estimatedMinutes} min
              </button>
            </Sheet>
          </Reveal>
        )}

        {continueLesson && continueLesson.id !== roadmap?.id && (
          <Reveal from="left" distance={40} className="mt-8">
            <Sheet tone="paper" pattern="ruled" shadow="hard-sm" className="px-6 py-6">
              <p className="tag text-ink-faint">Continue learning</p>
              <h2 className="mt-2 font-display text-xl font-extrabold uppercase">
                {continueLesson.title}
              </h2>
              <button
                type="button"
                className="mt-4 font-display text-sm font-black uppercase text-green underline decoration-2 underline-offset-4 focus-ink"
                onClick={() => navigate({ search: { lesson: continueLesson.id } })}
              >
                Resume →
              </button>
            </Sheet>
          </Reveal>
        )}

        {openCustom.length > 0 && (
          <section className="mt-14" aria-labelledby="learn-your-imports">
            <h2
              id="learn-your-imports"
              className="font-display text-xl font-extrabold uppercase tracking-tight"
            >
              Your imports
            </h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {openCustom.map((l) => (
                <LessonCard
                  key={l.id}
                  lesson={l}
                  state="Imported"
                  onOpen={() => navigate({ search: { lesson: l.id } })}
                />
              ))}
            </ul>
          </section>
        )}

        <div className="mt-14 space-y-12">
          {COMPETENCY_GROUPS.map((group) => {
            const items = allLessons.filter(
              (l) => l.groupId === group.id && !completedIds.has(l.id) && !isCustomLesson(l),
            );
            if (items.length === 0) return null;
            return (
              <section key={group.id} aria-labelledby={`learn-${group.id}`}>
                <h2
                  id={`learn-${group.id}`}
                  className="font-display text-xl font-extrabold uppercase tracking-tight"
                >
                  {group.label}
                </h2>
                <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((l) => {
                    const p = progressByLesson.get(l.id);
                    const state = p ? "In progress" : "Not started";
                    return (
                      <LessonCard
                        key={l.id}
                        lesson={l}
                        state={state}
                        onOpen={() => navigate({ search: { lesson: l.id } })}
                      />
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>

        {completedLessons.length > 0 && (
          <section className="mt-20" aria-labelledby="learn-completed">
            <Sheet tone="green" soft shadow="hard-sm" className="relative px-6 py-8 sm:px-8">
              <Tape className="-top-3 left-8" color="green" angle={-4} width={100} />
              <h2
                id="learn-completed"
                className="font-display text-xl font-extrabold uppercase tracking-tight"
              >
                Completed
              </h2>
              <p className="mt-2 text-sm text-ink-soft">
                Finished lessons live here — reopen anytime, or mark incomplete from the lesson.
              </p>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {completedLessons.map((l) => (
                  <LessonCard
                    key={l.id}
                    lesson={l}
                    state="Completed"
                    muted
                    onOpen={() => navigate({ search: { lesson: l.id } })}
                  />
                ))}
              </ul>
            </Sheet>
          </section>
        )}
      </div>
    </main>
  );
}

function ProgressBar({
  completed,
  total,
  pct,
}: {
  completed: number;
  total: number;
  pct: number;
}) {
  return (
    <div className="mt-8 max-w-xl border-2 border-ink bg-paper p-4 shadow-[var(--shadow-hard-sm)]">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-xs font-bold uppercase tracking-wide text-ink">Progress</p>
        <p className="tag text-ink-soft">
          {completed} of {total} · {pct}%
        </p>
      </div>
      <div
        className="mt-3 h-4 border-2 border-ink bg-paper-2"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Lesson completion progress"
      >
        <div
          className="h-full bg-green transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function LessonCard({
  lesson,
  state,
  muted,
  onOpen,
}: {
  lesson: Lesson;
  state: string;
  muted?: boolean;
  onOpen: () => void;
}) {
  return (
    <li className="relative">
      <Clip
        className="absolute -top-3 right-3 z-10"
        color="green"
        size={34}
        angle={8}
      />
      <button
        type="button"
        onClick={onOpen}
        className={`focus-ink group flex h-full w-full flex-col border-2 border-ink p-5 pt-6 text-left shadow-[var(--shadow-hard-sm)] transition hover:-translate-y-0.5 ${
          muted
            ? "bg-paper-2 hover:bg-paper hover:shadow-[var(--shadow-hard)]"
            : "bg-paper hover:bg-green-wash"
        }`}
      >
        <span className="tag text-ink-faint">{lesson.estimatedMinutes} min</span>
        <span className="mt-2 font-display text-lg font-extrabold uppercase leading-tight">
          {lesson.title}
        </span>
        <span className="mt-3 text-sm text-ink-soft line-clamp-2">{lesson.idea}</span>
        <span className="mt-auto pt-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-ink-faint">
          <span>{state}</span>
          {!isCustomLesson(lesson) && (
            <>
              <span aria-hidden>·</span>
              <span>{lesson.relatedPracticeIds.length} practice</span>
            </>
          )}
          {isCustomLesson(lesson) && (
            <>
              <span aria-hidden>·</span>
              <span>Imported</span>
            </>
          )}
        </span>
      </button>
    </li>
  );
}

function GlossaryView({
  onBack,
  onOpenLesson,
  resolveLesson,
}: {
  onBack: () => void;
  onOpenLesson: (id: string) => void;
  resolveLesson: (id: string) => Lesson | undefined;
}) {
  return (
    <main className="relative px-5 pb-28 pt-10 sm:px-8">
      <div className="mx-auto max-w-[820px]">
        <button type="button" className="tag focus-ink" onClick={onBack}>
          ← Learn home
        </button>
        <Sheet tone="green" soft shadow="hard-sm" className="relative mt-6 px-6 py-6">
          <Tape className="-top-3 left-8" color="green" angle={-4} width={100} />
          <Tab color="green">Reference</Tab>
          <h1 className="mt-4 font-display text-4xl font-black uppercase">PM Glossary</h1>
          <p className="mt-3 text-ink-soft">
            Compact definitions for terms you’ll see in lessons, drills, and interviews.
          </p>
        </Sheet>
        <ul className="mt-10 space-y-8">
          {GLOSSARY_TERMS.map((t) => (
            <li key={t.id} className="border-b border-ink/20 pb-6">
              <h2 className="font-display text-lg font-extrabold uppercase">{t.term}</h2>
              <p className="mt-2 leading-relaxed text-ink">{t.definition}</p>
              {t.relatedLessonIds.length > 0 && (
                <p className="mt-3 flex flex-wrap gap-2">
                  {t.relatedLessonIds.map((id) => {
                    const l = resolveLesson(id);
                    if (!l) return null;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onOpenLesson(id)}
                        className="text-xs font-black uppercase text-green underline decoration-2 underline-offset-2 focus-ink"
                      >
                        {l.title} →
                      </button>
                    );
                  })}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

function ResourcesView({ onBack }: { onBack: () => void }) {
  return (
    <main className="relative px-5 pb-28 pt-10 sm:px-8">
      <div className="mx-auto max-w-[820px]">
        <button type="button" className="tag focus-ink" onClick={onBack}>
          ← Learn home
        </button>
        <Sheet tone="green" soft shadow="hard-sm" className="relative mt-6 px-6 py-6">
          <Tape className="-top-3 left-8" color="green" angle={-4} width={100} />
          <Tab color="green">Explore more</Tab>
          <h1 className="mt-4 font-display text-4xl font-black uppercase">Resources</h1>
          <p className="mt-3 text-ink-soft">
            Optional external pointers — not required product features. Prefer one resource used well
            over ten bookmarked.
          </p>
        </Sheet>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {FURTHER_RESOURCES.map((r) => (
            <li key={r.url} className="border-2 border-ink bg-paper p-5 shadow-[var(--shadow-hard-sm)]">
              <p className="tag text-ink-faint">{r.category}</p>
              <a
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block font-display text-base font-extrabold uppercase text-ink underline decoration-2 underline-offset-4 focus-ink"
              >
                {r.label} ↗
              </a>
              {r.note && <p className="mt-2 text-sm text-ink-soft">{r.note}</p>}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

function LessonReader({
  lesson,
  progress,
  signedIn,
  authReady,
  saveState,
  saveError,
  onBack,
  onToggleComplete,
  onOpenLesson,
  onDeleteCustom,
  resolveLesson,
}: {
  lesson: Lesson;
  progress?: LessonProgressRecord | undefined;
  signedIn: boolean;
  authReady: boolean;
  saveState: SaveState;
  saveError: string | null;
  onBack: () => void;
  onToggleComplete: () => void;
  onOpenLesson: (id: string) => void;
  onDeleteCustom?: (() => void) | undefined;
  resolveLesson: (id: string) => Lesson | undefined;
}) {
  const completed = Boolean(progress?.completedAt);
  const article = lesson.article ?? articleForLesson(lesson);
  const hasInlineFigure = article.some((b) => b.type === "figure");

  return (
    <main className="relative overflow-hidden px-5 pb-28 pt-10 sm:px-8">
      <div aria-hidden className="ruled pointer-events-none absolute inset-0 -z-10 opacity-40" />
      <div className="mx-auto max-w-[820px]">
        <button type="button" onClick={onBack} className="tag focus-ink text-ink-soft hover:text-ink">
          ← All lessons
        </button>

        <Reveal from="down" distance={20}>
          <Sheet tone="paper" pattern="ruled" shadow="hard-sm" className="relative mt-6 px-6 py-7 sm:px-8">
            <Tape className="-top-3 left-8" color="green" angle={-4} width={110} />
            <div className="flex flex-wrap items-center gap-3">
              <Tab color="green">
                {COMPETENCY_GROUPS.find((g) => g.id === lesson.groupId)?.shortLabel ?? "Lesson"}
              </Tab>
              <span className="tag">{lesson.estimatedMinutes} min</span>
              {isCustomLesson(lesson) && <span className="tag text-blue">Imported</span>}
              <SaveStatus state={saveState} error={saveError} />
            </div>
            <h1 className="mt-4 font-display text-[clamp(2rem,6vw,3.4rem)] font-black uppercase leading-[0.92]">
              {lesson.title}
            </h1>
            <p className="mt-3 flex flex-wrap gap-2">
              {lesson.competencies.map((id) => (
                <span
                  key={id}
                  className="border border-ink/30 px-2 py-0.5 text-xs uppercase tracking-wide text-ink-soft"
                >
                  {getCompetency(id).label}
                </span>
              ))}
            </p>
          </Sheet>
        </Reveal>

        {lesson.visualId && !hasInlineFigure && (
          <div className="mt-8">
            <LessonVisual visualId={lesson.visualId} />
          </div>
        )}

        <article className="mt-10">
          <ArticleBody blocks={article} />
          <section className="mt-12 border-t border-ink/20 pt-8">
            <h2 className="font-display text-sm font-extrabold uppercase tracking-wide text-green">
              Try it this week
            </h2>
            <p className="mt-3 text-[1.08rem] leading-[1.75] text-ink">{lesson.tryIt}</p>
          </section>
        </article>

        {lesson.checkpoints && lesson.checkpoints.length > 0 && (
          <CheckpointQuiz lessonId={lesson.id} checkpoints={lesson.checkpoints} />
        )}

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onToggleComplete}
            disabled={!authReady}
            className={`border-2 border-ink px-4 py-2 font-display text-sm font-bold uppercase tracking-wide focus-ink transition disabled:opacity-50 ${
              completed
                ? "bg-paper-2 text-ink-soft hover:bg-green hover:text-ink"
                : "bg-paper-2 text-ink-faint hover:bg-green hover:text-ink"
            }`}
          >
            {completed ? "Mark incomplete" : "Mark complete"}
          </button>
          <p className="text-sm text-ink-soft">
            {signedIn
              ? "Progress syncs when cloud tables are available."
              : "Progress saves on this device. Sign in to sync across devices."}
          </p>
          {onDeleteCustom && (
            <button
              type="button"
              onClick={onDeleteCustom}
              className="border-2 border-pink px-3 py-2 font-display text-xs font-bold uppercase text-pink focus-ink"
            >
              Delete import
            </button>
          )}
        </div>

        <nav className="mt-14 space-y-6 border-t-2 border-ink pt-8" aria-label="Next steps">
          <h2 className="font-display text-lg font-extrabold uppercase">Next</h2>
          {lesson.relatedPracticeIds.length > 0 && (
            <div>
              <p className="font-display text-xs font-extrabold uppercase tracking-wide text-yellow-ink">
                Practice this skill
              </p>
              <ul className="mt-2 space-y-2">
                {lesson.relatedPracticeIds.map((id) => {
                  const q = getPracticeQuestion(id);
                  if (!q) return null;
                  return (
                    <li key={id}>
                      <Link
                        to="/practice"
                        search={{ mode: "drill", q: id }}
                        className="inline-block border-2 border-ink bg-paper-2 px-3 py-1.5 font-display text-sm font-black uppercase tracking-wide text-ink-soft transition focus-ink hover:bg-yellow hover:text-ink"
                      >
                        {q.title} →
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {lesson.relatedLessonIds.length > 0 && (
            <div>
              <p className="font-display text-xs font-extrabold uppercase tracking-wide text-green">
                Related lessons
              </p>
              <ul className="mt-2 space-y-2">
                {lesson.relatedLessonIds.map((id) => {
                  const l = resolveLesson(id);
                  if (!l) return null;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => onOpenLesson(id)}
                        className="inline-block border-2 border-ink bg-paper-2 px-3 py-1.5 font-display text-sm font-black uppercase tracking-wide text-ink-soft transition focus-ink hover:bg-green hover:text-ink"
                      >
                        {l.title} →
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {lesson.relatedCreateTemplateIds.length > 0 && (
            <div>
              <p className="font-display text-xs font-extrabold uppercase tracking-wide text-purple">
                Create something with this
              </p>
              <ul className="mt-2 space-y-2">
                {lesson.relatedCreateTemplateIds.map((id) => {
                  const t = getCreateTemplate(id);
                  if (!t) return null;
                  return (
                    <li key={id}>
                      <Link
                        to="/create"
                        search={{ template: t.id }}
                        className="inline-block border-2 border-ink bg-paper-2 px-3 py-1.5 font-display text-sm font-black uppercase tracking-wide text-ink-soft transition focus-ink hover:bg-purple hover:text-paper"
                      >
                        {t.title} →
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {lesson.externalResources && lesson.externalResources.length > 0 && (
            <div>
              <p className="tag text-ink-faint">External resources</p>
              <ul className="mt-2 space-y-2 text-sm">
                {lesson.externalResources.map((r) => (
                  <li key={r.url}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-black uppercase text-purple underline decoration-2 underline-offset-2 focus-ink"
                    >
                      {r.label} ↗
                    </a>
                    {r.note && <span className="text-ink-soft"> — {r.note}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {lesson.sourceRefs && lesson.sourceRefs.length > 0 && (
            <div className="pt-4">
              <p className="tag text-ink-faint">Conceptual references</p>
              <ul className="mt-2 space-y-1 text-sm text-ink-soft">
                {lesson.sourceRefs.map((r) => (
                  <li key={`${r.title}-${r.topic}`}>
                    {r.title}
                    {r.author ? ` — ${r.author}` : ""}
                    {r.topic ? ` · ${r.topic}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>
      </div>
    </main>
  );
}

function ArticleBody({ blocks }: { blocks: LessonArticleBlock[] }) {
  return (
    <div className="space-y-8">
      {blocks.map((block, i) => {
        const key = `${block.type}-${i}`;
        switch (block.type) {
          case "heading":
            return (
              <h2
                key={key}
                className="mt-4 font-display text-xl font-extrabold uppercase tracking-tight text-ink"
              >
                {block.text}
              </h2>
            );
          case "p":
            return (
              <p key={key} className="text-[1.08rem] leading-[1.75] text-ink">
                {block.text}
              </p>
            );
          case "bullets":
            return (
              <ul key={key} className="list-disc space-y-2 pl-5 text-[1.05rem] leading-relaxed text-ink">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          case "steps":
            return (
              <ol key={key} className="space-y-3">
                {block.items.map((step, idx) => (
                  <li key={step.label} className="flex gap-3 border-2 border-ink bg-green-wash px-4 py-3">
                    <span className="font-display text-sm font-black text-green">{idx + 1}</span>
                    <span>
                      <span className="font-display text-sm font-extrabold uppercase">{step.label}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-ink-soft">{step.detail}</span>
                    </span>
                  </li>
                ))}
              </ol>
            );
          case "callout": {
            const toneClass =
              block.tone === "trap"
                ? "bg-paper-2"
                : block.tone === "framework"
                  ? "bg-green-wash"
                  : "bg-paper";
            return (
              <aside
                key={key}
                className={`border-2 border-ink ${toneClass} px-4 py-4 shadow-[var(--shadow-hard-sm)]`}
              >
                <p className="font-display text-xs font-extrabold uppercase tracking-wide text-green">
                  {block.title}
                </p>
                <p className="mt-2 text-[1.02rem] leading-relaxed text-ink">{block.body}</p>
              </aside>
            );
          }
          case "quote":
            return (
              <blockquote
                key={key}
                className="border-l-4 border-green pl-5 font-display text-lg font-bold leading-snug text-ink"
              >
                {block.text}
              </blockquote>
            );
          case "figure":
            return (
              <div key={key}>
                <LessonVisual visualId={block.visualId} />
              </div>
            );
          case "compare":
            return (
              <div key={key} className="grid gap-3 sm:grid-cols-2">
                <div className="border-2 border-ink bg-paper-2 p-4">
                  <p className="font-display text-xs font-extrabold uppercase text-ink-faint">
                    {block.left.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink">{block.left.body}</p>
                </div>
                <div className="border-2 border-ink bg-green-wash p-4">
                  <p className="font-display text-xs font-extrabold uppercase text-green">
                    {block.right.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink">{block.right.body}</p>
                </div>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
