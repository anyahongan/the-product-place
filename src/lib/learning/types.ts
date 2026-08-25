import type { CompetencyGroupId, CompetencyId } from "@/lib/learning/competencies";

/** Conceptual reference only — never invent chapter/page numbers. */
export type SourceRef = {
  title: string;
  author: string;
  topic: string;
  chapter?: string | null;
  page?: string | null;
};

export type ExternalResource = {
  label: string;
  url: string;
  note?: string;
};

export type LessonCheckpoint = {
  id: string;
  prompt: string;
  choices: [string, string, string, string] | [string, string, string] | [string, string];
  correctIndex: number;
  explanation: string;
};

export type LessonVisualId =
  | "lifecycle"
  | "rice"
  | "b2b-models"
  | "api-stack"
  | "roadmap-weeks"
  | "tradeoff-scale"
  | "closing-menu"
  | "pm-loop"
  | "funnel"
  | "metric-tree"
  | "stakeholder-map"
  | "okr-cascade"
  | "jtbd-lens"
  | "experiment-flow"
  | "problem-frame"
  | "discovery-loop"
  | "eng-collab"
  | "decision-log";

/** Ordered blocks for article-style lesson rendering. */
export type LessonArticleBlock =
  | { type: "heading"; text: string }
  | { type: "p"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "steps"; items: Array<{ label: string; detail: string }> }
  | { type: "callout"; tone: "note" | "trap" | "framework"; title: string; body: string }
  | { type: "quote"; text: string }
  | { type: "figure"; visualId: LessonVisualId }
  | { type: "compare"; left: { title: string; body: string }; right: { title: string; body: string } };

export type Lesson = {
  id: string;
  slug: string;
  title: string;
  groupId: CompetencyGroupId;
  competencies: CompetencyId[];
  estimatedMinutes: number;
  idea: string;
  whyPmsCare: string;
  howToThink: string;
  example: string;
  watchOut: string;
  tryIt: string;
  /** Optional bullet takeaways shown after the core blocks. */
  keyTakeaways?: string[];
  /** Extra in-depth sections */
  depthSections?: Array<{ heading: string; body: string }>;
  /** Dense article body — when present, LessonReader prefers this layout. */
  article?: LessonArticleBlock[];
  visualId?: LessonVisualId;
  checkpoints?: LessonCheckpoint[];
  relatedPracticeIds: string[];
  relatedLessonIds: string[];
  relatedCreateTemplateIds: string[];
  externalResources?: ExternalResource[];
  sourceRefs?: SourceRef[];
};

export type PracticeDifficulty = "warmup" | "standard" | "stretch";

export type PracticeCategory =
  | "product-sense"
  | "execution-metrics"
  | "strategy"
  | "behavioral"
  | "estimation"
  | "technical"
  | "design-collab";

export type PracticeAnswerFormat = "open" | "multiple-choice" | "checkbox";

export type PracticeChoiceOption = {
  id: string;
  label: string;
};

export type PracticeQuestion = {
  id: string;
  title: string;
  prompt: string;
  category: PracticeCategory;
  difficulty: PracticeDifficulty;
  estimatedMinutes: number;
  competencies: CompetencyId[];
  relatedLessonIds: string[];
  relatedCreateTemplateIds: string[];
  hints?: string[];
  /** Deterministic self-check dimensions — not an AI grade. */
  rubric: string[];
  /** Default open (typed / spoken). Choice formats skip the essay box. */
  format?: PracticeAnswerFormat;
  choices?: PracticeChoiceOption[];
  /** Correct option id(s). One for multiple-choice; one+ for checkbox. */
  correctChoiceIds?: string[];
  /** Shown after submit for choice drills. */
  choiceExplanation?: string;
};

export type CreateTemplateType =
  | "product-teardown"
  | "feature-proposal"
  | "zero-to-one"
  | "prd"
  | "experiment-plan"
  | "study-plan"
  | "interview-prep";

export type CreateSectionDef = {
  id: string;
  label: string;
  placeholder: string;
};

export type CreateTemplate = {
  id: CreateTemplateType;
  title: string;
  blurb: string;
  competencies: CompetencyId[];
  relatedLessonIds: string[];
  sections: CreateSectionDef[];
  /** Short how-to shown on the Create home card and editor. */
  howItWorks?: string;
  starterTips?: string[];
  /** Optional example fill the user can load into empty sections. */
  exampleFill?: Record<string, string>;
};

export type LessonProgressRecord = {
  id: string;
  lessonId: string;
  startedAt: string;
  lastOpenedAt: string;
  completedAt: string | null;
};

export type PracticeAttemptRecord = {
  id: string;
  questionId: string;
  startedAt: string;
  completedAt: string | null;
  responseText: string;
  rubricState: Record<string, boolean>;
  notes: string | null;
};

export type CreateProjectStatus = "active" | "archived" | "completed";

export type CreateProjectRecord = {
  id: string;
  templateType: CreateTemplateType;
  title: string;
  status: CreateProjectStatus;
  /** sectionId → text */
  content: Record<string, string>;
  sourcePracticeQuestionId: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export const PRACTICE_CATEGORY_LABELS: Record<PracticeCategory, string> = {
  "product-sense": "Product Sense",
  "execution-metrics": "Execution / Metrics",
  strategy: "Strategy",
  behavioral: "Behavioral",
  estimation: "Estimation",
  technical: "Technical",
  "design-collab": "Design Collaboration",
};

export const DIFFICULTY_LABELS: Record<PracticeDifficulty, string> = {
  warmup: "Warmup",
  standard: "Standard",
  stretch: "Stretch",
};

export const PRACTICE_FORMAT_LABELS: Record<PracticeAnswerFormat, string> = {
  open: "Write / speak",
  "multiple-choice": "Multiple choice",
  checkbox: "Select all that apply",
};
