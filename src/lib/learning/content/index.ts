import { COMPETENCIES, COMPETENCY_GROUPS, type CompetencyId } from "@/lib/learning/competencies";
import { LESSONS, LESSONS_BY_ID } from "@/lib/learning/content/lessons";
import { PRACTICE_CHOICE_QUESTIONS } from "@/lib/learning/content/practiceChoiceQuestions";
import { PRACTICE_QUESTIONS as PRACTICE_OPEN_QUESTIONS } from "@/lib/learning/content/practiceQuestions";
import { CREATE_TEMPLATES, CREATE_TEMPLATES_BY_ID } from "@/lib/learning/content/createTemplates";
import { GLOSSARY_TERMS } from "@/lib/learning/content/glossary";
import { FURTHER_RESOURCES } from "@/lib/learning/content/resources";
import type {
  CreateTemplate,
  CreateTemplateType,
  Lesson,
  PracticeAnswerFormat,
  PracticeCategory,
  PracticeDifficulty,
  PracticeQuestion,
} from "@/lib/learning/types";

export const PRACTICE_QUESTIONS: PracticeQuestion[] = [
  ...PRACTICE_OPEN_QUESTIONS,
  ...PRACTICE_CHOICE_QUESTIONS,
];

export {
  LESSONS,
  LESSONS_BY_ID,
  CREATE_TEMPLATES,
  CREATE_TEMPLATES_BY_ID,
  GLOSSARY_TERMS,
  FURTHER_RESOURCES,
};
export { COMPETENCIES, COMPETENCY_GROUPS };

export function getLesson(id: string): Lesson | undefined {
  return LESSONS_BY_ID[id];
}

export function getPracticeQuestion(id: string): PracticeQuestion | undefined {
  return PRACTICE_QUESTIONS.find((q) => q.id === id);
}

export function getCreateTemplate(id: CreateTemplateType | string): CreateTemplate | undefined {
  return CREATE_TEMPLATES_BY_ID[id];
}

export function lessonsForGroup(groupId: string): Lesson[] {
  return LESSONS.filter((l) => l.groupId === groupId);
}

export function filterPracticeQuestions(filters: {
  category?: PracticeCategory | "all";
  difficulty?: PracticeDifficulty | "all";
  competency?: CompetencyId | "all";
  format?: PracticeAnswerFormat | "all";
  practicedIds?: Set<string>;
  practiced?: "all" | "practiced" | "not-practiced";
}): PracticeQuestion[] {
  return PRACTICE_QUESTIONS.filter((q) => {
    const format = q.format ?? "open";
    if (filters.format && filters.format !== "all" && format !== filters.format) {
      return false;
    }
    if (filters.category && filters.category !== "all" && q.category !== filters.category) {
      return false;
    }
    if (filters.difficulty && filters.difficulty !== "all" && q.difficulty !== filters.difficulty) {
      return false;
    }
    if (
      filters.competency &&
      filters.competency !== "all" &&
      !q.competencies.includes(filters.competency)
    ) {
      return false;
    }
    if (filters.practiced && filters.practiced !== "all" && filters.practicedIds) {
      const done = filters.practicedIds.has(q.id);
      if (filters.practiced === "practiced" && !done) return false;
      if (filters.practiced === "not-practiced" && done) return false;
    }
    return true;
  });
}

export function pickQuickDrillQuestion(
  category: PracticeCategory | "surprise",
  excludeIds: Set<string> = new Set(),
  format: PracticeAnswerFormat | "any" = "any",
): PracticeQuestion {
  let pool =
    category === "surprise"
      ? PRACTICE_QUESTIONS
      : PRACTICE_QUESTIONS.filter((q) => q.category === category);
  if (format !== "any") {
    pool = pool.filter((q) => (q.format ?? "open") === format);
  }
  if (pool.length === 0) {
    pool =
      format === "any"
        ? PRACTICE_QUESTIONS
        : PRACTICE_QUESTIONS.filter((q) => (q.format ?? "open") === format);
  }
  const fresh = pool.filter((q) => !excludeIds.has(q.id));
  const list = fresh.length > 0 ? fresh : pool;
  return list[Math.floor(Math.random() * list.length)]!;
}

export function questionFormat(q: PracticeQuestion): PracticeAnswerFormat {
  return q.format ?? "open";
}

export type CrossLinkIssue = {
  from: string;
  field: string;
  missingId: string;
};

/** Deterministic integrity check for registries. */
export function validateLearningCrossLinks(): CrossLinkIssue[] {
  const issues: CrossLinkIssue[] = [];
  const lessonIds = new Set(LESSONS.map((l) => l.id));
  const practiceIds = new Set(PRACTICE_QUESTIONS.map((q) => q.id));
  const templateIds = new Set<string>(CREATE_TEMPLATES.map((t) => t.id));
  const competencyIds = new Set(COMPETENCIES.map((c) => c.id));

  for (const lesson of LESSONS) {
    for (const id of lesson.relatedPracticeIds) {
      if (!practiceIds.has(id)) {
        issues.push({ from: lesson.id, field: "relatedPracticeIds", missingId: id });
      }
    }
    for (const id of lesson.relatedLessonIds) {
      if (!lessonIds.has(id)) {
        issues.push({ from: lesson.id, field: "relatedLessonIds", missingId: id });
      }
    }
    for (const id of lesson.relatedCreateTemplateIds) {
      if (!templateIds.has(id)) {
        issues.push({ from: lesson.id, field: "relatedCreateTemplateIds", missingId: id });
      }
    }
    for (const id of lesson.competencies) {
      if (!competencyIds.has(id)) {
        issues.push({ from: lesson.id, field: "competencies", missingId: id });
      }
    }
  }

  for (const q of PRACTICE_QUESTIONS) {
    for (const id of q.relatedLessonIds) {
      if (!lessonIds.has(id)) {
        issues.push({ from: q.id, field: "relatedLessonIds", missingId: id });
      }
    }
    for (const id of q.relatedCreateTemplateIds) {
      if (!templateIds.has(id)) {
        issues.push({ from: q.id, field: "relatedCreateTemplateIds", missingId: id });
      }
    }
    for (const id of q.competencies) {
      if (!competencyIds.has(id)) {
        issues.push({ from: q.id, field: "competencies", missingId: id });
      }
    }
  }

  for (const t of CREATE_TEMPLATES) {
    for (const id of t.relatedLessonIds) {
      if (!lessonIds.has(id)) {
        issues.push({ from: t.id, field: "relatedLessonIds", missingId: id });
      }
    }
    for (const id of t.competencies) {
      if (!competencyIds.has(id)) {
        issues.push({ from: t.id, field: "competencies", missingId: id });
      }
    }
  }

  for (const term of GLOSSARY_TERMS) {
    for (const id of term.relatedLessonIds) {
      if (!lessonIds.has(id)) {
        issues.push({ from: `glossary:${term.id}`, field: "relatedLessonIds", missingId: id });
      }
    }
  }

  return issues;
}

export function emptyProjectContent(template: CreateTemplate): Record<string, string> {
  return Object.fromEntries(template.sections.map((s) => [s.id, ""]));
}
