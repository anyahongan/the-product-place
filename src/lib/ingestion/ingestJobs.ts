import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkMode } from "@/types/apply";
import {
  buildRoleDedupeKey,
  canonicalizeJobTitle,
  mergeLocations,
  normalizeText,
  preferApplyUrl,
} from "@/lib/apply/normalization/dedupe";
import type { NormalizedJob } from "@/lib/apply/types";
import type { IngestionSummary, JobSourceAdapter, RawSourceJob } from "@/lib/ingestion/types";

/**
 * Pure upsert pipeline. Callers must pass a server-side Supabase client
 * (see createServiceSupabase in serviceClient.server.ts).
 * Do not read service-role env vars from this module.
 */

function longerText(a: string | null, b: string | null): string | null {
  const left = a?.trim() ?? "";
  const right = b?.trim() ?? "";
  if (!left) return right || null;
  if (!right) return left || null;
  return right.length > left.length ? right : left;
}

function mergeWorkModes(a: WorkMode | null, b: WorkMode | null): WorkMode | null {
  if (a && b && a !== b) {
    // Distinct explicit modes across locations → treat as hybrid when remote involved
    if (a === "remote" || b === "remote") return "hybrid";
    return a;
  }
  return a ?? b;
}

function mergeGraduationYears(
  a: number[] | null,
  b: number[] | null,
): number[] | null {
  const set = new Set<number>([...(a ?? []), ...(b ?? [])]);
  if (set.size === 0) return null;
  return [...set].sort((x, y) => x - y);
}

/** Merge two postings of the same role (typically different locations). */
export function mergeNormalizedJobs(a: NormalizedJob, b: NormalizedJob): NormalizedJob {
  return {
    ...a,
    title: canonicalizeJobTitle(a.title) || canonicalizeJobTitle(b.title) || a.title,
    location: mergeLocations(a.location, b.location),
    workMode: mergeWorkModes(a.workMode, b.workMode),
    graduationYears: mergeGraduationYears(a.graduationYears, b.graduationYears),
    employmentType: a.employmentType ?? b.employmentType,
    postedDate:
      a.postedDate && b.postedDate
        ? a.postedDate <= b.postedDate
          ? a.postedDate
          : b.postedDate
        : (a.postedDate ?? b.postedDate),
    deadline: a.deadline ?? b.deadline,
    applyUrl: preferApplyUrl(a.applyUrl, b.applyUrl),
    description: longerText(a.description, b.description),
    sourceUrl: a.sourceUrl || b.sourceUrl,
    status: a.status === "closed" && b.status === "closed" ? "closed" : "open",
    // Keep first external id; source records still store each ATS id separately when present
    id: a.id || b.id,
    dedupeKey: a.dedupeKey,
  };
}

function toNormalizedFromRaw(
  raw: RawSourceJob,
  sourceName: string,
): NormalizedJob | null {
  const payload = (raw.rawPayload ?? {}) as Partial<NormalizedJob>;
  const productRoleCategory = payload.productRoleCategory ?? null;
  if (!productRoleCategory) return null;

  const title = canonicalizeJobTitle(raw.title);
  const applyUrl = raw.applyUrl ?? null;
  // Always role-based — ignore per-location / per-URL keys from adapters
  const dedupeKey = buildRoleDedupeKey(raw.company, title);

  return {
    id: raw.externalId ?? `ingest:${dedupeKey}`,
    company: raw.company,
    title,
    productRoleCategory,
    location: raw.location ?? null,
    workMode: payload.workMode ?? null,
    graduationYears: payload.graduationYears ?? null,
    employmentType: payload.employmentType ?? null,
    postedDate: raw.postedDate ?? null,
    firstSeenDate: new Date().toISOString().slice(0, 10),
    deadline: payload.deadline ?? null,
    source: sourceName,
    sourceUrl: raw.sourceUrl ?? "",
    applyUrl,
    description: raw.description ?? null,
    status: (payload.status as NormalizedJob["status"]) ?? "open",
    dedupeKey,
  };
}

async function upsertCompany(
  supabase: SupabaseClient,
  name: string,
): Promise<string> {
  const normalized = normalizeText(name);
  const { data: existing } = await supabase
    .from("companies")
    .select("id")
    .eq("normalized_name", normalized)
    .maybeSingle();
  if (existing?.id) return existing.id as string;

  const { data, error } = await supabase
    .from("companies")
    .insert({ name, normalized_name: normalized })
    .select("id")
    .single();
  if (error) {
    const { data: again } = await supabase
      .from("companies")
      .select("id")
      .eq("normalized_name", normalized)
      .single();
    if (again?.id) return again.id as string;
    throw error;
  }
  return data.id as string;
}

async function ensureSource(
  supabase: SupabaseClient,
  adapter: JobSourceAdapter,
): Promise<string> {
  const { data: existing } = await supabase
    .from("job_sources")
    .select("id")
    .eq("name", adapter.sourceName)
    .maybeSingle();
  if (existing?.id) return existing.id as string;

  const { data, error } = await supabase
    .from("job_sources")
    .insert({
      name: adapter.sourceName,
      source_type: adapter.sourceType,
      base_url: adapter.baseUrl ?? null,
      is_active: true,
      trust_priority: 10,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

/**
 * SOURCE ADAPTER → NORMALIZE → DEDUPE → UPSERT companies/jobs/source records.
 * Scheduling should call this function later — do not auto-schedule yet.
 */
export async function ingestJobsFromAdapter(
  adapter: JobSourceAdapter,
  supabase: SupabaseClient,
): Promise<IngestionSummary> {
  const summary: IngestionSummary = {
    source: adapter.sourceName,
    recordsParsed: 0,
    productJobsFound: 0,
    newJobs: 0,
    updatedJobs: 0,
    duplicatesMerged: 0,
    errors: 0,
  };

  const sourceId = await ensureSource(supabase, adapter);
  const { data: run, error: runErr } = await supabase
    .from("job_discovery_runs")
    .insert({ source_id: sourceId, status: "RUNNING" })
    .select("id")
    .single();
  if (runErr) throw runErr;
  summary.runId = run.id as string;

  try {
    const rawJobs = await adapter.discover();
    summary.recordsParsed = rawJobs.length;

    const normalized = rawJobs
      .map((raw) => toNormalizedFromRaw(raw, adapter.sourceName))
      .filter((j): j is NormalizedJob => j != null);
    summary.productJobsFound = normalized.length;

    const byKey = new Map<string, NormalizedJob>();
    for (const job of normalized) {
      const existing = byKey.get(job.dedupeKey);
      if (existing) {
        summary.duplicatesMerged += 1;
        byKey.set(job.dedupeKey, mergeNormalizedJobs(existing, job));
      } else {
        byKey.set(job.dedupeKey, job);
      }
    }

    const now = new Date().toISOString();

    for (const job of byKey.values()) {
      try {
        const companyId = await upsertCompany(supabase, job.company);
        const { data: existing } = await supabase
          .from("jobs")
          .select("id, first_seen_at, location, work_mode, description, canonical_apply_url")
          .eq("dedupe_key", job.dedupeKey)
          .maybeSingle();

        let jobId: string;
        if (existing?.id) {
          const mergedLocation = mergeLocations(
            existing.location as string | null,
            job.location,
          );
          const mergedApply = preferApplyUrl(
            (existing.canonical_apply_url as string | null) ?? null,
            job.applyUrl,
          );
          const mergedDesc = longerText(
            (existing.description as string | null) ?? null,
            job.description,
          );
          const { error } = await supabase
            .from("jobs")
            .update({
              company_id: companyId,
              title: job.title,
              normalized_title: normalizeText(job.title),
              product_role_category: job.productRoleCategory,
              location: mergedLocation,
              normalized_location: mergedLocation ? normalizeText(mergedLocation) : null,
              work_mode: mergeWorkModes(
                (existing.work_mode as WorkMode | null) ?? null,
                job.workMode,
              ),
              graduation_years: job.graduationYears,
              employment_type: job.employmentType,
              posted_at: job.postedDate,
              deadline_at: job.deadline,
              description: mergedDesc,
              canonical_apply_url: mergedApply,
              canonical_source_url: job.sourceUrl || null,
              last_seen_at: now,
              is_active: job.status !== "closed",
              updated_at: now,
            })
            .eq("id", existing.id);
          if (error) throw error;
          jobId = existing.id as string;
          summary.updatedJobs += 1;
        } else {
          const { data: inserted, error } = await supabase
            .from("jobs")
            .insert({
              company_id: companyId,
              title: job.title,
              normalized_title: normalizeText(job.title),
              product_role_category: job.productRoleCategory,
              location: job.location,
              normalized_location: job.location ? normalizeText(job.location) : null,
              work_mode: job.workMode,
              graduation_years: job.graduationYears,
              employment_type: job.employmentType,
              posted_at: job.postedDate,
              deadline_at: job.deadline,
              description: job.description,
              canonical_apply_url: job.applyUrl,
              canonical_source_url: job.sourceUrl || null,
              first_seen_at: now,
              last_seen_at: now,
              is_active: job.status !== "closed",
              dedupe_key: job.dedupeKey,
            })
            .select("id")
            .single();
          if (error) throw error;
          jobId = inserted.id as string;
          summary.newJobs += 1;
        }

        // Attribution URL (may repeat across jobs from the same tracker page).
        const sourceUrl =
          job.applyUrl || job.sourceUrl || `provenance:${job.dedupeKey}`;
        const externalId = job.id;

        // Identity: prefer (source_id, external_id), else (source_id, job_id).
        let srcRec: { id: string } | null = null;
        if (externalId) {
          const byExternal = await supabase
            .from("job_source_records")
            .select("id")
            .eq("source_id", sourceId)
            .eq("external_id", externalId)
            .maybeSingle();
          if (byExternal.error) throw byExternal.error;
          srcRec = byExternal.data;
        }
        if (!srcRec?.id) {
          const byJob = await supabase
            .from("job_source_records")
            .select("id")
            .eq("source_id", sourceId)
            .eq("job_id", jobId)
            .maybeSingle();
          if (byJob.error) throw byJob.error;
          srcRec = byJob.data;
        }

        if (srcRec?.id) {
          const { error: srcUpdErr } = await supabase
            .from("job_source_records")
            .update({
              job_id: jobId,
              external_id: externalId,
              source_url: sourceUrl,
              raw_title: job.title,
              raw_company: job.company,
              raw_location: job.location,
              raw_payload: { dedupeKey: job.dedupeKey },
              last_seen_at: now,
              updated_at: now,
            })
            .eq("id", srcRec.id);
          if (srcUpdErr) throw srcUpdErr;
        } else {
          const { error: srcInsErr } = await supabase.from("job_source_records").insert({
            job_id: jobId,
            source_id: sourceId,
            external_id: externalId,
            source_url: sourceUrl,
            raw_title: job.title,
            raw_company: job.company,
            raw_location: job.location,
            raw_payload: { dedupeKey: job.dedupeKey },
            first_discovered_at: now,
            last_seen_at: now,
          });
          if (srcInsErr) throw srcInsErr;
        }
      } catch {
        summary.errors += 1;
      }
    }

    await supabase
      .from("job_discovery_runs")
      .update({
        completed_at: now,
        status: "SUCCEEDED",
        records_discovered: summary.recordsParsed,
        records_verified: summary.productJobsFound,
        records_inserted: summary.newJobs,
        records_updated: summary.updatedJobs,
        records_deduplicated: summary.duplicatesMerged,
        records_rejected: summary.errors,
        metadata: { adapter: adapter.sourceType },
      })
      .eq("id", summary.runId);

    return summary;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ingestion failed";
    summary.errors += 1;
    summary.errorMessage = message;
    await supabase
      .from("job_discovery_runs")
      .update({
        completed_at: new Date().toISOString(),
        status: "FAILED",
        error_message: message,
        records_discovered: summary.recordsParsed,
        records_verified: summary.productJobsFound,
        records_inserted: summary.newJobs,
        records_updated: summary.updatedJobs,
        records_deduplicated: summary.duplicatesMerged,
        records_rejected: summary.errors,
      })
      .eq("id", summary.runId);
    return summary;
  }
}
