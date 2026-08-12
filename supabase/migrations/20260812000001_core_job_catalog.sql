-- Shared product catalog for The Product Place
-- Canonical jobs are writable only via service role / server ingestion.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Shared: companies
-- ---------------------------------------------------------------------------
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null,
  website_url text,
  careers_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint companies_normalized_name_unique unique (normalized_name)
);

create index if not exists companies_name_idx on public.companies (name);

-- ---------------------------------------------------------------------------
-- Shared: job_sources
-- ---------------------------------------------------------------------------
create table if not exists public.job_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_type text not null
    check (source_type in (
      'GITHUB_TRACKER',
      'CURATED_TRACKER',
      'ATS_API',
      'EMPLOYER_CAREERS_PAGE',
      'SEARCH_DISCOVERY',
      'MANUAL',
      'AUTHORIZED_JOB_FEED',
      'OTHER'
    )),
  base_url text,
  is_active boolean not null default true,
  trust_priority integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_sources_name_unique unique (name)
);

-- ---------------------------------------------------------------------------
-- Shared: jobs (canonical catalog)
-- ---------------------------------------------------------------------------
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  title text not null,
  normalized_title text not null,
  product_role_category text not null,
  location text,
  normalized_location text,
  work_mode text
    check (work_mode is null or work_mode in ('remote', 'hybrid', 'in-person')),
  graduation_years integer[],
  employment_type text
    check (employment_type is null or employment_type in ('internship', 'part-time', 'full-time')),
  posted_at date,
  deadline_at date,
  description text,
  canonical_apply_url text,
  canonical_source_url text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_verified_at timestamptz,
  is_active boolean not null default true,
  dedupe_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_dedupe_key_unique unique (dedupe_key)
);

create index if not exists jobs_product_role_idx on public.jobs (product_role_category);
create index if not exists jobs_posted_at_idx on public.jobs (posted_at);
create index if not exists jobs_first_seen_at_idx on public.jobs (first_seen_at);
create index if not exists jobs_deadline_at_idx on public.jobs (deadline_at);
create index if not exists jobs_is_active_idx on public.jobs (is_active);
create index if not exists jobs_company_id_idx on public.jobs (company_id);
create index if not exists jobs_dedupe_key_idx on public.jobs (dedupe_key);

-- ---------------------------------------------------------------------------
-- Shared: job_source_records (where we saw a canonical job)
-- ---------------------------------------------------------------------------
create table if not exists public.job_source_records (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  source_id uuid not null references public.job_sources(id) on delete cascade,
  external_id text,
  source_url text not null,
  raw_title text,
  raw_company text,
  raw_location text,
  raw_payload jsonb,
  first_discovered_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_source_records_unique unique (source_id, source_url)
);

create index if not exists job_source_records_job_id_idx on public.job_source_records (job_id);
create index if not exists job_source_records_source_id_idx on public.job_source_records (source_id);

-- ---------------------------------------------------------------------------
-- Shared: job_candidates (discovered, not yet trusted)
-- ---------------------------------------------------------------------------
create table if not exists public.job_candidates (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.job_sources(id) on delete cascade,
  discovered_url text not null,
  reported_company text,
  reported_title text,
  raw_discovery_payload jsonb,
  status text not null default 'DISCOVERED'
    check (status in (
      'DISCOVERED',
      'VERIFYING',
      'VERIFIED',
      'DUPLICATE',
      'REJECTED',
      'ERROR'
    )),
  discovered_at timestamptz not null default now(),
  verified_at timestamptz,
  rejection_reason text,
  canonical_job_id uuid references public.jobs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists job_candidates_status_idx on public.job_candidates (status);
create index if not exists job_candidates_source_id_idx on public.job_candidates (source_id);

-- ---------------------------------------------------------------------------
-- Shared: job_discovery_runs
-- ---------------------------------------------------------------------------
create table if not exists public.job_discovery_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.job_sources(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'RUNNING'
    check (status in ('RUNNING', 'SUCCEEDED', 'FAILED')),
  records_discovered integer not null default 0,
  records_verified integer not null default 0,
  records_inserted integer not null default 0,
  records_updated integer not null default 0,
  records_deduplicated integer not null default 0,
  records_rejected integer not null default 0,
  error_message text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists job_discovery_runs_source_id_idx on public.job_discovery_runs (source_id);

-- Seed first source (GitHub internship tracker)
insert into public.job_sources (name, source_type, base_url, is_active, trust_priority)
values (
  'Summer2027 Internships (GitHub)',
  'GITHUB_TRACKER',
  'https://github.com/vanshb03/Summer2027-Internships',
  true,
  10
)
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- RLS: shared catalog is readable; writes only via service role
-- ---------------------------------------------------------------------------
alter table public.companies enable row level security;
alter table public.job_sources enable row level security;
alter table public.jobs enable row level security;
alter table public.job_source_records enable row level security;
alter table public.job_candidates enable row level security;
alter table public.job_discovery_runs enable row level security;

-- Authenticated (and anon for public browse of open jobs) can SELECT catalog
create policy companies_select_authenticated
  on public.companies for select
  to authenticated
  using (true);

create policy companies_select_anon
  on public.companies for select
  to anon
  using (true);

create policy job_sources_select_authenticated
  on public.job_sources for select
  to authenticated
  using (true);

create policy job_sources_select_anon
  on public.job_sources for select
  to anon
  using (true);

create policy jobs_select_authenticated
  on public.jobs for select
  to authenticated
  using (true);

create policy jobs_select_anon
  on public.jobs for select
  to anon
  using (true);

create policy job_source_records_select_authenticated
  on public.job_source_records for select
  to authenticated
  using (true);

create policy job_source_records_select_anon
  on public.job_source_records for select
  to anon
  using (true);

-- Candidates & discovery runs: authenticated read only (ops debugging); no client writes
create policy job_candidates_select_authenticated
  on public.job_candidates for select
  to authenticated
  using (true);

create policy job_discovery_runs_select_authenticated
  on public.job_discovery_runs for select
  to authenticated
  using (true);

-- No INSERT/UPDATE/DELETE policies for authenticated/anon on shared tables.
-- Service role bypasses RLS for ingestion.
