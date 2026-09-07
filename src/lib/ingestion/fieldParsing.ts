import type { EmploymentType, ProductRole, WorkMode } from "@/types/apply";
import { classifyProductRole } from "@/lib/apply/normalization/classifyProductRole";
import {
  hasInternshipSignal,
  inferMinimumExperienceYears,
  inferRoleEligibility,
} from "@/lib/apply/normalization/roleEligibility";

/** Strip HTML to plain text for descriptions / parsing. */
export function htmlToPlainText(html: string | null | undefined): string | null {
  if (!html) return null;
  const text = html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*p\s*>/gi, "\n")
    .replace(/<\/\s*li\s*>/gi, "\n")
    .replace(/<\/\s*h[1-6]\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  return text || null;
}

/** Explicit internship / co-op / university-recruit signals in a string. */
export { hasInternshipSignal } from "@/lib/apply/normalization/roleEligibility";

/**
 * Conservative employment-type inference from title + optional text.
 * Returns null when unclear — never invents.
 *
 * Title internship signals take precedence over body text that may mention
 * "full-time conversion" or similar.
 */
export function inferEmploymentType(
  title: string,
  text: string | null = null,
): EmploymentType | null {
  if (hasInternshipSignal(title)) return "internship";

  const body = (text ?? "").toLowerCase();
  const hay = `${title}\n${text ?? ""}`.toLowerCase();

  if (inferRoleEligibility(title, text) === "post-grad") return "full-time";

  const minYears = inferMinimumExperienceYears(hay);
  if (minYears !== null && minYears >= 3) return "full-time";

  if (hasInternshipSignal(body)) return "internship";
  if (/\bpart[\s-]?time\b/.test(hay)) return "part-time";
  if (
    /\bfull[\s-]?time\b/.test(hay) ||
    /\bnew\s+grad(?:uate)?s?\b/.test(hay) ||
    /\bentry[\s-]?level\b/.test(hay) ||
    /\bearly[\s-]?career\b/.test(hay) ||
    /\bpermanent\b/.test(hay)
  ) {
    return "full-time";
  }
  return null;
}

/** Map ATS enum-like employment strings when explicit. */
export function mapAtsEmploymentType(raw: string | null | undefined): EmploymentType | null {
  if (!raw) return null;
  const t = raw.toLowerCase().replace(/[_-]+/g, " ").trim();
  if (/intern|co ?op|university/.test(t)) return "internship";
  if (/part ?time/.test(t)) return "part-time";
  if (/full ?time|permanent|regular|exempt/.test(t)) return "full-time";
  return null;
}

/**
 * Work mode only when explicit in text/location/flags.
 * Does NOT infer from city names alone.
 */
export function inferWorkModeFromText(
  location: string | null,
  extra: string | null = null,
  flags?: { isRemote?: boolean | null },
): WorkMode | null {
  if (flags?.isRemote === true) return "remote";
  const hay = `${location ?? ""}\n${extra ?? ""}`.toLowerCase();
  if (!hay.trim()) return null;
  if (/\bhybrid\b/.test(hay)) return "hybrid";
  if (/\bin[\s-]?person\b|\bon[\s-]?site\b|\bonsite\b/.test(hay)) return "in-person";
  if (
    /\bremote\s+only\b/.test(hay) ||
    /^remote\b/.test(hay.trim()) ||
    /\bfully\s+remote\b/.test(hay) ||
    /\bremote\b/.test(hay)
  ) {
    return "remote";
  }
  return null;
}

const YEAR_WINDOW_MIN = () => new Date().getUTCFullYear() - 1;
const YEAR_WINDOW_MAX = () => new Date().getUTCFullYear() + 6;

function inGraduationWindow(y: number): boolean {
  return y >= YEAR_WINDOW_MIN() && y <= YEAR_WINDOW_MAX();
}

/**
 * Extract graduation year eligibility when wording is structurally clear.
 * High precision: years require nearby graduation / degree / enrollment context.
 * Does NOT treat salary, copyright, start dates, or job IDs as graduation years.
 */
export function parseGraduationYears(text: string | null | undefined): number[] | null {
  if (!text) return null;
  const years = new Set<number>();

  const pushYear = (y: number) => {
    if (inGraduationWindow(y)) years.add(y);
  };

  const pushYearRange = (a: number, b: number) => {
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    if (hi - lo > 4) return;
    for (let y = lo; y <= hi; y++) pushYear(y);
  };

  // "graduating between December 2027 and June 2028"
  // "expected graduation date between … 2027 … 2028"
  const between = text.match(
    /(?:graduat(?:ing|es?|ion)|expected\s+graduation(?:\s+date)?)[^\d]{0,60}(20\d{2})[^\d]{0,40}(20\d{2})/i,
  );
  if (between) {
    pushYearRange(Number(between[1]), Number(between[2]));
  }

  // "graduation years: 2027, 2028, 2029" / "eligible graduation years 2027-2029"
  const listed = text.match(
    /(?:graduat(?:ion|ing)|eligible)\s+years?[^\d]{0,20}((?:20\d{2}(?:\s*[,/–\-]\s*|,\s*)*){1,6}20\d{2}|20\d{2})/i,
  );
  if (listed?.[1]) {
    const ys = listed[1].match(/20\d{2}/g) ?? [];
    if (ys.length >= 2) {
      const nums = ys.map(Number);
      pushYearRange(Math.min(...nums), Math.max(...nums));
    } else if (ys.length === 1) {
      pushYear(Number(ys[0]));
    }
  }

  for (const m of text.matchAll(/class of\s*(20\d{2})/gi)) {
    pushYear(Number(m[1]));
  }

  for (const m of text.matchAll(/\b(20\d{2})\s+graduates?\b/gi)) {
    pushYear(Number(m[1]));
  }

  // "graduating in 2028" / "graduates 2028" / "graduation: 2028"
  for (const m of text.matchAll(
    /graduat(?:ing|es?|ion)(?:\s+date)?(?:\s*:)?\s+(?:in\s+)?(20\d{2})/gi,
  )) {
    pushYear(Number(m[1]));
  }

  // "expected graduation … 2028"
  for (const m of text.matchAll(
    /expected\s+graduation(?:\s+date)?[^\d]{0,40}(20\d{2})/gi,
  )) {
    pushYear(Number(m[1]));
  }

  // Explicit range only with graduation anchor already handled above.
  // Do NOT match bare "2027-2028" (salaries, copyright, seasons, job IDs).

  if (years.size === 0) return null;
  return [...years].sort((a, b) => a - b);
}

export type ClassifiedFields = {
  productRoleCategory: ProductRole;
  employmentType: EmploymentType | null;
  workMode: WorkMode | null;
  graduationYears: number[] | null;
  description: string | null;
};

/** Shared classification for ATS/tracker rows after fetch. */
export function classifyJobFields(input: {
  title: string;
  location?: string | null;
  descriptionHtml?: string | null;
  descriptionText?: string | null;
  employmentHint?: string | null;
  isRemote?: boolean | null;
}): ClassifiedFields | null {
  const productRoleCategory = classifyProductRole(input.title);
  if (!productRoleCategory) return null;

  const description =
    input.descriptionText?.trim() ||
    htmlToPlainText(input.descriptionHtml) ||
    null;

  const fromTitleOrBody = inferEmploymentType(input.title, description);
  const fromAts = mapAtsEmploymentType(input.employmentHint);

  // Explicit title internship wins over conflicting ATS "Full-time" metadata.
  let employmentType: EmploymentType | null;
  if (hasInternshipSignal(input.title) || fromTitleOrBody === "internship") {
    employmentType = "internship";
  } else {
    employmentType = fromAts ?? fromTitleOrBody;
  }

  const workMode = inferWorkModeFromText(input.location ?? null, description, {
    isRemote: input.isRemote ?? null,
  });

  const graduationYears =
    inferRoleEligibility(input.title, description) === "post-grad"
      ? null
      : parseGraduationYears(`${input.title}\n${description ?? ""}`);

  return {
    productRoleCategory,
    employmentType,
    workMode,
    graduationYears,
    description,
  };
}
