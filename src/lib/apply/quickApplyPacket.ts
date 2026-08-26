import type { UserProfileBundle } from "@/types/profile";

export type QuickApplyCheck = {
  id: string;
  label: string;
  ready: boolean;
  detail: string;
};

export type QuickApplyPacket = {
  checks: QuickApplyCheck[];
  readyCount: number;
  totalCount: number;
  canOpenEmployer: boolean;
  answers: { id: string; label: string; answer: string }[];
  experienceHighlights: { id: string; title: string; organization: string; bullets: string[] }[];
};

/**
 * Assembles a Quick Apply materials packet from stored profile facts only.
 * Does not invent content or call LLMs.
 */
export function buildQuickApplyPacket(
  bundle: UserProfileBundle | null,
  hasApplicationUrl: boolean,
): QuickApplyPacket {
  const profile = bundle?.profile;
  const answers = (bundle?.answers ?? [])
    .filter((a) => a.answer.trim())
    .map((a) => ({ id: a.id, label: a.label, answer: a.answer }));

  const experienceHighlights = (bundle?.experiences ?? []).slice(0, 4).map((exp) => ({
    id: exp.id,
    title: exp.title,
    organization: exp.organization,
    bullets: exp.bullets
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .slice(0, 3)
      .map((b) => b.content),
  }));

  const checks: QuickApplyCheck[] = [
    {
      id: "email",
      label: "Preferred email",
      ready: Boolean(profile?.preferredEmail.trim()),
      detail: profile?.preferredEmail.trim() || "Add in Profile",
    },
    {
      id: "linkedin",
      label: "Your LinkedIn",
      ready: Boolean(profile?.linkedinUrl.trim()),
      detail: profile?.linkedinUrl.trim() || "Add in Profile",
    },
    {
      id: "resume",
      label: "Master resume",
      ready: Boolean(bundle?.masterResume),
      detail: bundle?.masterResume?.originalFilename ?? "Upload in Profile",
    },
    {
      id: "experiences",
      label: "Experience library",
      ready: (bundle?.experiences.length ?? 0) > 0,
      detail:
        (bundle?.experiences.length ?? 0) > 0
          ? `${bundle!.experiences.length} experience${bundle!.experiences.length === 1 ? "" : "s"}`
          : "Add experiences in Profile",
    },
    {
      id: "answers",
      label: "Standard answers",
      ready: answers.length > 0,
      detail:
        answers.length > 0
          ? `${answers.length} answer${answers.length === 1 ? "" : "s"} ready to copy`
          : "Add standard answers in Profile",
    },
    {
      id: "employer-link",
      label: "Employer application link",
      ready: hasApplicationUrl,
      detail: hasApplicationUrl ? "Ready to open" : "No direct link for this role",
    },
  ];

  return {
    checks,
    readyCount: checks.filter((c) => c.ready).length,
    totalCount: checks.length,
    canOpenEmployer: hasApplicationUrl,
    answers,
    experienceHighlights,
  };
}
