import type { AppliedImportRow } from "@/lib/apply/parseAppliedImportFields";
import {
  findHeaderRowIndex,
  mapImportColumns,
  rowFromCells,
} from "@/lib/apply/parseAppliedImportFields";

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

/** Split OCR / pasted table text into a grid. */
export function parseLooseTableText(text: string): string[][] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const delimiter =
    lines.filter((line) => line.includes("\t")).length >= lines.length / 2
      ? "\t"
      : lines.filter((line) => /\s{2,}/.test(line)).length >= lines.length / 2
        ? null
        : ",";

  if (delimiter === ",") return parseCsv(text);

  return lines.map((line) => {
    if (delimiter === "\t") return line.split("\t").map((cell) => cell.trim());
    return line.split(/\s{2,}/).map((cell) => cell.trim());
  });
}

export function parseAppliedImportGrid(grid: string[][]): ParseAppliedImportResult {
  const warnings: string[] = [];
  if (grid.length === 0) {
    return { rows: [], skipped: 0, warnings: ["No rows found in file."] };
  }

  const headerIdx = findHeaderRowIndex(grid);
  const headers = grid[headerIdx]!;
  const map = mapImportColumns(headers);

  if (map.company < 0 || map.title < 0) {
    return {
      rows: [],
      skipped: grid.length,
      warnings: [
        "Could not find Company and Title columns. Use headers like Company, Role/Title, Status, Date Applied.",
      ],
    };
  }

  const rows: AppliedImportRow[] = [];
  let skipped = 0;

  for (let i = headerIdx + 1; i < grid.length; i++) {
    const parsed = rowFromCells(grid[i]!, map);
    if (!parsed) {
      skipped++;
      continue;
    }
    rows.push(parsed);
  }

  if (map.unmapped.length > 0 && rows.length > 0) {
    warnings.push(
      `Mapped extra columns into notes: ${map.unmapped.map((u) => u.header).join(", ")}.`,
    );
  }

  if (rows.length === 0) {
    warnings.push("No application rows parsed after the header row.");
  }

  return { rows, skipped, warnings };
}

export function parseAppliedImportText(text: string): ParseAppliedImportResult {
  return parseAppliedImportGrid(parseCsv(text.trim()));
}

export function parseAppliedImportLooseText(text: string): ParseAppliedImportResult {
  return parseAppliedImportGrid(parseLooseTableText(text));
}
