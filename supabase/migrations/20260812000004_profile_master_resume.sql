-- Profile + Master Resume + Experience Library
-- Forward migration only. Do not edit prior migrations.

-- ---------------------------------------------------------------------------
-- Extend profiles (auth ownership stub → career dossier fields)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists preferred_name text,
  add column if not exists school text,
  add column if not exists major text,
  add column if not exists minor text,
  add column if not exists graduation_year integer,
  add column if not exists current_location text,
  add column if not exists preferred_email text,
  add column if not exists phone text,
  add column if not exists linkedin_url text,
  add column if not exists github_url text,
  add column if not exists portfolio_url text,
  add column if not exists website_url text,
  add column if not exists work_authorization_status text,
  add column if not exists requires_sponsorship boolean;

comment on column public.profiles.requires_sponsorship is
  'User-authored only. Null means unanswered — never infer.';

-- ---------------------------------------------------------------------------
-- Target role preferences (multi-select)
-- ---------------------------------------------------------------------------
create table if not exists public.profile_role_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  constraint profile_role_preferences_user_role_unique unique (user_id, role)
);

create index if not exists profile_role_preferences_user_id_idx
  on public.profile_role_preferences (user_id);

alter table public.profile_role_preferences enable row level security;
create policy profile_role_preferences_select_own on public.profile_role_preferences
  for select to authenticated using (auth.uid() = user_id);
create policy profile_role_preferences_insert_own on public.profile_role_preferences
  for insert to authenticated with check (auth.uid() = user_id);
create policy profile_role_preferences_update_own on public.profile_role_preferences
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy profile_role_preferences_delete_own on public.profile_role_preferences
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Location preferences
-- ---------------------------------------------------------------------------
create table if not exists public.profile_location_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  location_label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profile_location_preferences_user_id_idx
  on public.profile_location_preferences (user_id);

alter table public.profile_location_preferences enable row level security;
create policy profile_location_preferences_select_own on public.profile_location_preferences
  for select to authenticated using (auth.uid() = user_id);
create policy profile_location_preferences_insert_own on public.profile_location_preferences
  for insert to authenticated with check (auth.uid() = user_id);
create policy profile_location_preferences_update_own on public.profile_location_preferences
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy profile_location_preferences_delete_own on public.profile_location_preferences
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Work mode / employment type preferences
-- ---------------------------------------------------------------------------
create table if not exists public.profile_work_mode_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  work_mode text not null,
  created_at timestamptz not null default now(),
  constraint profile_work_mode_preferences_unique unique (user_id, work_mode),
  constraint profile_work_mode_preferences_check
    check (work_mode in ('remote', 'hybrid', 'in-person'))
);

alter table public.profile_work_mode_preferences enable row level security;
create policy profile_work_mode_preferences_select_own on public.profile_work_mode_preferences
  for select to authenticated using (auth.uid() = user_id);
create policy profile_work_mode_preferences_insert_own on public.profile_work_mode_preferences
  for insert to authenticated with check (auth.uid() = user_id);
create policy profile_work_mode_preferences_delete_own on public.profile_work_mode_preferences
  for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.profile_employment_type_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  employment_type text not null,
  created_at timestamptz not null default now(),
  constraint profile_employment_type_preferences_unique unique (user_id, employment_type),
  constraint profile_employment_type_preferences_check
    check (employment_type in ('internship', 'part-time', 'full-time'))
);

alter table public.profile_employment_type_preferences enable row level security;
create policy profile_employment_type_preferences_select_own on public.profile_employment_type_preferences
  for select to authenticated using (auth.uid() = user_id);
create policy profile_employment_type_preferences_insert_own on public.profile_employment_type_preferences
  for insert to authenticated with check (auth.uid() = user_id);
create policy profile_employment_type_preferences_delete_own on public.profile_employment_type_preferences
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Standard application answers (user-authored Q/A)
-- ---------------------------------------------------------------------------
create table if not exists public.standard_application_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  answer text not null default '',
  category text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists standard_application_answers_user_id_idx
  on public.standard_application_answers (user_id);

alter table public.standard_application_answers enable row level security;
create policy standard_application_answers_select_own on public.standard_application_answers
  for select to authenticated using (auth.uid() = user_id);
create policy standard_application_answers_insert_own on public.standard_application_answers
  for insert to authenticated with check (auth.uid() = user_id);
create policy standard_application_answers_update_own on public.standard_application_answers
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy standard_application_answers_delete_own on public.standard_application_answers
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Resume documents (metadata; files live in private Storage bucket)
-- ---------------------------------------------------------------------------
create table if not exists public.resume_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null default 'MASTER_RESUME',
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  byte_size bigint,
  uploaded_at timestamptz not null default now(),
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resume_documents_type_check
    check (document_type in ('MASTER_RESUME', 'TAILORED_RESUME'))
);

create index if not exists resume_documents_user_id_idx on public.resume_documents (user_id);
create index if not exists resume_documents_user_current_idx
  on public.resume_documents (user_id, is_current)
  where is_current = true;

alter table public.resume_documents enable row level security;
create policy resume_documents_select_own on public.resume_documents
  for select to authenticated using (auth.uid() = user_id);
create policy resume_documents_insert_own on public.resume_documents
  for insert to authenticated with check (auth.uid() = user_id);
create policy resume_documents_update_own on public.resume_documents
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy resume_documents_delete_own on public.resume_documents
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Experience library (structured facts — separate from uploaded PDF)
-- ---------------------------------------------------------------------------
create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  experience_type text not null,
  organization text not null,
  title text not null,
  location text,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  summary text,
  skills text[] not null default '{}',
  project_url text,
  github_url text,
  case_study_url text,
  product_type text,
  project_status text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint experiences_type_check check (
    experience_type in (
      'work',
      'internship',
      'project',
      'leadership',
      'research',
      'extracurricular',
      'volunteer',
      'other'
    )
  )
);

create index if not exists experiences_user_id_idx on public.experiences (user_id);
create index if not exists experiences_user_sort_idx on public.experiences (user_id, sort_order);

alter table public.experiences enable row level security;
create policy experiences_select_own on public.experiences
  for select to authenticated using (auth.uid() = user_id);
create policy experiences_insert_own on public.experiences
  for insert to authenticated with check (auth.uid() = user_id);
create policy experiences_update_own on public.experiences
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy experiences_delete_own on public.experiences
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Experience bullets (fact bank)
-- ---------------------------------------------------------------------------
create table if not exists public.experience_bullets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  experience_id uuid not null references public.experiences(id) on delete cascade,
  content text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists experience_bullets_experience_id_idx
  on public.experience_bullets (experience_id);
create index if not exists experience_bullets_user_id_idx
  on public.experience_bullets (user_id);

alter table public.experience_bullets enable row level security;
create policy experience_bullets_select_own on public.experience_bullets
  for select to authenticated using (auth.uid() = user_id);
create policy experience_bullets_insert_own on public.experience_bullets
  for insert to authenticated with check (auth.uid() = user_id);
create policy experience_bullets_update_own on public.experience_bullets
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy experience_bullets_delete_own on public.experience_bullets
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Optional factual metrics (user-authored only — never inferred)
-- ---------------------------------------------------------------------------
create table if not exists public.experience_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  experience_id uuid not null references public.experiences(id) on delete cascade,
  label text not null,
  value text not null,
  context text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists experience_metrics_experience_id_idx
  on public.experience_metrics (experience_id);

alter table public.experience_metrics enable row level security;
create policy experience_metrics_select_own on public.experience_metrics
  for select to authenticated using (auth.uid() = user_id);
create policy experience_metrics_insert_own on public.experience_metrics
  for insert to authenticated with check (auth.uid() = user_id);
create policy experience_metrics_update_own on public.experience_metrics
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy experience_metrics_delete_own on public.experience_metrics
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Private Storage bucket for resumes
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes',
  'resumes',
  false,
  10485760,
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Path convention: {user_id}/master-resume/{filename}
drop policy if exists resumes_storage_select_own on storage.objects;
drop policy if exists resumes_storage_insert_own on storage.objects;
drop policy if exists resumes_storage_update_own on storage.objects;
drop policy if exists resumes_storage_delete_own on storage.objects;

create policy resumes_storage_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy resumes_storage_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy resumes_storage_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy resumes_storage_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
