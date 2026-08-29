-- =====================================================================
-- U, ME, NOW — 0001 schema
-- Tables, constraints, indexes, and structural triggers.
-- Run in the Supabase SQL editor in order (0001 -> 0002 -> 0003 -> 0004).
-- =====================================================================

-- Public profile (safe to show to other authorised users).
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  public_age int check (public_age is null or public_age >= 18),
  city text not null default 'Jakarta',
  bio text,
  intents text[] not null default '{}' check (intents <@ array['Chat','Meet','Date','Casual']),
  discoverable boolean not null default false,
  onboarding_complete boolean not null default false,
  account_status text not null default 'active' check (account_status in ('active','suspended','banned')),
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Private profile (owner + admins only; never exposed publicly).
create table if not exists public.profile_private (
  id uuid primary key references auth.users(id) on delete cascade,
  date_of_birth date,
  broad_area text check (broad_area is null or broad_area in
    ('Central Jakarta','South Jakarta','West Jakarta','North Jakarta','East Jakarta','Tangerang','Bekasi')),
  consent_terms_at timestamptz,
  consent_privacy_at timestamptz,
  consent_guidelines_at timestamptz,
  privacy_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_photos_user on public.profile_photos(user_id, sort_order);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  liker_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  liked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint likes_no_self check (liker_id <> liked_id),
  constraint likes_unique unique (liker_id, liked_id)
);
create index if not exists idx_likes_liked on public.likes(liked_id);

-- Canonical ordering (user_a < user_b) guarantees one row per pair.
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint matches_canonical check (user_a < user_b),
  constraint matches_unique unique (user_a, user_b)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null unique references public.matches(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists idx_messages_conv on public.messages(conversation_id, created_at);

create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint blocks_no_self check (blocker_id <> blocked_id),
  constraint blocks_unique unique (blocker_id, blocked_id)
);
create index if not exists idx_blocks_blocked on public.blocks(blocked_id);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reported_user_id uuid not null references auth.users(id) on delete cascade,
  message_id uuid references public.messages(id) on delete set null,
  photo_id uuid references public.profile_photos(id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_reports_status on public.reports(status, created_at desc);

create table if not exists public.admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'moderator' check (role in ('moderator','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete set null,
  affected_user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists idx_modactions_user on public.moderation_actions(affected_user_id, created_at desc);

-- ---------- structural triggers ----------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
drop trigger if exists trg_private_updated on public.profile_private;
create trigger trg_private_updated before update on public.profile_private
  for each row execute function public.set_updated_at();
drop trigger if exists trg_reports_updated on public.reports;
create trigger trg_reports_updated before update on public.reports
  for each row execute function public.set_updated_at();

-- Auto-create empty profile rows for every new auth user.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  insert into public.profile_private (id) values (new.id) on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Enforce max 3 photos per user at the database level.
create or replace function public.enforce_photo_limit()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.profile_photos where user_id = new.user_id) >= 3 then
    raise exception 'Maximum of 3 photos allowed';
  end if;
  return new;
end $$;

drop trigger if exists trg_photo_limit on public.profile_photos;
create trigger trg_photo_limit before insert on public.profile_photos
  for each row execute function public.enforce_photo_limit();
