# U, ME, NOW — WHO'S AROUND?

A mobile-first, installable **PWA** for adult (18+) location-based dating and social discovery, launching privately in **Jakarta**. Built with **React + TypeScript + Vite**, backed by **Supabase Free** (Auth, PostgreSQL, Storage, Edge Functions, Realtime), and deployable as a static site to **Cloudflare Pages Free**.

- Public language: **U, ME, NOW** · **WHO'S AROUND?** · *Meet people nearby. Right now.* · *Less scrolling. More NOW.*
- Monetisation: optional **U-ME-NOW+** monthly subscription via **Stripe**.
- U-ME-NOW+ pricing: **Rp175,000/month** for Indonesia or **US$9.99/month** internationally.
- Free users keep core discovery, matching and direct chat. Premium users get unlimited likes and can see people who liked them.
- The browser only ever uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Stripe secret keys and webhook secrets are server-side only.

```
/app
├── frontend/                 # React + Vite PWA
│   ├── src/                  # pages, components, lib, context, hooks
│   ├── public/               # icons, manifest, _redirects
│   └── scripts/              # development seed helpers
└── supabase/
    ├── migrations/           # 0001..0006 SQL — run in order
    ├── config.toml           # Edge Function JWT settings
    └── functions/
        ├── delete-account/
        ├── create-checkout-session/
        ├── create-portal-session/
        └── stripe-webhook/
```

---

## 1. Supabase project setup

1. Go to https://supabase.com → sign in → **New project** (Free plan). Region: **Singapore**.
2. Open **Project Settings → API**.
3. Use the Project URL and publishable/anon key only in the frontend.

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
6. `0006_monetisation.sql` — Stripe subscriptions, premium entitlement, 20/day free-like quota, incoming-like RPC and RLS

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

Stripe is the payment processor for U-ME-NOW+. The application uses Stripe-hosted Checkout for subscriptions and the Stripe Billing Portal for billing management. The webhook verifies Stripe's signature against the raw request body.

### Create the Stripe catalogue

In **Stripe Dashboard → Product catalogue** create:

**Product:** `U-ME-NOW+`

Create two recurring monthly prices:

- **IDR 175,000 / month** — copy its Price ID into `STRIPE_PRICE_ID_IDR`
- **USD 9.99 / month** — copy its Price ID into `STRIPE_PRICE_ID_USD`

Use the same product for both prices.

### Configure the Stripe Customer Portal

In Stripe Billing → Customer portal, enable at minimum:

- payment-method updates
- invoice history
- subscription cancellation

The portal gives customers a secure hosted page for managing billing.

### Supabase Edge Function secrets

Set these in **Supabase → Edge Functions → Secrets**:

```text
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_ID_IDR=price_...
STRIPE_PRICE_ID_USD=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
APP_URL=https://u-me-now.online
```

Do **not** put any of these in the React frontend.

### Deploy the Edge Functions

```text
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session
supabase functions deploy stripe-webhook
supabase functions deploy delete-account
```

`supabase/config.toml` keeps JWT verification enabled for the authenticated functions and disabled only for `stripe-webhook`.

### Stripe webhook

In **Stripe Dashboard → Workbench → Webhooks**, create a live endpoint:

```text
https://zfqubamijskcjbbjtxyp.supabase.co/functions/v1/stripe-webhook
```

Subscribe to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Copy the endpoint signing secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`.

The webhook is the authoritative source for subscription status. It verifies the Stripe signature and writes the entitlement into Supabase.

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

Use Stripe **test mode first** with test price IDs and a Stripe test payment method. Verify:

1. authenticated user opens `/premium`
2. IDR and USD prices are selectable
3. Checkout opens on Stripe
4. successful checkout redirects back to `/premium`
5. webhook creates/updates `public.subscriptions`
6. U-ME-NOW+ becomes active
7. free-like quota becomes unlimited
8. incoming likes become visible
9. Billing Portal opens
10. cancellation at period end preserves access until `current_period_end`
11. canceled/expired subscription removes premium access

Only after that should live Stripe keys, live prices and the live webhook be enabled.

## Production launch

See `LAUNCH_CHECKLIST.md` for legal, support, moderation, DNS, authentication, PWA and payment approval checks. U-ME-NOW should not publicly launch until Stripe approval, final legal review and operational moderation/support arrangements are complete.
