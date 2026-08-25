/**
 * Compact original PM glossary — definitions are Product Place originals.
 */

export type GlossaryTerm = {
  id: string;
  term: string;
  definition: string;
  relatedLessonIds: string[];
};

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: "user-story",
    term: "User story",
    definition:
      "A short requirement from a user’s perspective: who needs what, and why. Classic shape: “As a [user], I want [capability] so that [outcome].” Good stories stay testable and avoid sneaking in UI specs.",
    relatedLessonIds: ["lesson-okrs-jtbd", "lesson-user-problem"],
  },
  {
    id: "rice",
    term: "RICE",
    definition:
      "A prioritization score using Reach, Impact, Confidence, and Effort. Useful for comparing options — dangerous when the inputs are invented to justify a pre-chosen favorite.",
    relatedLessonIds: ["lesson-rice-moscow", "lesson-prioritize"],
  },
  {
    id: "moscow",
    term: "MoSCoW",
    definition:
      "A scope method that labels work Must / Should / Could / Won’t (this time). Forces an explicit cut line so “nice to have” doesn’t silently become the release.",
    relatedLessonIds: ["lesson-rice-moscow", "lesson-prioritize"],
  },
  {
    id: "b2b",
    term: "B2B",
    definition:
      "Business-to-business: you sell to organizations. Buying cycles are longer, stakeholders multiply, and success often means workflow adoption — not just downloads.",
    relatedLessonIds: ["lesson-b2b-b2c-ai"],
  },
  {
    id: "b2c",
    term: "B2C",
    definition:
      "Business-to-consumer: individuals are the buyers/users. Feedback loops can be faster; distribution, retention, and habit often dominate.",
    relatedLessonIds: ["lesson-b2b-b2c-ai"],
  },
  {
    id: "b2b2c",
    term: "B2B2C",
    definition:
      "You sell through a business that reaches end consumers (e.g., a bank offering your product to its customers). You juggle two “customers”: the partner org and the end user.",
    relatedLessonIds: ["lesson-b2b-b2c-ai"],
  },
  {
    id: "prd",
    term: "PRD",
    definition:
      "Product requirements document: a shared record of problem, goals, non-goals, users, requirements, and open questions. Formats vary — clarity beats template worship.",
    relatedLessonIds: ["lesson-eng-design", "lesson-what-pm-does"],
  },
  {
    id: "tradeoff",
    term: "Tradeoff",
    definition:
      "An explicit choice where gaining one outcome means giving up another (speed vs quality, breadth vs depth, short-term growth vs trust). PMs earn trust by naming tradeoffs out loud.",
    relatedLessonIds: ["lesson-prioritize", "lesson-strategy-tradeoffs"],
  },
  {
    id: "entry-point",
    term: "Entry point",
    definition:
      "Where and how a user first encounters value — a landing page, invite, search result, or in-product CTA. Weak entry points make strong features feel invisible.",
    relatedLessonIds: ["lesson-product-sense", "lesson-segmentation"],
  },
  {
    id: "ab-test",
    term: "A/B test",
    definition:
      "An experiment that randomly shows variants to comparable users and measures outcomes. Useful when you pre-commit a decision rule; useless when you peek until the preferred variant “wins.”",
    relatedLessonIds: ["lesson-experimentation", "lesson-choose-metrics"],
  },
  {
    id: "scalability",
    term: "Scalability",
    definition:
      "Whether a system (product, process, or architecture) can handle more users, data, or complexity without collapsing cost or quality. PMs trade scalability against shipping speed constantly.",
    relatedLessonIds: ["lesson-apis-frontend-backend", "lesson-tech-literacy-basics"],
  },
  {
    id: "pmf",
    term: "Product-market fit",
    definition:
      "Evidence that a defined market eagerly wants your product enough to use, pay, or recommend it. Not a single metric — a pattern of retention, demand, and willingness to endure rough edges.",
    relatedLessonIds: ["lesson-strategy-tradeoffs", "lesson-product-sense"],
  },
  {
    id: "api",
    term: "API",
    definition:
      "Application Programming Interface: a contract that lets systems talk. PMs care because APIs shape integrations, platform bets, and what “simple” means for partners and clients.",
    relatedLessonIds: ["lesson-apis-frontend-backend", "lesson-reading-tech-docs"],
  },
  {
    id: "okrs",
    term: "OKRs",
    definition:
      "Objectives and Key Results: a qualitative objective paired with measurable results. Helpful for alignment; harmful when every task is force-fitted into fake numbers.",
    relatedLessonIds: ["lesson-okrs-jtbd", "lesson-choose-metrics"],
  },
  {
    id: "jtbd",
    term: "JTBD (Jobs to be Done)",
    definition:
      "A lens that asks what “job” a person hires a product to do in a situation. Shifts conversation from feature lists to progress the user is trying to make.",
    relatedLessonIds: ["lesson-okrs-jtbd", "lesson-user-problem"],
  },
];
