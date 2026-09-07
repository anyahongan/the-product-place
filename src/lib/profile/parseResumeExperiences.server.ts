import { createServerFn } from "@tanstack/react-start";
import { extractText, getDocumentProxy } from "unpdf";
import { fetchOpenAiJson } from "@/lib/ai/openaiJson";
import {
  buildResumeParsePrompt,
  normalizeParsedExperience,
  RESUME_PARSE_SYSTEM,
  type ParsedResumeExperience,
} from "@/lib/profile/parseResumeExperiences";

type ParsePayload = {
  pdfBase64: string;
};

type ParseResponse = {
  experiences: ParsedResumeExperience[];
  warnings: string[];
};

export const parseResumeExperiencesFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (!data || typeof data !== "object") throw new Error("Invalid payload");
    const d = data as Record<string, unknown>;
    if (typeof d["pdfBase64"] !== "string" || !d["pdfBase64"].trim()) {
      throw new Error("Expected a PDF file.");
    }
    return { pdfBase64: d["pdfBase64"].trim() } satisfies ParsePayload;
  })
  .handler(async ({ data }): Promise<ParseResponse> => {
    const key = process.env["OPENAI_API_KEY"]?.trim();
    if (!key) {
      throw new Error("Resume parsing requires OPENAI_API_KEY on the server.");
    }

    const bytes = Buffer.from(data.pdfBase64, "base64");
    if (bytes.length === 0) throw new Error("That PDF looks empty.");

    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    const { text } = await extractText(pdf, { mergePages: true });
    const resumeText = (typeof text === "string" ? text : text.join("\n\n")).trim();
    if (resumeText.length < 40) {
      return {
        experiences: [],
        warnings: [
          "Could not extract readable text from that PDF. Try a text-based PDF (not a scan).",
        ],
      };
    }

    const ai = await fetchOpenAiJson<{ experiences?: Record<string, unknown>[] }>(
      RESUME_PARSE_SYSTEM,
      buildResumeParsePrompt(resumeText),
      { temperature: 0.15, timeoutMs: 90_000 },
    );

    const experiences = (ai?.experiences ?? [])
      .map((row) => normalizeParsedExperience(row))
      .filter((row): row is ParsedResumeExperience => row != null);

    return {
      experiences,
      warnings:
        experiences.length === 0
          ? ["No experiences found in that resume. You can add roles manually below."]
          : [],
    };
  });
