// Stripe webhook for U-ME-NOW+ subscriptions.
// Required Edge Function secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
// This function must have JWT verification disabled because Stripe does not send Supabase JWTs.

import Stripe from 'npm:stripe@22.4.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'stripe-signature, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors })

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!stripeKey || !webhookSecret) throw new Error('Stripe webhook is not configured')

    const signature = req.headers.get('Stripe-Signature')
    if (!signature) return new Response('Missing Stripe-Signature', { status: 400, headers: cors })

    const body = await req.text()
    const stripe = new Stripe(stripeKey, { httpClient: Stripe.createFetchHttpClient() })
    const cryptoProvider = Stripe.createSubtleCryptoProvider()
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret, undefined, cryptoProvider)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

    const { error: eventInsertError } = await admin.from('stripe_events').insert({
      event_id: event.id,
      event_type: event.type,
      payload: event
    })
    if (eventInsertError) {
      // Stripe retries deliveries. A duplicate event has already been handled.
      if (eventInsertError.code === '23505') {
        return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } })
      }
      throw eventInsertError
    }

    const upsertSubscription = async (subscription: Stripe.Subscription, fallbackUserId?: string) => {
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
      const userId = subscription.metadata?.user_id || fallbackUserId || (await admin
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()).data?.user_id

      if (!userId) throw new Error(`No U-ME-NOW user mapped to Stripe customer ${customerId}`)

      const item = subscription.items.data[0]
      const priceId = item?.price?.id || null
      const currency = item?.price?.currency || null
      const periodEnd = item?.current_period_end || subscription.current_period_end || null

      const { error } = await admin.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        status: subscription.status,
        currency,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        cancel_at_period_end: subscription.cancel_at_period_end
      }, { onConflict: 'user_id' })
      if (error) throw error
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'subscription' && session.subscription) {
          const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          await upsertSubscription(subscription, session.client_reference_id || undefined)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await upsertSubscription(event.data.object as Stripe.Subscription)
        break
      }
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          await upsertSubscription(subscription)
        }
        break
      }
      default:
        break
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})
