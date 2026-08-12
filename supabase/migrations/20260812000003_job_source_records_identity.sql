-- job_source_records: identify a sighting by (source, canonical job), not by source_url.
-- source_url remains provenance/attribution and may repeat across jobs from the same page.
-- Idempotent forward migration (safe if re-applied after partial success).

-- 1) Drop legacy uniqueness on (source_id, source_url)
alter table public.job_source_records
  drop constraint if exists job_source_records_unique;

-- 2) Collapse duplicate (source_id, job_id) rows (keep newest last_seen_at, then id)
delete from public.job_source_records jsr
using public.job_source_records newer
where jsr.source_id = newer.source_id
  and jsr.job_id = newer.job_id
  and jsr.id <> newer.id
  and (
    jsr.last_seen_at < newer.last_seen_at
    or (jsr.last_seen_at = newer.last_seen_at and jsr.id < newer.id)
  );

-- 3) Collapse duplicate (source_id, external_id) where external_id is present
delete from public.job_source_records jsr
using public.job_source_records newer
where jsr.source_id = newer.source_id
  and jsr.external_id is not null
  and newer.external_id is not null
  and jsr.external_id = newer.external_id
  and jsr.id <> newer.id
  and (
    jsr.last_seen_at < newer.last_seen_at
    or (jsr.last_seen_at = newer.last_seen_at and jsr.id < newer.id)
  );

-- 4) One source record per source + canonical job
do $$
begin
  alter table public.job_source_records
    add constraint job_source_records_source_job_unique unique (source_id, job_id);
exception
  when duplicate_object then null;
end $$;

-- 5) When an adapter supplies external_id, keep it unique per source
create unique index if not exists job_source_records_source_external_uidx
  on public.job_source_records (source_id, external_id)
  where external_id is not null;

comment on constraint job_source_records_source_job_unique on public.job_source_records is
  'One sighting record per job source and canonical job; source_url is attribution only.';
