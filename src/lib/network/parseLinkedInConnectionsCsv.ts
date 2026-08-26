import { normalizeLinkedInUrl } from "@/lib/network/linkedinUrl";

export type LinkedInConnectionRow = {
  firstName: string;
  lastName: string;
  name: string;
  linkedinUrl: string | null;
  email: string | null;
  company: string;
  title: string;
  connectedOn: string | null;
};

export type ParseLinkedInConnectionsResult = {
  rows: LinkedInConnectionRow[];
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
    } else if (ch === ",") {
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
  for (let i = 0; i < rows.length; i++) {
    const normalized = rows[i]!.map(normalizeHeader);
    const hasFirst = normalized.some((h) => h === "first name" || h.startsWith("first name"));
    const hasUrl = normalized.some(
      (h) => h === "url" || h === "profile url" || h.includes("linkedin"),
    );
    if (hasFirst && (hasUrl || normalized.some((h) => h === "last name"))) {
      return i;
    }
  }
  return -1;
}

function columnIndex(headers: string[], candidates: string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const candidate of candidates) {
    const idx = normalized.indexOf(candidate);
    if (idx >= 0) return idx;
  }
  for (const candidate of candidates) {
    const idx = normalized.findIndex((h) => h.includes(candidate));
    if (idx >= 0) return idx;
  }
  return -1;
}

/** Parse LinkedIn `Connections.csv` from a data export (skips preamble notes). */
export function parseLinkedInConnectionsCsv(raw: string): ParseLinkedInConnectionsResult {
  const warnings: string[] = [];
  const text = raw.replace(/^\uFEFF/, "");
  const table = parseCsv(text);

  if (table.length === 0) {
    return { rows: [], skipped: 0, warnings: ["File is empty."] };
  }

  const headerIdx = findHeaderIndex(table);
  if (headerIdx < 0) {
    return {
      rows: [],
      skipped: 0,
      warnings: [
        "Could not find LinkedIn header row (First Name, Last Name, URL…). Remove the notes at the top or upload Connections.csv from your export.",
      ],
    };
  }

  const headers = table[headerIdx]!;
  const firstIdx = columnIndex(headers, ["first name"]);
  const lastIdx = columnIndex(headers, ["last name"]);
  const urlIdx = columnIndex(headers, ["url", "profile url", "linkedin url", "linkedin"]);
  const emailIdx = columnIndex(headers, ["email address", "email"]);
  const companyIdx = columnIndex(headers, ["company", "company name", "organization"]);
  const titleIdx = columnIndex(headers, ["position", "job title", "title"]);
  const connectedIdx = columnIndex(headers, ["connected on", "connection date"]);

  if (firstIdx < 0 && lastIdx < 0) {
    return { rows: [], skipped: 0, warnings: ["Missing First Name / Last Name columns."] };
  }

  const rows: LinkedInConnectionRow[] = [];
  let skipped = 0;

  for (const line of table.slice(headerIdx + 1)) {
    const firstName = (firstIdx >= 0 ? line[firstIdx] : "")?.trim() ?? "";
    const lastName = (lastIdx >= 0 ? line[lastIdx] : "")?.trim() ?? "";
    const name = [firstName, lastName].filter(Boolean).join(" ").trim();
    if (!name) {
      skipped++;
      continue;
    }

    const linkedinUrl = normalizeLinkedInUrl(urlIdx >= 0 ? line[urlIdx] : null);
    const email = (emailIdx >= 0 ? line[emailIdx] : "")?.trim() || null;
    const company = (companyIdx >= 0 ? line[companyIdx] : "")?.trim() ?? "";
    const title = (titleIdx >= 0 ? line[titleIdx] : "")?.trim() ?? "";
    const connectedOn = (connectedIdx >= 0 ? line[connectedIdx] : "")?.trim() || null;

    rows.push({
      firstName,
      lastName,
      name,
      linkedinUrl,
      email,
      company,
      title,
      connectedOn,
    });
  }

  if (rows.length === 0) {
    warnings.push("No connection rows found after the header.");
  } else if (rows.filter((r) => r.linkedinUrl).length === 0) {
    warnings.push("No profile URLs found — contacts will import without LinkedIn links.");
  }

  return { rows, skipped, warnings };
}
