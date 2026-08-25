/**
 * Consolidate live catalog onto role-based dedupe keys:
 * company + canonical title → one job with merged locations.
 *
 * - Merges duplicate location postings
 * - Rewrites dedupe_key to role:…
 * - Deactivates superseded rows
 * - Re-points job_source_records to the survivor
 *
 * Never prints secrets.
 * Run: npx --yes tsx --tsconfig tsconfig.json scripts/consolidate-role-dedupe.ts
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import {
  buildRoleDedupeKey,
  canonicalizeJobTitle,
  mergeLocations,
  normalizeText,
  preferApplyUrl,
} from "../src/lib/apply/normalization/dedupe";
import type { WorkMode } from "../src/types/apply";

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    const key = m[1]!;
    let val = m[2]!;
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

function createService() {
  const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
  const key =
    process.env["SUPABASE_SECRET_KEY"] || process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("Missing SUPABASE_URL / SUPABASE_SECRET_KEY");
  if (key === process.env["VITE_SUPABASE_PUBLISHABLE_KEY"]) {
    throw new Error("Refusing to use publishable key as service role");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type JobRow = {
  id: string;
  company_id: string;
  title: string;
  location: string | null;
  work_mode: WorkMode | null;
  description: string | null;
  canonical_apply_url: string | null;
  canonical_source_url: string | null;
  product_role_category: string | null;
  employment_type: string | null;
  graduation_years: number[] | null;
  posted_at: string | null;
  first_seen_at: string;
  is_active: boolean;
  dedupe_key: string;
};

async function main() {
  const supabase = createService();
  const { data: companies, error: coErr } = await supabase
    .from("companies")
    .select("id, name");
  if (coErr) throw coErr;
  const companyName = new Map(
    (companies ?? []).map((c) => [c.id as string, c.name as string]),
  );

  const { data: jobs, error: jobErr } = await supabase
    .from("jobs")
    .select(
      "id, company_id, title, location, work_mode, description, canonical_apply_url, canonical_source_url, product_role_category, employment_type, graduation_years, posted_at, first_seen_at, is_active, dedupe_key",
    )
    .eq("is_active", true)
    .limit(5000);
  if (jobErr) throw jobErr;

  const groups = new Map<string, JobRow[]>();
  for (const j of (jobs ?? []) as JobRow[]) {
    const company = companyName.get(j.company_id) ?? j.company_id;
    const key = buildRoleDedupeKey(company, j.title);
    const list = groups.get(key) ?? [];
    list.push(j);
    groups.set(key, list);
  }

  let mergedGroups = 0;
  let deactivated = 0;
  let rewritten = 0;
  const now = new Date().toISOString();

  for (const [roleKey, group] of groups) {
    // Prefer earliest first_seen as survivor
    group.sort((a, b) => a.first_seen_at.localeCompare(b.first_seen_at));
    const survivor = group[0]!;
    const company = companyName.get(survivor.company_id) ?? "";
    const title = canonicalizeJobTitle(survivor.title);

    let location = survivor.location;
    let applyUrl = survivor.canonical_apply_url;
    let description = survivor.description;
    let workMode = survivor.work_mode;
    for (const other of group.slice(1)) {
      location = mergeLocations(location, other.location);
      applyUrl = preferApplyUrl(applyUrl, other.canonical_apply_url);
      if ((other.description ?? "").length > (description ?? "").length) {
        description = other.description;
      }
      if (!workMode) workMode = other.work_mode;
      else if (other.work_mode && other.work_mode !== workMode) {
        if (workMode === "remote" || other.work_mode === "remote") workMode = "hybrid";
      }
    }

    const { error: updErr } = await supabase
      .from("jobs")
      .update({
        title,
        normalized_title: normalizeText(title),
        location,
        normalized_location: location ? normalizeText(location) : null,
        work_mode: workMode,
        description,
        canonical_apply_url: applyUrl,
        dedupe_key: roleKey,
        updated_at: now,
      })
      .eq("id", survivor.id);
    if (updErr) {
      // Collision: another row already owns roleKey — fold into that row instead
      const { data: owner } = await supabase
        .from("jobs")
        .select("id, location, work_mode, description, canonical_apply_url, first_seen_at")
        .eq("dedupe_key", roleKey)
        .maybeSingle();
      if (owner?.id && owner.id !== survivor.id) {
        const loc = mergeLocations(owner.location as string | null, location);
        await supabase
          .from("jobs")
          .update({
            title,
            normalized_title: normalizeText(title),
            location: loc,
            normalized_location: loc ? normalizeText(loc) : null,
            work_mode: (owner.work_mode as WorkMode | null) ?? workMode,
            description:
              ((owner.description as string | null) ?? "").length >= (description ?? "").length
                ? owner.description
                : description,
            canonical_apply_url: preferApplyUrl(
              (owner.canonical_apply_url as string | null) ?? null,
              applyUrl,
            ),
            updated_at: now,
          })
          .eq("id", owner.id);
        for (const row of group) {
          if (row.id === owner.id) continue;
          await supabase
            .from("job_source_records")
            .update({ job_id: owner.id, updated_at: now })
            .eq("job_id", row.id);
          await supabase
            .from("jobs")
            .update({ is_active: false, updated_at: now })
            .eq("id", row.id);
          deactivated += 1;
        }
        mergedGroups += 1;
        continue;
      }
      console.error("update failed for", company, title, updErr.message);
      continue;
    }
    rewritten += 1;

    if (group.length > 1) {
      mergedGroups += 1;
      for (const other of group.slice(1)) {
        await supabase
          .from("job_source_records")
          .update({ job_id: survivor.id, updated_at: now })
          .eq("job_id", other.id);
        await supabase
          .from("jobs")
          .update({ is_active: false, updated_at: now })
          .eq("id", other.id);
        deactivated += 1;
      }
    }
  }

  // Deactivate obvious non-product leftovers still active
  const { data: activeAfter } = await supabase
    .from("jobs")
    .select("id, title", { count: "exact" })
    .eq("is_active", true);
  console.log(
    JSON.stringify(
      {
        roleGroups: groups.size,
        mergedGroups,
        deactivated,
        rewrittenKeys: rewritten,
        activeAfter: activeAfter?.length ?? null,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
