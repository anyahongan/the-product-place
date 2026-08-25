import { createServerFn } from "@tanstack/react-start";
import {
  gradePracticeLocally,
  parseAiGradeJson,
  type GradePracticeInput,
  type PracticeGradeResult,
} from "@/lib/learning/practiceGrade";

function buildPrompt(input: GradePracticeInput): string {
  return `You are a rigorous PM interview coach for The Product Place.
Grade the candidate's practice answer thoroughly and honestly. No fluff. No fake praise.
Return ONLY valid JSON with this shape:
{
  "overallScore": number 0-100,
  "summary": string,
  "strengths": string[],
  "gaps": string[],
  "dimensions": [{"label": string, "score": 0|1|2, "feedback": string}],
  "rewriteSuggestion": string,
  "nextDrillTip": string,
  "targetNote": string|null
}

Score each rubric dimension 0 (missing), 1 (partial), 2 (strong).
If they named a target company/role/interview type, tailor feedback to that context.

Category: ${input.category}
Question title: ${input.questionTitle}
Prompt: ${input.questionPrompt}
Rubric: ${JSON.stringify(input.rubric)}
Target company: ${input.targetCompany || "(none)"}
Target role: ${input.targetRole || "(none)"}
Interview type: ${input.interviewType || "(none)"}

Candidate answer:
"""
${input.responseText.slice(0, 12000)}
"""`;
}

async function gradeWithOpenAI(input: GradePracticeInput): Promise<PracticeGradeResult | null> {
  const key = process.env["OPENAI_API_KEY"]?.trim();
  if (!key) return null;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env["OPENAI_PRACTICE_MODEL"]?.trim() || "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You grade PM interview practice answers. Be specific, rigorous, and actionable. JSON only.",
        },
        { role: "user", content: buildPrompt(input) },
      ],
    }),
    signal: AbortSignal.timeout(45_000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`AI grading failed (${res.status}): ${errText.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) return null;
  return parseAiGradeJson(content, input.rubric);
}

export const gradePracticeFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (!data || typeof data !== "object") throw new Error("Invalid grade payload");
    const d = data as Record<string, unknown>;
    if (typeof d["questionTitle"] !== "string" || typeof d["questionPrompt"] !== "string") {
      throw new Error("Missing question");
    }
    if (typeof d["responseText"] !== "string") throw new Error("Missing response");
    if (!Array.isArray(d["rubric"])) throw new Error("Missing rubric");
    return {
      questionTitle: d["questionTitle"] as string,
      questionPrompt: d["questionPrompt"] as string,
      category: String(d["category"] ?? "practice"),
      rubric: (d["rubric"] as unknown[]).map(String),
      responseText: d["responseText"] as string,
      targetCompany: typeof d["targetCompany"] === "string" ? d["targetCompany"] : "",
      targetRole: typeof d["targetRole"] === "string" ? d["targetRole"] : "",
      interviewType: typeof d["interviewType"] === "string" ? d["interviewType"] : "",
    } satisfies GradePracticeInput;
  })
  .handler(async ({ data }): Promise<PracticeGradeResult> => {
    try {
      const ai = await gradeWithOpenAI(data);
      if (ai) return ai;
    } catch {
      /* fall through to local coach */
    }
    const local = gradePracticeLocally(data);
    return { ...local, source: "coach" };
  });
