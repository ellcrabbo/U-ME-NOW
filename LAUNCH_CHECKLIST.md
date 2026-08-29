# U, ME, NOW — Pre-launch checklist

Mark every item before going public. Items flagged **(YOU)** need a human decision or an
external account action.

## Legal & policy — MUST review before launch
- [ ] **(YOU)** Have a lawyer review and finalise **Terms**, **Privacy Policy**, and
      **Community Guidelines** (current copy is a labelled TEMPLATE in `src/pages/Legal.tsx`).
- [ ] **(YOU)** Confirm compliance with Indonesian data-protection (UU PDP) and any local
      rules for adult dating services.
- [ ] **(YOU)** Add a real business entity / operator name and contact address to the docs.

## Support & contact
- [ ] **(YOU)** Set `VITE_SUPPORT_EMAIL` to a **real monitored inbox** (dev default is a
      placeholder). It appears on Contact, Safety, and in report confirmations.

## Safety & moderation
- [ ] **(YOU)** Assign at least one real admin via `admin_roles` (see README).
- [ ] Verify the `/admin` report queue, suspend, ban, reinstate, and action history work.
- [ ] Confirm blocking hides both users, stops likes/matches, and closes chat access.
- [ ] Confirm reporting a profile / photo / message creates a report visible only to admins.
- [ ] Decide moderation SLAs and who responds to urgent safety reports.

## Data, privacy & security
- [ ] Run all migrations `0001`→`0005` on the production project.
- [ ] Verify RLS is ON for every table (Supabase → Database → Tables shows "RLS enabled").
- [ ] Confirm date of birth and broad area are never returned to the client (only age +
      "Nearby" appear). Spot-check the `discover` RPC output.
- [ ] Confirm the `profile-photos` bucket is **private** and photos load via signed URLs.
- [ ] Deploy the `delete-account` Edge Function and test a full account deletion.

## Auth
- [ ] Set **Site URL** and **Redirect URLs** for your production domain.
- [ ] **(YOU)** Configure custom **SMTP** (the free built-in email is rate-limited and not
      suitable for launch volume).
- [ ] Test sign-up → email confirm → onboarding → discovery, plus reset-password.

## Demo data
- [ ] Run `node scripts/unseed.mjs` to remove all `@umenow.dev` demo accounts.

## PWA & deployment
- [ ] Cloudflare Pages: root `frontend`, build `yarn build`, output `dist`, `NODE_VERSION=20`.
- [ ] Set the three `VITE_*` env vars in Cloudflare (Production + Preview).
- [ ] Confirm deep links work (visit `/discover` directly → `_redirects` fallback).
- [ ] Install the PWA on Android (Add to Home screen) and iOS (Share → Add to Home Screen);
      confirm icon, theme colour, standalone launch, and that private data is not cached offline.

## Payment / store approval
- [ ] Not applicable in V1 — there are **no payments, subscriptions, credits, or boosts**,
      and **no native app stores** (this is a PWA). If you later add monetisation or submit
      to stores, complete their adult-content and payment approval processes first.

## Final smoke test (see TESTING.md)
- [ ] Two-account flow: mutual like → connection → realtime chat → unread/read.
- [ ] Non-discoverable and suspended/banned users excluded from discovery.
- [ ] Mobile layout at 390–430px looks correct; desktop fallback is a clean centered column.
