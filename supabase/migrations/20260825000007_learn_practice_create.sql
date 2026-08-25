-- Learn / Practice / Create — private user state
-- Public curriculum lives in typed TypeScript content files.

-- ---------------------------------------------------------------------------
-- lesson_progress
-- ---------------------------------------------------------------------------
create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null,
  started_at timestamptz not null default now(),
  last_opened_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_progress_user_lesson_unique unique (user_id, lesson_id)
);

create index if not exists lesson_progress_user_id_idx
  on public.lesson_progress (user_id);

alter table public.lesson_progress enable row level security;

create policy lesson_progress_select_own on public.lesson_progress
  for select to authenticated using (auth.uid() = user_id);
create policy lesson_progress_insert_own on public.lesson_progress
  for insert to authenticated with check (auth.uid() = user_id);
create policy lesson_progress_update_own on public.lesson_progress
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy lesson_progress_delete_own on public.lesson_progress
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- practice_attempts
-- ---------------------------------------------------------------------------
create table if not exists public.practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  response_text text not null default '',
  rubric_state jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists practice_attempts_user_id_idx
  on public.practice_attempts (user_id);
create index if not exists practice_attempts_user_question_idx
  on public.practice_attempts (user_id, question_id);

alter table public.practice_attempts enable row level security;

create policy practice_attempts_select_own on public.practice_attempts
  for select to authenticated using (auth.uid() = user_id);
create policy practice_attempts_insert_own on public.practice_attempts
  for insert to authenticated with check (auth.uid() = user_id);
create policy practice_attempts_update_own on public.practice_attempts
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy practice_attempts_delete_own on public.practice_attempts
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- create_projects
-- ---------------------------------------------------------------------------
create table if not exists public.create_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_type text not null,
  title text not null,
  status text not null default 'active',
  content jsonb not null default '{}'::jsonb,
  source_practice_question_id text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint create_projects_status_check check (status in ('active', 'archived'))
);

create index if not exists create_projects_user_id_idx
  on public.create_projects (user_id);
create index if not exists create_projects_user_updated_idx
  on public.create_projects (user_id, updated_at desc);

alter table public.create_projects enable row level security;

create policy create_projects_select_own on public.create_projects
  for select to authenticated using (auth.uid() = user_id);
create policy create_projects_insert_own on public.create_projects
  for insert to authenticated with check (auth.uid() = user_id);
create policy create_projects_update_own on public.create_projects
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy create_projects_delete_own on public.create_projects
  for delete to authenticated using (auth.uid() = user_id);
