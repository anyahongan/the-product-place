import type { JobFiltersState, JobListing } from "@/types/apply";

export function filterAndSortJobs(
  jobs: JobListing[],
  filters: JobFiltersState,
  savedIds: ReadonlySet<string> = new Set(),
): JobListing[] {
  const q = filters.query.trim().toLowerCase();

  let result = jobs.filter((job) => {
    if (filters.savedOnly && !savedIds.has(job.id)) {
      return false;
    }
    if (q) {
      const hay = `${job.company} ${job.title} ${job.productRole} ${job.source}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.productRoles.length > 0 && !filters.productRoles.includes(job.productRole)) {
      return false;
    }
    if (
      filters.graduationYears.length > 0 &&
      !filters.graduationYears.some((year) => job.graduationYears.includes(year))
    ) {
      return false;
    }
    if (filters.locations.length > 0 || filters.locationQuery.trim()) {
      const locSearch = filters.locationQuery.trim().toLowerCase();
      const checklistMatch =
        filters.locations.length > 0 &&
        filters.locations.some((loc) => {
          if (loc === "Remote (US)") {
            return job.workMode === "remote" || job.location.toLowerCase().includes("remote");
          }
          return job.location === loc || job.location.toLowerCase().includes(loc.toLowerCase());
        });
      const searchMatch = locSearch ? job.location.toLowerCase().includes(locSearch) : false;
      if (!checklistMatch && !searchMatch) return false;
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
    if (filters.sort === "opening-date") {
      return b.postedDate.localeCompare(a.postedDate);
    }
    if (filters.sort === "oldest-opening") {
      return a.postedDate.localeCompare(b.postedDate);
    }
    if (filters.sort === "best-match") {
      return b.matchPercent - a.matchPercent;
    }
    if (filters.sort === "company") {
      return a.company.localeCompare(b.company);
    }
    // due-date soonest, nulls last
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return a.deadline.localeCompare(b.deadline);
  });

  return result;
}

export const defaultFilters: JobFiltersState = {
  query: "",
  savedOnly: false,
  productRoles: [],
  graduationYears: [],
  locations: [],
  locationQuery: "",
  workModes: [],
  employmentTypes: [],
  sort: "best-match",
};

export function countActiveFilters(filters: JobFiltersState): number {
  let n = 0;
  if (filters.savedOnly) n += 1;
  if (filters.productRoles.length) n += 1;
  if (filters.graduationYears.length) n += 1;
  if (filters.locations.length || filters.locationQuery.trim()) n += 1;
  if (filters.workModes.length) n += 1;
  if (filters.employmentTypes.length) n += 1;
  if (filters.sort !== "best-match") n += 1;
  if (filters.query.trim()) n += 1;
  return n;
}
