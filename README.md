# U, ME, NOW — WHO'S AROUND?

A mobile-first, installable **PWA** for adult (18+) location-based dating and social discovery, launching privately in **Jakarta**. Built with **React + TypeScript + Vite**, backed by **Supabase Free** (Auth, PostgreSQL, Storage, Edge Functions, Realtime), and deployable as a static site to **Cloudflare Pages Free**.

- Public language: **U, ME, NOW** · **WHO'S AROUND?** · *Meet people nearby. Right now.* · *Less scrolling. More NOW.*
- Monetisation: optional **U-ME-NOW+** via **Stripe**.
- Launch plans: **Pro** — Rp175,000 every 2 weeks; **Unlimited** — monthly; **Lifetime** — one-off.
- Free users keep core discovery, matching and direct chat. Premium users get unlimited likes and can see people who liked them.
- The browser only ever uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Stripe secret keys are server-side only.

```
/app
├── frontend/                 # React + Vite PWA
│   ├── src/                  # pages, components, lib, context, hooks
│   ├── public/               # icons, manifest, _redirects
│   └── scripts/              # development seed helpers
└── supabase/
    ├── migrations/           # 0001..0008 SQL — run in order
    ├── config.toml           # Edge Function JWT settings
    └── functions/
        ├── delete-account/
        ├── create-checkout-session/
        └── create-portal-session/
```

---

## 1. Supabase project setup

1. Go to https://supabase.com → sign in → **New project** (Free plan). Region: **Singapore**.
2. Open **Project Settings → API**.
3. Use the Project URL and publishable/anon key only in the frontend.
4. Install **Stripe Sync Engine** from **Integrations → Stripe Sync Engine**. It creates the `stripe` schema and syncs Stripe billing objects into Postgres.

## 2. Browser environment variables

Local development uses `frontend/.env`:

```text
VITE_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR-ANON-PUBLISHABLE-KEY
VITE_SUPPORT_EMAIL=your-real-support-address
```

Never put a Supabase service-role key or Stripe secret in `frontend/.env` or Cloudflare browser-exposed variables.

## 3. Database migrations

Run each file in `supabase/migrations/` in order in the Supabase SQL Editor:

1. `0001_schema.sql` — core tables and structural triggers
2. `0002_functions.sql` — security-definer helpers and application RPCs
3. `0003_rls.sql` — Row Level Security policies
4. `0004_storage.sql` — private profile-photo storage
5. `0005_realtime.sql` — realtime messages
6. `0006_monetisation.sql` — initial U-ME-NOW+ entitlement/quota implementation
7. `0007_stripe_sync_engine.sql` — makes Stripe Sync Engine the billing source of truth and removes the duplicate local subscription/event ledger
8. `0008_stripe_plans.sql` — Pro, Unlimited and Lifetime entitlement logic

CLI alternative:

```text
supabase link
supabase db push
```

## 4. Storage

`0004_storage.sql` creates the private `profile-photos` bucket with a 5 MB limit and image MIME restrictions. Users can only manage their own objects. Do not make the bucket public.

## 5. Authentication and email

Supabase → Authentication → URL Configuration:

- Site URL: `https://u-me-now.online`
- Add production `/auth/callback` and `/auth/reset` URLs.
- Keep Email authentication and confirmation enabled.

For production email, configure **Resend as Supabase SMTP** rather than using the default Supabase sender. The password-reset template must contain the Supabase `{{ .ConfirmationURL }}` link so the recovery URL is actually clickable.

## 6. Stripe setup

Stripe is the payment processor for U-ME-NOW+. The application uses Stripe-hosted Checkout for purchases and subscriptions, and the Stripe Billing Portal for recurring subscription management. **Supabase Stripe Sync Engine is the authoritative billing data source for U-ME-NOW+ entitlements.**

### Create the Stripe catalogue

In **Stripe Dashboard → Product catalogue** create the U-ME-NOW+ catalogue and the three launch prices:

- **Pro** — **Rp175,000 every 2 weeks** — copy its Price ID into `STRIPE_PRICE_ID_PRO`
- **Unlimited** — **monthly** — copy its Price ID into `STRIPE_PRICE_ID_UNLIMITED`
- **Lifetime** — **one-off** — copy its Price ID into `STRIPE_PRICE_ID_LIFETIME`

Use the same U-ME-NOW+ product for the three prices if that matches the Stripe catalogue setup.

### Configure the Stripe Customer Portal

In Stripe Billing → Customer portal, enable at minimum:

- payment-method updates
- invoice history
- subscription cancellation

The portal is used for Pro and Unlimited recurring subscriptions. Lifetime purchases do not need subscription management.

### Stripe Sync Engine

Install **Supabase → Integrations → Stripe Sync Engine** and connect it to the Stripe account that owns the U-ME-NOW+ product/prices.

The Sync Engine creates and maintains the `stripe` schema and keeps Stripe billing data synced into Postgres. U-ME-NOW derives recurring entitlements from synced `stripe.subscriptions` and Lifetime entitlement from synced `stripe.checkout_sessions`, using Stripe customer metadata `user_id` and Checkout/Subscription metadata `plan`.

### Supabase Edge Function secrets

Set these in **Supabase → Edge Functions → Secrets**:

```text
STRIPE_SECRET_KEY=sk_test_...   # use test mode during testing
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_UNLIMITED=price_...
STRIPE_PRICE_ID_LIFETIME=price_...
APP_URL=https://u-me-now.online
```

Do **not** put any of these in the React frontend.

There is **no U-ME-NOW Stripe webhook secret to configure**. The installed Stripe Sync Engine owns the Stripe webhook/sync path.

### Deploy the Edge Functions

```text
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session
supabase functions deploy delete-account
```

The checkout and billing-portal functions require an authenticated Supabase user. Stripe billing state is not written into a separate application-owned subscription ledger.

## 7. GitHub

The source is backed up in the private GitHub repository independently of the hosting provider.

## 8. Cloudflare Pages

Use the connected GitHub repository with:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Framework preset | `None` |
| Root directory | `frontend` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | `20` |

Cloudflare Pages environment variables:

```text
VITE_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR-ANON-PUBLISHABLE-KEY
VITE_SUPPORT_EMAIL=your-real-support-address
NODE_VERSION=20
```

The SPA fallback is provided by `frontend/public/_redirects`.

## 9. Admin assignment

Admin access is never self-serve. In Supabase SQL Editor:

```sql
insert into public.admin_roles (user_id, role)
values ('<auth-user-uuid>', 'admin');
```

## 10. Development seed

Demo data is development-only. Remove it before launch using the existing seed/unseed scripts.

## 11. Local development

```text
cd frontend
npm install
npm run dev
```

## 12. Production payment test

Use Stripe **test mode first** with test Price IDs and a Stripe test payment method. Verify:

1. authenticated user opens `/premium`
2. Pro, Unlimited and Lifetime are selectable
3. Checkout opens on Stripe for the selected plan
4. Pro creates a 2-week recurring subscription
5. Unlimited creates a monthly recurring subscription
6. Lifetime creates a one-off payment
7. successful checkout redirects back to `/premium`
8. Stripe Sync Engine receives the customer and billing records
9. U-ME-NOW+ becomes active from the synced Stripe data
10. free-like quota becomes unlimited
11. incoming likes become visible
12. Billing Portal opens for recurring plans
13. cancellation at period end preserves access until `current_period_end`
14. canceled/expired recurring subscriptions remove premium access
15. Lifetime remains active after the one-off purchase

Only after that should live Stripe keys and live prices be enabled.

## Production launch

See `LAUNCH_CHECKLIST.md` for legal, support, moderation, DNS, authentication, PWA and payment approval checks. U-ME-NOW should not publicly launch until Stripe approval, final legal review and operational moderation/support arrangements are complete.
