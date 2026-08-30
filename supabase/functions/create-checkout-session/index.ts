// Creates a Stripe-hosted Checkout Session for U-ME-NOW+.
// Required Edge Function secrets:
// STRIPE_SECRET_KEY, STRIPE_PRICE_ID_IDR, STRIPE_PRICE_ID_USD, APP_URL
//
// Stripe Sync Engine is the billing source of truth. This function only creates
// the Stripe customer/session; subscription state is synced into Postgres by
// Supabase's Stripe integration.

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const appUrl = Deno.env.get('APP_URL') || 'https://u-me-now.online'
    const authHeader = req.headers.get('Authorization') ?? ''

    if (!stripeKey) throw new Error('Stripe is not configured')

    const asUser = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } })
    const { data: { user }, error: userErr } = await asUser.auth.getUser()
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    const { data: profile } = await asUser
      .from('profiles')
      .select('account_status,onboarding_complete')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.onboarding_complete || profile.account_status !== 'active') {
      return new Response(JSON.stringify({ error: 'Your account must be active and onboarded before subscribing.' }), { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    const body = await req.json().catch(() => ({}))
    const currency = body?.currency === 'usd' ? 'usd' : 'idr'
    const priceId = currency === 'usd'
      ? Deno.env.get('STRIPE_PRICE_ID_USD')
      : Deno.env.get('STRIPE_PRICE_ID_IDR')
    if (!priceId) throw new Error(`Stripe ${currency.toUpperCase()} price is not configured`)

    const stripe = new Stripe(stripeKey, { httpClient: Stripe.createFetchHttpClient() })

    // Use Stripe customer metadata as the stable user mapping. This avoids a
    // second application-owned subscription/customer ledger.
    const existingCustomers = await stripe.customers.search({
      query: `metadata['user_id']:'${user.id}'`,
      limit: 1
    })

    let customerId = existingCustomers.data[0]?.id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { user_id: user.id }
      })
      customerId = customer.id
    }

    // Prevent a second active subscription even if the Sync Engine has not yet
    // completed its first real-time update.
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10
    })
    const activeSubscription = existingSubscriptions.data.find((subscription) =>
      ['active', 'trialing', 'past_due'].includes(subscription.status)
    )
    if (activeSubscription) {
      return new Response(JSON.stringify({ error: 'You already have a U-ME-NOW+ subscription.', manage: true }), { status: 409, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        metadata: { user_id: user.id, product: 'u-me-now-plus', currency }
      },
      success_url: `${appUrl}/premium?success=1`,
      cancel_url: `${appUrl}/premium?canceled=1`,
      allow_promotion_codes: true
    })

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' }
    })
  }
})
