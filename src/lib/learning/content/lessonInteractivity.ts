import type { Lesson } from "@/lib/learning/types";
import { articleForLesson } from "@/lib/learning/content/lessonArticles";

/** Interactive depth patches merged onto lessons by id. */
export const LESSON_INTERACTIVITY: Record<
  string,
  Pick<Lesson, "visualId" | "checkpoints" | "depthSections" | "estimatedMinutes">
> = {
  "lesson-weeks-1-3-roadmap": {
    visualId: "roadmap-weeks",
    estimatedMinutes: 8,
    depthSections: [
      {
        heading: "How to schedule it",
        body: "Treat the three tracks as parallel, not sequential. A good week might be: Tuesday 25 min technical skim (one API concept), Thursday 40 min RICE/product sense drill, Sunday 20 min rewriting one past experience as a PM story. Miss a day? Skip shame — resume the next block.",
      },
      {
        heading: "What “done” looks like after 3 weeks",
        body: "You can explain frontend/backend/API in plain language, run a RICE comparison without freezing, tell one non-technical strength story with a decision, and ask two closing questions that sound like you.",
      },
    ],
    checkpoints: [
      {
        id: "cp-roadmap-1",
        prompt: "The Weeks 1–3 plan is best described as:",
        choices: [
          "Only coding practice until you feel “technical enough”",
          "Three parallel tracks: technical literacy, PM cores, and strengths stories",
          "Reading every PM book cover-to-cover before applying",
          "Skipping frameworks until you get an offer",
        ],
        correctIndex: 1,
        explanation:
          "Balance matters — technical fluency, PM judgment, and translating your background should move together.",
      },
      {
        id: "cp-roadmap-2",
        prompt: "Non-technical strengths in this roadmap are framed as:",
        choices: [
          "A consolation prize if you can’t code",
          "Irrelevant for PM recruiting",
          "Differentiators when translated into PM language with proof",
          "Only useful for behavioral interviews at non-tech companies",
        ],
        correctIndex: 2,
        explanation:
          "Domain expertise, customer-facing work, and cross-functional experience are assets — when you show decisions, not slogans.",
      },
    ],
  },
  "lesson-tech-literacy-basics": {
    visualId: "pm-loop",
    estimatedMinutes: 7,
    depthSections: [
      {
        heading: "Fluency vs mastery",
        body: "Fluency means you can follow an eng design review, ask about edge cases, and estimate whether something is a UI tweak vs a multi-service project. Mastery means you could implement it — that is not the bar for most early PM roles.",
      },
    ],
    checkpoints: [
      {
        id: "cp-tech-1",
        prompt: "For most PM internship paths, the technical goal is:",
        choices: [
          "Be as strong as a software engineer on algorithms",
          "Enough fluency to collaborate and pass screens — not a second CS degree",
          "Avoid all technical topics forever",
          "Only learn cloud certifications",
        ],
        correctIndex: 1,
        explanation:
          "You need informed collaboration and screen-pass fluency, not competitive coding as an identity.",
      },
    ],
  },
  "lesson-product-lifecycle": {
    visualId: "lifecycle",
    estimatedMinutes: 7,
    depthSections: [
      {
        heading: "Artifacts by stage",
        body: "Discover → interview notes / problem statements. Define → PRD or one-pager with non-goals. Build → tickets, acceptance criteria, design specs. Launch → rollout plan + metrics. Learn → experiment results or postmortem. The PM’s job is continuity across those handoffs.",
      },
    ],
    checkpoints: [
      {
        id: "cp-life-1",
        prompt: "Shipping a toggle with no success metric is usually a failure of which stage?",
        choices: ["Only Build", "Define / Learn — success wasn’t specified or checked", "Only Launch branding", "Discover interviews"],
        correctIndex: 1,
        explanation:
          "If you never defined success or never measured after launch, Define and Learn were skipped — even if Build “finished.”",
      },
    ],
  },
  "lesson-b2b-b2c-ai": {
    visualId: "b2b-models",
    estimatedMinutes: 8,
    depthSections: [
      {
        heading: "Prioritization shifts",
        body: "B2B often weights admin controls, security, and workflow adoption. B2C weights retention loops and distribution. B2B2C must satisfy the partner’s brand risk and the end user’s delight. AI-native adds eval quality, latency, and cost-per-call as product constraints — not just “cool demos.”",
      },
    ],
    checkpoints: [
      {
        id: "cp-b2b-1",
        prompt: "In classic B2B, which statement is most often true?",
        choices: [
          "Buyer and user are always the same person",
          "Buyer and user can differ — prioritization must serve both",
          "Consumer viral loops always dominate",
          "APIs never matter",
        ],
        correctIndex: 1,
        explanation:
          "Procurement and end users can conflict; strong B2B PMs design for both threads.",
      },
    ],
  },
  "lesson-apis-frontend-backend": {
    visualId: "api-stack",
    estimatedMinutes: 7,
    depthSections: [
      {
        heading: "A PM question checklist",
        body: "What does the user see? What data must persist? Which services talk? What’s the failure UX if the API is down? What’s the latency budget? Who owns the contract? Those questions prevent “just a button” surprises.",
      },
    ],
    checkpoints: [
      {
        id: "cp-api-1",
        prompt: "An API is best described as:",
        choices: [
          "The color palette of the UI",
          "A contract that lets systems exchange data and actions",
          "A marketing landing page",
          "Only a mobile app store listing",
        ],
        correctIndex: 1,
        explanation:
          "APIs define how pieces talk — integrations, platforms, and reliability inherit that contract.",
      },
    ],
  },
  "lesson-rice-moscow": {
    visualId: "rice",
    estimatedMinutes: 8,
    depthSections: [
      {
        heading: "When to use which",
        body: "Use RICE when comparing a list of candidates. Use MoSCoW when locking a release cut line. Always attach a tradeoff sentence: what you optimize and what you defer. Fake precision (Confidence 93%) is worse than an honest “medium.”",
      },
      {
        heading: "Worked micro-example",
        body: "Campus app ideas: push for events (high reach, medium impact, high confidence, medium effort), dark mode (loud ask, lower reach), admin CSV export (low reach, high impact for orgs, high effort). If retention of first-years is the goal, push likely wins — unless enterprise renewal depends on export this quarter.",
      },
    ],
    checkpoints: [
      {
        id: "cp-rice-1",
        prompt: "RICE’s Effort sits in the denominator because:",
        choices: [
          "Harder work should always win",
          "You want more impact per unit of cost",
          "Effort is irrelevant",
          "Only designers estimate effort",
        ],
        correctIndex: 1,
        explanation:
          "You’re comparing bang-for-buck — holding impact constant, lower effort scores higher.",
      },
      {
        id: "cp-rice-2",
        prompt: "MoSCoW’s “Won’t” bucket is useful because it:",
        choices: [
          "Deletes the backlog forever",
          "Makes the release cut explicit so scope doesn’t creep silently",
          "Replaces the need for stakeholders",
          "Only applies to hardware",
        ],
        correctIndex: 1,
        explanation:
          "Won’t (this time) is a commitment device for scope — not a moral judgment on the idea.",
      },
    ],
  },
  "lesson-interview-closing": {
    visualId: "closing-menu",
    estimatedMinutes: 7,
    depthSections: [
      {
        heading: "Say them in your voice",
        body: "Don’t recite a script. Example rewrites: “What would someone need to nail in the first 90 days?” · “Where do new PMs usually stumble on this team?” · “What do your strongest PMs do differently week to week?” · “What keeps you here?” Brave feedback questions (“anything that would raise your confidence / give you pause?”) only if rapport is real.",
      },
    ],
    checkpoints: [
      {
        id: "cp-close-1",
        prompt: "The best closing questions usually prioritize:",
        choices: [
          "Salary bands only",
          "Role success, challenges, team standards — and culture",
          "Whether they liked your outfit",
          "Asking them to re-explain the entire interview",
        ],
        correctIndex: 1,
        explanation:
          "You’re still doing product discovery on the role — success, risk, and fit.",
      },
    ],
  },
  "lesson-what-pm-does": {
    visualId: "pm-loop",
    estimatedMinutes: 7,
    depthSections: [
      {
        heading: "Weekly operating cadence",
        body: "Strong PMs keep a visible thread of: problem under focus, bets in flight, open decisions, and the metric that would change their mind. Meetings are inputs — outcomes are the scoreboard.",
      },
    ],
    checkpoints: [
      {
        id: "cp-pm-1",
        prompt: "A useful weekly PM goal sentence includes:",
        choices: [
          "Only a list of meetings attended",
          "A metric, a user, and a change you’re shipping or validating",
          "A redesign of the org chart",
          "Zero decisions",
        ],
        correctIndex: 1,
        explanation:
          "“Move ___ for ___ users by ___” keeps the job about outcomes.",
      },
    ],
  },
  "lesson-prioritize": {
    visualId: "tradeoff-scale",
    estimatedMinutes: 7,
    depthSections: [
      {
        heading: "Saying no without burning trust",
        body: "Name the goal you’re optimizing, show the comparison, offer a partial/time-boxed alternative when honest, and write the decision down. Silence is what creates shadow roadmaps.",
      },
    ],
    checkpoints: [
      {
        id: "cp-prio-1",
        prompt: "Prioritization is mainly:",
        choices: [
          "Sequenced saying-no with visible tradeoffs",
          "Doing whatever the loudest person wants",
          "Avoiding frameworks entirely",
          "Shipping everything smaller",
        ],
        correctIndex: 0,
        explanation:
          "Order implies refusal — the craft is making that refusal legible and fair.",
      },
    ],
  },
};

export function applyLessonInteractivity(lesson: Lesson): Lesson {
  const patch = LESSON_INTERACTIVITY[lesson.id];
  const merged: Lesson = patch ? { ...lesson, ...patch } : { ...lesson };
  const article = articleForLesson(merged);
  const minutesFromArticle = Math.min(18, Math.max(merged.estimatedMinutes, 8 + Math.floor(article.length / 2)));
  return {
    ...merged,
    article,
    estimatedMinutes: Math.max(merged.estimatedMinutes, minutesFromArticle),
  };
}
