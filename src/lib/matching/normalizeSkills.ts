import { normalizeText } from "@/lib/apply/normalization/dedupe";

/** Minimal controlled aliases — keep small and explicit. */
const SKILL_ALIASES: Record<string, string> = {
  "product analytics": "analytics",
  "ux research": "user research",
  "user research": "user research",
  figma: "figma",
  analytics: "analytics",
};

export function normalizeSkillToken(raw: string): string {
  const n = normalizeText(raw);
  return SKILL_ALIASES[n] ?? n;
}

export function collectProfileSkills(skillLists: string[][]): string[] {
  const out = new Set<string>();
  for (const list of skillLists) {
    for (const s of list) {
      const t = normalizeSkillToken(s);
      if (t.length >= 2) out.add(t);
    }
  }
  return [...out];
}

/**
 * Conservative token overlap against job text.
 * Requires word-boundary-ish matches; rejects single-letter tokens.
 */
export function skillOverlap(
  profileSkills: string[],
  jobText: string,
): { matched: string[]; ratio: number } {
  if (profileSkills.length === 0) return { matched: [], ratio: 0 };
  const hay = ` ${normalizeText(jobText)} `;
  const matched: string[] = [];
  for (const skill of profileSkills) {
    if (skill.length < 2) continue;
    const needle = ` ${skill} `;
    if (hay.includes(needle)) matched.push(skill);
  }
  const denom = Math.min(3, profileSkills.length);
  const ratio = denom === 0 ? 0 : Math.min(1, matched.length / denom);
  return { matched, ratio };
}

export function locationMatches(preferenceLabel: string, jobLocation: string): boolean {
  const pref = normalizeText(preferenceLabel);
  const loc = normalizeText(jobLocation);
  if (!pref || !loc) return false;
  if (pref === "remote" || pref === "remote us") {
    return loc.includes("remote");
  }
  if (loc.includes(pref) || pref.includes(loc)) return true;
  // Simple Bay Area ↔ SF when both sides use common labels
  if (
    (pref.includes("bay area") || pref === "sf bay area") &&
    (loc.includes("san francisco") || loc.includes("sf") || loc.includes("bay area"))
  ) {
    return true;
  }
  if (pref.includes("san francisco") && (loc.includes("san francisco") || loc.includes("sf"))) {
    return true;
  }
  if (pref.includes("new york") && (loc.includes("new york") || loc.includes("nyc"))) {
    return true;
  }
  return false;
}
