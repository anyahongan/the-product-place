import { Link } from "@tanstack/react-router";
import { useAuth } from "@/components/auth/AuthProvider";
import { Clip, Sheet, Tab } from "@/components/paper/Paper";
import { Reveal } from "@/components/paper/Reveal";
import { SaveStatus, type SaveState } from "@/components/profile/SaveStatus";
import { getCompetency } from "@/lib/learning/competencies";
import {
  CREATE_TEMPLATES,
  emptyProjectContent,
  getCreateTemplate,
  getLesson,
  getPracticeQuestion,
} from "@/lib/learning/content";
import { buildPlanFromProject, type BuildPlan } from "@/lib/learning/buildPlan";
import {
  isMissingRelationError,
  localCreateProject,
  localDeleteProject,
  localGetProject,
  localListProjects,
  localUpdateProject,
} from "@/lib/learning/localStore";
import {
  archiveCreateProject,
  completeCreateProject,
  createProject,
  deleteCreateProject,
  duplicateCreateProject,
  getCreateProject,
  listCreateProjects,
  reopenCreateProject,
  updateCreateProject,
} from "@/lib/learning/repositories/createProjectRepository";
import type { CreateProjectRecord, CreateTemplateType } from "@/lib/learning/types";
import { useEffect, useMemo, useRef, useState } from "react";

export type CreateSearch = {
  project?: string;
  template?: CreateTemplateType;
  fromPractice?: string;
};

function seedFromPractice(
  templateSections: { id: string }[],
  prompt: string,
): Record<string, string> {
  const seed: Record<string, string> = {};
  const keys = [
    "problem",
    "overview",
    "product",
    "hypothesis",
    "problemSpace",
    "closing",
    "goal",
    "stories",
  ];
  for (const key of keys) {
    if (templateSections.some((s) => s.id === key)) {
      seed[key] = prompt;
      break;
    }
  }
  return seed;
}

export function CreateWorkspace({
  search,
  navigate,
}: {
  search: CreateSearch;
  navigate: (opts: { search: CreateSearch; replace?: boolean }) => void;
}) {
  const { user, ready } = useAuth();
  const [projects, setProjects] = useState<CreateProjectRecord[]>(() => localListProjects());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [useLocalOnly, setUseLocalOnly] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const activeProjects = useMemo(
    () => projects.filter((p) => p.status === "active"),
    [projects],
  );
  const completedProjects = useMemo(
    () => projects.filter((p) => p.status === "completed"),
    [projects],
  );

  function exitSelect() {
    setSelecting(false);
    setSelectedIds(new Set());
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function persistStatus(id: string, status: "active" | "completed" | "archived") {
    if (useLocalOnly || !user) {
      return localUpdateProject(id, {
        status,
        archivedAt: status === "archived" ? new Date().toISOString() : null,
      });
    }
    try {
      if (status === "completed") return await completeCreateProject(user.id, id);
      if (status === "active") return await reopenCreateProject(user.id, id);
      return await archiveCreateProject(user.id, id);
    } catch (e) {
      if (!isMissingRelationError(e)) throw e;
      setUseLocalOnly(true);
      return localUpdateProject(id, {
        status,
        archivedAt: status === "archived" ? new Date().toISOString() : null,
      });
    }
  }

  async function persistDelete(id: string) {
    if (useLocalOnly || !user) {
      localDeleteProject(id);
      return;
    }
    try {
      await deleteCreateProject(user.id, id);
    } catch (e) {
      if (!isMissingRelationError(e)) throw e;
      setUseLocalOnly(true);
      localDeleteProject(id);
    }
  }

  async function markSelectedComplete() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    const updates: CreateProjectRecord[] = [];
    for (const id of ids) {
      updates.push(await persistStatus(id, "completed"));
    }
    setProjects((prev) => {
      const map = new Map(prev.map((p) => [p.id, p]));
      for (const row of updates) map.set(row.id, row);
      return [...map.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    });
    exitSelect();
  }

  async function markSelectedActive() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    const updates: CreateProjectRecord[] = [];
    for (const id of ids) {
      updates.push(await persistStatus(id, "active"));
    }
    setProjects((prev) => {
      const map = new Map(prev.map((p) => [p.id, p]));
      for (const row of updates) map.set(row.id, row);
      return [...map.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    });
    exitSelect();
  }

  async function deleteSelected() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} project${ids.length === 1 ? "" : "s"} permanently?`)) return;
    for (const id of ids) {
      await persistDelete(id);
    }
    setProjects((prev) => prev.filter((p) => !selectedIds.has(p.id)));
    exitSelect();
  }

  useEffect(() => {
    const local = localListProjects();
    if (!user) {
      setProjects(local);
      setUseLocalOnly(true);
      return;
    }
    let cancelled = false;
    listCreateProjects(user.id)
      .then((rows) => {
        if (cancelled) return;
        setUseLocalOnly(false);
        // Prefer remote; keep local-only ids that aren't on remote
        const remoteIds = new Set(rows.map((r) => r.id));
        const localOnly = local.filter((p) => !remoteIds.has(p.id));
        setProjects([...rows, ...localOnly].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
        setLoadError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setUseLocalOnly(true);
        setProjects(local);
        if (isMissingRelationError(e)) {
          setLoadError(null);
        } else {
          setLoadError(
            e instanceof Error
              ? `${e.message} — using on-device projects`
              : "Failed to load cloud projects — using on-device",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Start from template search param (works signed out via localStorage)
  useEffect(() => {
    if (!ready || !search.template || search.project) return;
    let cancelled = false;
    (async () => {
      const practice = search.fromPractice ? getPracticeQuestion(search.fromPractice) : null;
      const template = getCreateTemplate(search.template!);
      if (!template) return;
      const seed = practice ? seedFromPractice(template.sections, practice.prompt) : {};
      const title = practice ? `${template.title}: ${practice.title}` : template.title;

      try {
        let row: CreateProjectRecord;
        if (user && !useLocalOnly) {
          try {
            row = await createProject(user.id, {
              templateType: search.template!,
              title,
              sourcePracticeQuestionId: practice?.id ?? null,
              seedContent: seed,
            });
          } catch (e) {
            if (!isMissingRelationError(e)) throw e;
            setUseLocalOnly(true);
            row = localCreateProject({
              templateType: search.template!,
              title,
              content: { ...emptyProjectContent(template), ...seed },
              sourcePracticeQuestionId: practice?.id ?? null,
            });
          }
        } else {
          row = localCreateProject({
            templateType: search.template!,
            title,
            content: { ...emptyProjectContent(template), ...seed },
            sourcePracticeQuestionId: practice?.id ?? null,
          });
        }
        if (cancelled) return;
        setProjects((prev) => [row, ...prev.filter((p) => p.id !== row.id)]);
        navigate({ search: { project: row.id }, replace: true });
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Could not create project");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, ready, search.template, search.fromPractice, search.project, useLocalOnly]);

  if (search.project) {
    return (
      <ProjectEditor
        projectId={search.project}
        userId={user?.id ?? null}
        preferLocal={useLocalOnly || !user}
        onBack={() => navigate({ search: {} })}
        onUpdated={(row) =>
          setProjects((prev) => {
            const rest = prev.filter((p) => p.id !== row.id);
            return row.status === "active" || row.status === "completed" ? [row, ...rest] : rest;
          })
        }
        onDeleted={(id) => {
          setProjects((prev) => prev.filter((p) => p.id !== id));
          navigate({ search: {} });
        }}
      />
    );
  }

  return (
    <main className="relative overflow-hidden px-5 pb-28 pt-14 sm:px-8">
      <div aria-hidden className="gridpaper-fine pointer-events-none absolute inset-0 -z-10 opacity-45" />
      <div className="mx-auto max-w-[1320px]">
        <Reveal from="down" distance={24}>
          <Tab color="purple">Section 04 · Create</Tab>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-display text-[clamp(2.6rem,10vw,6.5rem)] font-black uppercase leading-[0.82]">
              Create
            </h1>
            <p className="tag text-purple">
              {projects.length} active project{projects.length === 1 ? "" : "s"}
              {!user || useLocalOnly ? " · this device" : ""}
            </p>
          </div>
          <p className="mt-4 max-w-[48ch] text-[1.05rem] text-ink-soft">
            Build real Product work for your portfolio — teardowns, proposals, PRDs, and experiment
            writeups you can ship to interviews, not busywork docs. Start blank, or load an example
            when you want a model.
          </p>
        </Reveal>

        {!user && (
          <Sheet tone="purple" soft shadow="hard-sm" className="relative mt-8 px-6 py-5">
            <Clip className="absolute -top-4 right-6" color="purple" size={40} angle={8} />
            <p className="text-ink-soft">
              Draft portfolio pieces on this device. Sign in after applying the Learn/Create migration
              to sync privately to your account.
            </p>
          </Sheet>
        )}

        {loadError && <p className="tag mt-4 text-pink">{loadError}</p>}

        <section className="mt-12" aria-labelledby="templates-heading">
          <h2
            id="templates-heading"
            className="font-display text-xl font-extrabold uppercase text-purple"
          >
            Templates
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CREATE_TEMPLATES.map((t) => (
              <li key={t.id} className="relative">
                <Clip
                  className="absolute -top-3 right-3 z-10"
                  color="purple"
                  size={34}
                  angle={8}
                />
                <button
                  type="button"
                  onClick={() => navigate({ search: { template: t.id } })}
                  className="focus-ink flex h-full w-full flex-col border-2 border-ink bg-paper p-5 pt-6 text-left shadow-[var(--shadow-hard-sm)] transition hover:-translate-y-0.5 hover:bg-purple-wash"
                >
                  <span className="font-display text-lg font-extrabold uppercase text-purple">
                    {t.title}
                  </span>
                  <span className="mt-2 text-sm text-ink-soft">{t.blurb}</span>
                  {t.howItWorks && (
                    <span className="mt-3 text-xs leading-relaxed text-ink">{t.howItWorks}</span>
                  )}
                  {t.starterTips && t.starterTips.length > 0 && (
                    <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-ink-soft">
                      {t.starterTips.slice(0, 2).map((tip) => (
                        <li key={tip}>{tip}</li>
                      ))}
                    </ul>
                  )}
                  <span className="mt-auto pt-4 text-xs font-bold uppercase tracking-wide text-purple">
                    Start · {t.sections.length} sections →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {projects.length > 0 && (
          <section className="mt-14" aria-labelledby="projects-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2
                id="projects-heading"
                className="font-display text-xl font-extrabold uppercase text-purple"
              >
                Your projects
              </h2>
              <div className="flex flex-wrap gap-2">
                {selecting ? (
                  <>
                    <button
                      type="button"
                      disabled={selectedIds.size === 0}
                      onClick={() => void markSelectedComplete()}
                      className="border-2 border-ink bg-paper px-3 py-1.5 font-display text-xs font-bold uppercase text-purple transition focus-ink hover:bg-purple-wash disabled:opacity-40"
                    >
                      Mark complete
                    </button>
                    <button
                      type="button"
                      disabled={selectedIds.size === 0}
                      onClick={() => void markSelectedActive()}
                      className="border-2 border-ink bg-paper px-3 py-1.5 font-display text-xs font-bold uppercase transition focus-ink hover:bg-yellow disabled:opacity-40"
                    >
                      Mark active
                    </button>
                    <button
                      type="button"
                      disabled={selectedIds.size === 0}
                      onClick={() => void deleteSelected()}
                      className="border-2 border-pink bg-paper px-3 py-1.5 font-display text-xs font-bold uppercase text-pink transition focus-ink hover:bg-pink hover:text-paper disabled:opacity-40"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={exitSelect}
                      className="border-2 border-ink bg-paper px-3 py-1.5 font-display text-xs font-bold uppercase transition focus-ink hover:bg-paper-2"
                    >
                      Done
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelecting(true)}
                    className="border-2 border-ink bg-paper px-3 py-1.5 font-display text-xs font-bold uppercase text-purple transition focus-ink hover:bg-purple hover:text-paper"
                  >
                    Select
                  </button>
                )}
              </div>
            </div>

            {selecting && (
              <p className="mt-3 text-sm italic text-purple">
                {selectedIds.size === 0
                  ? "Select projects to mark complete or delete."
                  : `${selectedIds.size} selected`}
              </p>
            )}

            {activeProjects.length > 0 && (
              <ul className="mt-4 space-y-3">
                {activeProjects.map((p) => (
                  <ProjectListRow
                    key={p.id}
                    project={p}
                    selecting={selecting}
                    selected={selectedIds.has(p.id)}
                    onToggle={() => toggleSelected(p.id)}
                    onOpen={() => navigate({ search: { project: p.id } })}
                  />
                ))}
              </ul>
            )}

            {completedProjects.length > 0 && (
              <div className="mt-10">
                <h3 className="font-display text-sm font-extrabold uppercase tracking-wide text-purple">
                  Completed
                </h3>
                <ul className="mt-3 space-y-3">
                  {completedProjects.map((p) => (
                    <ProjectListRow
                      key={p.id}
                      project={p}
                      selecting={selecting}
                      selected={selectedIds.has(p.id)}
                      muted
                      onToggle={() => toggleSelected(p.id)}
                      onOpen={() => navigate({ search: { project: p.id } })}
                    />
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function ProjectListRow({
  project,
  selecting,
  selected,
  muted,
  onToggle,
  onOpen,
}: {
  project: CreateProjectRecord;
  selecting: boolean;
  selected: boolean;
  muted?: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const t = getCreateTemplate(project.templateType);
  return (
    <li className="relative">
      {!selecting && (
        <Clip className="absolute -top-3 right-4 z-10" color="purple" size={34} angle={-6} />
      )}
      <div
        className={`flex w-full items-stretch gap-0 border-2 border-ink ${
          muted ? "bg-purple-wash" : "bg-paper"
        } ${selected ? "ring-2 ring-purple ring-offset-2" : ""}`}
      >
        {selecting && (
          <label className="flex cursor-pointer items-center border-r-2 border-ink px-4 hover:bg-purple-wash">
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggle}
              className="size-4 accent-[var(--purple)]"
              aria-label={`Select ${project.title}`}
            />
          </label>
        )}
        <button
          type="button"
          onClick={() => {
            if (selecting) onToggle();
            else onOpen();
          }}
          className={`focus-ink flex min-w-0 flex-1 items-center justify-between gap-4 px-5 py-4 text-left transition ${
            selecting ? "pr-5" : "pr-12"
          } ${muted ? "hover:bg-[color-mix(in_oklab,var(--purple)_32%,white)]" : "hover:bg-purple-wash"}`}
        >
          <span className="min-w-0">
            <span className="font-display font-extrabold uppercase text-purple">{project.title}</span>
            <span className="mt-1 block text-xs uppercase tracking-wide text-ink-faint">
              <span className="font-bold text-purple">{t?.title ?? project.templateType}</span>
              {" · updated "}
              {new Date(project.updatedAt).toLocaleDateString()}
              {project.status === "completed" ? " · completed" : ""}
            </span>
          </span>
          <span className="tag shrink-0 text-purple">{selecting ? (selected ? "Selected" : "Select") : "Open"}</span>
        </button>
      </div>
    </li>
  );
}

function ProjectEditor({
  projectId,
  userId,
  preferLocal,
  onBack,
  onUpdated,
  onDeleted,
}: {
  projectId: string;
  userId: string | null;
  preferLocal: boolean;
  onBack: () => void;
  onUpdated: (row: CreateProjectRecord) => void;
  onDeleted: (id: string) => void;
}) {
  const [project, setProject] = useState<CreateProjectRecord | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [localMode, setLocalMode] = useState(preferLocal);
  const [buildPlan, setBuildPlan] = useState<BuildPlan | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!preferLocal && userId) {
        try {
          const row = await getCreateProject(userId, projectId);
          if (cancelled) return;
          if (row) {
            setProject(row);
            setTitle(row.title);
            setContent(row.content);
            setLocalMode(false);
            loaded.current = true;
            return;
          }
        } catch (e) {
          if (!isMissingRelationError(e) && !cancelled) {
            setSaveError(e instanceof Error ? e.message : "Load failed");
          }
        }
      }
      const local = localGetProject(projectId);
      if (cancelled) return;
      if (local) {
        setProject(local);
        setTitle(local.title);
        setContent(local.content);
        setLocalMode(true);
        loaded.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, projectId, preferLocal]);

  async function persist(nextTitle: string, nextContent: Record<string, string>) {
    if (localMode || !userId) {
      const row = localUpdateProject(projectId, { title: nextTitle, content: nextContent });
      setProject(row);
      onUpdated(row);
      return row;
    }
    try {
      const row = await updateCreateProject(userId, projectId, {
        title: nextTitle,
        content: nextContent,
      });
      setProject(row);
      onUpdated(row);
      return row;
    } catch (e) {
      if (isMissingRelationError(e)) {
        setLocalMode(true);
        const row = localUpdateProject(projectId, { title: nextTitle, content: nextContent });
        setProject(row);
        onUpdated(row);
        return row;
      }
      throw e;
    }
  }

  function scheduleSave(nextTitle: string, nextContent: Record<string, string>) {
    if (!loaded.current) return;
    if (timer.current) clearTimeout(timer.current);
    setSaveState("saving");
    timer.current = setTimeout(async () => {
      try {
        await persist(nextTitle, nextContent);
        setSaveState("saved");
        setSaveError(null);
      } catch (e) {
        setSaveState("error");
        setSaveError(e instanceof Error ? e.message : "Error saving");
      }
    }, 700);
  }

  const template = project ? getCreateTemplate(project.templateType) : undefined;

  if (!project || !template) {
    return (
      <main className="px-5 py-16 sm:px-8">
        <p className="tag">Loading project…</p>
        <button type="button" className="mt-4 tag focus-ink" onClick={onBack}>
          ← Back
        </button>
      </main>
    );
  }

  const activeTemplate = template;

  function loadExample() {
    if (!activeTemplate.exampleFill) return;
    const next = { ...content };
    for (const [k, v] of Object.entries(activeTemplate.exampleFill)) {
      if (!(next[k] ?? "").trim()) next[k] = v;
    }
    setContent(next);
    scheduleSave(title, next);
  }

  return (
    <main className="relative px-5 pb-28 pt-10 sm:px-8">
      <div className="mx-auto max-w-[900px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" className="tag focus-ink" onClick={onBack}>
            ← All projects
          </button>
          <SaveStatus state={saveState} error={saveError} />
        </div>

        <Tab color="purple" className="mt-6">
          {template.title}
        </Tab>
        <label htmlFor="project-title" className="sr-only">
          Project title
        </label>
        <input
          id="project-title"
          value={title}
          onChange={(e) => {
            const v = e.target.value;
            setTitle(v);
            scheduleSave(v, content);
          }}
          className="mt-3 w-full border-b-2 border-ink bg-transparent font-display text-[clamp(1.6rem,4vw,2.4rem)] font-black uppercase leading-tight focus:outline-none focus-ink"
        />

        {template.howItWorks && (
          <Sheet tone="purple" soft shadow="hard-sm" className="relative mt-6 px-5 py-4">
            <Clip className="absolute -top-4 right-5" color="purple" size={40} angle={8} />
            <p className="tag text-purple">How this template works</p>
            <p className="mt-2 text-sm leading-relaxed text-ink">{template.howItWorks}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Treat this as a portfolio artifact: specific users, real tradeoffs, and metrics you’d
              defend in an interview — not a worksheet to fill for its own sake.
            </p>
            {template.starterTips && template.starterTips.length > 0 && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-soft">
                {template.starterTips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            )}
            {template.exampleFill && (
              <button
                type="button"
                onClick={loadExample}
                className="mt-4 border-2 border-ink bg-paper px-3 py-2 font-display text-xs font-bold uppercase text-ink transition focus-ink hover:bg-yellow"
              >
                Load example into empty fields
              </button>
            )}
          </Sheet>
        )}

        {template.relatedLessonIds.length > 0 && (
          <details className="mt-6 border border-ink/30 p-3">
            <summary className="cursor-pointer font-display text-xs font-bold uppercase tracking-wide text-purple">
              Need a refresher?
            </summary>
            <p className="mt-2 text-sm text-ink-soft">
              Pull related lessons before you write — stronger portfolio pieces come from clear
              frameworks, not blank-page guessing.
            </p>
            <ul className="mt-3 space-y-2">
              {template.relatedLessonIds.map((id) => {
                const l = getLesson(id);
                if (!l) return null;
                return (
                  <li key={id}>
                    <Link
                      to="/learn"
                      search={{ lesson: id }}
                      className="font-display text-sm font-bold uppercase tracking-wide text-[oklch(0.48_0.14_152)] underline decoration-[oklch(0.48_0.14_152)]/35 underline-offset-4 transition hover:text-[oklch(0.42_0.16_152)] hover:decoration-[oklch(0.42_0.16_152)] focus-ink"
                    >
                      {l.title} →
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 flex flex-wrap gap-2">
              {template.competencies.map((id) => (
                <span key={id} className="text-xs uppercase text-ink-faint">
                  {getCompetency(id).label}
                </span>
              ))}
            </p>
          </details>
        )}

        {project.sourcePracticeQuestionId && (
          <p className="mt-4 text-sm text-ink-soft">
            Started from practice:{" "}
            {getPracticeQuestion(project.sourcePracticeQuestionId)?.title ??
              project.sourcePracticeQuestionId}
          </p>
        )}

        <div className="mt-10 space-y-8">
          {template.sections.map((section) => (
            <div key={section.id}>
              <label
                htmlFor={`sec-${section.id}`}
                className="font-display text-sm font-extrabold uppercase tracking-wide text-purple"
              >
                {section.label}
              </label>
              <textarea
                id={`sec-${section.id}`}
                value={content[section.id] ?? ""}
                placeholder={section.placeholder}
                rows={4}
                onChange={(e) => {
                  const next = { ...content, [section.id]: e.target.value };
                  setContent(next);
                  scheduleSave(title, next);
                }}
                className="mt-2 w-full border-2 border-ink bg-paper p-3 text-base leading-relaxed focus-ink"
              />
            </div>
          ))}
        </div>

        <div className="mt-10">
          <button
            type="button"
            onClick={() => {
              const plan = buildPlanFromProject({
                title,
                template: activeTemplate,
                content,
              });
              setBuildPlan(plan);
              requestAnimationFrame(() => {
                document.getElementById("build-it-plan")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              });
            }}
            className="w-full border-2 border-ink bg-purple px-5 py-3.5 font-display text-base font-bold uppercase tracking-wide text-paper transition focus-ink hover:bg-purple-wash hover:text-purple sm:w-auto"
          >
            Build it →
          </button>
          <p className="mt-3 max-w-[48ch] text-sm italic leading-relaxed text-purple">
            Turn this writeup into a wireframe → vibecode → ship plan using real tools — so it becomes
            a portfolio demo, not just a doc.
          </p>
        </div>

        {buildPlan && (
          <BuildItPanel
            plan={buildPlan}
            onClose={() => setBuildPlan(null)}
            onRefresh={() =>
              setBuildPlan(
                buildPlanFromProject({
                  title,
                  template: activeTemplate,
                  content,
                }),
              )
            }
          />
        )}

        <div className="mt-12 flex flex-wrap gap-3 border-t-2 border-ink pt-6">
          <button
            type="button"
            className="border-2 border-ink bg-paper px-3 py-2 font-display text-xs font-bold uppercase transition focus-ink hover:bg-purple-wash"
            onClick={async () => {
              if (localMode || !userId) {
                const copy = localCreateProject({
                  templateType: project.templateType,
                  title: `${project.title} (copy)`,
                  content: { ...content },
                  sourcePracticeQuestionId: project.sourcePracticeQuestionId,
                });
                onUpdated(copy);
                onBack();
                return;
              }
              const row = await duplicateCreateProject(userId, projectId);
              onUpdated(row);
              onBack();
            }}
          >
            Duplicate
          </button>
          <button
            type="button"
            className="border-2 border-ink bg-paper px-3 py-2 font-display text-xs font-bold uppercase transition focus-ink hover:bg-yellow"
            onClick={async () => {
              if (!confirm("Archive this project?")) return;
              if (localMode || !userId) {
                const row = localUpdateProject(projectId, {
                  status: "archived",
                  archivedAt: new Date().toISOString(),
                });
                onUpdated(row);
                onBack();
                return;
              }
              const row = await archiveCreateProject(userId, projectId);
              onUpdated(row);
              onBack();
            }}
          >
            Archive
          </button>
          <button
            type="button"
            className="border-2 border-pink bg-paper px-3 py-2 font-display text-xs font-bold uppercase text-pink transition focus-ink hover:bg-pink hover:text-paper"
            onClick={async () => {
              if (!confirm("Delete this project permanently?")) return;
              if (localMode || !userId) {
                localDeleteProject(projectId);
                onDeleted(projectId);
                return;
              }
              await deleteCreateProject(userId, projectId);
              onDeleted(projectId);
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </main>
  );
}

function BuildItPanel({
  plan,
  onClose,
  onRefresh,
}: {
  plan: BuildPlan;
  onClose: () => void;
  onRefresh: () => void;
}) {
  return (
    <div id="build-it-plan" className="scroll-mt-8">
      <Sheet tone="purple" soft shadow="hard" className="relative mt-10 px-6 py-7 sm:px-8">
      <Clip className="absolute -top-4 right-6" color="purple" size={44} angle={8} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tag text-purple">Build plan</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold uppercase leading-tight text-purple">
            {plan.headline}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="border-2 border-ink bg-paper px-3 py-1.5 font-display text-xs font-bold uppercase transition focus-ink hover:bg-yellow"
          >
            Refresh from notes
          </button>
          <button
            type="button"
            onClick={onClose}
            className="border-2 border-ink bg-paper px-3 py-1.5 font-display text-xs font-bold uppercase text-purple transition focus-ink hover:bg-purple hover:text-paper"
          >
            Hide plan
          </button>
        </div>
      </div>

      <p className="mt-4 text-[1.05rem] leading-relaxed text-ink">{plan.summary}</p>
      <p className="mt-3 text-sm text-ink-soft">
        {plan.readinessNote}{" "}
        <span className="font-bold text-purple">
          ({plan.filledCount}/{plan.totalSections} sections filled)
        </span>
      </p>

      <div className="mt-8 space-y-8">
        {plan.phases.map((phase) => (
          <section key={phase.id}>
            <h3 className="font-display text-lg font-extrabold uppercase text-purple">
              {phase.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{phase.intro}</p>
            <ol className="mt-4 space-y-4">
              {phase.steps.map((step, idx) => (
                <li key={step.title} className="border-2 border-ink bg-paper px-4 py-4">
                  <p className="font-display text-sm font-extrabold uppercase">
                    <span className="text-purple">{idx + 1}.</span> {step.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink">{step.detail}</p>
                  {step.tools && step.tools.length > 0 && (
                    <>
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {step.tools.map((tool) => (
                          <li key={tool.name}>
                            {tool.url ? (
                              <a
                                href={tool.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block border-2 border-ink bg-paper-2 px-2.5 py-1 text-xs font-bold uppercase text-purple transition hover:bg-purple hover:text-paper focus-ink"
                                title={tool.why}
                              >
                                {tool.name} ↗
                              </a>
                            ) : (
                              <span
                                className="inline-block border-2 border-ink bg-paper-2 px-2.5 py-1 text-xs font-bold uppercase text-purple"
                                title={tool.why}
                              >
                                {tool.name}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                      <ul className="mt-2 space-y-1 text-xs text-ink-soft">
                        {step.tools.map((tool) => (
                          <li key={`${tool.name}-why`}>
                            <span className="font-bold text-purple">{tool.name}:</span> {tool.why}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <aside className="mt-8 border-2 border-ink bg-paper px-4 py-4">
        <p className="font-display text-xs font-extrabold uppercase tracking-wide text-purple">
          Portfolio tip
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink">{plan.portfolioTip}</p>
      </aside>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="border-2 border-ink bg-paper px-4 py-2 font-display text-xs font-bold uppercase text-purple transition focus-ink hover:bg-purple hover:text-paper"
        >
          Hide plan
        </button>
      </div>
      </Sheet>
    </div>
  );
}
