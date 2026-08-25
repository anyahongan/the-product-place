/**
 * Stable dedupe foundation for multi-source ingestion.
 *
 * Identity is the employer ROLE (company + canonical title), not each
 * location posting. Same role in SF + NYC → one canonical job with
 * combined locations.
 *
 * Apply-URL keys still preserve ATS job ids in query strings when used
 * as a secondary signal (never strip gh_jid / similar).
 */

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Strip location suffixes from titles so "PM (London)" and "PM (NYC)"
 * collapse to the same role name.
 */
export function canonicalizeJobTitle(title: string): string {
  let t = title.trim();
  // Trailing parenthetical locations / remote labels
  t = t.replace(
    /\s*\(([^)]*)\)\s*$/i,
    (_full, inner: string) => {
      const i = inner.toLowerCase();
      if (
        /\b(remote|hybrid|on[\s-]?site|in[\s-]?person|united states|united kingdom|usa|uk|canada|emea|apac|europe|london|new york|nyc|san francisco|sf|seattle|bay area|toronto|vancouver|berlin|paris|dublin|singapore|sydney|tokyo|beijing|pittsburgh|luxembourg|ljubljana)\b/.test(
          i,
        ) ||
        /^[A-Z]{2}$/.test(inner.trim())
      ) {
        return "";
      }
      return ` (${inner})`;
    },
  );
  // "Title - London, United Kingdom" / "Title — Remote"
  t = t.replace(
    /\s*[-–—]\s*(remote|hybrid|on[\s-]?site|london|new york|nyc|san francisco|seattle|vancouver|toronto|berlin|paris|dublin|beijing|pittsburgh|luxembourg|ljubljana)\b.*$/i,
    "",
  );
  return t.replace(/\s+/g, " ").trim();
}

/** Primary catalog identity: one row per company + role title. */
export function buildRoleDedupeKey(company: string, title: string): string {
  return `role:${normalizeText(company)}|${normalizeText(canonicalizeJobTitle(title))}`;
}

/**
 * URL fingerprint that keeps stable ATS ids in the query string
 * (e.g. gh_jid) so search-page URLs do not all collapse together.
 */
export function buildApplyUrlKey(applyUrl: string): string | null {
  try {
    const u = new URL(applyUrl);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    const path = u.pathname.replace(/\/+$/, "").toLowerCase();
    const params = u.searchParams;
    const idKeys = ["gh_jid", "gh_jid[]", "lever-origin", "ashby_jid", "jobId", "job_id", "id"];
    let idPart = "";
    for (const k of idKeys) {
      const v = params.get(k);
      if (v) {
        idPart = `?${k}=${v}`;
        break;
      }
    }
    // Greenhouse boards path already unique: /company/jobs/12345
    if (/\/jobs\/\d+/.test(path) || /\/[0-9a-f-]{8,}\b/i.test(path)) {
      return `url:${host}${path}`;
    }
    return `url:${host}${path}${idPart}`;
  } catch {
    return `url:${normalizeText(applyUrl)}`;
  }
}

/**
 * @deprecated Prefer buildRoleDedupeKey for catalog identity.
 * Kept for callers that still pass location; location is ignored so
 * multi-location postings of the same role share one key.
 */
export function buildDedupeKey(input: {
  applyUrl: string | null;
  company: string;
  title: string;
  location: string | null;
}): string {
  void input.applyUrl;
  void input.location;
  return buildRoleDedupeKey(input.company, input.title);
}

/** Merge location strings into a single ·-separated list (sorted, unique). */
export function mergeLocations(...locs: Array<string | null | undefined>): string | null {
  const parts = new Set<string>();
  for (const loc of locs) {
    if (!loc) continue;
    for (const piece of loc.split(/\s*·\s*/)) {
      const t = piece.trim();
      if (!t) continue;
      if (/^location not specified$/i.test(t)) continue;
      if (/^unknown$/i.test(t)) continue;
      parts.add(t);
    }
  }
  if (parts.size === 0) return null;
  return [...parts].sort((a, b) => a.localeCompare(b)).join(" · ");
}

export function preferApplyUrl(a: string | null, b: string | null): string | null {
  const score = (url: string | null): number => {
    if (!url) return -1;
    try {
      const u = new URL(url);
      const path = u.pathname.toLowerCase();
      if (/\/jobs\/\d+/.test(path)) return 5;
      if (/\/[0-9a-f-]{8,}/i.test(path)) return 4;
      if (u.searchParams.has("gh_jid")) return 3;
      if (/\/apply\b/i.test(path)) return 2;
      return 1;
    } catch {
      return 0;
    }
  };
  return score(a) >= score(b) ? a : b;
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
