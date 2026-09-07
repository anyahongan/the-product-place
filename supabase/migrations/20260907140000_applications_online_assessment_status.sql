-- Allow Online Assessment in application status (used by tracker + import).
alter table public.applications drop constraint if exists applications_status_check;

alter table public.applications add constraint applications_status_check check (
  current_status in (
    'Saved',
    'Preparing',
    'Applied',
    'Waiting',
    'Online Assessment',
    'Recruiter Screen',
    'Interviewing',
    'Final Round',
    'Offer',
    'Rejected',
    'Withdrawn'
  )
);
