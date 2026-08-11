import type { WorkMode } from "@/types/apply";
import type { NormalizedJob } from "@/lib/apply/types";
import { classifyProductRole } from "@/lib/apply/normalization/classifyProductRole";
import { buildDedupeKey } from "@/lib/apply/normalization/dedupe";

export type RawInternshipRow = {
  company: string;
  title: string;
  locationRaw: string;
  applyUrl: string | null;
  closed: boolean;
  datePostedRaw: string;
  sourceFile: string;
};

const SOURCE_NAME = "Summer2027 Internships (GitHub)";
const SOURCE_REPO_URL = "https://github.com/vanshb03/Summer2027-Internships";

export function normalizeInternshipRow(
  row: RawInternshipRow,
  nowIso = new Date().toISOString(),
): NormalizedJob | null {
  const productRoleCategory = classifyProductRole(row.title);
  if (!productRoleCategory) return null;

  const location = cleanLocation(row.locationRaw);
  const workMode = inferWorkMode(row.locationRaw);
  const postedDate = parsePostedDate(row.datePostedRaw, nowIso);
  const applyUrl = row.closed ? null : row.applyUrl;

  const dedupeKey = buildDedupeKey({
    applyUrl,
    company: row.company,
    title: row.title,
    location,
  });

  const id = `vansh2027:${hashKey(dedupeKey)}`;

  return {
    id,
    company: row.company.trim(),
    title: cleanTitle(row.title),
    productRoleCategory,
    location,
    workMode,
    graduationYears: null,
    employmentType: "internship",
    postedDate,
    firstSeenDate: postedDate ?? nowIso.slice(0, 10),
    deadline: null,
    source: SOURCE_NAME,
    sourceUrl: SOURCE_REPO_URL,
    applyUrl,
    description: null,
    status: row.closed ? "closed" : applyUrl ? "open" : "unknown",
    dedupeKey,
  };
}

function cleanTitle(title: string): string {
  return title
    .replace(/🛂|🇺🇸|🇨🇦|🔒/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanLocation(raw: string): string | null {
  const cleaned = raw
    .replace(/<br\s*\/?>/gi, ", ")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || null;
}

function inferWorkMode(locationRaw: string): WorkMode | null {
  const t = locationRaw.toLowerCase();
  if (/\bremote\b/.test(t) && /\bhybrid\b/.test(t)) return "hybrid";
  if (/\bremote\b/.test(t) && !/\bin[\s-]?person\b|\bon[\s-]?site\b/.test(t)) {
    // Pure remote or remote + city listed as remote-first
    if (/^remote\b/.test(t.trim()) || t.includes("remote only")) return "remote";
    if (t.startsWith("remote")) return "remote";
    // "Remote Carmel, IN" style → remote
    if (/\bremote\b/.test(t)) return "remote";
  }
  if (/\bhybrid\b/.test(t)) return "hybrid";
  if (/\bin[\s-]?person\b|\bon[\s-]?site\b/.test(t)) return "in-person";
  return null;
}

/** Dates in source look like "Aug 06" without year — use year from nowIso. */
function parsePostedDate(raw: string, nowIso: string): string | null {
  const cleaned = raw.replace(/[^A-Za-z0-9 ]/g, " ").trim();
  if (!cleaned) return null;

  const year = Number(nowIso.slice(0, 4));
  const parsed = Date.parse(`${cleaned} ${year} UTC`);
  if (Number.isNaN(parsed)) return null;

  const d = new Date(parsed);
  // If parsed date is more than ~4 months in the future, it likely belongs to previous year
  const now = new Date(nowIso);
  if (d.getTime() - now.getTime() > 120 * 24 * 60 * 60 * 1000) {
    d.setUTCFullYear(year - 1);
  }
  return d.toISOString().slice(0, 10);
}

function hashKey(key: string): string {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}
