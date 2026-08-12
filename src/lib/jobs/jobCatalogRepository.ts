import type { JobListingView, NormalizedJob } from "@/lib/apply/types";
import type { ProductRole } from "@/types/apply";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { loadProductJobs, toJobListingView } from "@/lib/apply/repositories/jobRepository";

type JobRow = {
  id: string;
  company_id: string;
  title: string;
  product_role_category: string;
  location: string | null;
  work_mode: string | null;
  graduation_years: number[] | null;
  employment_type: string | null;
  posted_at: string | null;
  deadline_at: string | null;
  description: string | null;
  canonical_apply_url: string | null;
  canonical_source_url: string | null;
  first_seen_at: string;
  is_active: boolean;
  dedupe_key: string;
  companies?: { name: string } | { name: string }[] | null;
};

function companyName(row: JobRow): string {
  const c = row.companies;
  if (Array.isArray(c)) return c[0]?.name ?? "Unknown";
  return c?.name ?? "Unknown";
}

function rowToNormalized(row: JobRow): NormalizedJob {
  return {
    id: row.id,
    company: companyName(row),
    title: row.title,
    productRoleCategory: row.product_role_category as ProductRole,
    location: row.location,
    workMode: row.work_mode as NormalizedJob["workMode"],
    graduationYears: row.graduation_years,
    employmentType: row.employment_type as NormalizedJob["employmentType"],
    postedDate: row.posted_at,
    firstSeenDate: row.first_seen_at.slice(0, 10),
    deadline: row.deadline_at,
    source: "The Product Place catalog",
    sourceUrl: row.canonical_source_url ?? "",
    applyUrl: row.canonical_apply_url,
    description: row.description,
    status: row.is_active ? "open" : "closed",
    dedupeKey: row.dedupe_key,
    catalogCompanyId: row.company_id,
  };
}

/** Read canonical catalog when Supabase is configured; else live GitHub fallback. */
export async function loadCatalogJobs(): Promise<{
  jobs: JobListingView[];
  warnings: string[];
  source: "supabase" | "live-github";
}> {
  const warnings: string[] = [];

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("jobs")
        .select(
          "id, company_id, title, product_role_category, location, work_mode, graduation_years, employment_type, posted_at, deadline_at, description, canonical_apply_url, canonical_source_url, first_seen_at, is_active, dedupe_key, companies(name)",
        )
        .eq("is_active", true)
        .order("posted_at", { ascending: false, nullsFirst: false });

      if (error) {
        warnings.push(`Catalog unavailable (${error.message}); using live GitHub fallback.`);
      } else if (data && data.length > 0) {
        const jobs = (data as JobRow[]).map((row, i) =>
          toJobListingView(rowToNormalized(row), i),
        );
        return { jobs, warnings, source: "supabase" };
      } else {
        warnings.push(
          "Canonical catalog is empty. Run server ingestion (ingestGitHubJobsFn), then reload.",
        );
      }
    }
  } else {
    warnings.push("Supabase not configured — using live GitHub job feed.");
  }

  const live = await loadProductJobs();
  return { jobs: live.jobs, warnings: [...warnings, ...live.errors], source: "live-github" };
}
