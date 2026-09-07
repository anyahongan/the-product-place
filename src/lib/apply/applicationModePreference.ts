import type { ApplicationMode } from "@/types/apply";

const MODE_KEY = "tpp.apply.mode.v1";

export function loadApplicationMode(): ApplicationMode {
  if (typeof window === "undefined") return "manual";
  try {
    const raw = window.localStorage.getItem(MODE_KEY);
    if (raw === "manual" || raw === "quick") return raw;
    // Legacy: Auto mode merged into Quick (apply list + batch walkthrough).
    if (raw === "auto") return "quick";
  } catch {
    /* ignore */
  }
  return "manual";
}

export function saveApplicationMode(mode: ApplicationMode) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MODE_KEY, mode);
  } catch {
    /* ignore */
  }
}
