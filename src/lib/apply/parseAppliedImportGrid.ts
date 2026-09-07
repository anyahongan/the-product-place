import type { AppliedImportRow } from "@/lib/apply/parseAppliedImportFields";
import {
  findHeaderRowIndex,
  mapImportColumns,
  postProcessImportRows,
  rowFromCells,
} from "@/lib/apply/parseAppliedImportFields";
import {
  parseAppliedImportOcrText,
  splitOcrLineToCells,
} from "@/lib/apply/parseAppliedImportOcr";

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

  const pipeLines = lines.filter((line) => line.includes("|")).length;
  const tabLines = lines.filter((line) => line.includes("\t")).length;
  const spacedLines = lines.filter((line) => /\s{2,}/.test(line)).length;

  if (pipeLines >= Math.max(2, lines.length / 3)) {
    return lines.map((line) =>
      line
        .split("|")
        .map((cell) => cell.trim())
        .filter((cell, idx, arr) => !(idx === 0 && !cell) && !(idx === arr.length - 1 && !cell)),
    );
  }

  if (tabLines >= lines.length / 2) {
    return lines.map((line) => line.split("\t").map((cell) => cell.trim()));
  }

  if (spacedLines >= lines.length / 2) {
    return lines.map((line) => line.split(/\s{2,}/).map((cell) => cell.trim()));
  }

  return lines.map((line) => splitOcrLineToCells(line));
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
    const ocrFallback = parseAppliedImportOcrText(
      grid.map((row) => row.join("\t")).join("\n"),
      grid,
    );
    if (ocrFallback.rows.length > 0) {
      return {
        ...ocrFallback,
        skipped: ocrFallback.skipped + (grid.length - headerIdx - 1),
        warnings: ocrFallback.warnings,
      };
    }

    return {
      rows: [],
      skipped: grid.length,
      warnings: [
        "Could not find Company and Title columns. For screenshots, try a clearer crop of the table or export as CSV. Headers like Company, Role/Title, Status help.",
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

  return { rows: postProcessImportRows(rows), skipped, warnings };
}

export function parseAppliedImportText(text: string): ParseAppliedImportResult {
  return parseAppliedImportGrid(parseCsv(text.trim()));
}

export function parseAppliedImportLooseText(text: string): ParseAppliedImportResult {
  const grid = parseLooseTableText(text);
  const primary = parseAppliedImportGrid(grid);
  if (primary.rows.length > 0) return primary;

  const ocrFallback = parseAppliedImportOcrText(text, grid);
  if (ocrFallback.rows.length > 0) {
    return {
      ...ocrFallback,
      warnings: [...ocrFallback.warnings, ...primary.warnings],
    };
  }

  return primary;
}
