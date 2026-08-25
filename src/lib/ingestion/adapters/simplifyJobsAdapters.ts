import type { JobSourceAdapter, RawSourceJob } from "@/lib/ingestion/types";
import { fetchSimplifyProductJobs } from "@/lib/apply/sources/simplifyJobsHtml";
import type { NormalizedJob } from "@/lib/apply/types";

/** SimplifyJobs Summer2027 — Product Management internship section (HTML tables). */
export class SimplifySummer2027Adapter implements JobSourceAdapter {
  readonly sourceName = "SimplifyJobs Summer2027 (Product)";
  readonly sourceType = "GITHUB_TRACKER" as const;
  readonly baseUrl = "https://github.com/SimplifyJobs/Summer2027-Internships";

  async discover(): Promise<RawSourceJob[]> {
    const { jobs, errors } = await fetchSimplifyProductJobs({
      readmeUrl:
        "https://raw.githubusercontent.com/SimplifyJobs/Summer2027-Internships/dev/README.md",
      sourceName: this.sourceName,
      sourceUrl: this.baseUrl,
      idPrefix: "simplify2027",
      employmentType: "internship",
      sectionHeadingIncludes: ["Product Management Internship"],
    });
    if (jobs.length === 0 && errors.length > 0) {
      throw new Error(`Simplify Summer2027 unavailable. ${errors.join(" · ")}`);
    }
    return jobs.map(toRaw);
  }
}

/** SimplifyJobs New-Grad — Product Management new-grad / early-career section. */
export class SimplifyNewGradAdapter implements JobSourceAdapter {
  readonly sourceName = "SimplifyJobs New-Grad (Product)";
  readonly sourceType = "GITHUB_TRACKER" as const;
  readonly baseUrl = "https://github.com/SimplifyJobs/New-Grad-Positions";

  async discover(): Promise<RawSourceJob[]> {
    const { jobs, errors } = await fetchSimplifyProductJobs({
      readmeUrl:
        "https://raw.githubusercontent.com/SimplifyJobs/New-Grad-Positions/dev/README.md",
      sourceName: this.sourceName,
      sourceUrl: this.baseUrl,
      idPrefix: "simplify-newgrad",
      employmentType: "full-time",
      sectionHeadingIncludes: ["Product Management New Grad"],
    });
    if (jobs.length === 0 && errors.length > 0) {
      throw new Error(`Simplify New-Grad unavailable. ${errors.join(" · ")}`);
    }
    return jobs.map(toRaw);
  }
}

function toRaw(j: NormalizedJob): RawSourceJob {
  return {
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
  };
}
