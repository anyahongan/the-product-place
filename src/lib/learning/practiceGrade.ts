export type PracticeGradeDimension = {
  label: string;
  score: number; // 0–2
  max: 2;
  feedback: string;
};

export type PracticeGradeResult = {
  overallScore: number; // 0–100
  summary: string;
  strengths: string[];
  gaps: string[];
  dimensions: PracticeGradeDimension[];
  rewriteSuggestion: string;
  nextDrillTip: string;
  targetNote: string | null;
  source: "ai" | "coach";
};

export type GradePracticeInput = {
  questionTitle: string;
  questionPrompt: string;
  category: string;
  rubric: string[];
  responseText: string;
  targetCompany?: string;
  targetRole?: string;
  interviewType?: string;
};

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function mentions(text: string, needles: string[]): number {
  const t = text.toLowerCase();
  return needles.filter((n) => t.includes(n.toLowerCase())).length;
}

function scoreRubricItem(item: string, response: string): { score: number; feedback: string } {
  const r = response.toLowerCase();
  const itemL = item.toLowerCase();
  const words = wordCount(response);

  // Structural signals
  const hasUser = mentions(response, ["user", "customer", "segment", "persona", "student", "buyer"]);
  const hasMetric = mentions(response, ["metric", "kpi", "retention", "conversion", "north star", "%", "rate"]);
  const hasTradeoff = mentions(response, ["tradeoff", "trade-off", "instead", "not", "defer", "priorit"]);
  const hasWhy = mentions(response, ["because", "so that", "in order", "reason"]);
  const hasStructure = mentions(response, ["first", "second", "then", "step", "1.", "2."]);
  const hasAssumption = mentions(response, ["assum", "unknown", "risk", "if we"]);

  let score = 0;
  const hints: string[] = [];

  if (words < 40) {
    hints.push("Answer is thin — interviewers expect structured depth, not a tweet.");
  } else if (words >= 80) {
    score += 1;
  }

  if (
    itemL.includes("user") ||
    itemL.includes("segment") ||
    itemL.includes("who") ||
    itemL.includes("customer")
  ) {
    if (hasUser) score = Math.min(2, score + 1);
    else hints.push("Name a specific user/segment — “users” is not a user.");
  } else if (itemL.includes("metric") || itemL.includes("success") || itemL.includes("measur")) {
    if (hasMetric) score = Math.min(2, score + 1);
    else hints.push("Call out a primary metric and what would move it.");
  } else if (itemL.includes("tradeoff") || itemL.includes("priorit") || itemL.includes("alternative")) {
    if (hasTradeoff) score = Math.min(2, score + 1);
    else hints.push("Surface an explicit tradeoff or alternative you rejected.");
  } else if (itemL.includes("assum") || itemL.includes("risk") || itemL.includes("unknown")) {
    if (hasAssumption) score = Math.min(2, score + 1);
    else hints.push("Label assumptions and risks honestly.");
  } else if (itemL.includes("structure") || itemL.includes("framework") || itemL.includes("step")) {
    if (hasStructure) score = Math.min(2, score + 1);
    else hints.push("Signpost your structure (steps / first–then).");
  } else {
    // Generic: look for conceptual overlap with rubric words
    const keyTerms = itemL.split(/[^a-z0-9]+/).filter((w) => w.length > 4).slice(0, 4);
    const hit = keyTerms.filter((w) => r.includes(w)).length;
    if (hit >= 2) score = Math.min(2, score + 1);
    else if (hit === 1 && words >= 60) score = Math.min(2, score + 1);
    else hints.push(`Make the “${item}” thread more explicit in your answer.`);
  }

  if (hasWhy && score < 2) score += 0; // soft
  if (score === 0 && words >= 100 && hasWhy) score = 1;
  if (score >= 1 && hints.length === 0 && words >= 120 && (hasMetric || hasTradeoff)) {
    score = 2;
  }

  const feedback =
    score === 2
      ? `Strong on this dimension: ${item}`
      : score === 1
        ? `Partial: ${item}. ${hints[0] ?? "Add one concrete example."}`
        : `Missing or weak: ${item}. ${hints[0] ?? "Address this explicitly."}`;

  return { score: Math.min(2, score), feedback };
}

/** Thorough local coach — used when no LLM key is configured, and as AI fallback. */
export function gradePracticeLocally(input: GradePracticeInput): PracticeGradeResult {
  const text = input.responseText.trim();
  const words = wordCount(text);

  if (words < 12) {
    return {
      overallScore: 8,
      summary:
        "There’s almost no answer to grade. Write a structured response (goal → approach → tradeoffs → metric) then resubmit.",
      strengths: [],
      gaps: ["Empty or near-empty response.", "No structure.", "No metric or user named."],
      dimensions: input.rubric.map((label) => ({
        label,
        score: 0,
        max: 2,
        feedback: "Not evidenced in your response yet.",
      })),
      rewriteSuggestion:
        "Draft outline: 1) Clarify the user & goal. 2) State 2–3 options. 3) Pick one with a tradeoff. 4) Name the success metric. 5) Call out one risk.",
      nextDrillTip: "Retry the same prompt after filling the outline — depth beats length.",
      targetNote: targetBlurb(input),
      source: "coach",
    };
  }

  const dimensions: PracticeGradeDimension[] = input.rubric.map((label) => {
    const { score, feedback } = scoreRubricItem(label, text);
    return { label, score, max: 2, feedback };
  });

  const earned = dimensions.reduce((s, d) => s + d.score, 0);
  const max = Math.max(1, dimensions.length * 2);
  let overall = Math.round((earned / max) * 100);

  // Soft bonuses / penalties
  if (words >= 150 && words <= 450) overall = Math.min(100, overall + 4);
  if (words > 650) overall = Math.max(0, overall - 6);
  if (mentions(text, ["i don't know", "idk", "not sure"]) > 2) overall = Math.max(0, overall - 5);

  const strengths: string[] = [];
  const gaps: string[] = [];
  for (const d of dimensions) {
    if (d.score === 2) strengths.push(d.label);
    else if (d.score === 0) gaps.push(d.label);
  }
  if (mentions(text, ["because", "tradeoff", "metric"]) >= 2) {
    strengths.push("You connected reasoning across the answer.");
  }
  if (mentions(text, ["user", "customer", "segment"]) === 0) {
    gaps.push("No clear user/segment.");
  }
  if (mentions(text, ["metric", "kpi", "retention", "conversion", "success"]) === 0) {
    gaps.push("No measurable success signal.");
  }

  const summary =
    overall >= 80
      ? "Interview-ready structure with clear product judgment. Tighten examples and rehearse aloud once."
      : overall >= 60
        ? "Solid core — strengthen the weak rubric dimensions and make the tradeoff sentence impossible to miss."
        : overall >= 40
          ? "Direction is visible but an interviewer would push for structure, users, and metrics. Use the rewrite outline."
          : "This would not clear a strong PM screen yet. Rebuild with the outline below, then resubmit.";

  const rewriteSuggestion = [
    `For “${input.questionTitle}”:`,
    `1. Goal / user — who and what success means${input.targetRole ? ` (frame for ${input.targetRole})` : ""}.`,
    "2. Approach — 2–3 options, pick one.",
    "3. Tradeoff — what you optimize and what you defer.",
    "4. Metric + guardrail.",
    "5. Risk / assumption + how you’d learn in a week.",
  ].join(" ");

  const nextDrillTip =
    input.category === "behavioral"
      ? "Rehearse the same story in 90 seconds out loud — cut filler, keep the decision."
      : input.category === "technical"
        ? "Add a plain-language systems sentence (frontend / API / backend) even if the prompt isn’t “technical.”"
        : "Do one more pass focusing only on the lowest-scoring rubric line.";

  return {
    overallScore: overall,
    summary,
    strengths: strengths.slice(0, 5),
    gaps: gaps.slice(0, 5),
    dimensions,
    rewriteSuggestion,
    nextDrillTip,
    targetNote: targetBlurb(input),
    source: "coach",
  };
}

function targetBlurb(input: GradePracticeInput): string | null {
  const bits = [input.targetCompany, input.targetRole, input.interviewType].filter(Boolean);
  if (bits.length === 0) return null;
  return `Tailored for: ${bits.join(" · ")}. Emphasize signals that company/role would care about in your rewrite.`;
}

export function parseAiGradeJson(raw: string, fallbackRubric: string[]): PracticeGradeResult | null {
  try {
    const data = JSON.parse(raw) as Partial<PracticeGradeResult> & {
      dimensions?: Array<{ label?: string; score?: number; feedback?: string }>;
    };
    if (typeof data.overallScore !== "number" || typeof data.summary !== "string") return null;
    const dimensions: PracticeGradeDimension[] = (data.dimensions ?? fallbackRubric.map((label) => ({
      label,
      score: 1,
      feedback: "See summary.",
    }))).map((d, i) => ({
      label: d.label ?? fallbackRubric[i] ?? `Dimension ${i + 1}`,
      score: Math.max(0, Math.min(2, Number(d.score) || 0)),
      max: 2,
      feedback: d.feedback ?? "",
    }));
    return {
      overallScore: Math.max(0, Math.min(100, Math.round(data.overallScore))),
      summary: data.summary,
      strengths: Array.isArray(data.strengths) ? data.strengths.map(String).slice(0, 6) : [],
      gaps: Array.isArray(data.gaps) ? data.gaps.map(String).slice(0, 6) : [],
      dimensions,
      rewriteSuggestion: String(data.rewriteSuggestion ?? ""),
      nextDrillTip: String(data.nextDrillTip ?? ""),
      targetNote: data.targetNote ? String(data.targetNote) : null,
      source: "ai",
    };
  } catch {
    return null;
  }
}

/** Instant, thorough grade for multiple-choice / checkbox drills. */
export function gradeChoiceQuestion(input: {
  question: {
    title: string;
    prompt: string;
    format?: "open" | "multiple-choice" | "checkbox";
    choices?: Array<{ id: string; label: string }>;
    correctChoiceIds?: string[];
    choiceExplanation?: string;
    rubric: string[];
  };
  selectedIds: string[];
  targetCompany?: string;
  targetRole?: string;
  interviewType?: string;
}): PracticeGradeResult {
  const correct = new Set(input.question.correctChoiceIds ?? []);
  const selected = new Set(input.selectedIds);
  const choices = input.question.choices ?? [];
  const format = input.question.format ?? "multiple-choice";

  let hits = 0;
  let misses = 0;
  let extras = 0;
  for (const id of correct) {
    if (selected.has(id)) hits += 1;
    else misses += 1;
  }
  for (const id of selected) {
    if (!correct.has(id)) extras += 1;
  }

  const totalNeeded = Math.max(1, correct.size);
  const precisionDenom = Math.max(1, selected.size);
  const recall = hits / totalNeeded;
  const precision = hits / precisionDenom;
  const f1 = recall + precision === 0 ? 0 : (2 * recall * precision) / (recall + precision);
  const overallScore = Math.round(f1 * 100);

  const correctLabels = choices.filter((c) => correct.has(c.id)).map((c) => c.label);
  const pickedLabels = choices.filter((c) => selected.has(c.id)).map((c) => c.label);
  const missedLabels = choices.filter((c) => correct.has(c.id) && !selected.has(c.id)).map((c) => c.label);
  const wrongLabels = choices.filter((c) => selected.has(c.id) && !correct.has(c.id)).map((c) => c.label);

  const perfect = misses === 0 && extras === 0 && hits === correct.size;
  const summary = perfect
    ? format === "checkbox"
      ? "Nailed the full set — you selected every correct option and nothing extra."
      : "Correct. You picked the strongest option for this interview signal."
    : format === "checkbox"
      ? `Partial credit: ${hits}/${correct.size} correct picks${extras ? `, ${extras} extra` : ""}${misses ? `, ${misses} missed` : ""}.`
      : "Not quite — review the explanation and try again with a sharper instinct.";

  const strengths: string[] = [];
  const gaps: string[] = [];
  if (hits > 0) strengths.push(`Locked in: ${pickedLabels.filter((l) => correctLabels.includes(l)).join("; ") || "a correct signal"}`);
  if (perfect) strengths.push("Clean selection — no distractors.");
  if (missedLabels.length) gaps.push(`Missed: ${missedLabels.join("; ")}`);
  if (wrongLabels.length) gaps.push(`Distractor(s) you took: ${wrongLabels.join("; ")}`);

  const dimensions: PracticeGradeDimension[] = input.question.rubric.map((label) => ({
    label,
    score: perfect ? 2 : hits > 0 && extras === 0 ? 1 : hits > 0 ? 1 : 0,
    max: 2 as const,
    feedback: perfect
      ? "Aligned with this rubric angle."
      : input.question.choiceExplanation ?? "Re-read the prompt and eliminate distractors.",
  }));

  const bits = [input.targetCompany, input.targetRole, input.interviewType].filter(Boolean);

  return {
    overallScore,
    summary,
    strengths: strengths.length ? strengths : ["You engaged the prompt — keep refining elimination."],
    gaps: gaps.length ? gaps : perfect ? [] : ["Revisit the explanation and retry once cold."],
    dimensions,
    rewriteSuggestion:
      input.question.choiceExplanation ??
      (perfect
        ? "Say the correct reasoning out loud in one sentence — that’s the interview version."
        : `Correct answer(s): ${correctLabels.join("; ")}.`),
    nextDrillTip: perfect
      ? "Level up: open an essay drill in the same category and write the reasoning."
      : "Retry this choice drill once, then switch to Write / speak to explain why.",
    targetNote: bits.length ? `Tailored for: ${bits.join(" · ")}.` : null,
    source: "coach",
  };
}

