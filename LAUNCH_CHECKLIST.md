# U, ME, NOW — Pre-launch checklist

Mark every item before going public. Items flagged **(YOU)** need a human decision or an external account action.

## Legal & policy — MUST review before launch
- [ ] **(YOU)** Have a lawyer review and finalise **Terms**, **Privacy Policy**, and **Community Guidelines** (current copy is a labelled TEMPLATE in `src/pages/Legal.tsx`).
- [ ] **(YOU)** Confirm compliance with Indonesian data-protection (UU PDP) and any local rules for adult dating services.
- [ ] **(YOU)** Add a real business entity / operator name and contact address to the docs.

## Support & contact
- [ ] **(YOU)** Set `VITE_SUPPORT_EMAIL` to a real monitored inbox.

## Safety & moderation
- [ ] **(YOU)** Assign at least one real admin via `admin_roles`.
- [ ] Verify the `/admin` report queue, suspend, ban, reinstate, and action history work.
- [ ] Confirm blocking hides both users, stops likes/matches, and closes chat access.
- [ ] Confirm reporting a profile / photo / message creates a report visible only to admins.
- [ ] Decide moderation SLAs and who responds to urgent safety reports.

## Data, privacy & security
- [ ] Run all migrations `0001`→`0006` on the production project.
- [ ] Verify RLS is ON for every table, including `subscriptions` and `stripe_events`.
- [ ] Confirm date of birth and broad area are never returned to the client (only age + "Nearby" appear).
- [ ] Confirm the `profile-photos` bucket is private and photos load via signed URLs.
- [ ] Deploy the `delete-account`, `create-checkout-session`, `create-portal-session`, and `stripe-webhook` Edge Functions.
- [ ] Confirm Stripe secrets are stored only in Supabase Edge Function Secrets, never in frontend or Cloudflare browser variables.

## Auth
- [ ] Set **Site URL** and **Redirect URLs** for `https://u-me-now.online`.
- [ ] **(YOU)** Configure Resend as custom SMTP and complete SPF/DKIM/DMARC.
- [ ] Confirm the Supabase reset-password email contains a clickable `{{ .ConfirmationURL }}` link.
- [ ] Test sign-up → email confirm → onboarding → discovery, plus reset-password.

## Demo data
- [ ] Remove all `@umenow.dev` demo accounts before public launch.

## PWA & deployment
- [ ] Cloudflare Pages: root `frontend`, build `npm run build`, output `dist`, `NODE_VERSION=20`.
- [ ] Set the three `VITE_*` env vars in Cloudflare (Production + Preview).
- [ ] Confirm deep links work (visit `/discover` directly → `_redirects` fallback).
- [ ] Install the PWA on Android and iOS; confirm icon, theme colour, standalone launch, and that private data is not cached offline.

## Monetisation — MUST complete before launch
- [ ] **(YOU)** Stripe account approved for U-ME-NOW dating/social-discovery service.
- [ ] **(YOU)** Create Stripe product `U-ME-NOW+`.
- [ ] **(YOU)** Create monthly price **IDR 175,000** and copy Price ID to `STRIPE_PRICE_ID_IDR`.
- [ ] **(YOU)** Create monthly price **USD 9.99** and copy Price ID to `STRIPE_PRICE_ID_USD`.
- [ ] **(YOU)** Configure Stripe Customer Portal for payment-method updates, invoice history, and cancellation.
- [ ] **(YOU)** Create the live Stripe webhook endpoint at `https://zfqubamijskcjbbjtxyp.supabase.co/functions/v1/stripe-webhook`.
- [ ] **(YOU)** Subscribe the webhook to `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, and `invoice.payment_failed`.
- [ ] **(YOU)** Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.
- [ ] **(YOU)** Set `STRIPE_SECRET_KEY`, both Price IDs, `STRIPE_WEBHOOK_SECRET`, and `APP_URL` in Supabase Edge Function Secrets.
- [ ] Test the full subscription lifecycle in Stripe **test mode** before using live keys.
- [ ] Verify checkout → webhook → `subscriptions` row → premium entitlement → unlimited likes → incoming likes.
- [ ] Verify cancellation at period end preserves access until `current_period_end` and then removes premium access.
- [ ] Verify Billing Portal works.

## Final smoke test
- [ ] Two-account flow: mutual like → connection → realtime chat → unread/read.
- [ ] Free account: 20 likes/day enforced by database RLS; 21st like is rejected.
- [ ] Premium account: unlimited likes and incoming likes visible.
- [ ] Non-discoverable and suspended/banned users excluded from discovery.
- [ ] Mobile layout at 390–430px looks correct; desktop fallback is a clean centered column.
- [ ] Production payment test passes before public launch.
