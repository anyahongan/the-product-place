import type { JobSourceAdapter, RawSourceJob } from "@/lib/ingestion/types";
import { buildDedupeKey } from "@/lib/apply/normalization/dedupe";
import { classifyJobFields } from "@/lib/ingestion/fieldParsing";

type GreenhouseJob = {
  id: number | string;
  title?: string;
  absolute_url?: string;
  updated_at?: string;
  content?: string | null;
  location?: { name?: string | null } | null;
  offices?: Array<{ name?: string | null; location?: string | null }>;
  metadata?: Array<{ name?: string; value?: unknown }>;
};

type GreenhouseResponse = { jobs?: GreenhouseJob[] };

function locationFromJob(job: GreenhouseJob): string | null {
  const name = job.location?.name?.trim();
  if (name) return name;
  const offices = (job.offices ?? [])
    .map((o) => o.name || o.location)
    .filter(Boolean)
    .join(", ");
  return offices || null;
}

function employmentHint(job: GreenhouseJob): string | null {
  for (const m of job.metadata ?? []) {
    const n = (m.name ?? "").toLowerCase();
    if (/employ|type|commitment|schedule/.test(n) && m.value != null) {
      return String(m.value);
    }
  }
  return null;
}

/**
 * Official Greenhouse boards API (structured JSON).
 * https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true
 */
export class GreenhouseBoardAdapter implements JobSourceAdapter {
  readonly sourceType = "ATS_API" as const;
  readonly sourceName: string;
  readonly baseUrl: string;
  readonly companyName: string;
  readonly boardToken: string;

  constructor(input: { companyName: string; boardToken: string }) {
    this.companyName = input.companyName;
    this.boardToken = input.boardToken;
    this.sourceName = `Greenhouse · ${input.companyName}`;
    this.baseUrl = `https://boards.greenhouse.io/${input.boardToken}`;
  }

  async discover(fetchImpl: typeof fetch = fetch): Promise<RawSourceJob[]> {
    const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(this.boardToken)}/jobs?content=true`;
    const res = await fetchImpl(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`Greenhouse ${this.boardToken}: HTTP ${res.status}`);
    }
    const data = (await res.json()) as GreenhouseResponse;
    const jobs = data.jobs ?? [];
    const out: RawSourceJob[] = [];

    for (const job of jobs) {
      const title = (job.title ?? "").trim();
      if (!title) continue;
      const location = locationFromJob(job);
      const fields = classifyJobFields({
        title,
        location,
        descriptionHtml: job.content ?? null,
        employmentHint: employmentHint(job),
      });
      if (!fields) continue;

      const applyUrl = job.absolute_url?.trim() || null;
      const externalId = `gh:${this.boardToken}:${job.id}`;
      const dedupeKey = buildDedupeKey({
        applyUrl,
        company: this.companyName,
        title,
        location,
      });
      const postedDate = job.updated_at ? job.updated_at.slice(0, 10) : null;

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
          ats: "greenhouse",
          boardToken: this.boardToken,
        },
      });
    }

    return out;
  }
}
