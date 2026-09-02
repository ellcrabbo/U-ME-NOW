# U, ME, NOW — Pre-launch checklist

Mark every item before going public. Items flagged **(YOU)** need a human decision, external account action, or professional review.

## Legal & regulatory — MUST complete before launch
- [ ] **(YOU)** Have a UK-qualified lawyer review and finalise the Terms, Privacy Policy, Community Guidelines, AUP, Reporting & Complaints, Law Enforcement, and Payments/Refunds pages.
- [ ] **(YOU)** Add the legal operator's exact registered name, registered office/address, company/registration details where applicable, and monitored legal contact details to the public Contact page.
- [ ] **(YOU)** Confirm the UK business structure and which UK consumer/data-protection laws apply to the actual contracting entity.
- [ ] **(YOU)** Confirm Indonesian regulatory position for the Jakarta launch, including PSE Lingkup Privat registration/obligations and any applicable local representative requirements.
- [ ] **(YOU)** Confirm whether any Indonesian business, tax, consumer, advertising or local licensing requirements apply to the operating model.
- [ ] **(YOU)** Complete and retain a written UK Online Safety Act illegal-content risk assessment if the service is in scope.
- [ ] **(YOU)** Complete the required children's access assessment and, if applicable, children's risk assessment under the Online Safety Act.
- [ ] **(YOU)** Decide and implement an age-assurance method appropriate to the legal risk assessment; a self-declared 18+ checkbox alone may not satisfy applicable UK requirements where highly effective age assurance is required.
- [ ] **(YOU)** If the UK Online Safety Act CSEA reporting duty applies, register the appropriate reporting process with the NCA and document the operational procedure.

## Public legal pages
- [ ] `/terms` — Terms of Service
- [ ] `/privacy` — Privacy Policy
- [ ] `/guidelines` — Community Guidelines
- [ ] `/acceptable-use` — Acceptable Use Policy
- [ ] `/reporting` — Reporting & Complaints
- [ ] `/law-enforcement` — Law Enforcement & Legal Requests
- [ ] `/refunds` — Payments, Cancellation & Refunds
- [ ] `/safety` — Safety Centre
- [ ] `/contact` — monitored support + legal operator information
- [ ] Ensure every public legal page is reachable without an account.

## Support & contact
- [ ] **(YOU)** Set `VITE_SUPPORT_EMAIL` to a real monitored inbox.
- [ ] **(YOU)** Establish a process for privacy requests, safety reports, consumer complaints and legal requests.
- [ ] **(YOU)** Set documented response targets for urgent safety, privacy and general support requests.

## Safety & moderation
- [ ] **(YOU)** Assign at least one real admin via `admin_roles`.
- [ ] Verify the `/admin` report queue, suspend, ban, reinstate, and action history work.
- [ ] Confirm blocking hides both users, stops likes/matches, and closes chat access.
- [ ] Confirm reporting a profile / photo / message creates a report visible only to authorised admins.
- [ ] Confirm moderation actions are logged and retained appropriately.
- [ ] Confirm urgent reports can be escalated outside normal support hours if required by the risk assessment.
- [ ] Confirm suspected child-safety incidents have a documented escalation and preservation process.

## Data, privacy & security
- [ ] **(YOU)** Map all personal-data flows: app → Supabase → storage → email → Stripe → analytics/other processors.
- [ ] **(YOU)** Complete a UK GDPR DPIA where required and document Indonesian PDP compliance.
- [ ] **(YOU)** Maintain a processor/vendor register and appropriate data-processing agreements.
- [ ] **(YOU)** Document international-transfer safeguards for data leaving the UK or Indonesia where applicable.
- [ ] Run all production database migrations in the documented order.
- [ ] Verify RLS is ON for every relevant table.
- [ ] Confirm date of birth and broad area are never returned to the client (only age + "Nearby" appear).
- [ ] Confirm the `profile-photos` bucket is private and photos load via signed URLs.
- [ ] Deploy the `delete-account`, `create-checkout-session`, and `create-portal-session` Edge Functions required by the current architecture.
- [ ] Confirm Stripe secrets are stored only in Supabase Edge Function Secrets, never in frontend or browser environment variables.
- [ ] **(YOU)** Implement and test the applicable data-breach response and notification procedure.

## Auth & consent
- [ ] Set **Site URL** and **Redirect URLs** for `https://u-me-now.online`.
- [ ] **(YOU)** Configure Resend as custom SMTP and complete SPF/DKIM/DMARC.
- [ ] Confirm the Supabase reset-password email contains a clickable `{{ .ConfirmationURL }}` link.
- [ ] Test sign-up → email confirm → onboarding → discovery, plus reset-password.
- [ ] **(YOU)** Record the acceptance/version of Terms and any separate consent required for processing sensitive data, where applicable.
- [ ] Ensure Google/OAuth registration cannot bypass required age, Terms or privacy acceptance controls.

## Demo data
- [ ] Remove all `@umenow.dev` demo accounts before public launch.

## PWA & deployment
- [ ] Cloudflare Pages: root `frontend`, build `npm run build`, output `dist`, `NODE_VERSION=20`.
- [ ] Set the required `VITE_*` env vars in Cloudflare (Production + Preview).
- [ ] Confirm deep links work (visit `/discover` directly → `_redirects` fallback).
- [ ] Install the PWA on Android and iOS; confirm icon, theme colour, standalone launch, and that private data is not cached offline.

## Monetisation — MUST complete before launch
- [ ] **(YOU)** Stripe account approved for U-ME-NOW dating/social-discovery service.
- [ ] **(YOU)** Create Stripe product `U-ME-NOW+`.
- [ ] **(YOU)** Create the agreed Pro price: **IDR 175,000 every 14 days** and copy the Price ID to the production secret.
- [ ] **(YOU)** Create the agreed Unlimited recurring price and confirm its exact amount/interval is displayed before purchase.
- [ ] **(YOU)** Create the agreed Lifetime one-off price.
- [ ] **(YOU)** Configure Stripe Customer Portal for payment-method updates, invoice history, and cancellation where supported.
- [ ] **(YOU)** Verify the current Stripe Sync Engine architecture and do not reintroduce a duplicate local Stripe event ledger unless the architecture is deliberately changed.
- [ ] Test checkout, entitlement sync, cancellation and expiry in Stripe test mode before live payments.
- [ ] Verify the checkout experience clearly shows price, billing interval, automatic renewal and cancellation information before payment.
- [ ] Verify cancellation at period end preserves access until `current_period_end` and then removes premium access.
- [ ] Verify Billing Portal works.

## Final smoke test
- [ ] Two-account flow: mutual like → connection → realtime chat → unread/read.
- [ ] Free account: 20 likes/day enforced by database RLS; 21st like is rejected.
- [ ] Premium account: unlimited likes and incoming likes visible.
- [ ] Non-discoverable and suspended/banned users excluded from discovery.
- [ ] Mobile layout at 390–430px looks correct; desktop fallback is a clean centered column.
- [ ] Production payment test passes before public launch.
- [ ] All public legal pages load without authentication and are linked from the landing page.
