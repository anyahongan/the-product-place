import type { ApplicationLifecycleStatus } from "@/lib/apply/types";

export type AppliedImportRow = {
  company: string;
  title: string;
  status: ApplicationLifecycleStatus;
  dateApplied: string | null;
  postedDate: string | null;
  deadline: string | null;
  applyUrl: string | null;
};

export type ParseAppliedImportResult = {
  rows: AppliedImportRow[];
  skipped: number;
  warnings: string[];
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === "," || ch === "\t") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || (ch === "\r" && next === "\n")) {
      row.push(field);
      field = "";
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      if (ch === "\r") i++;
    } else if (ch !== "\r") {
      field += ch;
    }
  }

  if (field || row.length) {
    row.push(field);
    if (row.some((cell) => cell.trim())) rows.push(row);
  }

  return rows;
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function findHeaderIndex(rows: string[][]): number {
  for (let i = 0; i < Math.min(rows.length, 8); i++) {
    const normalized = rows[i]!.map(normalizeHeader);
    const hasCompany = normalized.some((h) =>
      ["company", "employer", "organization", "org"].includes(h),
    );
    const hasTitle = normalized.some((h) =>
      ["title", "role", "position", "job title", "job"].includes(h),
    );
    if (hasCompany && hasTitle) return i;
  }
  return 0;
}

function pickColumn(headers: string[], aliases: string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const alias of aliases) {
    const idx = normalized.findIndex((h) => h === alias || h.includes(alias));
    if (idx >= 0) return idx;
  }
  return -1;
}

function parseFlexibleDate(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  const t = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  const us = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (us) {
    const year = us[3]!.length === 2 ? `20${us[3]}` : us[3]!;
    const month = us[1]!.padStart(2, "0");
    const day = us[2]!.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  const parsed = Date.parse(t);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString().slice(0, 10);
  return null;
}

const STATUS_ALIASES: Record<string, ApplicationLifecycleStatus> = {
  saved: "Saved",
  preparing: "Preparing",
  applied: "Applied",
  submitted: "Applied",
  waiting: "Waiting",
  "recruiter screen": "Recruiter Screen",
  interviewing: "Interviewing",
  interview: "Interviewing",
  "final round": "Final Round",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

function mapStatus(raw: string | undefined): ApplicationLifecycleStatus {
  if (!raw?.trim()) return "Saved";
  const key = raw.trim().toLowerCase();
  return STATUS_ALIASES[key] ?? "Saved";
}

export function parseAppliedImportText(text: string): ParseAppliedImportResult {
  const warnings: string[] = [];
  const grid = parseCsv(text.trim());
  if (grid.length === 0) {
    return { rows: [], skipped: 0, warnings: ["No rows found in file."] };
  }

  const headerIdx = findHeaderIndex(grid);
  const headers = grid[headerIdx]!;
  const companyCol = pickColumn(headers, ["company", "employer", "organization"]);
  const titleCol = pickColumn(headers, ["title", "role", "position", "job title"]);
  const statusCol = pickColumn(headers, ["status", "stage", "application status"]);
  const appliedCol = pickColumn(headers, ["date applied", "applied", "applied on", "submitted"]);
  const postedCol = pickColumn(headers, ["posted", "posted date", "open date", "opening date", "date posted"]);
  const dueCol = pickColumn(headers, ["due", "due date", "deadline", "closing date", "close date"]);
  const urlCol = pickColumn(headers, ["apply url", "application url", "link", "url"]);

  if (companyCol < 0 || titleCol < 0) {
    return {
      rows: [],
      skipped: grid.length,
      warnings: ["Could not find Company and Title columns. Export a sheet with those headers."],
    };
  }

  const rows: AppliedImportRow[] = [];
  let skipped = 0;

  for (let i = headerIdx + 1; i < grid.length; i++) {
    const cells = grid[i]!;
    const company = (cells[companyCol] ?? "").trim();
    const title = (cells[titleCol] ?? "").trim();
    if (!company || !title) {
      skipped++;
      continue;
    }
    rows.push({
      company,
      title,
      status: mapStatus(statusCol >= 0 ? cells[statusCol] : undefined),
      dateApplied: parseFlexibleDate(appliedCol >= 0 ? cells[appliedCol] : undefined),
      postedDate: parseFlexibleDate(postedCol >= 0 ? cells[postedCol] : undefined),
      deadline: parseFlexibleDate(dueCol >= 0 ? cells[dueCol] : undefined),
      applyUrl: urlCol >= 0 ? (cells[urlCol]?.trim() || null) : null,
    });
  }

  if (rows.length === 0) {
    warnings.push("No application rows parsed after the header row.");
  }

  return { rows, skipped, warnings };
}
