import type { JobSourceAdapter, RawSourceJob } from "@/lib/ingestion/types";
import { buildDedupeKey } from "@/lib/apply/normalization/dedupe";
import { classifyJobFields } from "@/lib/ingestion/fieldParsing";

type AshbyJob = {
  id?: string;
  title?: string;
  location?: string | null;
  secondaryLocations?: Array<{ location?: string | null }>;
  department?: string | null;
  team?: string | null;
  isRemote?: boolean | null;
  isListed?: boolean | null;
  employmentType?: string | null;
  publishedAt?: string | null;
  jobUrl?: string | null;
  applyUrl?: string | null;
  descriptionHtml?: string | null;
  descriptionPlain?: string | null;
};

type AshbyResponse = { jobs?: AshbyJob[] };

/**
 * Ashby public job board posting API.
 * https://api.ashbyhq.com/posting-api/job-board/{boardName}
 */
export class AshbyBoardAdapter implements JobSourceAdapter {
  readonly sourceType = "ATS_API" as const;
  readonly sourceName: string;
  readonly baseUrl: string;
  readonly companyName: string;
  readonly boardName: string;

  constructor(input: { companyName: string; boardName: string }) {
    this.companyName = input.companyName;
    this.boardName = input.boardName;
    this.sourceName = `Ashby · ${input.companyName}`;
    this.baseUrl = `https://jobs.ashbyhq.com/${input.boardName}`;
  }

  async discover(fetchImpl: typeof fetch = fetch): Promise<RawSourceJob[]> {
    const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(this.boardName)}`;
    const res = await fetchImpl(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      throw new Error(`Ashby ${this.boardName}: HTTP ${res.status}`);
    }
    const data = (await res.json()) as AshbyResponse;
    const jobs = data.jobs ?? [];
    const out: RawSourceJob[] = [];

    for (const job of jobs) {
      if (job.isListed === false) continue;
      const title = (job.title ?? "").trim();
      if (!title || !job.id) continue;

      const secondary = (job.secondaryLocations ?? [])
        .map((l) => l.location)
        .filter(Boolean)
        .join(", ");
      const location =
        [job.location, secondary].filter(Boolean).join(", ").trim() || null;

      const fields = classifyJobFields({
        title,
        location,
        descriptionHtml: job.descriptionHtml ?? null,
        descriptionText: job.descriptionPlain ?? null,
        employmentHint: job.employmentType ?? null,
        isRemote: job.isRemote ?? null,
      });
      if (!fields) continue;

      const applyUrl = (job.applyUrl || job.jobUrl || "").trim() || null;
      const externalId = `ashby:${this.boardName}:${job.id}`;
      const dedupeKey = buildDedupeKey({
        applyUrl,
        company: this.companyName,
        title,
        location,
      });
      const postedDate = job.publishedAt ? job.publishedAt.slice(0, 10) : null;

      out.push({
        externalId,
        company: this.companyName,
        title,
        location,
        applyUrl,
        sourceUrl: this.baseUrl,
        postedDate,
        description: fields.description,
        rawPayload: {
          productRoleCategory: fields.productRoleCategory,
          employmentType: fields.employmentType,
          workMode: fields.workMode,
          graduationYears: fields.graduationYears,
          dedupeKey,
          status: "open",
          ats: "ashby",
          boardName: this.boardName,
        },
      });
    }

    return out;
  }
}
