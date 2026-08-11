import type { NormalizedJob } from "@/lib/apply/types";
import { dedupeJobs } from "@/lib/apply/normalization/dedupe";
import {
  normalizeInternshipRow,
  type RawInternshipRow,
} from "@/lib/apply/normalization/normalizeJob";

const RAW_URLS = [
  {
    file: "README.md",
    url: "https://raw.githubusercontent.com/vanshb03/Summer2027-Internships/dev/README.md",
  },
  {
    file: "OFFSEASON_README.md",
    url: "https://raw.githubusercontent.com/vanshb03/Summer2027-Internships/dev/OFFSEASON_README.md",
  },
] as const;

/**
 * Source adapter for vanshb03/Summer2027-Internships.
 * Parses markdown internship tables into normalized product-relevant jobs.
 */
export async function fetchVansh2027Jobs(fetchImpl: typeof fetch = fetch): Promise<{
  jobs: NormalizedJob[];
  errors: string[];
}> {
  const errors: string[] = [];
  const rows: RawInternshipRow[] = [];

  for (const source of RAW_URLS) {
    try {
      const res = await fetchImpl(source.url, {
        headers: { Accept: "text/plain" },
      });
      if (!res.ok) {
        errors.push(`${source.file}: HTTP ${res.status}`);
        continue;
      }
      const markdown = await res.text();
      rows.push(...parseInternshipMarkdown(markdown, source.file));
    } catch (err) {
      errors.push(`${source.file}: ${err instanceof Error ? err.message : "fetch failed"}`);
    }
  }

  if (rows.length === 0 && errors.length > 0) {
    throw new Error(`Source unavailable. ${errors.join(" · ")}`);
  }

  const normalized = rows
    .map((row) => normalizeInternshipRow(row))
    .filter((job): job is NormalizedJob => job !== null);

  return { jobs: dedupeJobs(normalized), errors };
}

export function parseInternshipMarkdown(markdown: string, sourceFile: string): RawInternshipRow[] {
  const lines = markdown.split(/\r?\n/);
  const rows: RawInternshipRow[] = [];
  let lastCompany = "";

  for (const line of lines) {
    if (!line.startsWith("|")) continue;
    if (/^\|\s*-+/.test(line)) continue;
    if (/^\|\s*Company\s*\|/i.test(line)) continue;

    const cells = splitTableRow(line);
    if (cells.length < 5) continue;

    const [companyCell, roleCell, locationCell, linkCell, dateCell] = cells;
    if (!roleCell) continue;

    let company = (companyCell ?? "").trim();
    if (company === "↳" || company === "" || company === "→") {
      company = lastCompany;
    } else {
      lastCompany = company.replace(/<[^>]+>/g, "").trim();
      company = lastCompany;
    }

    if (!company || !roleCell.trim()) continue;

    const closed = /🔒/.test(linkCell ?? "") || /🔒/.test(roleCell);
    const applyUrl = extractApplyUrl(linkCell ?? "");

    rows.push({
      company,
      title: roleCell.replace(/<\/?[^>]+>/g, "").trim(),
      locationRaw: locationCell ?? "",
      applyUrl,
      closed,
      datePostedRaw: (dateCell ?? "").replace(/<\/?[^>]+>/g, "").trim(),
      sourceFile,
    });
  }

  return rows;
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((c) => c.trim());
}

function extractApplyUrl(cell: string): string | null {
  const href = cell.match(/href=["']([^"']+)["']/i);
  if (href?.[1]) return href[1];

  const md = cell.match(/\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/i);
  if (md?.[1]) return md[1];

  const bare = cell.match(/(https?:\/\/[^\s<]+)/i);
  if (bare?.[1]) return bare[1].replace(/[),]+$/, "");

  return null;
}
