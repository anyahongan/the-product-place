import { parseAppliedImportLooseText } from "@/lib/apply/parseAppliedImportGrid";
import type { ParseAppliedImportResult } from "@/lib/apply/parseAppliedImportGrid";

export function isOpenAiKeyMissingError(message: string): boolean {
  return /OPENAI_API_KEY/i.test(message);
}

async function preprocessImportImage(file: File): Promise<File | Blob> {
  if (typeof document === "undefined") return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(2.5, Math.max(1, 1800 / Math.max(bitmap.width, bitmap.height, 1)));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i]!;
    const g = imageData.data[i + 1]!;
    const b = imageData.data[i + 2]!;
    const avg = (r + g + b) / 3;
    const v = avg > 175 ? 255 : avg < 95 ? 0 : avg;
    imageData.data[i] = v;
    imageData.data[i + 1] = v;
    imageData.data[i + 2] = v;
  }
  ctx.putImageData(imageData, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  return blob ?? file;
}

/** OCR fallback when server vision parsing is unavailable. */
export async function parseAppliedImportImageOcr(
  file: File,
): Promise<ParseAppliedImportResult> {
  const { createWorker, PSM } = await import("tesseract.js");
  const worker = await createWorker("eng");
  const input = await preprocessImportImage(file);

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      preserve_interword_spaces: "1",
    });

    const { data } = await worker.recognize(input);
    const parsed = parseAppliedImportLooseText(data.text);
    return {
      ...parsed,
      warnings: [
        "Parsed with on-device OCR (server AI unavailable). Review status and company/title before importing.",
        ...parsed.warnings,
      ],
    };
  } finally {
    await worker.terminate();
  }
}
