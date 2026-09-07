import { createServerFn } from "@tanstack/react-start";
import { fetchOpenAiJson } from "@/lib/ai/openaiJson";
import {
  applyMaterialsFactsPayload,
  generateApplyMaterialsLocally,
  type ApplyMaterialsInput,
  type ApplyMaterialsResult,
} from "@/lib/apply/generateApplyMaterials";

type ProfileSnapshot = ApplyMaterialsInput["profile"];
type ExperienceSnapshot = ApplyMaterialsInput["experiences"][number];
type AnswerSnapshot = ApplyMaterialsInput["standardAnswers"][number];

type GeneratePayload = {
  jobId: string;
  job: ApplyMaterialsInput["job"];
  profile: ProfileSnapshot;
  experiences: ExperienceSnapshot[];
  standardAnswers: AnswerSnapshot[];
  networkInsights: ApplyMaterialsInput["networkInsights"];
  resumeTemplate: string | null;
  coverLetterTemplate: string | null;
};

async function generateWithOpenAI(input: ApplyMaterialsInput): Promise<ApplyMaterialsResult | null> {
  const hasCoverTemplate = Boolean(input.templates?.coverLetterTemplate?.trim());

  const system = hasCoverTemplate
    ? `You tailor internship application materials for The Product Place.
Use ONLY facts from the profile JSON. Never invent employers, titles, metrics, skills, or conversations.
Use the user's cover letter template structure and voice. Adapt it for the role and company in the job JSON.
Grade the final cover letter strictly as the hiring company would (0–10). Minimum acceptable score is 9/10.
Revise until the cover letter would score at least 9/10, then return the final version.

Return JSON:
{
  "resumeText": string,
  "coverLetterText": string,
  "coverLetterScore": number,
  "gradingNotes": string[],
  "tailoringNotes": string[]
}`
    : `You draft truthful internship application materials for The Product Place.
Use ONLY facts provided in the JSON fact bank. Never invent employers, titles, metrics, skills, or conversations.
Reorganize and summarize existing bullets only.
Return JSON: { "resumeText": string, "coverLetterText": string, "tailoringNotes": string[] }`;

  const userParts = [applyMaterialsFactsPayload(input)];

  if (input.templates?.resumeTemplate?.trim()) {
    userParts.push(
      `\nRESUME TEMPLATE (adapt for this role; keep truthful facts only):\n${input.templates.resumeTemplate.trim()}`,
    );
  }

  if (hasCoverTemplate) {
    userParts.push(
      `\nCOVER LETTER TEMPLATE (follow structure and voice; target role description below):\n${input.templates!.coverLetterTemplate!.trim()}`,
      `\nROLE DESCRIPTION:\n${input.job.description}`,
      `\nEnsure this cover letter would pass strict grading from ${input.job.company} with a MINIMUM score of 9/10.`,
    );
  }

  const ai = await fetchOpenAiJson<{
    resumeText?: string;
    coverLetterText?: string;
    coverLetterScore?: number;
    gradingNotes?: string[];
    tailoringNotes?: string[];
  }>(system, userParts.join("\n"));

  if (!ai?.resumeText || !ai.coverLetterText) return null;

  return {
    resumeText: ai.resumeText,
    coverLetterText: ai.coverLetterText,
    tailoringNotes: Array.isArray(ai.tailoringNotes) ? ai.tailoringNotes.map(String) : [],
    gradingNotes: Array.isArray(ai.gradingNotes) ? ai.gradingNotes.map(String) : undefined,
    coverLetterScore:
      typeof ai.coverLetterScore === "number" && Number.isFinite(ai.coverLetterScore)
        ? Math.max(0, Math.min(10, ai.coverLetterScore))
        : hasCoverTemplate
          ? null
          : undefined,
    source: "ai",
  };
}

export const generateApplyMaterialsFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (!data || typeof data !== "object") throw new Error("Invalid payload");
    const d = data as Record<string, unknown>;
    if (typeof d["jobId"] !== "string") throw new Error("Missing job");
    const job = d["job"] as Record<string, unknown>;
    if (typeof job["company"] !== "string" || typeof job["title"] !== "string") {
      throw new Error("Missing job details");
    }
    const profile = d["profile"] as Record<string, unknown> | undefined;
    if (!profile || typeof profile !== "object") {
      throw new Error("Missing profile snapshot");
    }
    return {
      jobId: d["jobId"] as string,
      job: {
        company: job["company"] as string,
        title: job["title"] as string,
        description: String(job["description"] ?? ""),
        productRole: String(job["productRole"] ?? "Product Management"),
        responsibilities: Array.isArray(job["responsibilities"])
          ? job["responsibilities"].map(String)
          : [],
      },
      profile: profile as ProfileSnapshot,
      experiences: Array.isArray(d["experiences"])
        ? (d["experiences"] as ExperienceSnapshot[])
        : [],
      standardAnswers: Array.isArray(d["standardAnswers"])
        ? (d["standardAnswers"] as AnswerSnapshot[])
        : [],
      networkInsights: Array.isArray(d["networkInsights"])
        ? (d["networkInsights"] as ApplyMaterialsInput["networkInsights"])
        : [],
      resumeTemplate:
        typeof d["resumeTemplate"] === "string" ? (d["resumeTemplate"] as string) : null,
      coverLetterTemplate:
        typeof d["coverLetterTemplate"] === "string"
          ? (d["coverLetterTemplate"] as string)
          : null,
    } satisfies GeneratePayload;
  })
  .handler(async ({ data }): Promise<ApplyMaterialsResult> => {
    const input: ApplyMaterialsInput = {
      profile: data.profile,
      experiences: data.experiences,
      standardAnswers: data.standardAnswers,
      networkInsights: data.networkInsights,
      job: data.job,
      templates: {
        resumeTemplate: data.resumeTemplate,
        coverLetterTemplate: data.coverLetterTemplate,
      },
    };

    try {
      const ai = await generateWithOpenAI(input);
      if (ai) return ai;
    } catch {
      /* local fallback */
    }
    return generateApplyMaterialsLocally(input);
  });
