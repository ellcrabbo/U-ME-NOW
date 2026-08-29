// U, ME, NOW — permanent account deletion Edge Function.
//
// Deploy:  supabase functions deploy delete-account
// Auth:    the caller's JWT is required (verify_jwt defaults to true).
//
// Uses the SERVICE ROLE key (available automatically to Edge Functions as
// SUPABASE_SERVICE_ROLE_KEY) to:
//   1. verify the caller,
//   2. remove all of the caller's profile photos from private storage,
//   3. delete the auth user, which cascades to every table that references
//      auth.users(id) ON DELETE CASCADE (profiles, private, photos, likes,
//      matches, conversations, messages, blocks, reports).
// The service-role key NEVER touches browser code.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authHeader = req.headers.get('Authorization') ?? ''

    // Identify the caller from their JWT.
    const asUser = createClient(url, anon, { global: { headers: { Authorization: authHeader } } })
    const {
      data: { user },
      error: userErr
    } = await asUser.auth.getUser()
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' }
      })
    }

    const admin = createClient(url, service, { auth: { persistSession: false } })

    // 1. Remove the user's photos from the private bucket.
    const { data: files } = await admin.storage.from('profile-photos').list(user.id)
    if (files && files.length) {
      await admin.storage
        .from('profile-photos')
        .remove(files.map((f) => `${user.id}/${f.name}`))
    }

    // 2. Delete the auth user (cascades all related rows).
    const { error: delErr } = await admin.auth.admin.deleteUser(user.id)
    if (delErr) {
      return new Response(JSON.stringify({ error: delErr.message }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' }
    })
  }
})
