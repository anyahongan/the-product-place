import type { JobSourceAdapter, RawSourceJob } from "@/lib/ingestion/types";
import { buildDedupeKey } from "@/lib/apply/normalization/dedupe";
import { classifyJobFields, htmlToPlainText } from "@/lib/ingestion/fieldParsing";

type LeverPosting = {
  id?: string;
  text?: string;
  hostedUrl?: string;
  applyUrl?: string;
  createdAt?: number;
  descriptionPlain?: string | null;
  description?: string | null;
  categories?: {
    location?: string | null;
    commitment?: string | null;
    team?: string | null;
  } | null;
  workplaceType?: string | null;
};

/**
 * Lever public postings API.
 * https://api.lever.co/v0/postings/{site}?mode=json
 */
export class LeverBoardAdapter implements JobSourceAdapter {
  readonly sourceType = "ATS_API" as const;
  readonly sourceName: string;
  readonly baseUrl: string;
  readonly companyName: string;
  readonly site: string;

  constructor(input: { companyName: string; site: string }) {
    this.companyName = input.companyName;
    this.site = input.site;
    this.sourceName = `Lever · ${input.companyName}`;
    this.baseUrl = `https://jobs.lever.co/${input.site}`;
  }

  async discover(fetchImpl: typeof fetch = fetch): Promise<RawSourceJob[]> {
    const url = `https://api.lever.co/v0/postings/${encodeURIComponent(this.site)}?mode=json`;
    const res = await fetchImpl(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      throw new Error(`Lever ${this.site}: HTTP ${res.status}`);
    }
    const data = (await res.json()) as LeverPosting[];
    if (!Array.isArray(data)) {
      throw new Error(`Lever ${this.site}: unexpected payload`);
    }

    const out: RawSourceJob[] = [];
    for (const job of data) {
      const title = (job.text ?? "").trim();
      if (!title || !job.id) continue;
      const location = job.categories?.location?.trim() || null;
      const description =
        job.descriptionPlain?.trim() ||
        htmlToPlainText(job.description) ||
        null;
      const fields = classifyJobFields({
        title,
        location,
        descriptionText: description,
        employmentHint: job.categories?.commitment ?? null,
        isRemote: /remote/i.test(job.workplaceType ?? "") || /remote/i.test(location ?? ""),
      });
      if (!fields) continue;

      const applyUrl = (job.applyUrl || job.hostedUrl || "").trim() || null;
      const externalId = `lever:${this.site}:${job.id}`;
      const dedupeKey = buildDedupeKey({
        applyUrl,
        company: this.companyName,
        title,
        location,
      });
      const postedDate =
        typeof job.createdAt === "number"
          ? new Date(job.createdAt).toISOString().slice(0, 10)
          : null;

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
          ats: "lever",
          site: this.site,
        },
      });
    }

    return out;
  }
}
