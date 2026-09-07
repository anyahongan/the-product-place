import { createServerFn } from "@tanstack/react-start";
import type { AppliedImportRow } from "@/lib/apply/parseAppliedImport";

type ImagePayload = {
  imageDataUrl: string;
  fileName?: string;
};

type ExtractedRows = {
  rows?: Array<{
    company?: string;
    title?: string;
    status?: string;
    dateApplied?: string | null;
    postedDate?: string | null;
    deadline?: string | null;
    applyUrl?: string | null;
  }>;
};

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
      throw new Error("Screenshot parsing requires OPENAI_API_KEY on the server.");
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env["OPENAI_PRACTICE_MODEL"]?.trim() ?? "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You extract job application tracker rows from screenshots or photos of spreadsheets.
Return JSON: { "rows": [{ "company": string, "title": string, "status": string, "dateApplied": string|null, "postedDate": string|null, "deadline": string|null, "applyUrl": string|null }] }
Use ISO dates (YYYY-MM-DD) when possible. Status should be one of: Saved, Preparing, Applied, Waiting, Recruiter Screen, Interviewing, Final Round, Offer, Rejected, Withdrawn.
Skip blank rows. Do not invent companies or titles not visible in the image.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract every application row from this tracker image.",
              },
              {
                type: "image_url",
                image_url: { url: data.imageDataUrl },
              },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(55_000),
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
    const rows: AppliedImportRow[] = (parsed.rows ?? [])
      .map((r) => ({
        company: String(r.company ?? "").trim(),
        title: String(r.title ?? "").trim(),
        status: mapStatus(r.status),
        dateApplied: r.dateApplied ?? null,
        postedDate: r.postedDate ?? null,
        deadline: r.deadline ?? null,
        applyUrl: r.applyUrl ?? null,
      }))
      .filter((r) => r.company && r.title);

    return {
      rows,
      warnings: rows.length === 0 ? ["No application rows found in that image."] : [],
    };
  });

function mapStatus(raw: string | undefined): AppliedImportRow["status"] {
  if (!raw?.trim()) return "Saved";
  const key = raw.trim().toLowerCase();
  const map: Record<string, AppliedImportRow["status"]> = {
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
  return map[key] ?? "Saved";
}
