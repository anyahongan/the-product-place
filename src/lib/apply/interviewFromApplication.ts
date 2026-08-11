import type { ApplicationRecord } from "@/lib/apply/types";
import type { InterviewItem, PrepModule, ProgressStage } from "@/types/apply";
import { PLACEHOLDER_CONTACTS } from "@/lib/apply/placeholderContacts";

function staticModules(company: string, title: string): PrepModule[] {
  return [
    {
      id: "product-sense",
      title: "Product Sense",
      prompt: `How would you improve a core experience related to ${title} at ${company}?`,
      bullets: [
        "Clarify the user and the job-to-be-done",
        "Name the metric you would move",
        "Propose 2–3 solutions with tradeoffs",
        "Static sample content — replace later with tailored prep",
      ],
    },
    {
      id: "execution",
      title: "Execution & Metrics",
      prompt: `A key funnel metric for ${company} dropped 12% week over week. How do you investigate?`,
      bullets: [
        "Segment before concluding",
        "Separate instrumentation vs real change",
        "Propose a next experiment",
      ],
    },
    {
      id: "behavioral",
      title: "Behavioral",
      prompt: "Tell a story about a product decision you owned under ambiguity.",
      bullets: [
        "Situation → decision → outcome",
        "What you would do differently",
        "Keep it specific to product work",
      ],
    },
    {
      id: "company",
      title: "Company",
      prompt: `What does ${company} sell, to whom, and why now?`,
      bullets: [
        "Customer and problem",
        "Differentiation hypothesis",
        "Why this internship role matters",
      ],
    },
    {
      id: "job-description",
      title: "Job Description",
      prompt: `Map the ${title} posting to 3 stories you can tell.`,
      bullets: [
        "Requirement → proof point",
        "Gap → learning plan",
        "Questions to ask the interviewer",
      ],
    },
  ];
}

function toProgressStage(status: ApplicationRecord["currentStatus"]): ProgressStage {
  switch (status) {
    case "Recruiter Screen":
      return "Recruiter Screen";
    case "Interviewing":
      return "Interview";
    case "Final Round":
      return "Final";
    case "Offer":
      return "Offer";
    default:
      return "Submitted";
  }
}

export function applicationToInterviewItem(app: ApplicationRecord): InterviewItem {
  return {
    id: `int-${app.applicationId}`,
    applicationId: app.applicationId,
    company: app.company,
    role: app.title,
    stage: app.currentStatus,
    datetime: app.statusHistory.at(-1)?.timestamp ?? new Date().toISOString(),
    progressStage: toProgressStage(app.currentStatus),
    tone: app.tone === "purple" ? "blue" : app.tone,
    modules: staticModules(app.company, app.title),
  };
}

export function applicationContacts() {
  return PLACEHOLDER_CONTACTS;
}
