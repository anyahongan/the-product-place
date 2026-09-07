import { parseAppliedImportLooseText } from "@/lib/apply/parseAppliedImportGrid";
import type { ParseAppliedImportResult } from "@/lib/apply/parseAppliedImportGrid";

export function isOpenAiKeyMissingError(message: string): boolean {
  return /OPENAI_API_KEY/i.test(message);
}

/** OCR fallback when server vision parsing is unavailable. */
export async function parseAppliedImportImageOcr(
  file: File,
): Promise<ParseAppliedImportResult> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(file);
    const parsed = parseAppliedImportLooseText(data.text);
    return {
      ...parsed,
      warnings: [
        "Parsed with on-device OCR (server AI unavailable). Review rows before importing.",
        ...parsed.warnings,
      ],
    };
  } finally {
    await worker.terminate();
  }
}
