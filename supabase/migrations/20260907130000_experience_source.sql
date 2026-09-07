-- Track whether an experience row came from resume parsing or manual entry.
alter table public.experiences
  add column if not exists source text not null default 'manual',
  add column if not exists resume_key text;

alter table public.experiences
  drop constraint if exists experiences_source_check;

alter table public.experiences
  add constraint experiences_source_check
  check (source in ('resume', 'manual'));

create unique index if not exists experiences_user_resume_key_idx
  on public.experiences (user_id, resume_key)
  where resume_key is not null;

comment on column public.experiences.source is
  'resume = parsed from master resume PDF; manual = user-added fact not on current resume.';

comment on column public.experiences.resume_key is
  'Stable org|title key used when re-syncing parsed resume experiences.';
