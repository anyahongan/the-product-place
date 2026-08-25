/**
 * Browser local persistence for Learn/Create when Supabase tables
 * are missing or the user is signed out.
 */

import type {
  CreateProjectRecord,
  CreateTemplateType,
  LessonProgressRecord,
} from "@/lib/learning/types";
import type { CustomLesson } from "@/lib/learning/generateLessonFromSource";

const PROGRESS_KEY = "tpp:lesson-progress:v1";
const PROJECTS_KEY = "tpp:create-projects:v1";
const CHECKPOINTS_KEY = "tpp:lesson-checkpoints:v1";
const CUSTOM_LESSONS_KEY = "tpp:custom-lessons:v1";

function readJson<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function localListLessonProgress(): LessonProgressRecord[] {
  return Object.values(readJson<Record<string, LessonProgressRecord>>(PROGRESS_KEY, {}));
}

export function localTouchLesson(lessonId: string): LessonProgressRecord {
  const map = readJson<Record<string, LessonProgressRecord>>(PROGRESS_KEY, {});
  const now = new Date().toISOString();
  const existing = map[lessonId];
  const row: LessonProgressRecord = existing
    ? { ...existing, lastOpenedAt: now }
    : {
        id: `local:${lessonId}`,
        lessonId,
        startedAt: now,
        lastOpenedAt: now,
        completedAt: null,
      };
  map[lessonId] = row;
  writeJson(PROGRESS_KEY, map);
  return row;
}

export function localMarkLessonComplete(lessonId: string, complete: boolean): LessonProgressRecord {
  const map = readJson<Record<string, LessonProgressRecord>>(PROGRESS_KEY, {});
  const now = new Date().toISOString();
  const existing = map[lessonId] ?? {
    id: `local:${lessonId}`,
    lessonId,
    startedAt: now,
    lastOpenedAt: now,
    completedAt: null,
  };
  const row: LessonProgressRecord = {
    ...existing,
    lastOpenedAt: now,
    completedAt: complete ? now : null,
  };
  map[lessonId] = row;
  writeJson(PROGRESS_KEY, map);
  return row;
}

export type CheckpointAnswers = Record<string, number>; // checkpointId -> choice index

export function localGetCheckpointAnswers(lessonId: string): CheckpointAnswers {
  const all = readJson<Record<string, CheckpointAnswers>>(CHECKPOINTS_KEY, {});
  return all[lessonId] ?? {};
}

export function localSaveCheckpointAnswer(
  lessonId: string,
  checkpointId: string,
  choiceIndex: number,
): CheckpointAnswers {
  const all = readJson<Record<string, CheckpointAnswers>>(CHECKPOINTS_KEY, {});
  const lesson = { ...(all[lessonId] ?? {}), [checkpointId]: choiceIndex };
  all[lessonId] = lesson;
  writeJson(CHECKPOINTS_KEY, all);
  return lesson;
}

export function localListProjects(): CreateProjectRecord[] {
  return Object.values(readJson<Record<string, CreateProjectRecord>>(PROJECTS_KEY, {})).filter(
    (p) => p.status === "active" || p.status === "completed",
  );
}

export function localGetProject(id: string): CreateProjectRecord | null {
  const map = readJson<Record<string, CreateProjectRecord>>(PROJECTS_KEY, {});
  return map[id] ?? null;
}

export function localCreateProject(input: {
  templateType: CreateTemplateType;
  title: string;
  content: Record<string, string>;
  sourcePracticeQuestionId?: string | null;
}): CreateProjectRecord {
  const map = readJson<Record<string, CreateProjectRecord>>(PROJECTS_KEY, {});
  const now = new Date().toISOString();
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `local-${Date.now()}`;
  const row: CreateProjectRecord = {
    id,
    templateType: input.templateType,
    title: input.title,
    status: "active",
    content: input.content,
    sourcePracticeQuestionId: input.sourcePracticeQuestionId ?? null,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  map[id] = row;
  writeJson(PROJECTS_KEY, map);
  return row;
}

export function localUpdateProject(
  id: string,
  patch: Partial<Pick<CreateProjectRecord, "title" | "content" | "status" | "archivedAt">>,
): CreateProjectRecord {
  const map = readJson<Record<string, CreateProjectRecord>>(PROJECTS_KEY, {});
  const existing = map[id];
  if (!existing) throw new Error("Local project not found");
  const row: CreateProjectRecord = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  map[id] = row;
  writeJson(PROJECTS_KEY, map);
  return row;
}

export function localDeleteProject(id: string) {
  const map = readJson<Record<string, CreateProjectRecord>>(PROJECTS_KEY, {});
  delete map[id];
  writeJson(PROJECTS_KEY, map);
}

export function isMissingRelationError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /relation|does not exist|42P01|Could not find the table|schema cache/i.test(msg);
}

export function localListCustomLessons(): CustomLesson[] {
  return Object.values(readJson<Record<string, CustomLesson>>(CUSTOM_LESSONS_KEY, {})).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export function localGetCustomLesson(id: string): CustomLesson | null {
  const map = readJson<Record<string, CustomLesson>>(CUSTOM_LESSONS_KEY, {});
  return map[id] ?? null;
}

export function localSaveCustomLesson(lesson: CustomLesson): CustomLesson {
  const map = readJson<Record<string, CustomLesson>>(CUSTOM_LESSONS_KEY, {});
  const row = { ...lesson, updatedAt: new Date().toISOString() };
  map[row.id] = row;
  writeJson(CUSTOM_LESSONS_KEY, map);
  return row;
}

export function localDeleteCustomLesson(id: string) {
  const map = readJson<Record<string, CustomLesson>>(CUSTOM_LESSONS_KEY, {});
  delete map[id];
  writeJson(CUSTOM_LESSONS_KEY, map);
}
