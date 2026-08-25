-- Allow create_projects.status = 'completed' (portfolio pieces marked done)

alter table public.create_projects
  drop constraint if exists create_projects_status_check;

alter table public.create_projects
  add constraint create_projects_status_check
  check (status in ('active', 'archived', 'completed'));
