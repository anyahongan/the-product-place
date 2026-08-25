export type { JobMatchResult, MatchSignal, MatchTier } from "@/lib/matching/matchTypes";
export {
  MATCH_WEIGHTS,
  TOTAL_POSSIBLE_WEIGHT,
  profileHasMatchInputs,
  tierFromScore,
} from "@/lib/matching/matchTypes";
export { calculateJobMatch, matchPercentForSort, summarizeMatchTiers } from "@/lib/matching/calculateJobMatch";
export { collectProfileSkills, skillOverlap, locationMatches } from "@/lib/matching/normalizeSkills";
