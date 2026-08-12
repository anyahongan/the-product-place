-- Private per-user recruiting data + RLS

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy profiles_update_own on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- saved_jobs
-- ---------------------------------------------------------------------------
create table if not exists public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  saved_at timestamptz not null default now(),
  auto_queue boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint saved_jobs_user_job_unique unique (user_id, job_id)
);

create index if not exists saved_jobs_user_id_idx on public.saved_jobs (user_id);
create index if not exists saved_jobs_job_id_idx on public.saved_jobs (job_id);

alter table public.saved_jobs enable row level security;
create policy saved_jobs_select_own on public.saved_jobs
  for select to authenticated using (auth.uid() = user_id);
create policy saved_jobs_insert_own on public.saved_jobs
  for insert to authenticated with check (auth.uid() = user_id);
create policy saved_jobs_update_own on public.saved_jobs
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy saved_jobs_delete_own on public.saved_jobs
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- applications
-- ---------------------------------------------------------------------------
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  legacy_job_id text,
  company_name text not null,
  title text not null,
  date_applied date,
  current_status text not null,
  resume_used text,
  cover_letter_used text,
  apply_url text,
  source_url text,
  auto_queued boolean not null default false,
  tone text not null default 'blue',
  job_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint applications_status_check check (current_status in (
    'Saved', 'Preparing', 'Applied', 'Waiting',
    'Recruiter Screen', 'Interviewing', 'Final Round',
    'Offer', 'Rejected', 'Withdrawn'
  ))
);

-- Prefer one application per user+job when job_id is present
create unique index if not exists applications_user_job_unique
  on public.applications (user_id, job_id)
  where job_id is not null;

create index if not exists applications_user_id_idx on public.applications (user_id);
create index if not exists applications_job_id_idx on public.applications (job_id);
create index if not exists applications_current_status_idx on public.applications (current_status);

alter table public.applications enable row level security;
create policy applications_select_own on public.applications
  for select to authenticated using (auth.uid() = user_id);
create policy applications_insert_own on public.applications
  for insert to authenticated with check (auth.uid() = user_id);
create policy applications_update_own on public.applications
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy applications_delete_own on public.applications
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- application_status_events
-- ---------------------------------------------------------------------------
create table if not exists public.application_status_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  status text not null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists application_status_events_app_idx
  on public.application_status_events (application_id);
create index if not exists application_status_events_user_idx
  on public.application_status_events (user_id);

alter table public.application_status_events enable row level security;
create policy application_status_events_select_own on public.application_status_events
  for select to authenticated using (auth.uid() = user_id);
create policy application_status_events_insert_own on public.application_status_events
  for insert to authenticated with check (auth.uid() = user_id);
create policy application_status_events_delete_own on public.application_status_events
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- contacts
-- ---------------------------------------------------------------------------
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  legacy_company_id text,
  name text not null,
  title text not null default '',
  contact_type text not null default 'OTHER',
  is_recruiter boolean not null default false,
  is_campus_recruiter boolean not null default false,
  school_relationship text,
  connection_degree text,
  background_similarities text[] not null default '{}',
  email text,
  linkedin_url text,
  relationship_status text not null default 'Not contacted',
  next_action text not null default 'No action',
  last_contacted_at date,
  next_follow_up date,
  meeting_date date,
  referral_status text not null default 'NOT DISCUSSED',
  notes text not null default '',
  is_recommended boolean not null default false,
  match_score integer,
  match_reasons text[] not null default '{}',
  tone text not null default 'pink',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contacts_user_id_idx on public.contacts (user_id);
create index if not exists contacts_company_id_idx on public.contacts (company_id);

alter table public.contacts enable row level security;
create policy contacts_select_own on public.contacts
  for select to authenticated using (auth.uid() = user_id);
create policy contacts_insert_own on public.contacts
  for insert to authenticated with check (auth.uid() = user_id);
create policy contacts_update_own on public.contacts
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy contacts_delete_own on public.contacts
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- contact_application_links
-- ---------------------------------------------------------------------------
create table if not exists public.contact_application_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  relationship_context text not null default 'GENERAL NETWORKING'
    check (relationship_context in (
      'RECRUITING', 'REFERRAL', 'INTERVIEW INSIGHT', 'GENERAL NETWORKING'
    )),
  created_at timestamptz not null default now(),
  constraint contact_application_links_unique unique (contact_id, application_id)
);

create index if not exists contact_application_links_user_idx
  on public.contact_application_links (user_id);

alter table public.contact_application_links enable row level security;
create policy contact_application_links_select_own on public.contact_application_links
  for select to authenticated using (auth.uid() = user_id);
create policy contact_application_links_insert_own on public.contact_application_links
  for insert to authenticated with check (auth.uid() = user_id);
create policy contact_application_links_update_own on public.contact_application_links
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy contact_application_links_delete_own on public.contact_application_links
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- interactions (Conversations + contact timeline)
-- ---------------------------------------------------------------------------
create table if not exists public.interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  application_id uuid references public.applications(id) on delete set null,
  interaction_type text not null,
  occurred_at date not null,
  subject text,
  details text,
  email_subject text,
  email_body text,
  meeting_time text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists interactions_user_idx on public.interactions (user_id);
create index if not exists interactions_contact_idx on public.interactions (contact_id);
create index if not exists interactions_application_idx on public.interactions (application_id);
create index if not exists interactions_occurred_at_idx on public.interactions (occurred_at);

alter table public.interactions enable row level security;
create policy interactions_select_own on public.interactions
  for select to authenticated using (auth.uid() = user_id);
create policy interactions_insert_own on public.interactions
  for insert to authenticated with check (auth.uid() = user_id);
create policy interactions_update_own on public.interactions
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy interactions_delete_own on public.interactions
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- notes
-- ---------------------------------------------------------------------------
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  application_id uuid references public.applications(id) on delete set null,
  related_application_ids text[] not null default '{}',
  related_timeline_event_id text,
  note_type text not null default 'GENERAL',
  content text not null default '',
  learned_at date not null default current_date,
  use_for_application_materials boolean not null default false,
  use_for_interview_prep boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_user_idx on public.notes (user_id);
create index if not exists notes_application_idx on public.notes (application_id);
create index if not exists notes_contact_idx on public.notes (contact_id);

alter table public.notes enable row level security;
create policy notes_select_own on public.notes
  for select to authenticated using (auth.uid() = user_id);
create policy notes_insert_own on public.notes
  for insert to authenticated with check (auth.uid() = user_id);
create policy notes_update_own on public.notes
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy notes_delete_own on public.notes
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- follow_up_reminders
-- ---------------------------------------------------------------------------
create table if not exists public.follow_up_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  due_at date not null,
  status text not null default 'FOLLOW UP'
    check (status in ('FOLLOW UP', 'SNOOZE', 'NO FOLLOW-UP NEEDED', 'COMPLETED')),
  snoozed_until date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists follow_up_reminders_user_idx on public.follow_up_reminders (user_id);
create index if not exists follow_up_reminders_due_at_idx on public.follow_up_reminders (due_at);

alter table public.follow_up_reminders enable row level security;
create policy follow_up_reminders_select_own on public.follow_up_reminders
  for select to authenticated using (auth.uid() = user_id);
create policy follow_up_reminders_insert_own on public.follow_up_reminders
  for insert to authenticated with check (auth.uid() = user_id);
create policy follow_up_reminders_update_own on public.follow_up_reminders
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy follow_up_reminders_delete_own on public.follow_up_reminders
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- referral_status_events
-- ---------------------------------------------------------------------------
create table if not exists public.referral_status_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  status text not null
    check (status in (
      'NOT DISCUSSED', 'MAYBE', 'OFFERED', 'REQUESTED',
      'SUBMITTED', 'DECLINED', 'NOT APPLICABLE'
    )),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists referral_status_events_user_idx on public.referral_status_events (user_id);
create index if not exists referral_status_events_contact_idx on public.referral_status_events (contact_id);

alter table public.referral_status_events enable row level security;
create policy referral_status_events_select_own on public.referral_status_events
  for select to authenticated using (auth.uid() = user_id);
create policy referral_status_events_insert_own on public.referral_status_events
  for insert to authenticated with check (auth.uid() = user_id);
create policy referral_status_events_delete_own on public.referral_status_events
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- local migration marker (per user)
-- ---------------------------------------------------------------------------
create table if not exists public.user_data_migrations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  local_v1_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_data_migrations enable row level security;
create policy user_data_migrations_select_own on public.user_data_migrations
  for select to authenticated using (auth.uid() = user_id);
create policy user_data_migrations_insert_own on public.user_data_migrations
  for insert to authenticated with check (auth.uid() = user_id);
create policy user_data_migrations_update_own on public.user_data_migrations
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
