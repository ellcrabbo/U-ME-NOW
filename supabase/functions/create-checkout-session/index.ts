// Creates a Stripe-hosted Checkout Session for U-ME-NOW+ plans.
// Required Edge Function secrets:
// STRIPE_SECRET_KEY, STRIPE_PRICE_ID_PRO, STRIPE_PRICE_ID_UNLIMITED,
// STRIPE_PRICE_ID_LIFETIME, APP_URL
//
// Stripe Sync Engine is the billing source of truth. This function only creates
// the Stripe customer/session; billing state is synced into Postgres.

import Stripe from 'npm:stripe@22.4.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

type Plan = 'pro' | 'unlimited' | 'lifetime'

const PLAN_CONFIG: Record<Plan, { secret: string; mode: 'subscription' | 'payment' }> = {
  pro: { secret: 'STRIPE_PRICE_ID_PRO', mode: 'subscription' },
  unlimited: { secret: 'STRIPE_PRICE_ID_UNLIMITED', mode: 'subscription' },
  lifetime: { secret: 'STRIPE_PRICE_ID_LIFETIME', mode: 'payment' }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' }
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const appUrl = Deno.env.get('APP_URL') || 'https://u-me-now.online'
    const authHeader = req.headers.get('Authorization') ?? ''

    if (!stripeKey) return json({ error: 'Stripe is not configured' }, 500)

    const asUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user }, error: userErr } = await asUser.auth.getUser()
    if (userErr || !user) return json({ error: 'Unauthorized' }, 401)

    const { data: profile } = await asUser
      .from('profiles')
      .select('account_status,onboarding_complete')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.onboarding_complete || profile.account_status !== 'active') {
      return json({ error: 'Your account must be active and onboarded before subscribing.' }, 403)
    }

    const body = await req.json().catch(() => ({}))
    const plan = body?.plan as Plan
    if (!plan || !Object.prototype.hasOwnProperty.call(PLAN_CONFIG, plan)) {
      return json({ error: 'Invalid plan. Choose pro, unlimited, or lifetime.' }, 400)
    }

    const stripe = new Stripe(stripeKey, { httpClient: Stripe.createFetchHttpClient() })

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

    const existingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 20
    })
    const activeSubscription = existingSubscriptions.data.find((subscription) =>
      ['active', 'trialing', 'past_due'].includes(subscription.status)
    )
    if (activeSubscription) {
      return json({ error: 'You already have an active U-ME-NOW+ subscription.', manage: true }, 409)
    }

    // Lifetime is permanent, so do not allow a second purchase.
    if (plan === 'lifetime') {
      const lifetimeSessions = await stripe.checkout.sessions.list({
        customer: customerId,
        limit: 100
      })
      const alreadyPurchased = lifetimeSessions.data.some((session) =>
        session.payment_status === 'paid' && session.metadata?.plan === 'lifetime'
      )
      if (alreadyPurchased) {
        return json({ error: 'You already own U-ME-NOW+ Lifetime.', manage: false }, 409)
      }
    }

    const config = PLAN_CONFIG[plan]
    const priceId = Deno.env.get(config.secret)
    if (!priceId) return json({ error: `${config.secret} is not configured` }, 500)

    const common = {
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/premium?success=1&plan=${plan}`,
      cancel_url: `${appUrl}/premium?canceled=1&plan=${plan}`,
      allow_promotion_codes: true,
      metadata: {
        user_id: user.id,
        plan,
        product: 'u-me-now-plus'
      }
    }

    const session = plan === 'lifetime'
      ? await stripe.checkout.sessions.create({
          ...common,
          mode: 'payment'
        })
      : await stripe.checkout.sessions.create({
          ...common,
          mode: 'subscription',
          subscription_data: {
            metadata: {
              user_id: user.id,
              plan,
              product: 'u-me-now-plus'
            }
          }
        })

    return json({ url: session.url })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500)
  }
})
