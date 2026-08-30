-- U, ME, NOW — 0007 Stripe Sync Engine billing source of truth
--
-- The Supabase Stripe Sync Engine owns the synced Stripe billing data in the
-- `stripe` schema. U-ME-NOW only derives entitlements from that synced data;
-- it does not maintain a second subscription/event ledger.

create or replace function public.is_premium(uid uuid)
returns boolean
language sql stable security definer
set search_path = public, stripe
as $$
  select exists (
    select 1
    from stripe.subscriptions s
    join stripe.customers c on c.id = s.customer
    where c.attrs #>> '{metadata,user_id}' = uid::text
      and s.status in ('trialing', 'active')
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;

create or replace function public.my_subscription()
returns table(
  status text,
  currency text,
  current_period_end timestamptz,
  cancel_at_period_end boolean
)
language sql stable security definer
set search_path = public, stripe
as $$
  select
    s.status,
    s.currency,
    s.current_period_end,
    coalesce((s.attrs->>'cancel_at_period_end')::boolean, false)
  from stripe.subscriptions s
  join stripe.customers c on c.id = s.customer
  where c.attrs #>> '{metadata,user_id}' = auth.uid()::text
  order by s.current_period_end desc nulls last
  limit 1;
$$;

-- Remove the old duplicate billing ledger. Stripe Sync Engine is now the
-- authoritative billing source for entitlement checks.
drop table if exists public.stripe_events;
drop table if exists public.subscriptions;

revoke all on function public.is_premium(uuid) from public;
revoke all on function public.my_subscription() from public;
grant execute on function public.is_premium(uuid) to authenticated;
grant execute on function public.my_subscription() to authenticated;
