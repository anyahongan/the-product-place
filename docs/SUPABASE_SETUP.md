# Supabase data foundation — setup & test guide

This project now supports a **canonical job catalog** + **private per-user recruiting data** in Supabase, while keeping the approved Apply/Network UI.

Until `VITE_SUPABASE_*` is set, the app keeps working with:

- live GitHub job feed (fallback)
- localStorage personal data

## Architecture (summary)

```
GitHub adapter (and future sources)
  → normalize / classify / dedupe
  → server ingestion (secret / service-role key)
  → companies + jobs + job_source_records

Apply UI ← jobs table (or live fallback)

Auth user
  → private applications / contacts / notes / …
  → one-time localStorage migration
```

## 1. Create a Supabase project

1. Open https://supabase.com and create a free project.
2. Wait until the database is ready.

## 2. Apply migrations

From the repo root (`the-product-place`):

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Or paste, in order, in the SQL editor:

1. `supabase/migrations/20260812000001_core_job_catalog.sql`
2. `supabase/migrations/20260812000002_personal_recruiting_data.sql`
3. `supabase/migrations/20260812000003_job_source_records_identity.sql` (if not already applied)
4. `supabase/migrations/20260812000004_profile_master_resume.sql` — Profile + private `resumes` Storage bucket

Profile / Master Resume requires migration `20260812000004`. After `db push` (or SQL paste), confirm in Dashboard → Storage that the private **resumes** bucket exists.

## 3. Project URL + publishable key

Supabase Dashboard → **Project Settings → API**:

- Project URL → `VITE_SUPABASE_URL` (and optionally `SUPABASE_URL` for server)
- `anon` / publishable key → `VITE_SUPABASE_PUBLISHABLE_KEY` only
- secret key → `SUPABASE_SECRET_KEY` (server only; never `VITE_`)

**Never** put the secret / service-role key in any `VITE_` variable. It bypasses RLS and must never enter the browser bundle.

## 4. Create `.env.local`

Copy `.env.example` → `.env.local`. Real env files (`.env`, `.env.local`, `.env.*`) are gitignored.

**Browser (required for auth + catalog reads):**

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

**Server only (required only for local GitHub → Supabase ingestion):**

```
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...   # NEVER VITE_ — bypasses RLS
# Optional legacy fallback:
# SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

You do **not** need the secret key in `.env.local` just to sign in or read the public job catalog. You need it for `ingestGitHubJobsFn` / the DEV catalog ingest control.

Restart `npm run dev` after changing env.

## 5. Auth (email/password)

Dashboard → **Authentication → Providers → Email**:

- Enable Email
- For early testing you may disable “Confirm email”

Header shows **Sign in** when Vite env is present.

## 6. Edge Function secrets (separate from `.env.local`)

Deployed Edge Functions read credentials from the Supabase project / platform env — **not** from Vite or the browser.

Hosted functions often already receive `SUPABASE_URL` and a privileged key. Prefer `SUPABASE_SECRET_KEY` when setting secrets manually; `SUPABASE_SERVICE_ROLE_KEY` remains a supported fallback (and is still commonly auto-injected).

```bash
# Optional if not already injected by the platform:
npx supabase secrets set SUPABASE_SECRET_KEY=...
npx supabase secrets set INGEST_SECRET=some-long-random-string
npx supabase functions deploy ingest-jobs
```

The Edge Function is a **smoke / schedule attachment point**. Full upsert pipeline is `ingestGitHubJobsFn` (TanStack server).

## 7. First catalog ingestion (recommended)

With `SUPABASE_SECRET_KEY` in server env, trigger from a small server call / REPL, or add a temporary admin button that calls:

```ts
import { ingestGitHubJobsFn } from "@/lib/ingestion/ingestJobs.server";
await ingestGitHubJobsFn();
```

Expect a summary like: `productJobsFound`, `newJobs`, `updatedJobs`, `duplicatesMerged`.

Re-run should update `last_seen_at` and **not** create duplicate `dedupe_key` rows.

## 8. Verify catalog

- SQL: `select count(*) from jobs where is_active;`
- Apply tab should show `catalogSource: supabase` once rows exist (see hook warnings if empty).
- Confirm anon/authenticated clients cannot INSERT into `jobs` (RLS: select only).

## 9. First account + personal data

1. Sign up / sign in from the header.
2. Migration banner may appear once; local apps/contacts/notes upload.
3. Local keys are **not deleted** (backup until you confirm).
4. Sign out → private UI should return to local prototype data.
5. Sign in → account data loads again.

## 10. Local commands

```bash
npm install
npm run dev          # http://localhost:8080
npx tsc --noEmit
npm run lint
npm run build
```

## What stays mock / client

- Recommended contact matching, AI, Gmail/Calendar, Quick/Auto apply execution
- LLM/search discovery adapter is an interface only (`SearchDiscoveryAdapter`)
- No recurring ingestion schedule yet

## Future LLM discovery plug-in

```
SearchDiscoveryAdapter.searchForRecentProductJobs()
  → insert job_candidates (DISCOVERED)
  → verify real posting
  → normalize + dedupe
  → upsert jobs + job_source_records
  → Apply feed unchanged
```
