import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { AppShell } from '../components/AppShell'
import { Spinner } from '../components/Brand'

// Handles the email-confirmation redirect. detectSessionInUrl parses the link,
// then we route the user onward based on onboarding state.
export default function AuthCallback() {
  const nav = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) {
      nav('/')
      return
    }
    const hash = window.location.hash
    if (hash.includes('error')) {
      const params = new URLSearchParams(hash.replace('#', ''))
      setError(params.get('error_description') || 'This link is invalid or has expired.')
      return
    }
    const go = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        setError('We could not confirm this link. Try signing in or resending confirmation.')
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', data.session.user.id)
        .maybeSingle()
      nav(profile?.onboarding_complete ? '/discover' : '/onboarding', { replace: true })
    }
    // small delay so detectSessionInUrl can finish
    const t = setTimeout(go, 400)
    return () => clearTimeout(t)
  }, [nav])

  if (error) {
    return (
      <AppShell nav={false}>
        <div className="flex min-h-screen flex-col items-center justify-center text-center">
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
