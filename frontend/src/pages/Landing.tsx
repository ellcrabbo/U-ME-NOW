import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Logo, PulseMark } from '../components/Brand'
import { ConfigBanner } from '../components/ConfigBanner'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Landing() {
  const { session, profile } = useAuth()
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase.rpc('count_online_discoverable').then(({ data }) => {
      setCount(typeof data === 'number' ? data : 0)
    })
  }, [])

  const primaryTo = !session ? '/auth/sign-up' : profile?.onboarding_complete ? '/discover' : '/onboarding'

  return (
    <div className="min-h-screen bg-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pt-safe">
        <header className="flex items-center justify-between pt-8">
          <Logo className="text-xl" />
          {!session && (
            <Link to="/auth/sign-in" className="text-sm font-semibold text-warm-mute" data-testid="landing-signin-link">
              Sign in
            </Link>
          )}
        </header>

        <div className="flex flex-1 flex-col justify-center py-10">
          <ConfigBanner />

          <div className="mb-8 flex items-center gap-4">
            <PulseMark size={96} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-signal">Jakarta</p>
              <p className="mt-1 text-sm text-warm-mute">Meet people nearby. Right now.</p>
            </div>
          </div>

          <h1 className="display text-6xl font-extrabold leading-[0.92] text-warm-white">
            WHO&rsquo;S
            <br />
            AROUND?
          </h1>

          <div className="mt-6" data-testid="online-count">
            {count === null ? (
              <p className="text-warm-faint">&nbsp;</p>
            ) : count > 0 ? (
              <p className="text-lg text-warm-white">
                <span className="display text-3xl font-bold text-signal">{count}</span>{' '}
                {count === 1 ? 'person is' : 'people are'} active nearby now
              </p>
            ) : (
              <p className="text-lg text-warm-mute">
                No one&rsquo;s online this second — be the first to show up.
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-warm-faint">
            <span>Chat</span>
            <span className="text-signal">·</span>
            <span>Meet</span>
            <span className="text-signal">·</span>
            <span>Date</span>
            <span className="text-signal">·</span>
            <span>Casual</span>
          </div>
        </div>

        <div className="pb-10">
          <Link to={primaryTo} className="btn-signal w-full text-lg" data-testid="landing-cta">
            SEE WHO&rsquo;S AROUND <ArrowRight size={20} />
          </Link>
          <p className="mt-4 text-center text-xs text-warm-faint">
            Adults 18+ only. Less scrolling. More NOW.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-warm-faint">
            <Link to="/safety">Safety</Link>
            <Link to="/guidelines">Guidelines</Link>
            <Link to="/acceptable-use">AUP</Link>
            <Link to="/reporting">Report</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/refunds">Payments</Link>
            <Link to="/law-enforcement">Law enforcement</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
