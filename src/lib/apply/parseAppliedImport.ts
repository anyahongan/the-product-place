import type { AppliedImportRow } from "@/lib/apply/parseAppliedImportFields";
import {
  parseAppliedImportGrid,
  parseAppliedImportLooseText,
  parseAppliedImportText as parseCsvText,
} from "@/lib/apply/parseAppliedImportGrid";

export type { AppliedImportRow } from "@/lib/apply/parseAppliedImportFields";
export type { ParseAppliedImportResult } from "@/lib/apply/parseAppliedImportGrid";

export { parseAppliedImportLooseText, parseAppliedImportGrid } from "@/lib/apply/parseAppliedImportGrid";

export function parseAppliedImportText(text: string) {
  return parseCsvText(text);
}
