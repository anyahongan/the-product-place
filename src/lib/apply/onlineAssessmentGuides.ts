import type { PracticeCategory } from "@/lib/learning/types";
import { PRACTICE_CATEGORY_LABELS } from "@/lib/learning/types";

const LEGACY_CATEGORY_ALIASES: Record<string, PracticeCategory> = {
  execution: "execution-metrics",
};

export function normalizePracticeCategory(
  category: string | undefined,
): PracticeCategory | "all" {
  if (!category || category === "all") return "all";
  if (category in LEGACY_CATEGORY_ALIASES) return LEGACY_CATEGORY_ALIASES[category];
  if (category in PRACTICE_CATEGORY_LABELS) return category as PracticeCategory;
  return "all";
}

export type OnlineAssessmentSource = {
  label: string;
  url: string;
};

export type OnlineAssessmentGuide = {
  oaType: string;
  summary: string;
  expectations: string[];
  prepTips: string[];
  practiceCategory: PracticeCategory;
  practiceQuery: string;
  sources: OnlineAssessmentSource[];
};

function normCompany(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const GUIDES: Record<string, OnlineAssessmentGuide> = {
  robinhood: {
    oaType: "Product + analytical reasoning",
    summary:
      "Robinhood’s product online assessments typically blend product judgment, metrics intuition, and structured reasoning under time pressure. Expect scenario questions about prioritization, user trust, and regulated fintech tradeoffs — not pure LeetCode. Candidates often report a timed multiple-choice or case-style section followed by short written responses. Treat it like a product sense + execution screen: clarify the user, name constraints, and explain tradeoffs plainly.",
    expectations: [
      "Timed multiple-choice or short-answer product scenarios",
      "Metrics and prioritization under ambiguity",
      "Fintech/regulatory awareness when relevant to the prompt",
      "Clear written communication — no jargon without explanation",
    ],
    prepTips: [
      "Practice structuring answers: user → problem → options → recommendation → metric.",
      "Review how Robinhood monetizes and where trust/regulation show up in product calls.",
      "Run one timed drill the day before so pacing feels familiar.",
    ],
    practiceCategory: "execution-metrics",
    practiceQuery: "metrics prioritization fintech",
    sources: [
      {
        label: "Glassdoor — Robinhood interview questions",
        url: "https://www.glassdoor.com/Interview/Robinhood-Interview-Questions-E795851.htm",
      },
      {
        label: "Reddit search — Robinhood PM OA",
        url: "https://www.reddit.com/search/?q=robinhood%20product%20online%20assessment",
      },
      {
        label: "Robinhood careers",
        url: "https://careers.robinhood.com/",
      },
    ],
  },
  google: {
    oaType: "Product sense + analytical / case",
    summary:
      "Google product intern OAs often emphasize structured product thinking, estimation, and user-centric reasoning. Community reports vary by team, but common themes include improving a Google product, diagnosing a metric change, and explaining tradeoffs at scale. Communication clarity matters as much as the ‘right’ idea — interviewers want to see how you decompose ambiguous problems.",
    expectations: [
      "Product improvement or design prompts tied to real Google surfaces",
      "Metric diagnosis and experiment thinking",
      "Estimation or ‘how would you measure success’ follow-ups",
      "Concise written or multiple-choice responses",
    ],
    prepTips: [
      "Pick one Google product and prepare a crisp improvement narrative with metrics.",
      "Practice ‘metric moved X — what do you check?’ trees out loud.",
      "Use headings or numbered steps in written answers when allowed.",
    ],
    practiceCategory: "product-sense",
    practiceQuery: "google product improvement metrics",
    sources: [
      {
        label: "Glassdoor — Google APM/PM interviews",
        url: "https://www.glassdoor.com/Interview/Google-Product-Manager-Interview-Questions-E9079.htm",
      },
      {
        label: "Reddit search — Google PM intern OA",
        url: "https://www.reddit.com/search/?q=google%20apm%20online%20assessment",
      },
      {
        label: "Google careers — students",
        url: "https://careers.google.com/students/",
      },
    ],
  },
  meta: {
    oaType: "Product judgment + execution",
    summary:
      "Meta product assessments frequently test product sense, prioritization, and execution instincts at social scale. Candidates describe scenario questions about engagement, integrity/safety, and growth levers. Expect to move quickly — partial credit often goes to structured thinking even when you lack domain detail.",
    expectations: [
      "Product tradeoffs at scale (growth vs. trust vs. revenue)",
      "Short case or multiple-choice product scenarios",
      "Clear success metrics and guardrails",
    ],
    prepTips: [
      "Frame answers with user segments and north-star vs. guardrail metrics.",
      "Prepare one example of a integrity/safety tradeoff you can discuss calmly.",
      "Practice 8–10 minute product sense prompts with a timer.",
    ],
    practiceCategory: "product-sense",
    practiceQuery: "social product tradeoffs metrics",
    sources: [
      {
        label: "Glassdoor — Meta PM interviews",
        url: "https://www.glassdoor.com/Interview/Meta-Product-Manager-Interview-Questions-E115263.htm",
      },
      {
        label: "Reddit search — Meta PM OA",
        url: "https://www.reddit.com/search/?q=meta%20product%20manager%20online%20assessment",
      },
      {
        label: "Meta careers",
        url: "https://www.metacareers.com/students",
      },
    ],
  },
  amazon: {
    oaType: "Leadership principles + product/analytical",
    summary:
      "Amazon assessments often weave Leadership Principles into product and execution questions. Intern pipelines may include work-style assessments plus analytical items. Written answers should show customer obsession, ownership, and bias for action — backed by concise examples or structured reasoning rather than buzzwords.",
    expectations: [
      "Work-style / LP-aligned situational questions",
      "Analytical or product prioritization items",
      "Customer-backwards framing",
    ],
    prepTips: [
      "Map 3–4 STAR stories to LPs before the OA window opens.",
      "Lead with the customer problem before proposing solutions.",
      "Use bullet structure when the platform allows free text.",
    ],
    practiceCategory: "behavioral",
    practiceQuery: "leadership principles product prioritization",
    sources: [
      {
        label: "Glassdoor — Amazon PM interviews",
        url: "https://www.glassdoor.com/Interview/Amazon-Product-Manager-Interview-Questions-E6036.htm",
      },
      {
        label: "Reddit search — Amazon PM intern assessment",
        url: "https://www.reddit.com/search/?q=amazon%20product%20intern%20online%20assessment",
      },
      {
        label: "Amazon jobs — students",
        url: "https://www.amazon.jobs/en/teams/internships-for-students",
      },
    ],
  },
};

const GENERIC: OnlineAssessmentGuide = {
  oaType: "Product online assessment",
  summary:
    "Most product online assessments combine timed product scenarios, metrics reasoning, and short written responses. You will usually see prompts about improving a feature, diagnosing a metric change, or prioritizing a backlog under constraints. Read every question twice, note assumptions you are making, and answer in a visible structure (user → problem → options → recommendation → how you would measure success). If the portal feels opaque, that is normal — focus on clarity and tradeoffs rather than guessing a single ‘correct’ product answer.",
  expectations: [
    "Timed product scenario or multiple-choice section",
    "Short written responses with limited word counts",
    "Metrics, prioritization, or tradeoff prompts",
    "Possibly a work-style or situational questionnaire",
  ],
  prepTips: [
    "Run two timed practice prompts the day before (product sense + metrics).",
    "Keep a scratch template: goal, users, options, pick, metric, risks.",
    "Submit early enough to avoid last-minute portal issues.",
  ],
  practiceCategory: "execution-metrics",
  practiceQuery: "online assessment product metrics",
  sources: [
    {
      label: "Reddit search — PM intern online assessment",
      url: "https://www.reddit.com/search/?q=product%20manager%20intern%20online%20assessment",
    },
    {
      label: "Glassdoor — PM interview questions (general)",
      url: "https://www.glassdoor.com/Interview/product-manager-interview-questions-SRCH_KO0,16.htm",
    },
  ],
};

export function getOnlineAssessmentGuide(company: string): OnlineAssessmentGuide {
  const key = normCompany(company);
  for (const [id, guide] of Object.entries(GUIDES)) {
    if (key.includes(id)) return guide;
  }
  return {
    ...GENERIC,
    summary: GENERIC.summary.replace("Most product", `${company}’s product`),
  };
}

export function practiceLinkForGuide(company: string): string {
  const params = new URLSearchParams({
    mode: "oa",
    company,
    oa: "1",
  });
  return `/practice?${params.toString()}`;
}
