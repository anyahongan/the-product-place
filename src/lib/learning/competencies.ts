/**
 * Shared competency taxonomy for Learn, Practice, and Create.
 * Stable IDs — do not rename casually; content cross-links depend on them.
 */

export type CompetencyGroupId =
  | "foundations"
  | "technical-literacy"
  | "product-sense"
  | "execution-metrics"
  | "strategy"
  | "pm-in-practice"
  | "interview";

export type CompetencyId =
  // Foundations
  | "role-of-pm"
  | "product-lifecycle"
  | "user-problems"
  | "product-discovery"
  | "prioritization"
  | "roadmapping"
  | "study-planning"
  // Technical literacy
  | "technical-fluency"
  | "apis-systems"
  | "frontend-backend"
  | "product-business-models"
  | "reading-tech-docs"
  // Product sense
  | "user-segmentation"
  | "pain-points"
  | "product-critique"
  | "feature-ideation"
  | "tradeoffs"
  | "zero-to-one"
  // Execution & metrics
  | "goals"
  | "north-star-metrics"
  | "funnels"
  | "metric-trees"
  | "diagnosing-metrics"
  | "experimentation"
  | "launch-metrics"
  | "rice-moscow"
  | "okrs-jtbd"
  | "user-research-basics"
  // Strategy
  | "market-understanding"
  | "competitive-analysis"
  | "positioning"
  | "growth"
  | "business-tradeoffs"
  // PM in practice
  | "stakeholder-management"
  | "working-with-engineering"
  | "working-with-design"
  | "ambiguity"
  | "roadmap-conflict"
  | "executive-communication"
  | "influence-without-authority"
  | "saying-no"
  | "decision-making"
  | "non-technical-strengths"
  // Interview categories (also used as practice categories)
  | "interview-product-sense"
  | "interview-execution"
  | "interview-strategy"
  | "interview-behavioral"
  | "interview-estimation"
  | "interview-technical"
  | "interview-design-collab"
  | "interview-closing";

export type Competency = {
  id: CompetencyId;
  groupId: CompetencyGroupId;
  label: string;
};

export type CompetencyGroup = {
  id: CompetencyGroupId;
  label: string;
  shortLabel: string;
};

export const COMPETENCY_GROUPS: CompetencyGroup[] = [
  { id: "foundations", label: "Product Foundations", shortLabel: "Foundations" },
  { id: "technical-literacy", label: "Technical Literacy", shortLabel: "Technical" },
  { id: "product-sense", label: "Product Sense", shortLabel: "Product Sense" },
  { id: "execution-metrics", label: "Execution & Prioritization", shortLabel: "Execution" },
  { id: "strategy", label: "Strategy", shortLabel: "Strategy" },
  { id: "pm-in-practice", label: "PM in Practice / Recruiting", shortLabel: "PM in Practice" },
  { id: "interview", label: "Interviewing", shortLabel: "Interview" },
];

export const COMPETENCIES: Competency[] = [
  { id: "role-of-pm", groupId: "foundations", label: "Role of the PM" },
  { id: "product-lifecycle", groupId: "foundations", label: "Product lifecycle" },
  { id: "user-problems", groupId: "foundations", label: "User problems" },
  { id: "product-discovery", groupId: "foundations", label: "Product discovery" },
  { id: "prioritization", groupId: "foundations", label: "Prioritization" },
  { id: "roadmapping", groupId: "foundations", label: "Roadmapping" },
  { id: "study-planning", groupId: "foundations", label: "Study planning" },

  { id: "technical-fluency", groupId: "technical-literacy", label: "Technical fluency" },
  { id: "apis-systems", groupId: "technical-literacy", label: "APIs & systems" },
  { id: "frontend-backend", groupId: "technical-literacy", label: "Frontend vs backend" },
  { id: "product-business-models", groupId: "technical-literacy", label: "B2B / B2C / AI-native" },
  { id: "reading-tech-docs", groupId: "technical-literacy", label: "Reading technical docs" },

  { id: "user-segmentation", groupId: "product-sense", label: "User segmentation" },
  { id: "pain-points", groupId: "product-sense", label: "Pain points" },
  { id: "product-critique", groupId: "product-sense", label: "Product critique" },
  { id: "feature-ideation", groupId: "product-sense", label: "Feature ideation" },
  { id: "tradeoffs", groupId: "product-sense", label: "Tradeoffs" },
  { id: "zero-to-one", groupId: "product-sense", label: "0→1 thinking" },

  { id: "goals", groupId: "execution-metrics", label: "Goals" },
  { id: "north-star-metrics", groupId: "execution-metrics", label: "North-star metrics" },
  { id: "funnels", groupId: "execution-metrics", label: "Funnels" },
  { id: "metric-trees", groupId: "execution-metrics", label: "Metric trees" },
  { id: "diagnosing-metrics", groupId: "execution-metrics", label: "Diagnosing metric changes" },
  { id: "experimentation", groupId: "execution-metrics", label: "Experimentation" },
  { id: "launch-metrics", groupId: "execution-metrics", label: "Launch metrics" },
  { id: "rice-moscow", groupId: "execution-metrics", label: "RICE & MoSCoW" },
  { id: "okrs-jtbd", groupId: "execution-metrics", label: "OKRs & JTBD" },
  { id: "user-research-basics", groupId: "execution-metrics", label: "User research" },

  { id: "market-understanding", groupId: "strategy", label: "Market understanding" },
  { id: "competitive-analysis", groupId: "strategy", label: "Competitive analysis" },
  { id: "positioning", groupId: "strategy", label: "Positioning" },
  { id: "growth", groupId: "strategy", label: "Growth" },
  { id: "business-tradeoffs", groupId: "strategy", label: "Business / product tradeoffs" },

  { id: "stakeholder-management", groupId: "pm-in-practice", label: "Stakeholder management" },
  { id: "working-with-engineering", groupId: "pm-in-practice", label: "Working with engineering" },
  { id: "working-with-design", groupId: "pm-in-practice", label: "Working with design" },
  { id: "ambiguity", groupId: "pm-in-practice", label: "Ambiguity" },
  { id: "roadmap-conflict", groupId: "pm-in-practice", label: "Roadmap conflict" },
  { id: "executive-communication", groupId: "pm-in-practice", label: "Executive communication" },
  { id: "influence-without-authority", groupId: "pm-in-practice", label: "Influence without authority" },
  { id: "saying-no", groupId: "pm-in-practice", label: "Saying no" },
  { id: "decision-making", groupId: "pm-in-practice", label: "Decision making" },
  { id: "non-technical-strengths", groupId: "pm-in-practice", label: "Non-technical strengths" },

  { id: "interview-product-sense", groupId: "interview", label: "Product Sense" },
  { id: "interview-execution", groupId: "interview", label: "Execution / Metrics" },
  { id: "interview-strategy", groupId: "interview", label: "Strategy" },
  { id: "interview-behavioral", groupId: "interview", label: "Behavioral" },
  { id: "interview-estimation", groupId: "interview", label: "Estimation" },
  { id: "interview-technical", groupId: "interview", label: "Technical / systems" },
  { id: "interview-design-collab", groupId: "interview", label: "Product / design collaboration" },
  { id: "interview-closing", groupId: "interview", label: "Closing questions" },
];

const byId = new Map(COMPETENCIES.map((c) => [c.id, c]));
const groupById = new Map(COMPETENCY_GROUPS.map((g) => [g.id, g]));

export function getCompetency(id: CompetencyId): Competency {
  const c = byId.get(id);
  if (!c) throw new Error(`Unknown competency: ${id}`);
  return c;
}

export function getCompetencyGroup(id: CompetencyGroupId): CompetencyGroup {
  const g = groupById.get(id);
  if (!g) throw new Error(`Unknown competency group: ${id}`);
  return g;
}

export function competenciesInGroup(groupId: CompetencyGroupId): Competency[] {
  return COMPETENCIES.filter((c) => c.groupId === groupId);
}
