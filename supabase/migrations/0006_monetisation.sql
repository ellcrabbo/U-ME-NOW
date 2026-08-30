-- U, ME, NOW — 0006 monetisation
-- Stripe subscriptions, premium entitlements, like quota, and RLS.

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  status text not null default 'incomplete'
    check (status in ('incomplete','trialing','active','past_due','canceled','unpaid','incomplete_expired','paused')),
  currency text check (currency is null or currency in ('idr','usd')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_status on public.subscriptions(status, current_period_end);

create table if not exists public.stripe_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb
);

create or replace function public.set_subscription_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_subscriptions_updated on public.subscriptions;
create trigger trg_subscriptions_updated before update on public.subscriptions
  for each row execute function public.set_subscription_updated_at();

create or replace function public.is_premium(uid uuid)
returns boolean language sql stable security definer set search_path to 'public'
as $$
  select exists(
    select 1 from public.subscriptions s
    where s.user_id = uid
      and s.status in ('trialing','active')
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;

create or replace function public.my_subscription()
returns table(status text, currency text, current_period_end timestamptz, cancel_at_period_end boolean)
language sql stable security definer set search_path to 'public'
as $$
  select s.status, s.currency, s.current_period_end, s.cancel_at_period_end
  from public.subscriptions s where s.user_id = auth.uid();
$$;

-- Free users receive 20 likes per UTC calendar day. Premium users are unlimited.
create or replace function public.my_like_quota()
returns table(premium boolean, used_count integer, remaining_count integer)
language plpgsql stable security definer set search_path to 'public'
as $$
declare
  v_premium boolean := public.is_premium(auth.uid());
  v_used integer;
begin
  if auth.uid() is null then return query select false, 0, 0; return; end if;
  select count(*)::integer into v_used from public.likes
  where liker_id = auth.uid() and created_at >= date_trunc('day', now());
  return query select v_premium, v_used,
    case when v_premium then -1 else greatest(0, 20 - v_used) end;
end $$;

create or replace function public.can_like()
returns boolean language plpgsql stable security definer set search_path to 'public'
as $$
declare v_used integer;
begin
  if auth.uid() is null then return false; end if;
  if public.is_premium(auth.uid()) then return true; end if;
  select count(*)::integer into v_used from public.likes
  where liker_id = auth.uid() and created_at >= date_trunc('day', now());
  return v_used < 20;
end $$;

-- Premium-only: reveal people who have liked the current user, while respecting
-- normal profile visibility and blocking rules.
create or replace function public.received_likes()
returns table(
  id uuid, display_name text, public_age integer, city text, bio text,
  intents text[], last_active_at timestamptz, is_nearby boolean, photo_paths text[]
)
language plpgsql stable security definer set search_path to 'public'
as $$
declare
  v uuid := auth.uid(); v_area text;
begin
  if v is null or not public.is_premium(v) then return; end if;
  select broad_area into v_area from public.profile_private where id = v;
  return query
  select p.id, p.display_name, p.public_age, p.city, p.bio, p.intents, p.last_active_at,
    (pp.broad_area is not null and pp.broad_area = v_area) as is_nearby,
    coalesce((select array_agg(ph.storage_path order by ph.sort_order)
      from public.profile_photos ph where ph.user_id = p.id), '{}') as photo_paths
  from public.likes l
  join public.profiles p on p.id = l.liker_id
  join public.profile_private pp on pp.id = p.id
  where l.liked_id = v
    and p.onboarding_complete = true
    and p.account_status = 'active'
    and not public.is_blocked(v, p.id)
    and public.can_view_profile(p.id)
  order by l.created_at desc;
end $$;

alter table public.subscriptions enable row level security;
alter table public.stripe_events enable row level security;

drop policy if exists subscriptions_select on public.subscriptions;
create policy subscriptions_select on public.subscriptions
  for select to authenticated using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- Subscription and Stripe-event writes are server-only via the service role.

drop policy if exists likes_insert on public.likes;
create policy likes_insert on public.likes
  for insert to authenticated
  with check (
    liker_id = auth.uid()
    and liker_id <> liked_id
    and public.can_like()
    and not public.is_blocked(auth.uid(), liked_id)
    and public.can_view_profile(liked_id)
  );
