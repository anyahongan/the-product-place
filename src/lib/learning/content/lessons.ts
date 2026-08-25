import type { Lesson } from "@/lib/learning/types";
import { applyLessonInteractivity } from "@/lib/learning/content/lessonInteractivity";
import { ENRICHMENT_LESSONS } from "@/lib/learning/content/lessonsEnrichment";

/**
 * Original Product Place curriculum.
 * Source refs acknowledge conceptual inspiration only — no chapter/page invention.
 */
const BASE_LESSONS: Lesson[] = [
  {
    id: "lesson-what-pm-does",
    slug: "what-does-a-pm-actually-do",
    title: "What Does a PM Actually Do?",
    groupId: "foundations",
    competencies: ["role-of-pm", "decision-making"],
    estimatedMinutes: 5,
    idea:
      "A PM owns outcomes, not a job title checklist. You decide what to build next, why it matters, and how you'll know it worked — then you help a team ship it.",
    whyPmsCare:
      "Recruiters, engineers, and designers all expect different things from “PM.” If you can't explain your job in decisions, you'll get pulled into project management theater.",
    howToThink:
      "Frame every week as three questions: What user problem are we solving? What are we choosing not to do? What signal tells us we moved the needle?",
    example:
      "At a fictional campus meal app, the PM doesn't “run sprints.” They choose whether to fix checkout drop-off or add a new restaurant filter — because retention is slipping among first-years.",
    watchOut:
      "Confusing activity with progress: standing up tickets, writing docs, and attending meetings while the core metric never moves.",
    tryIt:
      "Write one sentence: “This week I will move ___ for ___ users by shipping ___.” If you can't fill the blanks, you don't have a PM goal yet.",
    relatedPracticeIds: ["pq-behavioral-influence", "pq-sense-campus-events"],
    relatedLessonIds: ["lesson-user-problem", "lesson-prioritize"],
    relatedCreateTemplateIds: ["feature-proposal"],
    sourceRefs: [
      {
        title: "Product Management in Practice",
        author: "Matt LeMay",
        topic: "What product managers actually do",
        chapter: null,
      },
    ],
  },
  {
    id: "lesson-user-problem",
    slug: "start-with-the-user-problem",
    title: "Start With the User Problem",
    groupId: "foundations",
    competencies: ["user-problems", "product-discovery", "pain-points"],
    estimatedMinutes: 5,
    idea:
      "Features are guesses. Problems are the durable unit. A good problem statement names who struggles, when, and what fails today — without sneaking in your solution.",
    whyPmsCare:
      "Teams argue about solutions when they haven't agreed on the problem. Interviews and roadmaps both go sideways without a shared problem frame.",
    howToThink:
      "Use: When [situation], [user] wants to [job], but [obstacle], which causes [impact]. Strip adjectives that smuggle features (“easy one-tap sharing”).",
    example:
      "Weak: “Students need a better calendar.” Stronger: “When clubs post events across five apps, first-year students miss campus events they would have attended, so they feel disconnected in week three.”",
    watchOut:
      "Problem statements that are secretly solution statements — or so broad (“engagement is low”) that any feature can claim victory.",
    tryIt:
      "Rewrite a feature idea you like as a problem-only statement. If a stranger couldn't invent three different solutions, sharpen it.",
    relatedPracticeIds: ["pq-sense-campus-events", "pq-sense-food-cancel"],
    relatedLessonIds: ["lesson-segmentation", "lesson-product-sense"],
    relatedCreateTemplateIds: ["feature-proposal", "product-teardown"],
    sourceRefs: [
      {
        title: "Product Management in Practice",
        author: "Matt LeMay",
        topic: "Working from user problems",
        chapter: null,
      },
    ],
  },
  {
    id: "lesson-segmentation",
    slug: "user-segmentation",
    title: "User Segmentation",
    groupId: "product-sense",
    competencies: ["user-segmentation", "pain-points"],
    estimatedMinutes: 5,
    idea:
      "“Users” is not a user. Segmentation picks a slice where the pain, behavior, and willingness to change are similar enough to design for.",
    whyPmsCare:
      "Average metrics hide who is hurting. A feature that delights power users can confuse newcomers — and vice versa.",
    howToThink:
      "Segment on behavior and context first (new vs returning, high vs low frequency, constrained vs flexible time), not just demographics.",
    example:
      "A note-taking app's “export” request comes mostly from grad students finishing theses — not from casual journalers. Shipping a prettier editor won't help them.",
    watchOut:
      "Inventing personas from vibes (“Sarah, 22, loves aesthetics”) with no behavioral evidence.",
    tryIt:
      "Pick any consumer app. Name two segments that would want opposite things from the next release. What metric would each care about?",
    relatedPracticeIds: ["pq-sense-campus-events", "pq-sense-spotify-drop"],
    relatedLessonIds: ["lesson-user-problem", "lesson-product-sense"],
    relatedCreateTemplateIds: ["feature-proposal", "product-teardown"],
  },
  {
    id: "lesson-prioritize",
    slug: "prioritizing-what-to-build",
    title: "Prioritizing What to Build",
    groupId: "foundations",
    competencies: ["prioritization", "tradeoffs", "saying-no"],
    estimatedMinutes: 5,
    idea:
      "Prioritization is sequenced saying-no. You compare options on impact, confidence, and cost — then commit to an order people can plan around.",
    whyPmsCare:
      "Without an explicit order, the loudest stakeholder wins and the roadmap becomes a parking lot of half-promises.",
    howToThink:
      "Score candidates on: expected user/business impact, confidence in the evidence, and engineering/design cost. Force a stack rank — ties are decisions you haven't made.",
    example:
      "Three asks: dark mode, faster search, and a partner integration. Search has clear funnel evidence; dark mode is loud on Twitter; the partner pays next quarter. You ship search first and time-box the partner spike.",
    watchOut:
      "Framework theater (RICE filled with fake numbers) that never changes what you would have built anyway.",
    tryIt:
      "List three real backlog ideas. Rank them in 90 seconds without a spreadsheet. Write one sentence explaining why #3 waits.",
    relatedPracticeIds: ["pq-strategy-roadmap-conflict", "pq-behavioral-saying-no"],
    relatedLessonIds: ["lesson-what-pm-does", "lesson-strategy-tradeoffs"],
    relatedCreateTemplateIds: ["feature-proposal", "zero-to-one"],
    sourceRefs: [
      {
        title: "Cracking the PM Interview",
        author: "Gayle Laakmann McDowell & Jackie Bavaro",
        topic: "Prioritization and tradeoffs",
        chapter: null,
      },
    ],
  },
  {
    id: "lesson-product-sense",
    slug: "product-sense-problem-to-solution",
    title: "Product Sense: From Problem to Solution",
    groupId: "product-sense",
    competencies: ["feature-ideation", "tradeoffs", "product-critique", "zero-to-one"],
    estimatedMinutes: 6,
    idea:
      "Product sense is a repeatable path: clarify goal → choose user → diagnose pain → generate options → pick with tradeoffs → define success.",
    whyPmsCare:
      "Interviews and real work both punish jumping to UI. Structure is how you stay useful under ambiguity.",
    howToThink:
      "Narrate your path out loud. Prefer 2–3 sharp options over ten shallow ones. Explicitly discard ideas that don't serve the chosen user.",
    example:
      "Prompt: improve onboarding for a budgeting app. You pick first-job users who abandon after linking a bank. Options: progressive linking, sample data mode, or human setup chat. You choose sample data because it unblocks value before trust friction.",
    watchOut:
      "Listing features as “brainstorming” without a user or a success metric — then defending the prettiest one.",
    tryIt:
      "Take any “design a feature for X” prompt. Write only the goal, user, and three options — stop before screens.",
    relatedPracticeIds: ["pq-sense-campus-events", "pq-sense-design-habit", "pq-design-collab-onboarding"],
    relatedLessonIds: ["lesson-user-problem", "lesson-segmentation"],
    relatedCreateTemplateIds: ["feature-proposal", "zero-to-one"],
    sourceRefs: [
      {
        title: "Cracking the PM Interview",
        author: "Gayle Laakmann McDowell & Jackie Bavaro",
        topic: "Product design / product sense interview structure",
        chapter: null,
      },
    ],
  },
  {
    id: "lesson-choose-metrics",
    slug: "choosing-product-metrics",
    title: "Choosing Product Metrics",
    groupId: "execution-metrics",
    competencies: ["goals", "north-star-metrics", "launch-metrics"],
    estimatedMinutes: 5,
    idea:
      "A metric is a bet about what “better” means. Pick one primary outcome, a few inputs you can influence, and guardrails that catch damage.",
    whyPmsCare:
      "If success is undefined, every launch is a storytelling contest. Metrics make disagreements concrete.",
    howToThink:
      "North star ≈ long-term value created. Input metrics ≈ levers. Guardrails ≈ trust, quality, cost. Avoid vanity counts that rise when the product gets worse.",
    example:
      "For a flashcard app, north star might be cards reviewed with retention — not downloads. Guardrail: time-to-first-review shouldn't get slower.",
    watchOut:
      "Optimizing a proxy (clicks, DAU) that diverges from the user outcome you actually care about.",
    tryIt:
      "For a product you use, name one north star, two inputs, and one guardrail. Cross out any metric you couldn't explain to an engineer in one sentence.",
    relatedPracticeIds: ["pq-exec-metric-drop", "pq-exec-choose-north-star"],
    relatedLessonIds: ["lesson-metric-tree", "lesson-diagnose-drop"],
    relatedCreateTemplateIds: ["experiment-plan", "prd"],
    sourceRefs: [
      {
        title: "Cracking the PM Interview",
        author: "Gayle Laakmann McDowell & Jackie Bavaro",
        topic: "Metrics and analytical thinking",
        chapter: null,
      },
    ],
  },
  {
    id: "lesson-metric-tree",
    slug: "building-a-metric-tree",
    title: "Building a Metric Tree",
    groupId: "execution-metrics",
    competencies: ["metric-trees", "funnels", "diagnosing-metrics"],
    estimatedMinutes: 5,
    idea:
      "A metric tree decomposes an outcome into parts you can investigate. It turns “revenue is down” into a map of where to look first.",
    whyPmsCare:
      "Without a tree, teams thrash: every stakeholder brings a pet chart and no shared diagnosis path.",
    howToThink:
      "Start from the outcome. Split into multiplicative or additive drivers (users × conversion × value). Stop when a leaf is actionable by a team.",
    example:
      "Weekly active students → new + returning. Returning → opened app × completed a study session. Completed session → started session × finish rate.",
    watchOut:
      "Trees that are org charts in disguise (“marketing metric,” “eng metric”) instead of causal product drivers.",
    tryIt:
      "Draw a 2-level tree for “weekly active users” of a product you know. Mark which leaf you'd check first if WAUs fell 10%.",
    relatedPracticeIds: ["pq-exec-metric-drop", "pq-exec-spotify-hours"],
    relatedLessonIds: ["lesson-choose-metrics", "lesson-diagnose-drop"],
    relatedCreateTemplateIds: ["experiment-plan"],
  },
  {
    id: "lesson-diagnose-drop",
    slug: "diagnosing-a-metric-drop",
    title: "Diagnosing a Metric Drop",
    groupId: "execution-metrics",
    competencies: ["diagnosing-metrics", "funnels", "decision-making"],
    estimatedMinutes: 6,
    idea:
      "Diagnosis is ordered curiosity: confirm the drop is real, localize where, segment who, check changes, then form hypotheses before “fixing.”",
    whyPmsCare:
      "Jumping to solutions wastes weeks. Interviewers and execs both listen for whether you can separate signal from noise.",
    howToThink:
      "Checklist: data quality → time window → funnel step → platform/geo/segment → recent launches → external events → hypotheses ranked by likelihood × impact.",
    example:
      "Listening hours fell 12%. You verify logging, then see mobile iOS finish rate dipped after a player redesign — Android flat. Hypothesis: autoplay regression on iOS.",
    watchOut:
      "Declaring root cause from one chart, or blaming seasonality without checking whether the same week last year looked alike.",
    tryIt:
      "Invent a 15% drop in signup completion. Write the first five checks you'd run before proposing a feature.",
    relatedPracticeIds: ["pq-exec-spotify-hours", "pq-exec-food-cancel", "pq-exec-metric-drop"],
    relatedLessonIds: ["lesson-metric-tree", "lesson-choose-metrics"],
    relatedCreateTemplateIds: ["experiment-plan"],
    sourceRefs: [
      {
        title: "Cracking the PM Interview",
        author: "Gayle Laakmann McDowell & Jackie Bavaro",
        topic: "Execution and metrics diagnosis",
        chapter: null,
      },
    ],
  },
  {
    id: "lesson-eng-design",
    slug: "working-with-engineering-and-design",
    title: "Working With Engineering and Design",
    groupId: "pm-in-practice",
    competencies: ["working-with-engineering", "working-with-design", "ambiguity"],
    estimatedMinutes: 5,
    idea:
      "You don't manage designers or engineers — you create shared clarity: problem, constraints, success, and decision rights.",
    whyPmsCare:
      "Trust compounds when you bring crisp problems and respect craft. Trust dies when you hand over half-baked UI and call it a “PRD.”",
    howToThink:
      "With design: align on user + jobs before pixels. With eng: align on constraints, edge cases, and what “done” means. Bring options, not decrees.",
    example:
      "Instead of “make the button blue,” you bring two flows that solve bank-link drop-off and ask design which reduces anxiety better — then ask eng for cost of each.",
    watchOut:
      "Being the “ticket writer” or the “HiPPO messenger” instead of a thinking partner.",
    tryIt:
      "Rewrite a vague ask (“improve onboarding”) into a one-pager: user, problem, constraints, success metric, open questions.",
    relatedPracticeIds: ["pq-design-collab-onboarding", "pq-behavioral-disagreement"],
    relatedLessonIds: ["lesson-user-problem", "lesson-stakeholders"],
    relatedCreateTemplateIds: ["prd", "feature-proposal"],
    sourceRefs: [
      {
        title: "Product Management in Practice",
        author: "Matt LeMay",
        topic: "Collaboration with design and engineering",
        chapter: null,
      },
    ],
  },
  {
    id: "lesson-stakeholders",
    slug: "managing-stakeholders-without-authority",
    title: "Managing Stakeholders Without Authority",
    groupId: "pm-in-practice",
    competencies: [
      "stakeholder-management",
      "influence-without-authority",
      "executive-communication",
      "saying-no",
    ],
    estimatedMinutes: 5,
    idea:
      "Influence is translating goals. Find what each stakeholder optimizes for, connect your proposal to it, and make tradeoffs visible.",
    whyPmsCare:
      "PMs rarely own headcount. Progress depends on persuasion, clarity, and follow-through — not title power.",
    howToThink:
      "Map: who cares, what they fear, what evidence moves them. Separate “must respond” from “nice to include.” Document decisions.",
    example:
      "Sales wants a custom report for one prospect. You show the opportunity size vs. two roadmap items that unblock ten customers — and offer a lightweight CSV export this quarter.",
    watchOut:
      "Avoiding conflict until the week before launch, or saying yes to everyone and failing quietly.",
    tryIt:
      "Pick a recent disagreement. Write the other person's goal in one sentence you believe they'd agree with.",
    relatedPracticeIds: ["pq-behavioral-influence", "pq-behavioral-saying-no", "pq-strategy-roadmap-conflict"],
    relatedLessonIds: ["lesson-eng-design", "lesson-prioritize"],
    relatedCreateTemplateIds: ["feature-proposal"],
    sourceRefs: [
      {
        title: "Product Management in Practice",
        author: "Matt LeMay",
        topic: "Stakeholder management and influence",
        chapter: null,
      },
    ],
  },
  {
    id: "lesson-strategy-tradeoffs",
    slug: "product-strategy-and-tradeoffs",
    title: "Product Strategy and Tradeoffs",
    groupId: "strategy",
    competencies: ["market-understanding", "positioning", "business-tradeoffs", "growth"],
    estimatedMinutes: 6,
    idea:
      "Strategy is choosing where to win and what to ignore. Tradeoffs make the strategy real — otherwise it's a slogan.",
    whyPmsCare:
      "Without strategy, prioritization is vibes and competitive response is panic. Interviews probe whether you can pick a lane.",
    howToThink:
      "State the bet: target user, value proposition, why now, and what you will under-invest in. Check coherence with metrics and roadmap.",
    example:
      "A student productivity app bets on “exam season intensity” rather than year-round journaling. That means seasonal campaigns and study-mode features — not lifestyle branding.",
    watchOut:
      "Strategies that try to serve everyone, or tradeoffs you reverse the first time a stakeholder complains.",
    tryIt:
      "Write a 4-line strategy for a product you like: who, why us, why now, what we won't do.",
    relatedPracticeIds: ["pq-strategy-enter-market", "pq-strategy-competitor"],
    relatedLessonIds: ["lesson-prioritize", "lesson-choose-metrics"],
    relatedCreateTemplateIds: ["zero-to-one", "product-teardown"],
    sourceRefs: [
      {
        title: "Cracking the PM Interview",
        author: "Gayle Laakmann McDowell & Jackie Bavaro",
        topic: "Product strategy questions",
        chapter: null,
      },
    ],
  },
  {
    id: "lesson-experimentation",
    slug: "experimentation-and-launch-decisions",
    title: "Experimentation and Launch Decisions",
    groupId: "execution-metrics",
    competencies: ["experimentation", "launch-metrics", "decision-making"],
    estimatedMinutes: 5,
    idea:
      "Experiments are decisions with a pre-committed rule. A launch without a hypothesis is just a release.",
    whyPmsCare:
      "Shipping is expensive. Experiments reduce the cost of being wrong — if you define success before peeking at results.",
    howToThink:
      "Hypothesis → primary metric → guardrails → sample/exposure → decision rule (ship / iterate / kill). Don't change the rule mid-flight.",
    example:
      "Hypothesis: showing estimated delivery before checkout raises completed orders without increasing cancellations. Guardrail: support tickets per order.",
    watchOut:
      "Calling every A/B a “learning” while shipping whichever variant the VP liked — or peeking daily until significance appears.",
    tryIt:
      "Write a one-paragraph experiment for a change you'd make to an app you use. Include the kill criteria.",
    relatedPracticeIds: ["pq-exec-experiment", "pq-exec-metric-drop"],
    relatedLessonIds: ["lesson-choose-metrics", "lesson-diagnose-drop"],
    relatedCreateTemplateIds: ["experiment-plan"],
  },
];

export const LESSONS: Lesson[] = [...BASE_LESSONS, ...ENRICHMENT_LESSONS].map(applyLessonInteractivity);

export const LESSONS_BY_ID = Object.fromEntries(LESSONS.map((l) => [l.id, l])) as Record<
  string,
  Lesson
>;
