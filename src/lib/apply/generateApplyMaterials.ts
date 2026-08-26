import type { UserProfileBundle } from "@/types/profile";

export type ApplyMaterialsInput = {
  profile: UserProfileBundle["profile"];
  experiences: UserProfileBundle["experiences"];
  standardAnswers: UserProfileBundle["answers"];
  networkInsights: { text: string; contactName: string | null }[];
  job: {
    company: string;
    title: string;
    description: string;
    productRole: string;
    responsibilities: string[];
  };
};

export type ApplyMaterialsResult = {
  resumeText: string;
  coverLetterText: string;
  tailoringNotes: string[];
  source: "ai" | "coach";
};

function displayName(profile: ApplyMaterialsInput["profile"]): string {
  return profile.preferredName.trim() || "Candidate";
}

function schoolLine(profile: ApplyMaterialsInput["profile"]): string {
  const parts = [
    profile.school.trim(),
    profile.major.trim() ? profile.major.trim() : null,
    profile.graduationYear ? `Class of ${profile.graduationYear}` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

function contactLine(profile: ApplyMaterialsInput["profile"]): string {
  return [profile.preferredEmail.trim(), profile.linkedinUrl.trim(), profile.phone.trim()]
    .filter(Boolean)
    .join(" · ");
}

function scoreExperience(
  exp: ApplyMaterialsInput["experiences"][number],
  job: ApplyMaterialsInput["job"],
): number {
  const hay = `${exp.title} ${exp.organization} ${exp.skills.join(" ")} ${exp.bullets.map((b) => b.content).join(" ")}`.toLowerCase();
  let score = 0;
  if (hay.includes(job.company.toLowerCase())) score += 3;
  if (hay.includes(job.productRole.toLowerCase())) score += 2;
  for (const word of job.title.toLowerCase().split(/\s+/)) {
    if (word.length > 3 && hay.includes(word)) score += 1;
  }
  return score;
}

export function generateApplyMaterialsLocally(input: ApplyMaterialsInput): ApplyMaterialsResult {
  const name = displayName(input.profile);
  const ranked = [...input.experiences].sort(
    (a, b) => scoreExperience(b, input.job) - scoreExperience(a, input.job),
  );

  const resumeLines: string[] = [
    name.toUpperCase(),
    schoolLine(input.profile),
    contactLine(input.profile),
    "",
    "EXPERIENCE",
  ];

  for (const exp of ranked.slice(0, 5)) {
    resumeLines.push("");
    resumeLines.push(`${exp.title} · ${exp.organization}`);
    const bullets = [...exp.bullets].sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 4);
    for (const bullet of bullets) {
      resumeLines.push(`• ${bullet.content}`);
    }
  }

  if (ranked.length === 0) {
    resumeLines.push("Add experiences in Profile to populate this resume draft.");
  }

  const whyAnswer =
    input.standardAnswers.find((a) => /why|interest|company/i.test(a.label))?.answer.trim() ?? "";
  const introParagraph = whyAnswer
    ? whyAnswer
    : `I am excited to apply for the ${input.job.title} role at ${input.job.company}. My background in ${input.profile.major || "product"} and hands-on product work aligns with the responsibilities listed in the posting.`;

  const proofBullets = ranked
    .flatMap((exp) =>
      [...exp.bullets]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .slice(0, 1)
        .map((b) => `• At ${exp.organization}, ${b.content}`),
    )
    .slice(0, 3);

  const coverLetterLines = [
    `${input.job.company} Hiring Team`,
    "",
    `Dear ${input.job.company} team,`,
    "",
    introParagraph,
    "",
    ...(proofBullets.length
      ? ["Relevant highlights from my experience:", ...proofBullets, ""]
      : []),
    `I would welcome the opportunity to contribute to ${input.job.title} and learn from the team.`,
    "",
    "Thank you for your consideration,",
    name,
  ];

  const tailoringNotes = [
    `Prioritized ${ranked.length} experience${ranked.length === 1 ? "" : "s"} for ${input.job.productRole} at ${input.job.company}.`,
    input.networkInsights.length
      ? `Included ${input.networkInsights.length} network insight${input.networkInsights.length === 1 ? "" : "s"} marked for application materials.`
      : "Add Network notes marked for application materials to enrich future drafts.",
  ];

  return {
    resumeText: resumeLines.join("\n"),
    coverLetterText: coverLetterLines.join("\n"),
    tailoringNotes,
    source: "coach",
  };
}

export function applyMaterialsFactsPayload(input: ApplyMaterialsInput): string {
  return JSON.stringify(
    {
      profile: {
        name: displayName(input.profile),
        school: input.profile.school,
        major: input.profile.major,
        graduationYear: input.profile.graduationYear,
        email: input.profile.preferredEmail,
        linkedin: input.profile.linkedinUrl,
      },
      experiences: input.experiences.map((exp) => ({
        title: exp.title,
        organization: exp.organization,
        skills: exp.skills,
        bullets: exp.bullets
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((b) => b.content),
      })),
      standardAnswers: input.standardAnswers.map((a) => ({
        label: a.label,
        answer: a.answer,
      })),
      networkInsights: input.networkInsights,
      job: input.job,
    },
    null,
    2,
  );
}
