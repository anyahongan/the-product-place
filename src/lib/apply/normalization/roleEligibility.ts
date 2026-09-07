import type { JobListingView } from "@/lib/apply/types";
import type { EmploymentType } from "@/types/apply";

export function hasInternshipSignal(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\bintern(?:ship)?\b/.test(t) ||
    /\bco[\s-]?op\b/.test(t) ||
    /\buniversity\s+(recruit|program|grad)\b/.test(t) ||
    /\bcampus\s+(recruit|hire|program)\b/.test(t)
  );
}

/** Minimum years of experience explicitly required in posting text. */
export function inferMinimumExperienceYears(text: string | null | undefined): number | null {
  if (!text?.trim()) return null;
  let max = 0;

  const patterns = [
    /(\d+)\+?\s*years?\s*(?:of\s+)?(?:product|pm|professional|relevant|work|industry|experience)/gi,
    /(?:minimum|at least|min\.?)\s*(?:of\s+)?(\d+)\+?\s*years?/gi,
    /(\d+)\+?\s*years?\s*(?:of\s+)?experience/gi,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const years = Number(match[1]);
      if (years >= 2 && years <= 30) max = Math.max(max, years);
    }
  }

  return max >= 2 ? max : null;
}

const POST_GRAD_TITLE =
  /\b(chief of staff|staff\s+(?:product|pm)|principal\s+(?:product|pm)|director(?:,|\s|$)|vp[,|\s]|vice president|head of product|group product manager|senior product manager|sr\.?\s+product manager|lead product manager)\b/i;

export type RoleEligibility = "student" | "post-grad" | "unknown";

export function inferRoleEligibility(
  title: string,
  description: string | null = null,
): RoleEligibility {
  if (hasInternshipSignal(title)) return "student";

  const hay = `${title}\n${description ?? ""}`;
  const titleLower = title.toLowerCase();

  if (POST_GRAD_TITLE.test(titleLower)) return "post-grad";

  const minYears = inferMinimumExperienceYears(hay);
  if (minYears !== null && minYears >= 3) return "post-grad";

  if (
    /\bfull[\s-]?time\b/i.test(hay) &&
    !hasInternshipSignal(hay) &&
    (/\b8\+?\s*years?\b/i.test(hay) ||
      /\b5\+?\s*years?\b/i.test(hay) ||
      /\bexperienced\b/i.test(hay))
  ) {
    return "post-grad";
  }

  return "unknown";
}

export function eligibilityLabel(
  job: Pick<JobListingView, "title" | "description" | "graduationYears">,
): string | null {
  const eligibility = inferRoleEligibility(job.title, job.description);
  if (eligibility === "post-grad") return "Post-grad / experienced hire";
  if (job.graduationYears.length > 0) {
    return `’${job.graduationYears.map((y) => String(y).slice(2)).join(" / ’")}`;
  }
  return null;
}

export function matchesEmploymentFilter(
  job: Pick<JobListingView, "title" | "description" | "employmentType">,
  types: EmploymentType[],
): boolean {
  if (types.length === 0) return true;
  if (inferRoleEligibility(job.title, job.description) === "post-grad") return false;
  if (job.employmentType) return types.includes(job.employmentType);
  return types.includes("internship") && hasInternshipSignal(job.title);
}

export function matchesGraduationFilter(
  job: Pick<JobListingView, "title" | "description" | "graduationYears">,
  years: number[],
): boolean {
  if (years.length === 0) return true;
  if (inferRoleEligibility(job.title, job.description) === "post-grad") return false;
  if (job.graduationYears.length === 0) return false;
  return years.some((year) => job.graduationYears.includes(year));
}
