// Development-only seed. Creates clearly fictional demo accounts so you can
// test discovery, likes, matches, and chat. NEVER run against production data.
//
// Usage (from /app/frontend, or anywhere with these env vars set):
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.mjs
//
// Requires the SERVICE ROLE key (found in Supabase -> Project Settings -> API).
// Keep this key private. Demo accounts all use the @umenow.dev domain and can
// be removed at any time with scripts/unseed.mjs.

import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.')
  process.exit(1)
}
const admin = createClient(url, key, { auth: { persistSession: false } })

const AREAS = ['Central Jakarta', 'South Jakarta', 'West Jakarta', 'North Jakarta', 'East Jakarta']
const DEMO = [
  { name: 'Arya (demo)', age: 28, area: 'South Jakarta', intents: ['Date', 'Meet'], bio: 'DEMO PROFILE. Coffee, vinyl, late drives.' },
  { name: 'Sasa (demo)', age: 26, area: 'South Jakarta', intents: ['Chat', 'Casual'], bio: 'DEMO PROFILE. Here for good conversation.' },
  { name: 'Dimas (demo)', age: 31, area: 'Central Jakarta', intents: ['Meet', 'Date'], bio: 'DEMO PROFILE. Rooftop bars and street food.' },
  { name: 'Nadia (demo)', age: 24, area: 'West Jakarta', intents: ['Date'], bio: 'DEMO PROFILE. Design, film, and dogs.' },
  { name: 'Reza (demo)', age: 29, area: 'South Jakarta', intents: ['Casual', 'Chat'], bio: 'DEMO PROFILE. Gym in the AM, gigs at night.' },
  { name: 'Maya (demo)', age: 27, area: 'North Jakarta', intents: ['Meet', 'Chat'], bio: 'DEMO PROFILE. Marina walks and seafood.' },
  { name: 'Bima (demo)', age: 33, area: 'East Jakarta', intents: ['Date', 'Meet'], bio: 'DEMO PROFILE. Motorbikes and mountains.' },
  { name: 'Tari (demo)', age: 25, area: 'Central Jakarta', intents: ['Chat', 'Casual'], bio: 'DEMO PROFILE. Books, matcha, quiet nights.' }
]

function dobFor(age) {
  const d = new Date()
  d.setFullYear(d.getFullYear() - age)
  return d.toISOString().slice(0, 10)
}

for (let i = 0; i < DEMO.length; i++) {
  const d = DEMO[i]
  const email = `demo${i + 1}@umenow.dev`
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: 'DemoPassword123!',
    email_confirm: true
  })
  if (error) {
    console.warn(`skip ${email}: ${error.message}`)
    continue
  }
  const id = created.user.id
  await admin
    .from('profiles')
    .update({
      display_name: d.name,
      public_age: d.age,
      city: 'Jakarta',
      bio: d.bio,
      intents: d.intents,
      discoverable: true,
      onboarding_complete: true,
      last_active_at: new Date().toISOString()
    })
    .eq('id', id)
  await admin
    .from('profile_private')
    .update({
      date_of_birth: dobFor(d.age),
      broad_area: d.area,
      consent_terms_at: new Date().toISOString(),
      consent_privacy_at: new Date().toISOString(),
      consent_guidelines_at: new Date().toISOString()
    })
    .eq('id', id)
  console.log(`seeded ${d.name} (${email})`)
}

console.log('\nDone. Demo password for all accounts: DemoPassword123!')
console.log('Remove them any time with: node scripts/unseed.mjs')
