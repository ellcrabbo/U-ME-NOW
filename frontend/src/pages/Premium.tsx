import { useEffect, useMemo, useState } from 'react'
import { Check, CreditCard, Crown, ExternalLink, Sparkles } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AppShell } from '../components/AppShell'
import { Logo, Spinner } from '../components/Brand'

type Plan = 'pro' | 'unlimited' | 'lifetime'

interface Subscription {
  plan: Plan
  status: string
  currency: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  lifetime: boolean
}

const plans: Array<{
  id: Plan
  name: string
  cadence: string
  description: string
}> = [
  {
    id: 'pro',
    name: 'Pro',
    cadence: 'Every 2 weeks',
    description: 'More freedom to like and discover.'
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    cadence: 'Monthly',
    description: 'Unlimited access to premium discovery.'
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    cadence: 'One-off',
    description: 'U-ME-NOW+ permanently. No renewals.'
  }
]

function defaultPlan(): Plan {
  const stored = localStorage.getItem('ume-now-plan')
  if (stored === 'pro' || stored === 'unlimited' || stored === 'lifetime') return stored
  return 'pro'
}

export default function Premium() {
  const [params] = useSearchParams()
  const [plan, setPlan] = useState<Plan>(() => defaultPlan())
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const success = params.get('success') === '1'
  const canceled = params.get('canceled') === '1'
  const active = Boolean(subscription && (
    subscription.lifetime ||
    (['active', 'trialing'].includes(subscription.status) &&
      (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date()))
  ))

  const selectedPlan = useMemo(() => plans.find((item) => item.id === plan)!, [plan])

  async function loadSubscription() {
    const { data, error: queryError } = await supabase.rpc('my_subscription')
    if (!queryError) setSubscription((data?.[0] as Subscription) || null)
    setLoading(false)
  }

  useEffect(() => {
    loadSubscription()
    if (success) {
      const timers = [2500, 6000, 10000].map((delay) => window.setTimeout(loadSubscription, delay))
      return () => timers.forEach(window.clearTimeout)
    }
  }, [success])

  function choosePlan(nextPlan: Plan) {
    setPlan(nextPlan)
    localStorage.setItem('ume-now-plan', nextPlan)
    setError('')
  }

  async function subscribe() {
    setBusy(true)
    setError('')
    const { data, error: invokeError } = await supabase.functions.invoke('create-checkout-session', {
      body: { plan }
    })
    if (invokeError || !data?.url) {
      setError(invokeError?.message || data?.error || 'Unable to start checkout. Please try again.')
      setBusy(false)
      return
    }
    window.location.assign(data.url)
  }

  async function manageBilling() {
    setBusy(true)
    setError('')
    const { data, error: invokeError } = await supabase.functions.invoke('create-portal-session', { body: {} })
    if (invokeError || !data?.url) {
      setError(invokeError?.message || data?.error || 'Unable to open billing management.')
      setBusy(false)
      return
    }
    window.location.assign(data.url)
  }

  if (loading) return <AppShell><Spinner /></AppShell>

  return (
    <AppShell>
      <div className="pt-8 pb-10">
        <Logo className="text-lg" />

        <div className="mt-8 rounded-3xl border border-signal/40 bg-signal/10 p-6">
          <div className="flex items-center gap-2 text-signal">
            <Crown size={20} />
            <span className="text-sm font-semibold uppercase tracking-[0.18em]">U-ME-NOW+</span>
          </div>
          <h1 className="display mt-3 text-4xl font-bold">More NOW.</h1>
          <p className="mt-2 text-warm-mute">More control over who you meet, without putting the core experience behind a paywall.</p>
        </div>

        {success && !active && (
          <div className="mt-5 rounded-2xl border border-signal/50 bg-signal/10 p-4 text-sm text-warm-white" data-testid="premium-syncing">
            Payment completed. Your U-ME-NOW+ access is syncing now. This can take a few seconds.
          </div>
        )}
        {canceled && (
          <div className="mt-5 rounded-2xl border border-ink-line bg-ink-card p-4 text-sm text-warm-mute" data-testid="premium-canceled">
            Checkout was canceled. No payment was taken.
          </div>
        )}

        {active ? (
          <div className="mt-6 card p-5" data-testid="premium-active">
            <div className="flex items-center gap-2 text-signal"><Sparkles size={18} /><span className="font-semibold">U-ME-NOW+ is active</span></div>
            <p className="mt-2 text-sm text-warm-mute">
              {subscription?.lifetime
                ? 'Lifetime access is active. There are no recurring charges.'
                : subscription?.cancel_at_period_end && subscription.current_period_end
                  ? `Your ${subscription.plan} subscription is set to end on ${new Date(subscription.current_period_end).toLocaleDateString()}. You keep access until then.`
                  : `Your ${subscription?.plan || 'premium'} features are active.`}
            </p>
            {!subscription?.lifetime && (
              <button onClick={manageBilling} disabled={busy} className="btn-ghost mt-4 inline-flex items-center gap-2">
                <CreditCard size={16} /> Manage subscription <ExternalLink size={14} />
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="mt-6 card p-5">
              <p className="text-sm font-semibold text-warm-white">U-ME-NOW+ includes</p>
              <ul className="mt-4 space-y-3 text-sm text-warm-mute">
                <li className="flex gap-3"><Check size={17} className="mt-0.5 shrink-0 text-signal" /> See people who have liked you</li>
                <li className="flex gap-3"><Check size={17} className="mt-0.5 shrink-0 text-signal" /> Unlimited likes</li>
                <li className="flex gap-3"><Check size={17} className="mt-0.5 shrink-0 text-signal" /> Keep discovery, matching and chat free</li>
              </ul>
            </div>

            <div className="mt-6 card p-5">
              <p className="text-sm font-semibold text-warm-white">Choose your plan</p>
              <div className="mt-3 space-y-2">
                {plans.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => choosePlan(item.id)}
                    className={`w-full rounded-2xl border p-4 text-left ${plan === item.id ? 'border-signal bg-signal/10' : 'border-ink-line'}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-lg font-bold text-warm-white">{item.name}</span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-warm-faint">{item.cadence}</span>
                    </div>
                    <span className="mt-1 block text-sm text-warm-mute">{item.description}</span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-sm text-warm-mute">{selectedPlan.name} · {selectedPlan.cadence}. Stripe will show the exact price before payment.</p>
              {error && <p className="mt-4 text-sm text-signal" data-testid="premium-error">{error}</p>}
              <button onClick={subscribe} disabled={busy} className="btn-signal mt-5 w-full" data-testid="premium-checkout">
                {busy ? 'Opening secure checkout…' : `Continue with ${selectedPlan.name}`}
              </button>
              <p className="mt-3 text-center text-xs text-warm-faint">Secure checkout powered by Stripe.</p>
            </div>
          </>
        )}

        <div className="mt-8 text-xs leading-5 text-warm-faint">
          U-ME-NOW+ is optional. Core discovery, mutual matching and direct chat remain available to free users.
        </div>
      </div>
    </AppShell>
  )
}
