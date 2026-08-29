# U, ME, NOW — Manual test checklist

Use two browsers/profiles ("A" and "B") so you can test matching and chat. After running
migrations and setting env vars, sign up two accounts (or use `scripts/seed.mjs` demo data).

## Auth & onboarding
- [ ] Sign up with email/password → receive confirmation email → link opens `/auth/callback`
      → lands on onboarding.
- [ ] Resend-confirmation works; unconfirmed sign-in shows the resend prompt.
- [ ] Forgot password → reset link → set new password → sign in.
- [ ] Onboarding blocks submit until 18+ check, DOB (18+), name, area, ≥1 intent, and all
      three consents are provided. You cannot reach `/discover` until onboarding completes.

## Photos
- [ ] Upload up to 3 photos in onboarding; a 4th is prevented.
- [ ] In Settings: add, delete, and reorder photos (order persists after reload).
- [ ] Photos display via signed URLs; users without photos show the branded placeholder.

## Discovery visibility
- [ ] A appears to B only when discoverable, onboarded, and active.
- [ ] Turning discovery OFF removes you from others' discovery.
- [ ] Current user, incomplete, non-discoverable, suspended/banned, and blocked users are
      excluded.
- [ ] "Nearby" shows only when both users chose the same broad area. Area is never displayed.
- [ ] Filters (online now / recently active / intent) work; empty state renders.

## Likes & matches
- [ ] A likes B (no chat access yet). B likes A → a connection + conversation is created once.
- [ ] Liking twice does not create duplicates (DB unique constraint).

## Chat
- [ ] Only matched users can open the conversation; others get "unavailable".
- [ ] Messages send and appear in realtime for both users; timestamps show.
- [ ] Unread badge on Connections; opening the chat marks messages read.

## Blocking
- [ ] Block from a discovery card or from chat.
- [ ] Blocked user disappears from both users' discovery; chat becomes inaccessible; new
      likes/matches are prevented.

## Reporting
- [ ] Report a profile, a photo, and a message with a reason (+ optional details).
- [ ] Confirmation + safety guidance appears. Report is visible in `/admin` (not to others).

## Admin
- [ ] Assign your account in `admin_roles`; `/admin` becomes reachable.
- [ ] Report queue filters by status; change status (reviewing/resolved/dismissed).
- [ ] Suspend / ban / reinstate a user; the target's discovery + chat behaviour updates.
- [ ] Action history lists actions with admin id, target, and timestamp.

## Account deletion
- [ ] Settings → Delete account → confirm → Edge Function removes photos + all data; you are
      signed out and cannot sign back in.

## Mobile & PWA
- [ ] Layout is correct at 390–430px; touch targets are comfortable; desktop is a centered column.
- [ ] Install prompt/Add to Home Screen works; app launches standalone with the correct icon.
- [ ] Offline: static shell loads; private profile/chat data is NOT served from cache.

## Production deployment
- [ ] Cloudflare Pages build succeeds (root `frontend`, `yarn build`, output `dist`).
- [ ] Deep link to `/discover` works via `_redirects`.
- [ ] Auth redirect URLs include the production domain.
