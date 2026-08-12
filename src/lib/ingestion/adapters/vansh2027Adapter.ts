import type { JobSourceAdapter, RawSourceJob } from "@/lib/ingestion/types";
import { fetchVansh2027Jobs } from "@/lib/apply/sources/vansh2027";
import type { NormalizedJob } from "@/lib/apply/types";

/** First canonical source: existing GitHub internship tracker. */
export class Vansh2027GitHubAdapter implements JobSourceAdapter {
  readonly sourceName = "Summer2027 Internships (GitHub)";
  readonly sourceType = "GITHUB_TRACKER" as const;
  readonly baseUrl = "https://github.com/vanshb03/Summer2027-Internships";

  async discover(): Promise<RawSourceJob[]> {
    const { jobs } = await fetchVansh2027Jobs();
    return jobs.map((j: NormalizedJob) => ({
      externalId: j.id,
      company: j.company,
      title: j.title,
      location: j.location,
      applyUrl: j.applyUrl,
      sourceUrl: j.sourceUrl,
      postedDate: j.postedDate,
      description: j.description,
      rawPayload: {
        workMode: j.workMode,
        employmentType: j.employmentType,
        graduationYears: j.graduationYears,
        deadline: j.deadline,
        productRoleCategory: j.productRoleCategory,
        dedupeKey: j.dedupeKey,
        status: j.status,
      },
    }));
  }
}
