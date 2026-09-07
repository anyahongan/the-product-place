import { createServerFn } from "@tanstack/react-start";
import {
  normalizeRawImportRow,
  type AppliedImportRow,
} from "@/lib/apply/parseAppliedImportFields";

type ImagePayload = {
  imageDataUrl: string;
  fileName?: string;
};

type ExtractedRows = {
  rows?: Record<string, unknown>[];
};

const IMPORT_VISION_SYSTEM = `You extract job application tracker rows from screenshots or photos of spreadsheets.
Return JSON: {
  "rows": [{
    "company": string,
    "title": string,
    "status": string,
    "dateApplied": "YYYY-MM-DD"|null,
    "postedDate": "YYYY-MM-DD"|null,
    "deadline": "YYYY-MM-DD"|null,
    "applyUrl": string|null,
    "experienceNotes": string|null,
    "onlineAssessmentDue": "YYYY-MM-DD"|null,
    "materialsRequired": { "resume": boolean, "coverLetter": boolean, "transcript": boolean, "gpa": boolean }|null
  }]
}
Rules:
- Extract every visible application row. Skip blank rows.
- Do NOT invent companies, titles, or dates not visible in the image.
- Map status to the closest of: Saved, Preparing, Applied, Waiting, Online Assessment, Recruiter Screen, Interviewing, Final Round, Offer, Rejected, Withdrawn.
- Put any extra per-row notes (referral, location, next step, comments) in experienceNotes.
- Use ISO dates when possible.
- Include materialsRequired only when the tracker shows resume/cover letter/transcript/GPA requirements.`;

export const parseAppliedImportImageFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (!data || typeof data !== "object") throw new Error("Invalid payload");
    const d = data as Record<string, unknown>;
    if (typeof d["imageDataUrl"] !== "string" || !d["imageDataUrl"].startsWith("data:image/")) {
      throw new Error("Expected a PNG or JPEG screenshot.");
    }
    return {
      imageDataUrl: d["imageDataUrl"],
      fileName: typeof d["fileName"] === "string" ? d["fileName"] : undefined,
    } satisfies ImagePayload;
  })
  .handler(async ({ data }) => {
    const key = process.env["OPENAI_API_KEY"]?.trim();
    if (!key) {
      throw new Error("OPENAI_API_KEY_MISSING");
    }

    const model = process.env["OPENAI_VISION_MODEL"]?.trim()
      ?? process.env["OPENAI_PRACTICE_MODEL"]?.trim()
      ?? "gpt-4o-mini";

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.15,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: IMPORT_VISION_SYSTEM },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract every application row from this tracker image.",
              },
              {
                type: "image_url",
                image_url: { url: data.imageDataUrl, detail: "high" },
              },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(90_000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`OpenAI request failed (${res.status}): ${errText.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return { rows: [] as AppliedImportRow[], warnings: ["No rows extracted."] };

    const parsed = JSON.parse(content) as ExtractedRows;
    const rows = (parsed.rows ?? [])
      .map((row) => normalizeRawImportRow(row))
      .filter((row): row is AppliedImportRow => row != null);

    return {
      rows,
      warnings: rows.length === 0 ? ["No application rows found in that image."] : [],
    };
  });
