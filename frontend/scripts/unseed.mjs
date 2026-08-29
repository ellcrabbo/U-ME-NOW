// Removes ALL demo accounts created by seed.mjs (any user on @umenow.dev).
// Deleting the auth user cascades to every related table.
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/unseed.mjs

import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.')
  process.exit(1)
}
const admin = createClient(url, key, { auth: { persistSession: false } })

let page = 1
let removed = 0
while (true) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
  if (error) {
    console.error(error.message)
    break
  }
  const demo = data.users.filter((u) => (u.email || '').endsWith('@umenow.dev'))
  for (const u of demo) {
    await admin.auth.admin.deleteUser(u.id)
    removed++
    console.log(`removed ${u.email}`)
  }
  if (data.users.length < 200) break
  page++
}
console.log(`\nRemoved ${removed} demo account(s).`)
