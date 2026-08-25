import type { EmploymentType } from "@/types/apply";
import type { NormalizedJob } from "@/lib/apply/types";
import { classifyProductRole } from "@/lib/apply/normalization/classifyProductRole";
import { buildRoleDedupeKey, canonicalizeJobTitle, dedupeJobs } from "@/lib/apply/normalization/dedupe";
import { parseGraduationYears } from "@/lib/ingestion/fieldParsing";

export type SimplifyHtmlRow = {
  company: string;
  title: string;
  location: string | null;
  applyUrl: string | null;
  ageRaw: string | null;
  section: string;
};

/**
 * Parse SimplifyJobs-style HTML README tables into rows.
 * Prefer employer apply URLs over simplify.jobs deep links.
 */
export function parseSimplifyHtmlTables(
  markdown: string,
  options?: { sectionHeadingIncludes?: string[] },
): SimplifyHtmlRow[] {
  const headingIncludes = options?.sectionHeadingIncludes;
  const sections = splitHtmlSections(markdown);
  const rows: SimplifyHtmlRow[] = [];

  for (const section of sections) {
    if (headingIncludes && headingIncludes.length > 0) {
      const h = section.heading.toLowerCase();
      if (!headingIncludes.some((n) => h.includes(n.toLowerCase()))) continue;
    }

    let lastCompany = "";
    const trMatches = section.body.matchAll(/<tr>\s*([\s\S]*?)\s*<\/tr>/gi);
    for (const tr of trMatches) {
      const rowHtml = tr[1] ?? "";
      if (/<th\b/i.test(rowHtml)) continue;
      const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(
        (m) => m[1] ?? "",
      );
      if (cells.length < 4) continue;

      let company = stripHtml(cells[0] ?? "").replace(/🔥/g, "").trim();
      const title = stripHtml(cells[1] ?? "")
        .replace(/[🛂🇺🇸🇨🇦🎓🔒]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      const location = stripHtml(cells[2] ?? "").replace(/\s+/g, " ").trim() || null;
      const applyUrl = extractEmployerApplyUrl(cells[3] ?? "");
      const ageRaw = cells[4] ? stripHtml(cells[4]).trim() || null : null;

      if (!title) continue;
      if (!company || company === "↳" || company.startsWith("↳")) {
        company = lastCompany;
      } else {
        lastCompany = company;
      }
      if (!company) continue;

      rows.push({
        company,
        title,
        location,
        applyUrl,
        ageRaw,
        section: section.heading,
      });
    }
  }

  return rows;
}

function splitHtmlSections(markdown: string): Array<{ heading: string; body: string }> {
  const parts = markdown.split(/^## /gm);
  const out: Array<{ heading: string; body: string }> = [];
  for (let i = 1; i < parts.length; i++) {
    const block = parts[i] ?? "";
    const nl = block.indexOf("\n");
    const heading = (nl === -1 ? block : block.slice(0, nl)).trim();
    const body = nl === -1 ? "" : block.slice(nl + 1);
    out.push({ heading, body });
  }
  return out;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " · ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractEmployerApplyUrl(cellHtml: string): string | null {
  const hrefs = [...cellHtml.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)].map(
    (m) => m[1]!,
  );
  const employer = hrefs.find(
    (u) =>
      !/simplify\.jobs\/p\//i.test(u) &&
      !/i\.imgur\.com/i.test(u) &&
      !/github\.com\/SimplifyJobs/i.test(u),
  );
  return employer ?? hrefs[0] ?? null;
}

export function normalizeSimplifyRow(
  row: SimplifyHtmlRow,
  opts: {
    sourceName: string;
    sourceUrl: string;
    idPrefix: string;
    employmentType: EmploymentType;
  },
  nowIso = new Date().toISOString(),
): NormalizedJob | null {
  const productRoleCategory = classifyProductRole(row.title);
  if (!productRoleCategory) return null;

  const title = canonicalizeJobTitle(row.title);
  const dedupeKey = buildRoleDedupeKey(row.company, title);
  const graduationYears = parseGraduationYears(`${row.title}\n${row.section}`);

  return {
    id: `${opts.idPrefix}:${hashKey(dedupeKey)}`,
    company: row.company,
    title,
    productRoleCategory,
    location: row.location,
    workMode: inferWorkMode(row.location),
    graduationYears,
    employmentType: opts.employmentType,
    postedDate: null,
    firstSeenDate: nowIso.slice(0, 10),
    deadline: null,
    source: opts.sourceName,
    sourceUrl: opts.sourceUrl,
    applyUrl: row.applyUrl,
    description: null,
    status: row.applyUrl ? "open" : "unknown",
    dedupeKey,
  };
}

function inferWorkMode(location: string | null): NormalizedJob["workMode"] {
  if (!location) return null;
  const t = location.toLowerCase();
  if (/\bhybrid\b/.test(t)) return "hybrid";
  if (/\bremote\b/.test(t)) return "remote";
  if (/\bin[\s-]?person\b|\bon[\s-]?site\b/.test(t)) return "in-person";
  return null;
}

function hashKey(key: string): string {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

export async function fetchSimplifyProductJobs(input: {
  readmeUrl: string;
  sourceName: string;
  sourceUrl: string;
  idPrefix: string;
  employmentType: EmploymentType;
  sectionHeadingIncludes: string[];
  fetchImpl?: typeof fetch;
}): Promise<{ jobs: NormalizedJob[]; errors: string[] }> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const errors: string[] = [];
  try {
    const res = await fetchImpl(input.readmeUrl, {
      headers: { Accept: "text/plain", "User-Agent": "the-product-place" },
    });
    if (!res.ok) {
      errors.push(`HTTP ${res.status}`);
      return { jobs: [], errors };
    }
    const markdown = await res.text();
    const rows = parseSimplifyHtmlTables(markdown, {
      sectionHeadingIncludes: input.sectionHeadingIncludes,
    });
    const normalized = rows
      .map((row) =>
        normalizeSimplifyRow(row, {
          sourceName: input.sourceName,
          sourceUrl: input.sourceUrl,
          idPrefix: input.idPrefix,
          employmentType: input.employmentType,
        }),
      )
      .filter((j): j is NormalizedJob => j !== null);
    return { jobs: dedupeJobs(normalized), errors };
  } catch (err) {
    errors.push(err instanceof Error ? err.message : "fetch failed");
    return { jobs: [], errors };
  }
}
