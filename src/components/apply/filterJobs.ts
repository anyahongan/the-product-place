import type { JobFiltersState } from "@/types/apply";
import type { JobListingView } from "@/lib/apply/types";

export function filterAndSortJobs(
  jobs: JobListingView[],
  filters: JobFiltersState,
  savedIds: ReadonlySet<string> = new Set(),
): JobListingView[] {
  const q = filters.query.trim().toLowerCase();

  let result = jobs.filter((job) => {
    if (filters.savedOnly && !savedIds.has(job.id)) return false;

    if (q) {
      const hay =
        `${job.company} ${job.title} ${job.location} ${job.productRole} ${job.source}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }

    if (filters.productRoles.length > 0 && !filters.productRoles.includes(job.productRole)) {
      return false;
    }

    if (filters.graduationYears.length > 0) {
      // Unknown years remain visible — source often omits eligibility
      if (
        job.graduationYears.length > 0 &&
        !filters.graduationYears.some((year) => job.graduationYears.includes(year))
      ) {
        return false;
      }
    }

    if (filters.locations.length > 0 || filters.locationQuery.trim()) {
      const locSearch = filters.locationQuery.trim().toLowerCase();
      const checklistMatch =
        filters.locations.length > 0 &&
        filters.locations.some((loc) => {
          if (loc === "Remote (US)") {
            return (
              job.workMode === "remote" || (job.location ?? "").toLowerCase().includes("remote")
            );
          }
          return (job.location ?? "").toLowerCase().includes(loc.toLowerCase());
        });
      const searchMatch = locSearch
        ? (job.location ?? "").toLowerCase().includes(locSearch)
        : false;
      if (!checklistMatch && !searchMatch) return false;
    }

    if (filters.workModes.length > 0) {
      // Unknown work mode stays visible
      if (job.workMode !== null && !filters.workModes.includes(job.workMode)) {
        return false;
      }
    }

    if (filters.employmentTypes.length > 0) {
      if (job.employmentType !== null && !filters.employmentTypes.includes(job.employmentType)) {
        return false;
      }
    }

    return true;
  });

  result = [...result].sort((a, b) => {
    if (filters.sort === "opening-date" || filters.sort === "newest") {
      return (b.postedDate ?? "").localeCompare(a.postedDate ?? "");
    }
    if (filters.sort === "oldest-opening" || filters.sort === "oldest") {
      return (a.postedDate ?? "").localeCompare(b.postedDate ?? "");
    }
    if (filters.sort === "best-match") {
      const am = a.matchPercent ?? -1;
      const bm = b.matchPercent ?? -1;
      if (bm !== am) return bm - am;
      return (b.postedDate ?? "").localeCompare(a.postedDate ?? "");
    }
    if (filters.sort === "company") {
      return a.company.localeCompare(b.company);
    }
    // due-date
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
  sort: "opening-date",
};

export function countActiveFilters(filters: JobFiltersState): number {
  let n = 0;
  if (filters.savedOnly) n += 1;
  if (filters.productRoles.length) n += 1;
  if (filters.graduationYears.length) n += 1;
  if (filters.locations.length || filters.locationQuery.trim()) n += 1;
  if (filters.workModes.length) n += 1;
  if (filters.employmentTypes.length) n += 1;
  if (filters.sort !== "opening-date") n += 1;
  if (filters.query.trim()) n += 1;
  return n;
}
