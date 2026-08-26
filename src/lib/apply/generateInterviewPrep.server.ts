import { createServerFn } from "@tanstack/react-start";
import { fetchOpenAiJson } from "@/lib/ai/openaiJson";
import {
  generateInterviewPrepLocally,
  interviewPrepFactsPayload,
  type InterviewPrepInput,
  type InterviewPrepResult,
} from "@/lib/apply/generateInterviewPrep";
import { getApplicationContext } from "@/lib/profile/getApplicationContext";
import type { PrepModule } from "@/types/apply";

type Payload = {
  userId: string;
  jobId: string;
  company: string;
  title: string;
  description: string;
  responsibilities: string[];
};

async function generateWithOpenAI(input: InterviewPrepInput): Promise<InterviewPrepResult | null> {
  const ai = await fetchOpenAiJson<{ modules?: PrepModule[] }>(
    `You create PM internship interview prep modules. Use ONLY facts in the JSON input.
Return JSON: { "modules": [{ "id": "product-sense"|"execution"|"behavioral"|"company"|"job-description", "title": string, "prompt": string, "bullets": string[] }] }`,
    interviewPrepFactsPayload(input),
  );
  if (!ai?.modules?.length) return null;
  return { modules: ai.modules, source: "ai" };
}

export const generateInterviewPrepFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (!data || typeof data !== "object") throw new Error("Invalid payload");
    const d = data as Record<string, unknown>;
    if (typeof d["userId"] !== "string" || typeof d["jobId"] !== "string") {
      throw new Error("Missing user or job");
    }
    return {
      userId: d["userId"] as string,
      jobId: d["jobId"] as string,
      company: String(d["company"] ?? ""),
      title: String(d["title"] ?? ""),
      description: String(d["description"] ?? ""),
      responsibilities: Array.isArray(d["responsibilities"])
        ? d["responsibilities"].map(String)
        : [],
    } satisfies Payload;
  })
  .handler(async ({ data }): Promise<InterviewPrepResult> => {
    const ctx = await getApplicationContext(data.userId, data.jobId);
    const input: InterviewPrepInput = {
      company: data.company,
      title: data.title,
      description: data.description,
      responsibilities: data.responsibilities,
      profile: ctx.profile,
      experiences: ctx.experiences,
      networkInsights: ctx.networkInsights,
    };

    try {
      const ai = await generateWithOpenAI(input);
      if (ai) return ai;
    } catch {
      /* local fallback */
    }
    return generateInterviewPrepLocally(input);
  });
