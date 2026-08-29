# Test Credentials — U, ME, NOW

## Supabase
- VITE_SUPABASE_URL: (pending — user to provide from Project Settings → API)
- VITE_SUPABASE_PUBLISHABLE_KEY: (pending — anon public key)
- Service role key: used ONLY in the delete-account Edge Function (never in browser/repo)

## App test accounts
- Created via email/password sign-up against the user's Supabase project.
- Dev seed accounts (after running scripts/seed.mjs): demo1..demo8@umenow.dev / DemoPassword123!

## Admin
- Assigned manually via SQL: insert into public.admin_roles(user_id, role) values ('<uuid>','admin');
