import type { ExperienceType } from "@/types/profile";

export type ParsedResumeExperience = {
  experienceType: ExperienceType;
  organization: string;
  title: string;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent?: boolean;
  summary?: string | null;
  skills?: string[];
  bullets: string[];
};

const VALID_TYPES = new Set<ExperienceType>([
  "work",
  "internship",
  "project",
  "leadership",
  "research",
  "extracurricular",
  "volunteer",
  "other",
]);

export function resumeExperienceKey(organization: string, title: string): string {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  return `${norm(organization)}|${norm(title)}`;
}

/** Normalize YYYY, YYYY-MM, or YYYY-MM-DD to a date string Postgres accepts. */
export function normalizeResumeDate(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const t = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  if (/^\d{4}-\d{2}$/.test(t)) return `${t}-01`;
  if (/^\d{4}$/.test(t)) return `${t}-01-01`;
  return null;
}

export function normalizeParsedExperience(raw: Record<string, unknown>): ParsedResumeExperience | null {
  const organization = String(raw["organization"] ?? "").trim();
  const title = String(raw["title"] ?? "").trim();
  if (!organization || !title) return null;

  const typeRaw = String(raw["experienceType"] ?? raw["type"] ?? "work").toLowerCase();
  const experienceType = VALID_TYPES.has(typeRaw as ExperienceType)
    ? (typeRaw as ExperienceType)
    : inferExperienceType(title, organization);

  const bullets = Array.isArray(raw["bullets"])
    ? raw["bullets"].map((b) => String(b).trim()).filter(Boolean)
    : [];

  const isCurrent =
    Boolean(raw["isCurrent"]) ||
    String(raw["endDate"] ?? "").toLowerCase() === "present" ||
    String(raw["endDate"] ?? "").toLowerCase() === "current";

  return {
    experienceType,
    organization,
    title,
    location: String(raw["location"] ?? "").trim() || null,
    startDate: normalizeResumeDate(
      typeof raw["startDate"] === "string" ? raw["startDate"] : null,
    ),
    endDate: isCurrent
      ? null
      : normalizeResumeDate(typeof raw["endDate"] === "string" ? raw["endDate"] : null),
    isCurrent,
    summary: String(raw["summary"] ?? "").trim() || null,
    skills: Array.isArray(raw["skills"])
      ? raw["skills"].map((s) => String(s).trim()).filter(Boolean)
      : [],
    bullets,
  };
}

function inferExperienceType(title: string, organization: string): ExperienceType {
  const hay = `${title} ${organization}`.toLowerCase();
  if (hay.includes("intern")) return "internship";
  if (hay.includes("research") || hay.includes("lab")) return "research";
  if (hay.includes("project")) return "project";
  if (hay.includes("president") || hay.includes("lead") || hay.includes("director")) {
    return "leadership";
  }
  if (hay.includes("volunteer")) return "volunteer";
  return "work";
}

export function buildResumeParsePrompt(resumeText: string): string {
  return `RESUME TEXT (extract experiences from this only — do not invent facts):
"""
${resumeText.slice(0, 120_000)}
"""`;
}

export const RESUME_PARSE_SYSTEM = `You extract structured work experience from resume text for a student PM applicant fact bank.
Return JSON: {
  "experiences": [{
    "experienceType": "work"|"internship"|"project"|"leadership"|"research"|"extracurricular"|"volunteer"|"other",
    "organization": string,
    "title": string,
    "location": string|null,
    "startDate": "YYYY-MM-DD"|"YYYY-MM"|"YYYY"|null,
    "endDate": "YYYY-MM-DD"|"YYYY-MM"|"YYYY"|null,
    "isCurrent": boolean,
    "summary": string|null,
    "skills": string[],
    "bullets": string[]
  }]
}
Rules:
- Extract ONLY roles and bullets explicitly present in the resume text.
- Do NOT invent metrics, employers, titles, or accomplishments.
- Preserve bullet wording as closely as possible (light cleanup ok).
- Order experiences as they appear on the resume (usually reverse chronological).
- Use "internship" when the title or context indicates intern.
- If end date is Present/Current, set isCurrent true and endDate null.
- Return an empty experiences array if none found.`;
