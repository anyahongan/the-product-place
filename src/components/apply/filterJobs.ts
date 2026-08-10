import type { JobFiltersState, JobListing } from "@/types/apply";

export function filterAndSortJobs(jobs: JobListing[], filters: JobFiltersState): JobListing[] {
  const q = filters.query.trim().toLowerCase();
  const loc = filters.locationQuery.trim().toLowerCase();

  let result = jobs.filter((job) => {
    if (q) {
      const hay = `${job.company} ${job.title} ${job.productRole} ${job.source}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.productRoles.length > 0 && !filters.productRoles.includes(job.productRole)) {
      return false;
    }
    if (filters.graduationYear !== null && !job.graduationYears.includes(filters.graduationYear)) {
      return false;
    }
    if (loc && !job.location.toLowerCase().includes(loc)) {
      return false;
    }
    if (filters.workModes.length > 0 && !filters.workModes.includes(job.workMode)) {
      return false;
    }
    if (
      filters.employmentTypes.length > 0 &&
      !filters.employmentTypes.includes(job.employmentType)
    ) {
      return false;
    }
    return true;
  });

  result = [...result].sort((a, b) => {
    if (filters.sort === "newest") {
      return b.postedDate.localeCompare(a.postedDate);
    }
    if (filters.sort === "oldest") {
      return a.postedDate.localeCompare(b.postedDate);
    }
    // deadline soonest — nulls last
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return a.deadline.localeCompare(b.deadline);
  });

  return result;
}

export const defaultFilters: JobFiltersState = {
  query: "",
  productRoles: [],
  graduationYear: null,
  locationQuery: "",
  workModes: [],
  employmentTypes: [],
  sort: "newest",
};

export function countActiveFilters(filters: JobFiltersState): number {
  let n = 0;
  if (filters.productRoles.length) n += 1;
  if (filters.graduationYear !== null) n += 1;
  if (filters.locationQuery.trim()) n += 1;
  if (filters.workModes.length) n += 1;
  if (filters.employmentTypes.length) n += 1;
  if (filters.sort !== "newest") n += 1;
  return n;
}
