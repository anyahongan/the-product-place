import type { JobListingView } from "@/lib/apply/types";
import type { UserProfileBundle } from "@/types/profile";
import {
  MATCH_WEIGHTS,
  MIN_SIGNALS_FOR_NUMERIC,
  MIN_WEIGHT_FOR_NUMERIC,
  TOTAL_POSSIBLE_WEIGHT,
  profileHasMatchInputs,
  tierFromScore,
  type JobMatchResult,
  type MatchSignal,
} from "@/lib/matching/matchTypes";
import {
  collectProfileSkills,
  locationMatches,
  skillOverlap,
} from "@/lib/matching/normalizeSkills";

function emptyResult(partial?: Partial<JobMatchResult>): JobMatchResult {
  return {
    score: 0,
    tier: "LOW MATCH",
    coverage: 0,
    availableSignalCount: 0,
    showNumeric: false,
    signals: [],
    hardMismatch: false,
    personalized: false,
    ...partial,
  };
}

/**
 * Calculate explainable match for one job against a Profile bundle.
 * Pure / deterministic — no I/O.
 */
export function calculateJobMatch(
  job: JobListingView,
  bundle: UserProfileBundle,
): JobMatchResult {
  const roles = bundle.targets.roles;
  const employmentTypes = bundle.targets.employmentTypes;
  const workModes = bundle.targets.workModes;
  const locations = bundle.targets.locations.map((l) => l.label);
  const graduationYear = bundle.profile.graduationYear;
  const skills = collectProfileSkills(bundle.experiences.map((e) => e.skills));

  if (
    !profileHasMatchInputs({
      roles,
      graduationYear,
      employmentTypes,
      workModes,
      locations,
      skills,
    })
  ) {
    return emptyResult({
      signals: [
        {
          type: "role",
          status: "unknown",
          label: "Add target roles and preferences in Profile to personalize matches",
          available: false,
          earned: 0,
          weight: 0,
        },
      ],
    });
  }

  const signals: MatchSignal[] = [];
  let hardMismatch = false;

  // —— ROLE ——
  if (roles.length > 0) {
    const w = MATCH_WEIGHTS.role;
    const jobRole = job.productRole;
    if (jobRole === "Other / Unspecified Product") {
      signals.push({
        type: "role",
        status: "neutral",
        label: "Product role category unspecified",
        available: true,
        earned: w * 0.4,
        weight: w,
      });
    } else if (roles.includes(jobRole)) {
      signals.push({
        type: "role",
        status: "positive",
        label: `Target role: ${jobRole}`,
        available: true,
        earned: w,
        weight: w,
      });
    } else {
      signals.push({
        type: "role",
        status: "negative",
        label: `Role is ${jobRole} (outside your targets)`,
        available: true,
        earned: 0,
        weight: w,
      });
    }
  }

  // —— GRADUATION ——
  if (graduationYear !== null) {
    const w = MATCH_WEIGHTS.graduation;
    if (!job.graduationYears.length) {
      signals.push({
        type: "graduation",
        status: "unknown",
        label: "Graduation eligibility not listed",
        available: false,
        earned: 0,
        weight: w,
      });
    } else if (job.graduationYears.includes(graduationYear)) {
      signals.push({
        type: "graduation",
        status: "positive",
        label: `Graduation year ${graduationYear} eligible`,
        available: true,
        earned: w,
        weight: w,
      });
    } else {
      hardMismatch = true;
      signals.push({
        type: "graduation",
        status: "negative",
        label: `Graduation year appears ineligible (job: ${job.graduationYears.join(", ")})`,
        available: true,
        earned: 0,
        weight: w,
        hardMismatch: true,
      });
    }
  }

  // —— EMPLOYMENT ——
  if (employmentTypes.length > 0) {
    const w = MATCH_WEIGHTS.employment;
    if (!job.employmentType) {
      signals.push({
        type: "employment",
        status: "unknown",
        label: "Employment type not specified",
        available: false,
        earned: 0,
        weight: w,
      });
    } else if (employmentTypes.includes(job.employmentType)) {
      signals.push({
        type: "employment",
        status: "positive",
        label: `Employment: ${job.employmentType}`,
        available: true,
        earned: w,
        weight: w,
      });
    } else {
      hardMismatch = true;
      signals.push({
        type: "employment",
        status: "negative",
        label: `Employment is ${job.employmentType} (outside your preferences)`,
        available: true,
        earned: 0,
        weight: w,
        hardMismatch: true,
      });
    }
  }

  // —— WORK MODE ——
  if (workModes.length > 0) {
    const w = MATCH_WEIGHTS.workMode;
    if (!job.workMode) {
      signals.push({
        type: "workMode",
        status: "unknown",
        label: "Work mode not specified",
        available: false,
        earned: 0,
        weight: w,
      });
    } else if (workModes.includes(job.workMode)) {
      signals.push({
        type: "workMode",
        status: "positive",
        label: `Work mode: ${job.workMode}`,
        available: true,
        earned: w,
        weight: w,
      });
    } else {
      hardMismatch = true;
      signals.push({
        type: "workMode",
        status: "negative",
        label: `${job.workMode} role outside your selected work modes`,
        available: true,
        earned: 0,
        weight: w,
        hardMismatch: true,
      });
    }
  }

  // —— LOCATION ——
  if (locations.length > 0) {
    const w = MATCH_WEIGHTS.location;
    const loc = (job.location ?? "").trim();
    const unspecified =
      !loc ||
      loc.toLowerCase() === "location not specified" ||
      loc.toLowerCase() === "unknown";
    if (unspecified) {
      signals.push({
        type: "location",
        status: "unknown",
        label: "Location not specified",
        available: false,
        earned: 0,
        weight: w,
      });
    } else {
      const hit = locations.find((p) => locationMatches(p, loc));
      const remotePref = locations.some((p) => /remote/i.test(p));
      const remoteJob =
        job.workMode === "remote" || loc.toLowerCase().includes("remote");
      if (hit || (remotePref && remoteJob)) {
        signals.push({
          type: "location",
          status: "positive",
          label: hit ? `Preferred location: ${hit}` : "Remote fits your location preferences",
          available: true,
          earned: w,
          weight: w,
        });
      } else {
        signals.push({
          type: "location",
          status: "neutral",
          label: `Location: ${loc}`,
          available: true,
          earned: w * 0.25,
          weight: w,
        });
      }
    }
  }

  // —— SKILLS ——
  if (skills.length > 0) {
    const w = MATCH_WEIGHTS.skill;
    const text = `${job.title} ${job.description}`.trim();
    if (!text) {
      signals.push({
        type: "skill",
        status: "unknown",
        label: "Not enough job text for skill overlap",
        available: false,
        earned: 0,
        weight: w,
      });
    } else {
      const { matched, ratio } = skillOverlap(skills, text);
      if (matched.length > 0) {
        // Light bonus only — absence of overlap does not penalize (descriptions are sparse).
        signals.push({
          type: "skill",
          status: "positive",
          label: `Relevant experience: ${matched.slice(0, 4).join(", ")}`,
          available: true,
          earned: w * ratio,
          weight: w,
        });
      } else {
        signals.push({
          type: "skill",
          status: "neutral",
          label: "No clear skill overlap in title/description",
          available: false,
          earned: 0,
          weight: w,
        });
      }
    }
  }

  const available = signals.filter((s) => s.available);
  const availableWeight = available.reduce((sum, s) => sum + s.weight, 0);
  const earned = available.reduce((sum, s) => sum + s.earned, 0);

  let score = availableWeight > 0 ? (earned / availableWeight) * 100 : 0;
  if (hardMismatch) {
    score = Math.min(score, 42) * 0.85;
  }
  score = Math.max(0, Math.min(100, score));

  const coverage = availableWeight / TOTAL_POSSIBLE_WEIGHT;
  const availableSignalCount = available.length;
  const showNumeric =
    !hardMismatch &&
    availableSignalCount >= MIN_SIGNALS_FOR_NUMERIC &&
    availableWeight >= MIN_WEIGHT_FOR_NUMERIC;

  let tier = tierFromScore(score);
  if (hardMismatch) tier = "LOW MATCH";

  return {
    score,
    tier,
    coverage,
    availableSignalCount,
    showNumeric,
    signals,
    hardMismatch,
    personalized: true,
  };
}

/** Attach display percent for Best Match sort; null when not personalized. */
export function matchPercentForSort(result: JobMatchResult): number | null {
  if (!result.personalized) return null;
  return Math.round(result.score);
}

export function summarizeMatchTiers(
  results: JobMatchResult[],
): { strong: number; good: number; possible: number; low: number } {
  const out = { strong: 0, good: 0, possible: 0, low: 0 };
  for (const r of results) {
    if (!r.personalized) continue;
    if (r.tier === "STRONG MATCH") out.strong += 1;
    else if (r.tier === "GOOD MATCH") out.good += 1;
    else if (r.tier === "POSSIBLE MATCH") out.possible += 1;
    else out.low += 1;
  }
  return out;
}
