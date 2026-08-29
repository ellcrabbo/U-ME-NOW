-- =====================================================================
-- U, ME, NOW — 0003 row level security
-- Enable RLS on every table and define least-privilege policies.
-- =====================================================================

alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.profile_photos enable row level security;
alter table public.likes enable row level security;
alter table public.matches enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.admin_roles enable row level security;
alter table public.moderation_actions enable row level security;

-- ---------- profiles ----------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (public.can_view_profile(id));

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ---------- profile_private ----------
drop policy if exists private_select on public.profile_private;
create policy private_select on public.profile_private
  for select to authenticated using (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists private_insert on public.profile_private;
create policy private_insert on public.profile_private
  for insert to authenticated with check (id = auth.uid());

drop policy if exists private_update on public.profile_private;
create policy private_update on public.profile_private
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ---------- profile_photos ----------
drop policy if exists photos_select on public.profile_photos;
create policy photos_select on public.profile_photos
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()) or public.can_view_profile(user_id));

drop policy if exists photos_insert on public.profile_photos;
create policy photos_insert on public.profile_photos
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists photos_update on public.profile_photos;
create policy photos_update on public.profile_photos
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists photos_delete on public.profile_photos;
create policy photos_delete on public.profile_photos
  for delete to authenticated using (user_id = auth.uid());

-- ---------- likes ----------
drop policy if exists likes_select on public.likes;
create policy likes_select on public.likes
  for select to authenticated
  using (liker_id = auth.uid() or liked_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists likes_insert on public.likes;
create policy likes_insert on public.likes
  for insert to authenticated
  with check (
    liker_id = auth.uid()
    and liker_id <> liked_id
    and not public.is_blocked(auth.uid(), liked_id)
    and public.can_view_profile(liked_id)
  );

drop policy if exists likes_delete on public.likes;
create policy likes_delete on public.likes
  for delete to authenticated using (liker_id = auth.uid());

-- ---------- matches (read only for participants; created by trigger) ----------
drop policy if exists matches_select on public.matches;
create policy matches_select on public.matches
  for select to authenticated
  using (auth.uid() in (user_a, user_b) or public.is_admin(auth.uid()));

-- ---------- conversations ----------
drop policy if exists conversations_select on public.conversations;
create policy conversations_select on public.conversations
  for select to authenticated
  using (public.in_conversation(id) or public.is_admin(auth.uid()));

-- ---------- messages ----------
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select to authenticated
  using (public.in_conversation(conversation_id) or public.is_admin(auth.uid()));

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert to authenticated
  with check (sender_id = auth.uid() and public.can_message(conversation_id));

-- ---------- blocks ----------
drop policy if exists blocks_select on public.blocks;
create policy blocks_select on public.blocks
  for select to authenticated
  using (blocker_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists blocks_insert on public.blocks;
create policy blocks_insert on public.blocks
  for insert to authenticated
  with check (blocker_id = auth.uid() and blocker_id <> blocked_id);

drop policy if exists blocks_delete on public.blocks;
create policy blocks_delete on public.blocks
  for delete to authenticated using (blocker_id = auth.uid());

-- ---------- reports ----------
drop policy if exists reports_select on public.reports;
create policy reports_select on public.reports
  for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists reports_insert on public.reports;
create policy reports_insert on public.reports
  for insert to authenticated with check (reporter_id = auth.uid());

drop policy if exists reports_update on public.reports;
create policy reports_update on public.reports
  for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ---------- admin_roles (read own / admins; writes only via service role) ----------
drop policy if exists admin_roles_select on public.admin_roles;
create policy admin_roles_select on public.admin_roles
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- ---------- moderation_actions (admins read; writes only via RPC) ----------
drop policy if exists modactions_select on public.moderation_actions;
create policy modactions_select on public.moderation_actions
  for select to authenticated using (public.is_admin(auth.uid()));
