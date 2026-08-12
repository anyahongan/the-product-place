import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeText } from "@/lib/apply/normalization/dedupe";
import { buildDedupeKey } from "@/lib/apply/normalization/dedupe";
import type { NormalizedJob } from "@/lib/apply/types";
import type { IngestionSummary, JobSourceAdapter, RawSourceJob } from "@/lib/ingestion/types";

/**
 * Pure upsert pipeline. Callers must pass a server-side Supabase client
 * (see createServiceSupabase in serviceClient.server.ts).
 * Do not read service-role env vars from this module.
 */

function toNormalizedFromRaw(raw: RawSourceJob): NormalizedJob | null {
  const payload = (raw.rawPayload ?? {}) as Partial<NormalizedJob>;
  if (!payload.productRoleCategory && !payload.dedupeKey) {
    // Already filtered by vansh adapter; require product role from payload when present
  }
  const productRoleCategory = payload.productRoleCategory ?? null;
  if (!productRoleCategory) return null;

  const applyUrl = raw.applyUrl ?? null;
  const dedupeKey =
    payload.dedupeKey ??
    buildDedupeKey({
      applyUrl,
      company: raw.company,
      title: raw.title,
      location: raw.location ?? null,
    });

  return {
    id: raw.externalId ?? `ingest:${dedupeKey}`,
    company: raw.company,
    title: raw.title,
    productRoleCategory,
    location: raw.location ?? null,
    workMode: payload.workMode ?? null,
    graduationYears: payload.graduationYears ?? null,
    employmentType: payload.employmentType ?? null,
    postedDate: raw.postedDate ?? null,
    firstSeenDate: new Date().toISOString().slice(0, 10),
    deadline: payload.deadline ?? null,
    source: "Summer2027 Internships (GitHub)",
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
      .map(toNormalizedFromRaw)
      .filter((j): j is NormalizedJob => j != null);
    summary.productJobsFound = normalized.length;

    const byKey = new Map<string, NormalizedJob>();
    for (const job of normalized) {
      if (byKey.has(job.dedupeKey)) summary.duplicatesMerged += 1;
      else byKey.set(job.dedupeKey, job);
    }

    const now = new Date().toISOString();

    for (const job of byKey.values()) {
      try {
        const companyId = await upsertCompany(supabase, job.company);
        const { data: existing } = await supabase
          .from("jobs")
          .select("id, first_seen_at")
          .eq("dedupe_key", job.dedupeKey)
          .maybeSingle();

        let jobId: string;
        if (existing?.id) {
          const { error } = await supabase
            .from("jobs")
            .update({
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

        const sourceUrl = job.sourceUrl || job.applyUrl || `dedupe:${job.dedupeKey}`;
        const { data: srcRec } = await supabase
          .from("job_source_records")
          .select("id")
          .eq("source_id", sourceId)
          .eq("source_url", sourceUrl)
          .maybeSingle();

        if (srcRec?.id) {
          await supabase
            .from("job_source_records")
            .update({
              job_id: jobId,
              external_id: job.id,
              raw_title: job.title,
              raw_company: job.company,
              raw_location: job.location,
              last_seen_at: now,
              updated_at: now,
            })
            .eq("id", srcRec.id);
        } else {
          await supabase.from("job_source_records").insert({
            job_id: jobId,
            source_id: sourceId,
            external_id: job.id,
            source_url: sourceUrl,
            raw_title: job.title,
            raw_company: job.company,
            raw_location: job.location,
            raw_payload: { dedupeKey: job.dedupeKey },
            first_discovered_at: now,
            last_seen_at: now,
          });
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
