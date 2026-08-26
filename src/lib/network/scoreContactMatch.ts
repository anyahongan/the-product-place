import type { ApplicationRecord } from "@/lib/apply/types";
import type { MatchReason, NetworkContact } from "@/types/network";
import type { UserProfileBundle } from "@/types/profile";

export type ContactMatchResult = {
  score: number;
  reasons: MatchReason[];
};

function titleHintsProduct(title: string): boolean {
  return /product|pm\b|apm|product manager|product management/i.test(title);
}

function titleHintsRecruiter(title: string, contact: NetworkContact): boolean {
  return contact.isRecruiter || contact.isCampusRecruiter || /recruit|talent|university/i.test(title);
}

/** Rule-based contact ↔ profile/application relevance (no LLM). */
export function scoreContactMatch(
  contact: NetworkContact,
  bundle: UserProfileBundle | null,
  apps: ApplicationRecord[],
): ContactMatchResult {
  const reasons: MatchReason[] = [];
  let score = 0;

  const relatedApp = apps.find(
    (a) =>
      a.companyId === contact.companyId ||
      contact.relatedApplicationIds.includes(a.applicationId),
  );

  if (relatedApp) {
    score += 28;
    reasons.push("Product team");
  }

  if (contact.isCampusRecruiter) {
    score += 22;
    reasons.push("Campus Recruiter");
  } else if (contact.isRecruiter || titleHintsRecruiter(contact.title, contact)) {
    score += 18;
    reasons.push("University Recruiter");
  }

  if (contact.contactType === "PRODUCT MANAGER" || titleHintsProduct(contact.title)) {
    score += 14;
    reasons.push("Product team");
  }

  if (contact.contactType === "FORMER INTERN") {
    score += 12;
    reasons.push("Former intern");
  }

  if (contact.schoolRelationship?.toLowerCase().includes("alum")) {
    score += 16;
    reasons.push("School alum");
  }

  if (contact.connectionDegree === "1st") {
    score += 10;
    reasons.push("Shared professional interest");
  } else if (contact.connectionDegree === "2nd") {
    score += 6;
    reasons.push("2nd-degree connection");
  }

  if (bundle) {
    const school = bundle.profile.school.trim().toLowerCase();
    if (school && contact.schoolRelationship?.toLowerCase().includes(school.split(" ")[0] ?? "")) {
      score += 8;
      if (!reasons.includes("Same major")) reasons.push("Same major");
    }

    const targetRoles = bundle.targets.roles.join(" ").toLowerCase();
    if (targetRoles && titleHintsProduct(contact.title) && targetRoles.includes("product")) {
      score += 8;
      reasons.push("Relevant product area");
    }

    const profileSkills = new Set(
      bundle.experiences.flatMap((e) => e.skills.map((s) => s.toLowerCase())),
    );
    const titleWords = contact.title.toLowerCase().split(/\W+/);
    if (titleWords.some((w) => w.length > 3 && profileSkills.has(w))) {
      score += 6;
      reasons.push("Shared professional interest");
    }
  }

  if (contact.relationshipStatus === "Not contacted") score += 4;

  const uniqueReasons = [...new Set(reasons)].slice(0, 4);
  return {
    score: Math.min(100, score),
    reasons: uniqueReasons.length ? uniqueReasons : ["Shared professional interest"],
  };
}

export function withContactMatchScores(
  contacts: NetworkContact[],
  bundle: UserProfileBundle | null,
  apps: ApplicationRecord[],
): NetworkContact[] {
  return contacts.map((contact) => {
    if (!contact.isRecommended && contact.relationshipStatus !== "Not contacted") {
      return contact;
    }
    const { score, reasons } = scoreContactMatch(contact, bundle, apps);
    return { ...contact, matchScore: score, matchReasons: reasons };
  });
}
