import type { JobListingView, NormalizedJob } from "@/lib/apply/types";
import type { ToneName } from "@/types/apply";
import { fetchVansh2027Jobs } from "@/lib/apply/sources/vansh2027";

const TONES: ToneName[] = ["blue", "green", "yellow", "purple"];

export function toJobListingView(job: NormalizedJob, index = 0): JobListingView {
  return {
    id: job.id,
    company: job.company,
    title: job.title,
    productRole: job.productRoleCategory ?? "Other / Unspecified Product",
    location: job.location ?? "Location not specified",
    workMode: job.workMode,
    graduationYears: job.graduationYears ?? [],
    employmentType: job.employmentType,
    postedDate: job.postedDate,
    deadline: job.deadline,
    status: job.status === "closed" ? "closed" : job.status === "open" ? "open" : "unknown",
    matchPercent: null,
    source: job.source,
    sourceUrl: job.sourceUrl,
    applicationUrl: job.applyUrl ?? "",
    description:
      job.description ??
      `${job.title} at ${job.company}. Sourced from ${job.source}. Full details are on the employer application page.`,
    responsibilities: [],
    requirements: [],
    tone: TONES[index % TONES.length]!,
    closed: job.status === "closed",
  };
}

export async function loadProductJobs(): Promise<{
  jobs: JobListingView[];
  errors: string[];
}> {
  const { jobs, errors } = await fetchVansh2027Jobs();
  const views = jobs
    .slice()
    .sort((a, b) => (b.postedDate ?? "").localeCompare(a.postedDate ?? ""))
    .map((job, i) => toJobListingView(job, i));
  return { jobs: views, errors };
}
