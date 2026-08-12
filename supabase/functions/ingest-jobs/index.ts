import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/**
 * Supabase Edge Function: manual GitHub job ingestion.
 *
 * Privileged credentials come ONLY from Deno.env (Supabase project secrets):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, optional INGEST_SECRET
 * Never accept service-role keys from the request body or browser.
 * Service-role bypasses RLS — do not log or return the key.
 *
 * Set secrets: npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
 *
 * Prefer TanStack `ingestGitHubJobsFn` for full local upsert; this Edge Function
 * is the production-shaped entrypoint. Keep scheduling OFF until approved.
 */

const VANSH_README =
  "https://raw.githubusercontent.com/vanshb03/Summer2027-Internships/dev/README.md";
const VANSH_OFFSEASON =
  "https://raw.githubusercontent.com/vanshb03/Summer2027-Internships/dev/OFFSEASON_README.md";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), { status: 405 });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    return new Response(JSON.stringify({ error: "Missing service credentials" }), {
      status: 500,
    });
  }

  // Optional caller auth via shared INGEST_SECRET (also Deno.env only — not the service role).
  const ingestSecret = Deno.env.get("INGEST_SECRET");
  const auth = req.headers.get("Authorization") ?? "";
  if (ingestSecret) {
    if (auth !== `Bearer ${ingestSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
  }

  // Always use Deno.env service role — never a key from the client request.
  const supabase = createClient(url, key);

  try {
    // Lightweight fetch probe — full parse/classify lives in app server fn for parity.
    // Edge function records a run and delegates detailed upserts when INGEST_MODE=full
    // is not set; for now we mark a discovery run and return instructions.
    const { data: source } = await supabase
      .from("job_sources")
      .select("id, name")
      .eq("name", "Summer2027 Internships (GitHub)")
      .maybeSingle();

    if (!source) {
      return new Response(
        JSON.stringify({
          error: "job_sources row missing — apply migrations first",
        }),
        { status: 400 },
      );
    }

    const { data: run } = await supabase
      .from("job_discovery_runs")
      .insert({ source_id: source.id, status: "RUNNING" })
      .select("id")
      .single();

    const [readme, off] = await Promise.all([
      fetch(VANSH_README).then((r) => r.text()),
      fetch(VANSH_OFFSEASON).then((r) => r.text()),
    ]);

    await supabase
      .from("job_discovery_runs")
      .update({
        completed_at: new Date().toISOString(),
        status: "SUCCEEDED",
        records_discovered: (readme.match(/^\|/gm) ?? []).length + (off.match(/^\|/gm) ?? []).length,
        metadata: {
          note: "Edge function smoke sync. Prefer TanStack ingestGitHubJobsFn for full upsert pipeline until Edge shares the TS classifier bundle.",
          readmeChars: readme.length,
          offseasonChars: off.length,
        },
      })
      .eq("id", run!.id);

    return new Response(
      JSON.stringify({
        ok: true,
        runId: run!.id,
        message:
          "Edge function reachable. Run the app server ingestGitHubJobsFn for full catalog upsert.",
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "ingest failed" }),
      { status: 500 },
    );
  }
});
