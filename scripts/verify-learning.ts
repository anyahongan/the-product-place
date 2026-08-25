/**
 * Lightweight Learn / Practice / Create verification.
 * Run: npx --yes tsx --tsconfig tsconfig.json scripts/verify-learning.ts
 */

import {
  COMPETENCIES,
  COMPETENCY_GROUPS,
  CREATE_TEMPLATES,
  LESSONS,
  PRACTICE_QUESTIONS,
  emptyProjectContent,
  filterPracticeQuestions,
  getCreateTemplate,
  getLesson,
  getPracticeQuestion,
  pickQuickDrillQuestion,
  validateLearningCrossLinks,
} from "../src/lib/learning/content";
import { getCompetency } from "../src/lib/learning/competencies";

let passed = 0;
let failed = 0;

function assert(name: string, cond: boolean, detail?: string) {
  if (cond) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

console.log("\nLearning verification\n");

{
  console.log("A. Registries load");
  assert("lessons >= 20", LESSONS.length >= 20, `n=${LESSONS.length}`);
  assert("practice >= 40", PRACTICE_QUESTIONS.length >= 40, `n=${PRACTICE_QUESTIONS.length}`);
  assert("templates >= 7", CREATE_TEMPLATES.length >= 7, `n=${CREATE_TEMPLATES.length}`);
  assert("competency groups >= 7", COMPETENCY_GROUPS.length >= 7);
  assert("competencies", COMPETENCIES.length > 30);
  assert("roadmap lesson", Boolean(getLesson("lesson-weeks-1-3-roadmap")));
  assert("closing lesson", Boolean(getLesson("lesson-interview-closing")));
  assert("tech literacy lesson", Boolean(getLesson("lesson-tech-literacy-basics")));
  assert("study-plan template", Boolean(getCreateTemplate("study-plan")));
  assert("interview-prep template", Boolean(getCreateTemplate("interview-prep")));
}

{
  console.log("B. Stable unique IDs");
  const lessonIds = LESSONS.map((l) => l.id);
  assert("unique lesson ids", new Set(lessonIds).size === lessonIds.length);
  const qIds = PRACTICE_QUESTIONS.map((q) => q.id);
  assert("unique practice ids", new Set(qIds).size === qIds.length);
  const tIds = CREATE_TEMPLATES.map((t) => t.id);
  assert("unique template ids", new Set(tIds).size === tIds.length);
}

{
  console.log("C. Cross-links resolve");
  const issues = validateLearningCrossLinks();
  assert("no broken cross-links", issues.length === 0, JSON.stringify(issues.slice(0, 5)));
  for (const lesson of LESSONS) {
    for (const id of lesson.relatedPracticeIds) {
      assert(`lesson→practice ${lesson.id}→${id}`, Boolean(getPracticeQuestion(id)));
    }
  }
  for (const q of PRACTICE_QUESTIONS) {
    for (const id of q.relatedLessonIds) {
      assert(`practice→lesson ${q.id}→${id}`, Boolean(getLesson(id)));
    }
    for (const id of q.relatedCreateTemplateIds) {
      assert(`practice→create ${q.id}→${id}`, Boolean(getCreateTemplate(id)));
    }
  }
  for (const t of CREATE_TEMPLATES) {
    for (const id of t.relatedLessonIds) {
      assert(`create→lesson ${t.id}→${id}`, Boolean(getLesson(id)));
    }
  }
}

{
  console.log("D. Lesson shape");
  for (const l of LESSONS.slice(0, 3)) {
    assert(`${l.id} has idea`, l.idea.length > 20);
    assert(`${l.id} has tryIt`, l.tryIt.length > 10);
    assert(`${l.id} minutes`, l.estimatedMinutes >= 4 && l.estimatedMinutes <= 20);
  }
  const withRefs = LESSONS.filter((l) => (l.sourceRefs?.length ?? 0) > 0);
  assert("some source refs exist", withRefs.length >= 3);
  assert(
    "no invented chapters",
    withRefs.every((l) =>
      (l.sourceRefs ?? []).every((r) => r.chapter == null || r.chapter === null),
    ),
  );
}

{
  console.log("E. Practice filters + quick drill");
  const sense = filterPracticeQuestions({ category: "product-sense" });
  assert("filter product-sense", sense.length > 0 && sense.every((q) => q.category === "product-sense"));
  const q = pickQuickDrillQuestion("surprise");
  assert("surprise pick", Boolean(getPracticeQuestion(q.id)));
  assert("rubric non-empty", q.rubric.length >= 3);
}

{
  console.log("F. Create templates");
  for (const t of CREATE_TEMPLATES) {
    assert(`${t.id} sections`, t.sections.length >= 6);
    const empty = emptyProjectContent(t);
    assert(`${t.id} empty keys`, Object.keys(empty).length === t.sections.length);
    assert(
      `${t.id} empty values blank`,
      Object.values(empty).every((v) => v === ""),
    );
  }
  assert("feature-proposal exists", Boolean(getCreateTemplate("feature-proposal")));
}

{
  console.log("G. Competency lookup");
  assert("getCompetency works", getCompetency("prioritization").label.includes("Priorit"));
}

console.log(`\nResult: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
