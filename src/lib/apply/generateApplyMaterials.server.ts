import { createServerFn } from "@tanstack/react-start";
import { fetchOpenAiJson } from "@/lib/ai/openaiJson";
import {
  applyMaterialsFactsPayload,
  generateApplyMaterialsLocally,
  type ApplyMaterialsInput,
  type ApplyMaterialsResult,
} from "@/lib/apply/generateApplyMaterials";
import { getApplicationContext } from "@/lib/profile/getApplicationContext";

type GeneratePayload = {
  userId: string;
  jobId: string;
  job: ApplyMaterialsInput["job"];
};

async function generateWithOpenAI(input: ApplyMaterialsInput): Promise<ApplyMaterialsResult | null> {
  const ai = await fetchOpenAiJson<{
    resumeText?: string;
    coverLetterText?: string;
    tailoringNotes?: string[];
  }>(
    `You draft truthful internship application materials for The Product Place.
Use ONLY facts provided in the JSON fact bank. Never invent employers, titles, metrics, skills, or conversations.
Reorganize and summarize existing bullets only. Return JSON: { "resumeText": string, "coverLetterText": string, "tailoringNotes": string[] }`,
    applyMaterialsFactsPayload(input),
  );
  if (!ai?.resumeText || !ai.coverLetterText) return null;
  return {
    resumeText: ai.resumeText,
    coverLetterText: ai.coverLetterText,
    tailoringNotes: Array.isArray(ai.tailoringNotes) ? ai.tailoringNotes.map(String) : [],
    source: "ai",
  };
}

export const generateApplyMaterialsFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (!data || typeof data !== "object") throw new Error("Invalid payload");
    const d = data as Record<string, unknown>;
    if (typeof d["userId"] !== "string" || typeof d["jobId"] !== "string") {
      throw new Error("Missing user or job");
    }
    const job = d["job"] as Record<string, unknown>;
    if (typeof job["company"] !== "string" || typeof job["title"] !== "string") {
      throw new Error("Missing job details");
    }
    return {
      userId: d["userId"] as string,
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
    } satisfies GeneratePayload;
  })
  .handler(async ({ data }): Promise<ApplyMaterialsResult> => {
    const ctx = await getApplicationContext(data.userId, data.jobId);
    const input: ApplyMaterialsInput = {
      profile: ctx.profile,
      experiences: ctx.experiences,
      standardAnswers: ctx.standardAnswers,
      networkInsights: ctx.networkInsights,
      job: data.job,
    };

    try {
      const ai = await generateWithOpenAI(input);
      if (ai) return ai;
    } catch {
      /* local fallback */
    }
    return generateApplyMaterialsLocally(input);
  });
