# U, ME, NOW — PRD

## Problem statement
Mobile-first, installable PWA for adult (18+) location-based dating & social discovery,
launching privately in Jakarta. Core proposition: "WHO'S AROUND?" — discover active adults
nearby, state intent, mutually connect, chat. Mainstream adult dating positioning (NOT
escorting/explicit/anonymous/transactional).

## Non-negotiable stack
React + TypeScript + Vite PWA. Supabase Free (Auth, Postgres, Storage, Edge Functions,
Realtime). Static deploy to Cloudflare Pages Free. No paid APIs, no maps, no AI, no payments,
no push. Browser uses only VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY. Service-role key
only inside Edge Function. GitHub-backed (ellcrabbo/U-ME-NOW).

## Visual system
Near-black (#0A0A0B), warm white (#F5F0E8), one vivid accent signal-orange (#FF5C38).
Bricolage Grotesque display + Instrument Sans body. Radar/pulse mark. No pink/hearts, no
explicit imagery, gradient placeholders instead of stock photos.

## Architecture
- Frontend: /app/frontend (Vite). Supervisor runs `yarn start` on :3000 for preview.
- DB: /app/supabase/migrations 0001..0005 (schema, functions/RPCs, RLS, storage, realtime).
- Edge Function: /app/supabase/functions/delete-account.
- Security-definer RPCs enforce discovery ("Nearby" without leaking area), atomic match
  creation (like trigger), chat access, admin moderation. RLS on every table.

## Implemented (2026-06)
- Landing (live online count RPC + zero-state), Auth (sign up/in, confirm, resend, reset,
  callback), Onboarding (18+, DOB private, area private, intents, bio, up-to-3 photos,
  discoverable, consents), Profile/Settings (edit, photo reorder/delete, delete-account),
  Discovery (secure RPC + filters + block/report), Likes/Matches (reciprocal trigger),
  Realtime Chat (unread/read), Safety (block/report), Admin moderation (/admin, report queue,
  suspend/ban/reinstate, action history), Legal/Safety/Contact template pages, PWA (manifest,
  icons, service worker precaching static only, _redirects), dev seed/unseed scripts.
- Verified: production build passes (tsc + vite + PWA), landing renders on-brief in preview.

## Pending (needs user external action)
- Supabase project creation + run migrations + provide URL/anon key.
- After creds: set frontend/.env, restart, run testing agent for full E2E.
- Deploy delete-account function; set Auth redirect URLs; custom SMTP for launch.
- Legal review of template copy; real support email; assign admin; remove demo data.
- Cloudflare Pages deploy (root frontend, build yarn build, output dist).

## Backlog / future (out of V1 scope)
- Custom SMTP, richer profile fields, report evidence attachments, admin photo/message
  inline context viewer, rate limiting on likes/messages.
