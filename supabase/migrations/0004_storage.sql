-- =====================================================================
-- U, ME, NOW — 0004 storage
-- Private photo bucket + object-level RLS. Photos are retrieved via
-- short-lived signed URLs; the bucket is NOT public.
-- Object path convention: {user_id}/{uuid}.{ext}
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photos', 'profile-photos', false, 5242880,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Read: owner, admins, or anyone allowed to view that profile.
drop policy if exists photos_read on storage.objects;
create policy photos_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'profile-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin(auth.uid())
      or public.can_view_profile(((storage.foldername(name))[1])::uuid)
    )
  );

-- Write/update/delete: owner only (path must start with their user id).
drop policy if exists photos_write on storage.objects;
create policy photos_write on storage.objects
  for insert to authenticated
  with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists photos_modify on storage.objects;
create policy photos_modify on storage.objects
  for update to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists photos_remove on storage.objects;
create policy photos_remove on storage.objects
  for delete to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
