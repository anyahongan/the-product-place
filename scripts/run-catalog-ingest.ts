/**
 * Live multi-source catalog ingestion + catalog stats.
 * Uses server env (SUPABASE_SECRET_KEY). Never prints secrets.
 *
 * Run: npx --yes tsx --tsconfig tsconfig.json scripts/run-catalog-ingest.ts
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { ingestAllSources } from "../src/lib/ingestion/runIngestion";

function loadEnvFile(path: string) {
  try {
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
  } catch {
    /* ignore */
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

function createService() {
  const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
  const key =
    process.env["SUPABASE_SECRET_KEY"] || process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL / SUPABASE_SECRET_KEY");
  }
  if (key === process.env["VITE_SUPABASE_PUBLISHABLE_KEY"]) {
    throw new Error("Refusing to use publishable key as service role");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function catalogStats(supabase: ReturnType<typeof createService>) {
  const { count: total } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true });
  const { count: active } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);
  const { count: activeIntern } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)
    .eq("employment_type", "internship");

  const { data: activeRows } = await supabase
    .from("jobs")
    .select(
      "product_role_category, employment_type, work_mode, graduation_years, description, canonical_source_url, canonical_apply_url",
    )
    .eq("is_active", true)
    .limit(5000);

  const byRole: Record<string, number> = {};
  const byEmp: Record<string, number> = {};
  let withDesc = 0;
  let withMode = 0;
  let withGrad = 0;
  for (const row of activeRows ?? []) {
    const role = (row.product_role_category as string) || "unknown";
    byRole[role] = (byRole[role] ?? 0) + 1;
    const emp = (row.employment_type as string) || "unknown";
    byEmp[emp] = (byEmp[emp] ?? 0) + 1;
    if (row.description) withDesc += 1;
    if (row.work_mode) withMode += 1;
    if (Array.isArray(row.graduation_years) && row.graduation_years.length) withGrad += 1;
  }

  const { data: sources } = await supabase.from("job_sources").select("id, name");
  const sourceNames = new Map((sources ?? []).map((s) => [s.id as string, s.name as string]));
  const { data: recs } = await supabase
    .from("job_source_records")
    .select("source_id, job_id")
    .limit(20000);
  const bySource: Record<string, number> = {};
  const seenJob = new Set<string>();
  for (const r of recs ?? []) {
    const name = sourceNames.get(r.source_id as string) ?? "unknown";
    // count distinct jobs per source
    const key = `${name}::${r.job_id}`;
    if (seenJob.has(key)) continue;
    seenJob.add(key);
    bySource[name] = (bySource[name] ?? 0) + 1;
  }

  return {
    total: total ?? 0,
    active: active ?? 0,
    activeInternships: activeIntern ?? 0,
    byRole,
    byEmp,
    withDesc,
    withMode,
    withGrad,
    bySource,
  };
}

async function main() {
  const supabase = createService();
  console.log("\n=== CATALOG BEFORE ===");
  const before = await catalogStats(supabase);
  console.log(JSON.stringify(before, null, 2));

  console.log("\n=== INGEST RUN 1 ===");
  const run1 = await ingestAllSources(supabase, {
    delayMs: 450,
    onSourceComplete: (s, i, total) => {
      const flag = s.errorMessage && s.recordsParsed === 0 ? "FAIL" : "ok";
      console.log(
        `[${i + 1}/${total}] ${flag} ${s.source}: parsed=${s.recordsParsed} product=${s.productJobsFound} new=${s.newJobs} upd=${s.updatedJobs} err=${s.errors}${s.errorMessage ? ` (${s.errorMessage})` : ""}`,
      );
    },
  });
  console.log("TOTALS", JSON.stringify(run1.totals, null, 2));

  console.log("\n=== CATALOG AFTER RUN 1 ===");
  const after1 = await catalogStats(supabase);
  console.log(JSON.stringify(after1, null, 2));

  console.log("\n=== INGEST RUN 2 (idempotency) ===");
  const run2 = await ingestAllSources(supabase, {
    delayMs: 450,
    onSourceComplete: (s, i, total) => {
      console.log(
        `[${i + 1}/${total}] ${s.source}: new=${s.newJobs} upd=${s.updatedJobs} product=${s.productJobsFound}`,
      );
    },
  });
  console.log("TOTALS", JSON.stringify(run2.totals, null, 2));

  console.log("\n=== CATALOG AFTER RUN 2 ===");
  const after2 = await catalogStats(supabase);
  console.log(JSON.stringify(after2, null, 2));

  console.log("\n=== IDEMPOTENCY CHECK ===");
  console.log({
    activeStable: after1.active === after2.active,
    totalStable: after1.total === after2.total,
    run2NewJobs: run2.totals.newJobs,
  });
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
