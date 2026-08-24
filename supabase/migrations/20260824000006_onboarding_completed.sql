-- Account setup / first-time onboarding completion flags
-- Forward migration only. Do not edit prior migrations (000001–000005).
--
-- Reuses existing public.profiles ownership + RLS (authenticated users update own row).

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false;

alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz;

comment on column public.profiles.onboarding_completed is
  'True after the user finishes Account Setup (/setup). Default false for new and existing early-stage accounts.';

comment on column public.profiles.onboarding_completed_at is
  'Timestamp when onboarding_completed was set true. Null until setup finishes.';
