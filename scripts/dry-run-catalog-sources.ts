/**
 * Dry-run all enabled adapters — no Supabase writes.
 * Reports Product jobs that would be ingested.
 *
 * Run: npx --yes tsx --tsconfig tsconfig.json scripts/dry-run-catalog-sources.ts
 */

import { listRegistry } from "../src/lib/ingestion/sourceRegistry";
import type { RawSourceJob } from "../src/lib/ingestion/types";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const entries = listRegistry({ enabledOnly: true });
  const bySource: Array<{
    id: string;
    label: string;
    fetched: number;
    product: number;
    withDesc: number;
    withMode: number;
    withGrad: number;
    internships: number;
    error?: string;
  }> = [];

  const allProduct: RawSourceJob[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!;
    try {
      const adapter = entry.createAdapter();
      const raw = await adapter.discover();
      const withDesc = raw.filter((j) => Boolean(j.description)).length;
      const withMode = raw.filter((j) => Boolean(j.rawPayload?.["workMode"])).length;
      const withGrad = raw.filter((j) => {
        const g = j.rawPayload?.["graduationYears"];
        return Array.isArray(g) && g.length > 0;
      }).length;
      const internships = raw.filter(
        (j) => j.rawPayload?.["employmentType"] === "internship",
      ).length;
      bySource.push({
        id: entry.id,
        label: entry.label,
        fetched: raw.length,
        product: raw.length,
        withDesc,
        withMode,
        withGrad,
        internships,
      });
      allProduct.push(...raw);
      console.log(
        `[${i + 1}/${entries.length}] ok ${entry.label}: product=${raw.length} desc=${withDesc} mode=${withMode} grad=${withGrad} intern=${internships}`,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "fail";
      bySource.push({
        id: entry.id,
        label: entry.label,
        fetched: 0,
        product: 0,
        withDesc: 0,
        withMode: 0,
        withGrad: 0,
        internships: 0,
        error: msg,
      });
      console.log(`[${i + 1}/${entries.length}] FAIL ${entry.label}: ${msg}`);
    }
    if (i < entries.length - 1) await sleep(350);
  }

  // Dedupe by apply URL / external-ish
  const byApply = new Map<string, RawSourceJob>();
  for (const j of allProduct) {
    const key =
      (j.applyUrl && j.applyUrl.split("?")[0]) ||
      j.externalId ||
      `${j.company}|${j.title}|${j.location}`;
    if (!byApply.has(key)) byApply.set(key, j);
  }

  const roles: Record<string, number> = {};
  const emps: Record<string, number> = {};
  let desc = 0;
  let mode = 0;
  let grad = 0;
  for (const j of byApply.values()) {
    const role = String(j.rawPayload?.["productRoleCategory"] ?? "unknown");
    roles[role] = (roles[role] ?? 0) + 1;
    const emp = String(j.rawPayload?.["employmentType"] ?? "unknown");
    emps[emp] = (emps[emp] ?? 0) + 1;
    if (j.description) desc += 1;
    if (j.rawPayload?.["workMode"]) mode += 1;
    const g = j.rawPayload?.["graduationYears"];
    if (Array.isArray(g) && g.length) grad += 1;
  }

  console.log("\n=== DRY RUN SUMMARY ===");
  console.log(
    JSON.stringify(
      {
        sourcesAttempted: entries.length,
        sourcesFailed: bySource.filter((s) => s.error).length,
        productRowsRaw: allProduct.length,
        uniqueByApplyUrl: byApply.size,
        withDescription: desc,
        withWorkMode: mode,
        withGradYears: grad,
        byRole: roles,
        byEmployment: emps,
        topSources: bySource
          .filter((s) => s.product > 0)
          .sort((a, b) => b.product - a.product)
          .slice(0, 15),
        failedSources: bySource.filter((s) => s.error).map((s) => ({ label: s.label, error: s.error })),
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
