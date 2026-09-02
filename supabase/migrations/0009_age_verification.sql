-- =====================================================================
-- U, ME, NOW — 0009 manual age verification
-- Zero-cost MVP age assurance: government ID + contemporaneous selfie,
-- manually reviewed by an authorised moderator/admin.
-- Underlying verification files are private and should be deleted after
-- review. The application retains only the verification outcome/metadata.
-- =====================================================================

alter table public.profile_private
  add column if not exists age_verification_status text not null default 'required'
    check (age_verification_status in ('required','pending','approved','rejected')),
  add column if not exists age_verified_at timestamptz,
  add column if not exists age_verification_method text,
  add column if not exists age_verification_reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists age_verification_reviewed_at timestamptz;

create table if not exists public.age_verification_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  id_storage_path text not null,
  selfie_storage_path text not null,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected')),
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewer_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists idx_age_verification_status
  on public.age_verification_submissions(status, created_at asc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'age-verification',
  'age-verification',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

alter table public.age_verification_submissions enable row level security;

drop policy if exists age_submission_insert on public.age_verification_submissions;
create policy age_submission_insert on public.age_verification_submissions
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists age_submission_select on public.age_verification_submissions;
create policy age_submission_select on public.age_verification_submissions
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists age_submission_update on public.age_verification_submissions;
create policy age_submission_update on public.age_verification_submissions
  for update to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Users may upload only into their own folder. Admins may read/delete for review.
drop policy if exists age_files_insert on storage.objects;
create policy age_files_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'age-verification'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists age_files_read on storage.objects;
create policy age_files_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'age-verification'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin(auth.uid())
    )
  );

drop policy if exists age_files_delete on storage.objects;
create policy age_files_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'age-verification'
    and public.is_admin(auth.uid())
  );

-- Only an admin can change the outcome. This prevents users from approving
-- themselves through the client.
create or replace function public.admin_review_age_verification(
  p_submission uuid,
  p_status text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Not authorised';
  end if;

  if p_status not in ('approved','rejected') then
    raise exception 'Invalid review status';
  end if;

  select user_id into v_user
  from public.age_verification_submissions
  where id = p_submission
  for update;

  if v_user is null then
    raise exception 'Submission not found';
  end if;

  update public.age_verification_submissions
  set status = p_status,
      reviewer_id = auth.uid(),
      reviewer_note = nullif(trim(p_note), ''),
      reviewed_at = now()
  where id = p_submission;

  update public.profile_private
  set age_verification_status = p_status,
      age_verified_at = case when p_status = 'approved' then now() else null end,
      age_verification_method = case when p_status = 'approved' then 'manual_photo_id_and_selfie' else null end,
      age_verification_reviewed_by = auth.uid(),
      age_verification_reviewed_at = now()
  where id = v_user;
end;
$$;

grant execute on function public.admin_review_age_verification(uuid, text, text) to authenticated;

create or replace function public.admin_list_age_verifications()
returns table (
  id uuid,
  user_id uuid,
  id_storage_path text,
  selfie_storage_path text,
  status text,
  reviewer_note text,
  created_at timestamptz,
  reviewed_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select s.id, s.user_id, s.id_storage_path, s.selfie_storage_path,
         s.status, s.reviewer_note, s.created_at, s.reviewed_at
  from public.age_verification_submissions s
  where public.is_admin(auth.uid())
  order by s.created_at asc;
$$;

grant execute on function public.admin_list_age_verifications() to authenticated;
