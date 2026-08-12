/**
 * Future multi-source job discovery contracts.
 * LLM/search adapters return CANDIDATES only — never authoritative catalog rows.
 */

export type JobSourceType =
  | "GITHUB_TRACKER"
  | "CURATED_TRACKER"
  | "ATS_API"
  | "EMPLOYER_CAREERS_PAGE"
  | "SEARCH_DISCOVERY"
  | "MANUAL"
  | "AUTHORIZED_JOB_FEED"
  | "OTHER";

export type CandidateStatus =
  | "DISCOVERED"
  | "VERIFYING"
  | "VERIFIED"
  | "DUPLICATE"
  | "REJECTED"
  | "ERROR";

/** Raw row from any source adapter before normalization. */
export type RawSourceJob = {
  externalId?: string | null;
  company: string;
  title: string;
  location?: string | null;
  applyUrl?: string | null;
  sourceUrl?: string | null;
  postedDate?: string | null;
  description?: string | null;
  rawPayload?: Record<string, unknown> | null;
};

export type DiscoveryCriteria = {
  productRoles?: string[];
  employmentTypes?: Array<"internship" | "part-time" | "full-time">;
  graduationYears?: number[];
  location?: string | null;
  workModes?: Array<"remote" | "hybrid" | "in-person">;
  recentlyPostedDays?: number;
};

export type DiscoveryCandidate = {
  discoveredUrl: string;
  reportedCompany?: string | null;
  reportedTitle?: string | null;
  rawDiscoveryPayload?: Record<string, unknown> | null;
};

/**
 * Source adapters implement discover/parse; normalize/verify/dedupe are shared.
 * Scheduling hooks attach here later — do not enable recurring sync yet.
 */
export interface JobSourceAdapter {
  readonly sourceName: string;
  readonly sourceType: JobSourceType;
  readonly baseUrl?: string | null;
  /** Fetch + parse into raw jobs for this source. */
  discover(): Promise<RawSourceJob[]>;
}

/**
 * PLACEHOLDER ONLY — do not call an LLM from this adapter yet.
 * Future: search → candidate URLs → verify → normalize → dedupe → catalog.
 */
export interface SearchDiscoveryAdapter {
  readonly sourceType: "SEARCH_DISCOVERY";
  searchForRecentProductJobs(criteria: DiscoveryCriteria): Promise<DiscoveryCandidate[]>;
}

export class UnimplementedSearchDiscoveryAdapter implements SearchDiscoveryAdapter {
  readonly sourceType = "SEARCH_DISCOVERY" as const;
  async searchForRecentProductJobs(_criteria: DiscoveryCriteria): Promise<DiscoveryCandidate[]> {
    throw new Error(
      "SearchDiscoveryAdapter is not implemented. Do not treat LLM output as canonical jobs.",
    );
  }
}

export type IngestionSummary = {
  source: string;
  recordsParsed: number;
  productJobsFound: number;
  newJobs: number;
  updatedJobs: number;
  duplicatesMerged: number;
  errors: number;
  runId?: string;
  errorMessage?: string;
};
