import { useEffect, useMemo, useState } from 'react'
import { Check, CreditCard, Crown, ExternalLink, Sparkles } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AppShell } from '../components/AppShell'
import { Logo, Spinner } from '../components/Brand'

interface Subscription {
  status: string
  currency: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
}

function defaultCurrency(): 'idr' | 'usd' {
  const locale = navigator.language.toLowerCase()
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
  return locale.startsWith('id') || zone === 'Asia/Jakarta' ? 'idr' : 'usd'
}

export default function Premium() {
  const [params] = useSearchParams()
  const [currency, setCurrency] = useState<'idr' | 'usd'>(() => defaultCurrency())
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const success = params.get('success') === '1'
  const canceled = params.get('canceled') === '1'
  const active = Boolean(subscription && ['active', 'trialing'].includes(subscription.status) && (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date()))

  const priceLabel = useMemo(() => (currency === 'idr' ? 'Rp175,000 / month' : '$9.99 / month'), [currency])

  async function loadSubscription() {
    const { data, error: queryError } = await supabase.rpc('my_subscription')
    if (!queryError) setSubscription((data?.[0] as Subscription) || null)
    setLoading(false)
  }

  useEffect(() => {
    loadSubscription()
    if (success) {
      const timer = window.setTimeout(loadSubscription, 2500)
      return () => window.clearTimeout(timer)
    }
  }, [success])

  async function subscribe() {
    setBusy(true)
    setError('')
    const { data, error: invokeError } = await supabase.functions.invoke('create-checkout-session', {
      body: { currency }
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
            Checkout was canceled. No subscription was started.
          </div>
        )}

        {active ? (
          <div className="mt-6 card p-5" data-testid="premium-active">
            <div className="flex items-center gap-2 text-signal"><Sparkles size={18} /><span className="font-semibold">U-ME-NOW+ is active</span></div>
            <p className="mt-2 text-sm text-warm-mute">
              {subscription?.cancel_at_period_end && subscription.current_period_end
                ? `Your subscription is set to end on ${new Date(subscription.current_period_end).toLocaleDateString()}. You keep access until then.`
                : 'Your premium features are active.'}
            </p>
            <button onClick={manageBilling} disabled={busy} className="btn-ghost mt-4 inline-flex items-center gap-2">
              <CreditCard size={16} /> Manage subscription <ExternalLink size={14} />
            </button>
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
              <p className="text-sm font-semibold text-warm-white">Your price</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => setCurrency('idr')} className={`rounded-2xl border p-4 text-left ${currency === 'idr' ? 'border-signal bg-signal/10' : 'border-ink-line'}`}>
                  <span className="block text-lg font-bold text-warm-white">Rp175k</span>
                  <span className="text-xs text-warm-faint">Indonesia</span>
                </button>
                <button onClick={() => setCurrency('usd')} className={`rounded-2xl border p-4 text-left ${currency === 'usd' ? 'border-signal bg-signal/10' : 'border-ink-line'}`}>
                  <span className="block text-lg font-bold text-warm-white">$9.99</span>
                  <span className="text-xs text-warm-faint">International</span>
                </button>
              </div>
              <p className="mt-3 text-sm text-warm-mute">{priceLabel}. Renews monthly until canceled.</p>
              {error && <p className="mt-4 text-sm text-signal" data-testid="premium-error">{error}</p>}
              <button onClick={subscribe} disabled={busy} className="btn-signal mt-5 w-full" data-testid="premium-checkout">
                {busy ? 'Opening secure checkout…' : `Get U-ME-NOW+ — ${priceLabel}`}
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
