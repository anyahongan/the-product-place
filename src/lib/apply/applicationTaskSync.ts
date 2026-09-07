import type { ApplicationRecord } from "@/lib/apply/types";
import { formatShortDate } from "@/data/apply";

const TASK_KEY = "tpp.today.v1";
export const OA_TASK_PREFIX = "oa:";

type Task = { id: string; text: string; done: boolean };

function readTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TASK_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Task[];
  } catch {
    return [];
  }
}

function writeTasks(tasks: Task[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TASK_KEY, JSON.stringify(tasks));
  window.dispatchEvent(new Event("tpp-tasks-updated"));
}

export function syncOnlineAssessmentTask(app: ApplicationRecord): void {
  const taskId = `${OA_TASK_PREFIX}${app.applicationId}`;
  const oa = app.onlineAssessment;

  let tasks = readTasks().filter((t) => t.id !== taskId);

  if (oa?.dueDate && !oa.completed) {
    tasks.unshift({
      id: taskId,
      text: `Complete ${app.company} online assessment · due ${formatShortDate(oa.dueDate)}`,
      done: false,
    });
  }

  writeTasks(tasks);
}

export function completeOnlineAssessmentTask(applicationId: string): void {
  const taskId = `${OA_TASK_PREFIX}${applicationId}`;
  const tasks = readTasks().map((t) => (t.id === taskId ? { ...t, done: true } : t));
  writeTasks(tasks);
}
