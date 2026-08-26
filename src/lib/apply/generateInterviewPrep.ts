import type { PrepModule } from "@/types/apply";
import type { UserProfileBundle } from "@/types/profile";

export type InterviewPrepInput = {
  company: string;
  title: string;
  description: string;
  responsibilities: string[];
  profile: UserProfileBundle["profile"] | null;
  experiences: UserProfileBundle["experiences"];
  networkInsights: { text: string; contactName: string | null }[];
};

export type InterviewPrepResult = {
  modules: PrepModule[];
  source: "ai" | "coach";
};

function experienceStories(experiences: InterviewPrepInput["experiences"]): string[] {
  return experiences
    .flatMap((exp) =>
      [...exp.bullets]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .slice(0, 1)
        .map((b) => `${exp.title} at ${exp.organization}: ${b.content}`),
    )
    .slice(0, 4);
}

export function generateInterviewPrepLocally(input: InterviewPrepInput): InterviewPrepResult {
  const respSnippet = input.responsibilities.slice(0, 3).join("; ") || input.description.slice(0, 180);
  const stories = experienceStories(input.experiences);
  const insightBullets = input.networkInsights.slice(0, 3).map((n) =>
    n.contactName ? `${n.contactName}: ${n.text}` : n.text,
  );

  const modules: PrepModule[] = [
    {
      id: "product-sense",
      title: "Product Sense",
      prompt: `How would you improve a core ${input.title} experience at ${input.company}?`,
      bullets: [
        "Clarify user + job-to-be-done tied to the posting",
        "Name the metric you would move",
        "Propose 2 solutions with tradeoffs",
        respSnippet ? `Posting focus: ${respSnippet}` : "Review the job description before your answer",
      ],
    },
    {
      id: "execution",
      title: "Execution & Metrics",
      prompt: `A key funnel metric for ${input.company} dropped 12% week over week. How do you investigate?`,
      bullets: [
        "Segment before concluding (platform, cohort, channel)",
        "Check instrumentation vs real behavior change",
        "Propose a next experiment with success criteria",
      ],
    },
    {
      id: "behavioral",
      title: "Behavioral",
      prompt: "Tell a story about a product decision you owned under ambiguity.",
      bullets:
        stories.length > 0
          ? [...stories, "Use Situation → Action → Result → learning"]
          : ["Add experiences in Profile to unlock story prompts", "Use SAR structure"],
    },
    {
      id: "company",
      title: "Company",
      prompt: `What does ${input.company} sell, to whom, and why now?`,
      bullets: [
        "Customer + problem in one sentence",
        "Differentiation vs alternatives",
        "Why this internship team matters to you",
        ...insightBullets,
      ],
    },
    {
      id: "job-description",
      title: "Job Description",
      prompt: `Map the ${input.title} posting to proof points from your profile.`,
      bullets: [
        "Requirement → experience from your library",
        "Gap → honest learning plan",
        "3 questions to ask the interviewer",
        input.profile?.major ? `Connect ${input.profile.major} coursework/projects where relevant` : "Highlight relevant coursework",
      ],
    },
  ];

  return { modules, source: "coach" };
}

export function interviewPrepFactsPayload(input: InterviewPrepInput): string {
  return JSON.stringify(input, null, 2);
}
