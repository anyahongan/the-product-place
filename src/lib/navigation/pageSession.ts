const SCROLL_PREFIX = "tpp:scroll:";
const DRAFT_PREFIX = "tpp:draft:";

export function routeSessionKey(pathname: string, search: string): string {
  return `${pathname}${search}`;
}

export function saveRouteScroll(key: string, y: number): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(SCROLL_PREFIX + key, String(Math.round(y)));
  } catch {
    /* quota or private mode */
  }
}

export function readRouteScroll(key: string): number | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SCROLL_PREFIX + key);
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function readPageDraft<T>(draftKey: string): T | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_PREFIX + draftKey);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writePageDraft(draftKey: string, value: unknown): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(DRAFT_PREFIX + draftKey, JSON.stringify(value));
  } catch {
    /* quota or private mode */
  }
}

export function clearPageDraft(draftKey: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(DRAFT_PREFIX + draftKey);
  } catch {
    /* ignore */
  }
}
