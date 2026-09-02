import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { AppShell } from '../components/AppShell'
import { Spinner } from '../components/Brand'

// Handles email-confirmation and OAuth redirects, then routes the user onward
// based on onboarding state.
export default function AuthCallback() {
  const nav = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) {
      nav('/')
      return
    }

    let cancelled = false

    const go = async () => {
      const hash = window.location.hash
      const query = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(hash.replace(/^#/, ''))
      const callbackError = hashParams.get('error_description') || query.get('error_description')

      if (callbackError || hashParams.get('error') || query.get('error')) {
        if (!cancelled) setError(callbackError || 'This link is invalid or has expired.')
        return
      }

      // Supabase normally processes the OAuth/email callback automatically.
      // Give it a few short attempts rather than relying on a single fixed delay.
      for (let attempt = 0; attempt < 10 && !cancelled; attempt += 1) {
        const { data, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          if (!cancelled) setError(sessionError.message)
          return
        }

        if (data.session) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('onboarding_complete')
            .eq('id', data.session.user.id)
            .maybeSingle()

          if (profileError) {
            if (!cancelled) setError(profileError.message)
            return
          }

          if (!cancelled) {
            nav(profile?.onboarding_complete ? '/discover' : '/onboarding', { replace: true })
          }
          return
        }

        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      if (!cancelled) {
        setError('We could not complete sign-in. Try signing in again.')
      }
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled || !session) return
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        void go()
      }
    })

    void go()

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [nav])

  if (error) {
    return (
      <AppShell nav={false}>
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <p className="text-signal" data-testid="callback-error">{error}</p>
          <button className="btn-ghost mt-6" onClick={() => nav('/auth/sign-in')}>
            Go to sign in
          </button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell nav={false}>
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Confirming…" />
      </div>
    </AppShell>
  )
}
