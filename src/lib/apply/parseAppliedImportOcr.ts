import type { AppliedImportRow } from "@/lib/apply/parseAppliedImportFields";
import {
  cleanImportCell,
  inferImportStatus,
  parseFlexibleDate,
  postProcessImportRows,
  rowFromCells,
  type ImportColumnMap,
} from "@/lib/apply/parseAppliedImportFields";
import { APPLICATION_STATUSES } from "@/lib/apply/types";
import type { ParseAppliedImportResult } from "@/lib/apply/parseAppliedImportGrid";

const TITLE_HINT =
  /\b(product manager|program manager|technical program manager|project manager|software engineer|swe|engineer|developer|designer|analyst|associate|intern|coordinator|specialist|consultant|strategist|operations|data scientist|researcher|mba|fellow|apprentice|lead|director|manager)\b/i;

const HEADER_HINT = /\b(company|employer|organization|title|role|position|status|stage|applied|date)\b/i;

function splitOcrLineToCells(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed) return [];
  if (trimmed.includes("|")) {
    return trimmed
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell, idx, arr) => !(idx === 0 && !cell) && !(idx === arr.length - 1 && !cell));
  }
  if (trimmed.includes("\t")) return trimmed.split("\t").map((cell) => cell.trim());
  if (/\s{2,}/.test(trimmed)) return trimmed.split(/\s{2,}/).map((cell) => cell.trim());
  return [trimmed];
}

function looksLikeHeaderRow(cells: string[]): boolean {
  const joined = cells.join(" ").toLowerCase();
  if (!HEADER_HINT.test(joined)) return false;
  return cells.length >= 2;
}

function buildPositionalMap(columnCount: number): ImportColumnMap {
  return {
    company: 0,
    title: columnCount >= 2 ? 1 : -1,
    status: columnCount >= 3 ? 2 : -1,
    dateApplied: columnCount >= 4 ? 3 : -1,
    postedDate: columnCount >= 5 ? 4 : -1,
    deadline: columnCount >= 6 ? 5 : -1,
    applyUrl: -1,
    experienceNotes: columnCount >= 7 ? 6 : -1,
    onlineAssessmentDue: -1,
    materialsResume: -1,
    materialsCoverLetter: -1,
    materialsTranscript: -1,
    materialsGpa: -1,
    unmapped: [],
  };
}

function splitCompanyTitle(text: string): { company: string; title: string } | null {
  const cleaned = cleanImportCell(text);
  if (!cleaned) return null;

  const titleMatch = cleaned.match(
    /^(.+?)\s+((?:senior|staff|lead|principal|associate|entry[- ]level)\s+)?(.+)$/i,
  );
  if (titleMatch) {
    const candidateTitle = `${titleMatch[2] ?? ""}${titleMatch[3] ?? ""}`.trim();
    const company = titleMatch[1]!.trim();
    if (TITLE_HINT.test(candidateTitle) && company.length >= 2) {
      return { company, title: candidateTitle };
    }
  }

  const keywordMatch = cleaned.match(new RegExp(`^(.+?)\\s+(${TITLE_HINT.source})\\b(.+)?$`, "i"));
  if (keywordMatch) {
    const company = keywordMatch[1]!.trim();
    const title = [keywordMatch[2], keywordMatch[3]].filter(Boolean).join(" ").trim();
    if (company.length >= 2 && title.length >= 2) return { company, title };
  }

  const words = cleaned.split(/\s+/);
  if (words.length >= 4) {
    for (let titleWords = 2; titleWords <= 5; titleWords++) {
      if (words.length <= titleWords) continue;
      const title = words.slice(-titleWords).join(" ");
      const company = words.slice(0, -titleWords).join(" ");
      if (TITLE_HINT.test(title) && company.length >= 2) {
        return { company, title };
      }
    }
  }

  if (words.length >= 3) {
    return {
      company: words.slice(0, 2).join(" "),
      title: words.slice(2).join(" "),
    };
  }

  if (words.length === 2) {
    return { company: words[0]!, title: words[1]! };
  }

  return null;
}

function extractTrailingStatus(text: string): {
  before: string;
  statusRaw: string;
} | null {
  const ranked = [...APPLICATION_STATUSES].sort((a, b) => b.length - a.length);
  for (const status of ranked) {
    const re = new RegExp(`\\s+${status.replace(/\s+/g, "\\s+")}\\s*$`, "i");
    if (re.test(text)) {
      return {
        before: text.replace(re, "").trim(),
        statusRaw: status,
      };
    }
  }

  const aliasTail = text.match(
    /\s+(applied|submitted|interviewing|rejected|offer|waiting|ghosted|oa|assessment|screen|onsite|final|withdrawn)\.?\s*$/i,
  );
  if (aliasTail) {
    return {
      before: text.slice(0, aliasTail.index).trim(),
      statusRaw: aliasTail[1]!,
    };
  }

  return null;
}

function parseFreeformOcrLine(line: string): AppliedImportRow | null {
  const cleaned = cleanImportCell(line);
  if (!cleaned || cleaned.length < 4) return null;
  if (HEADER_HINT.test(cleaned) && cleaned.split(/\s+/).length <= 6) return null;

  const cells = splitOcrLineToCells(cleaned);
  if (cells.length >= 2) {
    const company = cells[0] ?? "";
    const title = cells[1] ?? "";
    if (company && title && !HEADER_HINT.test(`${company} ${title}`)) {
      const statusRaw = cells[2];
      const dateApplied = parseFlexibleDate(cells[3] ?? cells.find((c) => /\d/.test(c)));
      const notes = cells.length > 4 ? cells.slice(4).join(" · ") : cells.length > 3 && !dateApplied ? cells[3] : null;
      return {
        company,
        title,
        status: inferImportStatus({ statusRaw, notes, extraHints: cells.slice(2) }),
        dateApplied,
        postedDate: null,
        deadline: null,
        applyUrl: cells.find((c) => /^https?:\/\//i.test(c)) ?? null,
        experienceNotes: notes && notes !== statusRaw ? notes : null,
        onlineAssessmentDue: null,
        materialsRequired: null,
      };
    }
  }

  let working = cleaned;
  let statusRaw: string | undefined;
  const statusExtract = extractTrailingStatus(working);
  if (statusExtract) {
    working = statusExtract.before;
    statusRaw = statusExtract.statusRaw;
  }

  const dateMatch = working.match(
    /\s+(\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?|\d{4}-\d{2}-\d{2}|[A-Za-z]{3,9}\s+\d{1,2}(?:,?\s+\d{4})?)\s*$/,
  );
  const dateApplied = dateMatch ? parseFlexibleDate(dateMatch[1]) : null;
  if (dateMatch) working = working.slice(0, dateMatch.index).trim();

  const split = splitCompanyTitle(working);
  if (!split) return null;

  return {
    company: split.company,
    title: split.title,
    status: inferImportStatus({ statusRaw, notes: cleaned }),
    dateApplied,
    postedDate: null,
    deadline: null,
    applyUrl: null,
    experienceNotes: null,
    onlineAssessmentDue: null,
    materialsRequired: null,
  };
}

export function parseGridPositionalFallback(grid: string[][]): ParseAppliedImportResult {
  const normalized = grid
    .map((row) => row.map(cleanImportCell))
    .filter((row) => row.some((cell) => cell.length > 0));

  if (normalized.length === 0) {
    return { rows: [], skipped: 0, warnings: [] };
  }

  const counts = new Map<number, number>();
  for (const row of normalized) {
    const count = row.filter(Boolean).length;
    if (count >= 2) counts.set(count, (counts.get(count) ?? 0) + 1);
  }

  const bestEntry = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const columnCount = bestEntry?.[0] ?? 0;
  if (columnCount < 2) {
    return { rows: [], skipped: normalized.length, warnings: [] };
  }

  const map = buildPositionalMap(columnCount);
  let startIdx = 0;
  if (normalized[0] && looksLikeHeaderRow(normalized[0])) startIdx = 1;

  const rows: AppliedImportRow[] = [];
  let skipped = 0;

  for (let i = startIdx; i < normalized.length; i++) {
    const row = normalized[i]!;
    if (row.filter(Boolean).length < 2) {
      skipped++;
      continue;
    }
    const parsed = rowFromCells(row, map);
    if (!parsed) {
      skipped++;
      continue;
    }
    rows.push(parsed);
  }

  if (rows.length === 0) {
    return { rows: [], skipped, warnings: [] };
  }

  return {
    rows: postProcessImportRows(rows),
    skipped,
    warnings: [
      "OCR column layout inferred (headers were unclear). Review company, title, and status before importing.",
    ],
  };
}

export function parseOcrFreeformLines(text: string): ParseAppliedImportResult {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rows: AppliedImportRow[] = [];
  let skipped = 0;

  for (const line of lines) {
    const parsed = parseFreeformOcrLine(line);
    if (!parsed) {
      skipped++;
      continue;
    }
    rows.push(parsed);
  }

  if (rows.length === 0) {
    return { rows: [], skipped, warnings: [] };
  }

  return {
    rows: postProcessImportRows(rows),
    skipped,
    warnings: [
      "OCR parsed line-by-line (table structure was unclear). Review company, title, and status before importing.",
    ],
  };
}

/** OCR-specific parsing with grid + freeform fallbacks. */
export function parseAppliedImportOcrText(text: string, grid: string[][]): ParseAppliedImportResult {
  const positional = parseGridPositionalFallback(grid);
  if (positional.rows.length > 0) return positional;

  const freeform = parseOcrFreeformLines(text);
  if (freeform.rows.length > 0) return freeform;

  return { rows: [], skipped: grid.length, warnings: [] };
}

export { splitOcrLineToCells };
