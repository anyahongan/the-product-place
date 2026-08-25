/**
 * Early-career dry-run: compare candidate sources against live catalog uniqueness.
 * No writes. Does not print secrets.
 *
 * Run: npx --yes tsx --tsconfig tsconfig.json scripts/dry-run-early-career.ts
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { listRegistry } from "../src/lib/ingestion/sourceRegistry";
import { buildRoleDedupeKey, canonicalizeJobTitle } from "../src/lib/apply/normalization/dedupe";
import type { RawSourceJob } from "../src/lib/ingestion/types";

function loadEnvLocal(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const raw = readFileSync(".env.local", "utf8");
    for (const line of raw.split("\n")) {
      if (!line.includes("=") || line.trim().startsWith("#")) continue;
      const i = line.indexOf("=");
      const k = line.slice(0, i).trim();
      const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
      out[k] = v;
    }
  } catch {
    /* optional */
  }
  return out;
}

function isEarlyTitle(title: string): boolean {
  return /\bintern(?:ship)?\b|\bco[\s-]?op\b|\bnew[\s-]?grad|\bearly[\s-]?career|\bentry[\s-]?level|\bassociate\s+product\s+manager\b|\buniversity\b|\bcampus\b/i.test(
    title,
  );
}

function empOf(j: RawSourceJob): string {
  return String(j.rawPayload?.["employmentType"] ?? "null");
}

function roleKey(j: RawSourceJob): string {
  const payloadKey = j.rawPayload?.["dedupeKey"];
  if (typeof payloadKey === "string" && payloadKey) return payloadKey;
  return buildRoleDedupeKey(j.company, canonicalizeJobTitle(j.title));
}

async function main() {
  const env = { ...process.env, ...loadEnvLocal() };
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Missing VITE_SUPABASE_URL / publishable key");

  const sb = createClient(url, key);
  const { data: active, error } = await sb
    .from("jobs")
    .select("title, employment_type, graduation_years, companies(name)")
    .eq("is_active", true)
    .limit(5000);
  if (error) throw error;
  const rows = active ?? [];

  const existingKeys = new Set(
    rows.map((j) => {
      const company = (j.companies as { name?: string } | null)?.name ?? "";
      return buildRoleDedupeKey(company, canonicalizeJobTitle(j.title));
    }),
  );

  const current = {
    active: rows.length,
    internships: rows.filter((j) => j.employment_type === "internship").length,
    newGradApm: rows.filter((j) => isEarlyTitle(j.title) && j.employment_type !== "internship")
      .length,
    knownGrad: rows.filter(
      (j) => Array.isArray(j.graduation_years) && (j.graduation_years as number[]).length > 0,
    ).length,
  };

  const earlyIds = [
    "tracker-simplify-summer2027",
    "tracker-simplify-newgrad",
    "gh-sezzle",
    "gh-blockchain",
    "gh-ixllearning",
    "gh-appian",
    "as-uncountable",
  ];

  const entries = listRegistry({ enabledOnly: true, ids: earlyIds });
  const batch: RawSourceJob[] = [];
  const perSource: Array<Record<string, unknown>> = [];

  for (const entry of entries) {
    try {
      const raw = await entry.createAdapter().discover();
      batch.push(...raw);
      const unique = raw.filter((j) => !existingKeys.has(roleKey(j)));
      const interns = unique.filter((j) => empOf(j) === "internship" || isEarlyTitle(j.title));
      const newGrad = unique.filter(
        (j) => empOf(j) !== "internship" && isEarlyTitle(j.title),
      );
      perSource.push({
        source: entry.label,
        productCandidates: raw.length,
        uniqueProduct: unique.length,
        uniqueInternships: unique.filter((j) => empOf(j) === "internship").length,
        uniqueNewGradApm: newGrad.length,
        earlyTitleUnique: interns.length,
        errors: 0,
      });
      console.log(
        `ok ${entry.label}: product=${raw.length} unique=${unique.length} uniqueIntern=${unique.filter((j) => empOf(j) === "internship").length} uniqueNG=${newGrad.length}`,
      );
    } catch (e) {
      perSource.push({
        source: entry.label,
        productCandidates: 0,
        uniqueProduct: 0,
        uniqueInternships: 0,
        uniqueNewGradApm: 0,
        errors: 1,
        error: e instanceof Error ? e.message : "fail",
      });
      console.log(`FAIL ${entry.label}: ${e instanceof Error ? e.message : e}`);
    }
  }

  const uniqueBatch = batch.filter((j) => !existingKeys.has(roleKey(j)));
  const uniqueInterns = uniqueBatch.filter((j) => empOf(j) === "internship");
  const uniqueNg = uniqueBatch.filter(
    (j) => empOf(j) !== "internship" && isEarlyTitle(j.title),
  );
  const withGrad = uniqueBatch.filter((j) => {
    const g = j.rawPayload?.["graduationYears"];
    return Array.isArray(g) && g.length > 0;
  });

  console.log(
    "\n" +
      JSON.stringify(
        {
          CURRENT: current,
          PROPOSED_SOURCE_BATCH: {
            rawCandidates: batch.length,
            productCandidates: batch.length,
            uniqueProductCandidates: uniqueBatch.length,
            uniqueInternships: uniqueInterns.length,
            uniqueNewGradApm: uniqueNg.length,
            jobsWithParsedGradEligibility: withGrad.length,
            perSource,
            sampleUniqueInterns: uniqueInterns.slice(0, 15).map((j) => `${j.company} | ${j.title}`),
            sampleUniqueNewGrad: uniqueNg.slice(0, 15).map((j) => `${j.company} | ${j.title}`),
          },
        },
        null,
        2,
      ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
