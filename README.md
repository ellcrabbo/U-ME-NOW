# U, ME, NOW — WHO'S AROUND?

A mobile-first, installable **PWA** for adult (18+) location-based dating and social
discovery, launching privately in **Jakarta**. Built with **React + TypeScript + Vite**,
backed entirely by **Supabase Free** (Auth, PostgreSQL, Storage, Edge Functions, Realtime),
and deployable as a **static site to Cloudflare Pages Free**.

- Public language: **U, ME, NOW** · **WHO'S AROUND?** · *Meet people nearby. Right now.* · *Less scrolling. More NOW.*
- No paid services, no credit card, no external maps, no AI, no payments, no push.
- The browser only ever uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
  The service-role key is used **only** inside a Supabase Edge Function, never in the client.

```
/app
├── frontend/                 # the React + Vite PWA (this is what deploys)
│   ├── src/                  # pages, components, lib, context, hooks
│   ├── public/               # favicon, icons, manifest source, _redirects
│   ├── scripts/              # seed.mjs, unseed.mjs, make-icons.mjs
│   └── .env / .env.example
└── supabase/
    ├── migrations/           # 0001..0005 SQL — run in order
    └── functions/
        └── delete-account/   # secure account-deletion Edge Function
```

---

## 1. Supabase project setup

1. Go to https://supabase.com → sign in → **New project** (Free plan). Region: **Singapore**
   (closest to Jakarta). Set and save a strong database password.
2. Wait for the project to finish provisioning.
3. Open **Project Settings → API**. You will need:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_PUBLISHABLE_KEY`

## 2. Required environment variables

Local dev lives in `frontend/.env` (copy from `frontend/.env.example`):

```
VITE_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR-ANON-PUBLISHABLE-KEY
VITE_SUPPORT_EMAIL=support@yourdomain.com   # real inbox before launch
```

> Only `VITE_`-prefixed variables reach the browser. Never put the service-role key here.

## 3. Database migration instructions

Open **Supabase → SQL Editor** and run each file in `supabase/migrations/` **in order**:

1. `0001_schema.sql` — tables, constraints, indexes, structural triggers
2. `0002_functions.sql` — security-definer helpers, discovery/chat RPCs, match trigger
3. `0003_rls.sql` — enables Row Level Security + all policies
4. `0004_storage.sql` — private photo bucket + object policies
5. `0005_realtime.sql` — enables realtime on `messages`

(If you prefer the CLI: `supabase link` then `supabase db push`.)

## 4. Storage bucket setup

`0004_storage.sql` creates a **private** bucket `profile-photos` (not public) with a 5 MB
limit and image-only MIME types, plus object RLS: owners manage their own files
(`{user_id}/…`), and reads are limited to the owner, admins, or users allowed to view that
profile. The app fetches photos through **short-lived signed URLs** — never public links.
No manual dashboard step is required beyond running the migration.

## 5. Authentication redirect URL setup

**Supabase → Authentication → URL Configuration:**

- **Site URL:** your production origin, e.g. `https://umenow.pages.dev` (or your custom domain).
- **Redirect URLs:** add every origin you use, each exactly:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/auth/reset`
  - `https://YOUR-CLOUDFLARE-DOMAIN/auth/callback`
  - `https://YOUR-CLOUDFLARE-DOMAIN/auth/reset`

**Authentication → Providers → Email:** keep **Email** enabled with **Confirm email** ON.
This uses Supabase's built-in free email sender.

> **Free email rate limit:** Supabase's default built-in email is limited (roughly a few
> messages per hour) and is intended for testing. For real launch traffic, configure a
> custom SMTP provider (Authentication → Emails → SMTP). The app already surfaces this to
> users (slow delivery notice + resend controls).

## 6. GitHub connection

The source is backed up to a **private GitHub repo** independent of Emergent.
Use the **"Save to Github"** button in the Emergent chat toolbar to push commits.
(This repo is already linked to `github.com/<you>/U-ME-NOW`.)

## 7. Cloudflare Pages build settings

Cloudflare → **Workers & Pages → Create → Pages → Connect to Git** → pick this repo.

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| **Framework preset** | `None` (or Vite) |
| **Root directory** | `frontend` |
| **Build command** | `yarn build` |
| **Build output directory** | `dist` |
| Node version | 20 (set env `NODE_VERSION=20`) |

SPA deep links are handled by `frontend/public/_redirects` (`/* /index.html 200`), which is
copied into `dist/` on build.

## 8. Cloudflare Pages environment variables

Pages project → **Settings → Environment variables → Production** (and Preview):

```
VITE_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR-ANON-PUBLISHABLE-KEY
VITE_SUPPORT_EMAIL=support@yourdomain.com
NODE_VERSION=20
```

Redeploy after saving so the build picks them up.

## Edge Function (account deletion)

Deploy once with the Supabase CLI:

```
supabase functions deploy delete-account
```

It automatically receives `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` from the platform — no manual secrets needed. It verifies the
caller, removes their photos, and deletes their auth user (cascading all data).

## Assigning admins (moderation)

Admin access is **never** self-serve. In **Supabase → SQL Editor**:

```sql
insert into public.admin_roles (user_id, role)
values ('<the-auth-user-uuid>', 'admin');
```

Find the UUID under **Authentication → Users**. That user then sees `/admin`.

## Development seed (optional, non-production)

From `frontend/`, with the service-role key exported:

```
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.mjs     # add demo profiles
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/unseed.mjs   # remove them all
```

All demo accounts use `@umenow.dev` and are clearly labelled "(demo)". **Run `unseed.mjs`
before public launch.**

## Local development

```
cd frontend
cp .env.example .env   # fill in your values
yarn install --ignore-engines
yarn start             # http://localhost:3000
```

## 9. Production launch checks

See `LAUNCH_CHECKLIST.md` for the full pre-launch list (legal review, support email,
admin assignment, demo-data removal, redirect URLs, SMTP, RLS smoke tests, PWA install,
and store/payment-approval notes).
