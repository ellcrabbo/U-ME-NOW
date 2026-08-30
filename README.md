# U, ME, NOW — WHO'S AROUND?

A mobile-first, installable **PWA** for adult (18+) location-based dating and social discovery, launching privately in **Jakarta**. Built with **React + TypeScript + Vite**, backed by **Supabase Free** (Auth, PostgreSQL, Storage, Edge Functions, Realtime), and deployable as a static site to **Cloudflare Pages Free**.

- Public language: **U, ME, NOW** · **WHO'S AROUND?** · *Meet people nearby. Right now.* · *Less scrolling. More NOW.*
- Monetisation: optional **U-ME-NOW+** via Stripe.
- Launch plans: **Pro — Rp175,000 every 2 weeks · Unlimited — monthly · Lifetime — one-off.**
- Free users keep core discovery, matching and direct chat. Premium users get unlimited likes and can see people who liked them.
- The browser only ever uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Stripe secret keys are server-side only.

## Stripe billing architecture

Stripe is the payment processor. The application uses Stripe-hosted Checkout for Pro, Unlimited and Lifetime, and Stripe Billing Portal for recurring-plan management. **Supabase Stripe Sync Engine is the authoritative billing source for entitlements.** U-ME-NOW does not maintain a second Stripe webhook/event ledger.

### Stripe catalogue

Create these prices in the Stripe account used by the Sync Engine:

- **U-ME-NOW+ Pro** — IDR 175,000 recurring every 2 weeks
- **U-ME-NOW+ Unlimited** — recurring monthly
- **U-ME-NOW+ Lifetime** — one-time payment

Copy the three Stripe Price IDs into Supabase Edge Function Secrets:

```text
STRIPE_SECRET_KEY=...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_UNLIMITED=price_...
STRIPE_PRICE_ID_LIFETIME=price_...
APP_URL=https://u-me-now.online
```

Never put Stripe secrets or a Supabase service-role key in the React frontend.

### Sync Engine

Install and connect **Supabase → Integrations → Stripe Sync Engine** to the same Stripe account that owns these prices. The application derives entitlement from synced `stripe.customers`, `stripe.subscriptions`, and `stripe.checkout_sessions` data.

Customer metadata must contain the Supabase `user_id`. Checkout sessions and recurring subscriptions created by the Edge Function also carry a `plan` metadata value of `pro`, `unlimited`, or `lifetime`.

### Edge Functions

Deploy:

```text
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session
supabase functions deploy delete-account
```

There is no separate U-ME-NOW Stripe webhook secret to configure for this architecture; Stripe Sync Engine owns the Stripe sync path.

## Database migrations

Run each file in `supabase/migrations/` in order in the Supabase SQL Editor:

1. `0001_schema.sql`
2. `0002_functions.sql`
3. `0003_rls.sql`
4. `0004_storage.sql`
5. `0005_realtime.sql`
6. `0006_monetisation.sql`
7. `0007_stripe_sync_engine.sql`
8. `0008_stripe_plans.sql` — derives Pro/Unlimited/Lifetime entitlement from the actual Stripe Sync Engine schema

`0008` uses `stripe.customers.metadata`, `stripe.subscriptions.metadata`, `stripe.subscriptions.current_period_end`, `stripe.subscriptions.cancel_at_period_end`, and synced Checkout Session metadata/raw data. Do not recreate the old `public.subscriptions` or `public.stripe_events` tables.

## Browser environment

Local development uses `frontend/.env`:

```text
VITE_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR-ANON-PUBLISHABLE-KEY
VITE_SUPPORT_EMAIL=your-real-support-address
```

Cloudflare Pages uses the same browser-safe variables plus `NODE_VERSION=20`.

## Production payment test

Before enabling live payments, verify with Stripe test-mode prices:

1. Authenticated user opens `/premium`.
2. Pro, Unlimited and Lifetime are selectable.
3. Checkout opens on Stripe.
4. Pro creates a subscription with `plan=pro`.
5. Unlimited creates a subscription with `plan=unlimited`.
6. Lifetime creates a one-off Checkout Session with `plan=lifetime`.
7. Stripe Sync Engine syncs the resulting Stripe records.
8. `my_subscription()` returns the correct plan.
9. `is_premium()` becomes true after sync.
10. Free-like quota becomes unlimited for premium users.
11. Incoming likes become visible.
12. Billing Portal opens for recurring customers.
13. Cancellation at period end preserves access until `current_period_end`.
14. Expired/canceled recurring subscriptions lose premium access.
15. A paid Lifetime purchase remains active without a renewal.

Only after these checks pass should live Stripe keys/prices be used.

## App structure

```text
/app
├── frontend/                 # React + Vite PWA
│   ├── src/                  # pages, components, lib, context, hooks
│   ├── public/               # icons, manifest, _redirects
│   └── scripts/              # development seed helpers
└── supabase/
    ├── migrations/           # database migrations
    └── functions/            # server-only Edge Functions
```

See `LAUNCH_CHECKLIST.md` for the remaining legal, support, moderation, DNS, authentication, PWA and payment approval checks.

<!-- CI trigger: billing configuration was changed to public-repository Actions usage. -->
