/**
 * Deterministic job ↔ profile matching.
 *
 * Weights (when a signal is available — unavailable signals are excluded from the denominator):
 *   ROLE                 30  strongest relevance
 *   GRADUATION           25  strong when job lists years; neutral/excluded when unknown
 *   EMPLOYMENT TYPE      15  strong
 *   LOCATION             10  medium
 *   WORK MODE            10  medium when job specifies mode
 *   SKILL OVERLAP        10  light bonus (job descriptions are sparse)
 *
 * Score = (sum earned) / (sum available weights) × 100
 * Coverage = availableWeights / TOTAL_POSSIBLE_WEIGHTS (not hiring confidence)
 * Hard mismatches (e.g. explicit grad ineligibility) apply a score penalty and force LOW tier.
 */

export type MatchSignalType =
  | "role"
  | "graduation"
  | "employment"
  | "workMode"
  | "location"
  | "skill";

export type MatchSignalStatus = "positive" | "neutral" | "negative" | "unknown";

export type MatchSignal = {
  type: MatchSignalType;
  status: MatchSignalStatus;
  label: string;
  /** Weight included in denominator when true */
  available: boolean;
  /** Points earned toward this weight (0..weight) */
  earned: number;
  weight: number;
  hardMismatch?: boolean;
};

export type MatchTier = "STRONG MATCH" | "GOOD MATCH" | "POSSIBLE MATCH" | "LOW MATCH";

export type JobMatchResult = {
  /** 0–100 relevance score (deterministic; not hire probability) */
  score: number;
  tier: MatchTier;
  /** 0–1 fraction of total weight that was available */
  coverage: number;
  /** Count of signals that entered the denominator */
  availableSignalCount: number;
  /** When false, UI should avoid a precise numeric % (sparse job/profile data) */
  showNumeric: boolean;
  signals: MatchSignal[];
  hardMismatch: boolean;
  /** Enough profile data to personalize at all */
  personalized: boolean;
};

export const MATCH_WEIGHTS = {
  role: 30,
  graduation: 25,
  employment: 15,
  location: 10,
  workMode: 10,
  skill: 10,
} as const;

export const TOTAL_POSSIBLE_WEIGHT =
  MATCH_WEIGHTS.role +
  MATCH_WEIGHTS.graduation +
  MATCH_WEIGHTS.employment +
  MATCH_WEIGHTS.location +
  MATCH_WEIGHTS.workMode +
  MATCH_WEIGHTS.skill;

/**
 * Minimum available weight before showing a numeric match %.
 * Role + employment alone (45) is below this — avoids “94 MATCH” on sparse jobs.
 */
export const MIN_WEIGHT_FOR_NUMERIC = 55;

/** Minimum available signal count before showing a numeric match % */
export const MIN_SIGNALS_FOR_NUMERIC = 2;

/** Profile needs at least one target role + one other preference category */
export function profileHasMatchInputs(input: {
  roles: unknown[];
  graduationYear: number | null;
  employmentTypes: unknown[];
  workModes: unknown[];
  locations: unknown[];
  skills: unknown[];
}): boolean {
  if (input.roles.length === 0) return false;
  return (
    input.graduationYear !== null ||
    input.employmentTypes.length > 0 ||
    input.workModes.length > 0 ||
    input.locations.length > 0 ||
    input.skills.length > 0
  );
}

export function tierFromScore(score: number): MatchTier {
  if (score >= 85) return "STRONG MATCH";
  if (score >= 70) return "GOOD MATCH";
  if (score >= 50) return "POSSIBLE MATCH";
  return "LOW MATCH";
}
