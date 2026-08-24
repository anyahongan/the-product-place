-- Resume Storage repair
-- Forward migration only. Do not edit prior migrations (000001–000004).
--
-- Production currently has Profile tables from 20260812000004 but is missing
-- the private `resumes` Storage bucket and its storage.objects policies.
-- This migration repairs ONLY those Storage pieces.
--
-- Path convention (unchanged; matches resumeRepository):
--   {auth.uid()}/master-resume/{filename}

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

-- ---------------------------------------------------------------------------
-- storage.objects RLS — own user-id folder only
-- ---------------------------------------------------------------------------
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
