/**
 * Stable dedupe foundation for multi-source ingestion later.
 * Prefer apply URL; fall back to company+title+location.
 */
export function buildDedupeKey(input: {
  applyUrl: string | null;
  company: string;
  title: string;
  location: string | null;
}): string {
  if (input.applyUrl) {
    try {
      const u = new URL(input.applyUrl);
      const host = u.hostname.replace(/^www\./, "").toLowerCase();
      const path = u.pathname.replace(/\/+$/, "").toLowerCase();
      return `url:${host}${path}`;
    } catch {
      return `url:${normalizeText(input.applyUrl)}`;
    }
  }

  return `ctl:${normalizeText(input.company)}|${normalizeText(input.title)}|${normalizeText(input.location ?? "")}`;
}

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function dedupeJobs<T extends { id: string; dedupeKey: string }>(jobs: T[]): T[] {
  const seen = new Map<string, T>();
  for (const job of jobs) {
    if (!seen.has(job.dedupeKey)) {
      seen.set(job.dedupeKey, job);
    }
  }
  return [...seen.values()];
}
