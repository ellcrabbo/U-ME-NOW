// Creates a short-lived Stripe Billing Portal session for an authenticated user.
// Required Edge Function secret: STRIPE_SECRET_KEY

import Stripe from 'npm:stripe@22.4.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors })

  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const appUrl = Deno.env.get('APP_URL') || 'https://u-me-now.online'
    const authHeader = req.headers.get('Authorization') ?? ''
    if (!stripeKey) throw new Error('Stripe is not configured')

    const asUser = createClient(url, anon, { global: { headers: { Authorization: authHeader } } })
    const { data: { user }, error: userErr } = await asUser.auth.getUser()
    if (userErr || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } })

    const admin = createClient(url, service, { auth: { persistSession: false } })
    const { data: subscription } = await admin.from('subscriptions').select('stripe_customer_id').eq('user_id', user.id).maybeSingle()
    if (!subscription?.stripe_customer_id) {
      return new Response(JSON.stringify({ error: 'No Stripe customer is associated with this account.' }), { status: 404, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    const stripe = new Stripe(stripeKey, { httpClient: Stripe.createFetchHttpClient() })
    const portal = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${appUrl}/premium`
    })

    return new Response(JSON.stringify({ url: portal.url }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})
