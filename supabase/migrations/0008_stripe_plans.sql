-- U, ME, NOW — 0008 Stripe plan entitlements
--
-- Billing remains entirely Stripe-owned. The Stripe Sync Engine is the source
-- of truth. Recurring plans are read from stripe.subscriptions; Lifetime is
-- read from synced Stripe Checkout Sessions.

create or replace function public.is_premium(uid uuid)
returns boolean
language sql stable security definer
set search_path = public, stripe
as $$
  select
    exists (
      select 1
      from stripe.subscriptions s
      join stripe.customers c on c.id = s.customer
      where c.metadata ->> 'user_id' = uid::text
        and s.status in ('trialing', 'active')
        and (
          s.current_period_end is null
          or to_timestamp(s.current_period_end) > now()
        )
    )
    or exists (
      select 1
      from stripe.checkout_sessions cs
      join stripe.customers c on c.id = cs.customer
      where c.metadata ->> 'user_id' = uid::text
        and cs.metadata ->> 'plan' = 'lifetime'
        and cs._raw_data ->> 'payment_status' = 'paid'
    );
$$;

-- Return the user's current premium plan. Recurring plans take priority over
-- Lifetime only so the result remains deterministic if legacy/test data exists.
drop function if exists public.my_subscription();

create or replace function public.my_subscription()
returns table(
  plan text,
  status text,
  currency text,
  current_period_end timestamptz,
  cancel_at_period_end boolean,
  lifetime boolean
)
language sql stable security definer
set search_path = public, stripe
as $$
  with recurring as (
    select
      coalesce(s.metadata ->> 'plan', 'unlimited') as plan,
      s.status,
      c.currency,
      case
        when s.current_period_end is null then null
        else to_timestamp(s.current_period_end)
      end as current_period_end,
      coalesce(s.cancel_at_period_end, false) as cancel_at_period_end,
      false as lifetime,
      1 as priority
    from stripe.subscriptions s
    join stripe.customers c on c.id = s.customer
    where c.metadata ->> 'user_id' = auth.uid()::text
      and s.status in (
        'trialing',
        'active',
        'past_due',
        'canceled',
        'unpaid'
      )
  ),
  lifetime_purchase as (
    select
      'lifetime'::text as plan,
      'paid'::text as status,
      cs.currency,
      null::timestamptz as current_period_end,
      false as cancel_at_period_end,
      true as lifetime,
      2 as priority
    from stripe.checkout_sessions cs
    join stripe.customers c on c.id = cs.customer
    where c.metadata ->> 'user_id' = auth.uid()::text
      and cs.metadata ->> 'plan' = 'lifetime'
      and cs._raw_data ->> 'payment_status' = 'paid'
    order by cs.id desc
    limit 1
  )
  select
    plan,
    status,
    currency,
    current_period_end,
    cancel_at_period_end,
    lifetime
  from (
    select * from recurring
    union all
    select * from lifetime_purchase
  ) x
  order by priority, current_period_end desc nulls last
  limit 1;
$$;

revoke all on function public.is_premium(uuid) from public;
revoke all on function public.my_subscription() from public;
grant execute on function public.is_premium(uuid) to authenticated;
grant execute on function public.my_subscription() to authenticated;
