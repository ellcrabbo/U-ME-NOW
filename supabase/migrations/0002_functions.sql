-- =====================================================================
-- U, ME, NOW — 0002 functions
-- Security-definer helpers, RPCs, and the reciprocal-like match trigger.
-- These functions bypass RLS internally so they can enforce rules that
-- would otherwise require exposing private data to the client.
-- =====================================================================

-- ---------- helpers ----------

create or replace function public.is_admin(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.admin_roles where user_id = uid);
$$;

create or replace function public.account_active(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = uid and account_status = 'active');
$$;

create or replace function public.is_blocked(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

create or replace function public.are_matched(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.matches
    where user_a = least(a, b) and user_b = greatest(a, b)
  );
$$;

-- Central visibility rule reused by profiles/photos policies.
create or replace function public.can_view_profile(target uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare v uuid := auth.uid(); rec public.profiles%rowtype;
begin
  if v is null then return false; end if;
  if v = target then return true; end if;
  if public.is_admin(v) then return true; end if;
  if not public.account_active(v) then return false; end if;
  select * into rec from public.profiles where id = target;
  if not found then return false; end if;
  if rec.account_status <> 'active' or rec.onboarding_complete = false then return false; end if;
  if public.is_blocked(v, target) then return false; end if;
  return rec.discoverable or public.are_matched(v, target);
end $$;

create or replace function public.in_conversation(p_conversation uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1
    from public.conversations c
    join public.matches m on m.id = c.match_id
    where c.id = p_conversation and auth.uid() in (m.user_a, m.user_b)
  );
$$;

-- Can the current user send in this conversation? (participant, not blocked,
-- both accounts active).
create or replace function public.can_message(p_conversation uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare a uuid; b uuid; v uuid := auth.uid();
begin
  select m.user_a, m.user_b into a, b
  from public.conversations c join public.matches m on m.id = c.match_id
  where c.id = p_conversation;
  if a is null then return false; end if;
  if v <> a and v <> b then return false; end if;
  if public.is_blocked(a, b) then return false; end if;
  return public.account_active(a) and public.account_active(b);
end $$;

-- ---------- activity + landing ----------

create or replace function public.touch_last_active()
returns void language sql security definer set search_path = public as $$
  update public.profiles set last_active_at = now() where id = auth.uid();
$$;

-- Public landing count. Callable by anon (returns only a number).
create or replace function public.count_online_discoverable()
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::int from public.profiles
  where discoverable = true
    and onboarding_complete = true
    and account_status = 'active'
    and last_active_at > now() - interval '15 minutes';
$$;

-- ---------- discovery ----------
-- Returns public fields + a computed is_nearby boolean. NEVER returns anyone's
-- broad_area, coordinates, or distance.
create or replace function public.discover(
  p_online boolean default false,
  p_recent boolean default false,
  p_intent text default null
)
returns table (
  id uuid,
  display_name text,
  public_age int,
  city text,
  bio text,
  intents text[],
  last_active_at timestamptz,
  is_nearby boolean,
  photo_paths text[]
)
language plpgsql stable security definer set search_path = public as $$
declare v uuid := auth.uid(); v_area text; v_ok boolean;
begin
  if v is null then return; end if;
  select (account_status = 'active' and onboarding_complete) into v_ok from public.profiles where id = v;
  if not coalesce(v_ok, false) then return; end if;
  select broad_area into v_area from public.profile_private where id = v;

  return query
    select p.id, p.display_name, p.public_age, p.city, p.bio, p.intents, p.last_active_at,
           (pp.broad_area is not null and pp.broad_area = v_area) as is_nearby,
           coalesce(
             (select array_agg(ph.storage_path order by ph.sort_order)
              from public.profile_photos ph where ph.user_id = p.id), '{}'
           ) as photo_paths
    from public.profiles p
    join public.profile_private pp on pp.id = p.id
    where p.id <> v
      and p.discoverable = true
      and p.onboarding_complete = true
      and p.account_status = 'active'
      and not public.is_blocked(v, p.id)
      and (not p_online or p.last_active_at > now() - interval '15 minutes')
      and (not p_recent or p.last_active_at > now() - interval '7 days')
      and (p_intent is null or p_intent = any(p.intents))
    order by p.last_active_at desc nulls last
    limit 100;
end $$;

-- ---------- matches / conversations ----------

-- Reciprocal like -> create match + conversation atomically.
create or replace function public.handle_new_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare a uuid; b uuid; m_id uuid;
begin
  if exists (select 1 from public.likes where liker_id = new.liked_id and liked_id = new.liker_id)
     and not public.is_blocked(new.liker_id, new.liked_id) then
    a := least(new.liker_id, new.liked_id);
    b := greatest(new.liker_id, new.liked_id);
    insert into public.matches(user_a, user_b) values (a, b)
      on conflict (user_a, user_b) do nothing
      returning id into m_id;
    if m_id is not null then
      insert into public.conversations(match_id) values (m_id) on conflict (match_id) do nothing;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_like_match on public.likes;
create trigger trg_like_match after insert on public.likes
  for each row execute function public.handle_new_like();

-- Conversation id for a matched pair (used to detect a fresh connection).
create or replace function public.conversation_for(p_other uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select c.id
  from public.conversations c
  join public.matches m on m.id = c.match_id
  where m.user_a = least(auth.uid(), p_other)
    and m.user_b = greatest(auth.uid(), p_other)
  limit 1;
$$;

create or replace function public.conversation_meta(p_conversation uuid)
returns table (other_user_id uuid, other_display_name text, other_photo_path text)
language plpgsql stable security definer set search_path = public as $$
declare v uuid := auth.uid(); other uuid;
begin
  if not public.in_conversation(p_conversation) then return; end if;
  select case when m.user_a = v then m.user_b else m.user_a end into other
  from public.conversations c join public.matches m on m.id = c.match_id
  where c.id = p_conversation;
  return query
    select other,
           p.display_name,
           (select storage_path from public.profile_photos where user_id = other order by sort_order limit 1)
    from public.profiles p where p.id = other;
end $$;

create or replace function public.my_conversations()
returns table (
  conversation_id uuid,
  match_id uuid,
  other_user_id uuid,
  other_display_name text,
  other_photo_path text,
  last_message text,
  last_message_at timestamptz,
  unread_count int
)
language plpgsql stable security definer set search_path = public as $$
declare v uuid := auth.uid();
begin
  if v is null then return; end if;
  return query
    select
      c.id,
      m.id,
      case when m.user_a = v then m.user_b else m.user_a end as other_user_id,
      p.display_name,
      (select storage_path from public.profile_photos
        where user_id = (case when m.user_a = v then m.user_b else m.user_a end)
        order by sort_order limit 1),
      (select content from public.messages where conversation_id = c.id order by created_at desc limit 1),
      (select created_at from public.messages where conversation_id = c.id order by created_at desc limit 1),
      (select count(*)::int from public.messages
        where conversation_id = c.id and sender_id <> v and read_at is null)
    from public.conversations c
    join public.matches m on m.id = c.match_id
    join public.profiles p on p.id = (case when m.user_a = v then m.user_b else m.user_a end)
    where v in (m.user_a, m.user_b)
      and not public.is_blocked(m.user_a, m.user_b)
    order by (select created_at from public.messages where conversation_id = c.id order by created_at desc limit 1) desc nulls last,
             c.created_at desc;
end $$;

create or replace function public.mark_conversation_read(p_conversation uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.in_conversation(p_conversation) then return; end if;
  update public.messages
    set read_at = now()
    where conversation_id = p_conversation and sender_id <> auth.uid() and read_at is null;
end $$;

-- ---------- admin RPCs (all guarded by is_admin) ----------

create or replace function public.admin_list_reports(p_status text default null)
returns setof public.reports language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'not authorised'; end if;
  return query select * from public.reports
    where p_status is null or status = p_status
    order by created_at desc;
end $$;

create or replace function public.admin_set_report_status(p_report uuid, p_status text, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare r public.reports%rowtype;
begin
  if not public.is_admin(auth.uid()) then raise exception 'not authorised'; end if;
  update public.reports set status = p_status where id = p_report returning * into r;
  insert into public.moderation_actions(admin_id, affected_user_id, action, reason)
    values (auth.uid(), r.reported_user_id, 'report_' || p_status, p_reason);
end $$;

create or replace function public.admin_moderate_user(p_user uuid, p_action text, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare new_status text;
begin
  if not public.is_admin(auth.uid()) then raise exception 'not authorised'; end if;
  new_status := case p_action
    when 'suspend' then 'suspended'
    when 'ban' then 'banned'
    when 'unsuspend' then 'active'
    else null end;
  if new_status is null then raise exception 'invalid action'; end if;
  update public.profiles
    set account_status = new_status,
        discoverable = case when new_status = 'active' then discoverable else false end
    where id = p_user;
  insert into public.moderation_actions(admin_id, affected_user_id, action, reason)
    values (auth.uid(), p_user, p_action, p_reason);
end $$;

create or replace function public.admin_list_actions()
returns setof public.moderation_actions language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'not authorised'; end if;
  return query select * from public.moderation_actions order by created_at desc limit 200;
end $$;

-- Prevent non-admins from escalating their own account_status via direct update.
create or replace function public.guard_account_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.account_status is distinct from old.account_status and not public.is_admin(auth.uid()) then
    new.account_status := old.account_status;
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_status on public.profiles;
create trigger trg_guard_status before update on public.profiles
  for each row execute function public.guard_account_status();

-- ---------- grants ----------
grant execute on function public.count_online_discoverable() to anon, authenticated;
grant execute on function public.touch_last_active() to authenticated;
grant execute on function public.discover(boolean, boolean, text) to authenticated;
grant execute on function public.conversation_for(uuid) to authenticated;
grant execute on function public.conversation_meta(uuid) to authenticated;
grant execute on function public.my_conversations() to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
grant execute on function public.admin_list_reports(text) to authenticated;
grant execute on function public.admin_set_report_status(uuid, text, text) to authenticated;
grant execute on function public.admin_moderate_user(uuid, text, text) to authenticated;
grant execute on function public.admin_list_actions() to authenticated;
