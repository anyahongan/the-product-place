import { useCallback, useEffect, useState } from "react";
import { starterTasks } from "@/data/content";

export type Task = { id: string; text: string; done: boolean };

const KEY = "tpp.today.v1";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(starterTasks);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setTasks(JSON.parse(raw) as Task[]);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(tasks));
    } catch {
      /* ignore */
    }
  }, [tasks, hydrated]);

  const add = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTasks((prev) => [
      ...prev,
      { id: `t${Date.now()}`, text: trimmed, done: false },
    ]);
  }, []);

  const toggle = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { tasks, add, toggle, remove, hydrated };
}
