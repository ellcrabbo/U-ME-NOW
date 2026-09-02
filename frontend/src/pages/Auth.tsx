import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { AuthLayout } from '../components/AuthLayout'
import { ConfigBanner } from '../components/ConfigBanner'

const redirectTo = () => `${window.location.origin}/auth/callback`

async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectTo() }
  })
}

export function SignIn() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)
  const [needsConfirm, setNeedsConfirm] = useState(false)
  const [resent, setResent] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!isSupabaseConfigured) return
    setErr('')
    setNeedsConfirm(false)
    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) {
      if (/confirm/i.test(error.message)) setNeedsConfirm(true)
      setErr(error.message)
      return
    }
    nav('/discover')
  }

  async function google() {
    if (!isSupabaseConfigured) return
    setErr('')
    setGoogleBusy(true)
    const { error } = await signInWithGoogle()
    if (error) {
      setGoogleBusy(false)
      setErr(error.message)
    }
  }

  async function resend() {
    await supabase.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: redirectTo() } })
    setResent(true)
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to see who's around.">
      <ConfigBanner />
      <button
        type="button"
        onClick={google}
        className="btn-ghost w-full"
        disabled={googleBusy || busy}
        data-testid="signin-google"
      >
        {googleBusy ? 'Opening Google…' : 'Continue with Google'}
      </button>
      <div className="my-4 flex items-center gap-3 text-xs text-warm-faint">
        <span className="h-px flex-1 bg-warm-faint/30" />
        <span>or</span>
        <span className="h-px flex-1 bg-warm-faint/30" />
      </div>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div>
          <label className="label">Email</label>
          <input className="field" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="signin-email" />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="field" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required data-testid="signin-password" />
        </div>
        {err && <p className="text-sm text-signal" data-testid="signin-error">{err}</p>}
        {needsConfirm && (
          <button type="button" onClick={resend} className="text-left text-sm text-warm-mute underline" data-testid="signin-resend">
            {resent ? 'Confirmation email sent.' : 'Resend confirmation email'}
          </button>
        )}
        <button className="btn-signal mt-2" disabled={busy || googleBusy} data-testid="signin-submit">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <div className="mt-4 flex items-center justify-between text-sm">
        <Link to="/auth/forgot" className="text-warm-mute" data-testid="signin-forgot">Forgot password?</Link>
        <Link to="/auth/sign-up" className="font-semibold text-signal" data-testid="signin-to-signup">Create account</Link>
      </div>
    </AuthLayout>
  )
}

export function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [resent, setResent] = useState(false)
  const nav = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!isSupabaseConfigured) return
    setErr('')
    if (password.length < 8) {
      setErr('Password must be at least 8 characters.')
      return
    }
    setBusy(true)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: redirectTo() }
    })
    setBusy(false)
    if (error) {
      setErr(error.message)
      return
    }
    if (data.session) {
      nav('/onboarding')
      return
    }
    setSent(true)
  }

  async function google() {
    if (!isSupabaseConfigured) return
    setErr('')
    setGoogleBusy(true)
    const { error } = await signInWithGoogle()
    if (error) {
      setGoogleBusy(false)
      setErr(error.message)
    }
  }

  async function resend() {
    await supabase.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: redirectTo() } })
    setResent(true)
  }

  if (sent) {
    return (
      <AuthLayout title="Check your email" subtitle={`We sent a confirmation link to ${email}.`}>
        <div className="card p-5 text-sm text-warm-mute" data-testid="signup-confirm-notice">
          <p>Tap the link in that email to confirm your account, then come back to finish setup.</p>
          <p className="mt-3 text-warm-faint">
            Using Supabase&rsquo;s free built-in email, delivery can be slow and is rate-limited
            (roughly a few messages per hour). If it doesn&rsquo;t arrive, wait a moment and resend.
          </p>
          <button onClick={resend} className="btn-ghost mt-4 w-full" data-testid="signup-resend">
            {resent ? 'Sent again' : 'Resend confirmation email'}
          </button>
          <Link to="/auth/sign-in" className="mt-3 block text-center text-warm-mute underline">Back to sign in</Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Join U, ME, NOW" subtitle="Adults 18+ in Jakarta.">
      <ConfigBanner />
      <button
        type="button"
        onClick={google}
        className="btn-ghost w-full"
        disabled={googleBusy || busy}
        data-testid="signup-google"
      >
        {googleBusy ? 'Opening Google…' : 'Continue with Google'}
      </button>
      <div className="my-4 flex items-center gap-3 text-xs text-warm-faint">
        <span className="h-px flex-1 bg-warm-faint/30" />
        <span>or</span>
        <span className="h-px flex-1 bg-warm-faint/30" />
      </div>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div>
          <label className="label">Email</label>
          <input className="field" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="signup-email" />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="field" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required data-testid="signup-password" />
          <p className="mt-1 text-xs text-warm-faint">At least 8 characters.</p>
        </div>
        {err && <p className="text-sm text-signal" data-testid="signup-error">{err}</p>}
        <button className="btn-signal mt-2" disabled={busy || googleBusy} data-testid="signup-submit">
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-warm-mute">
        Already have an account? <Link to="/auth/sign-in" className="font-semibold text-signal">Sign in</Link>
      </p>
    </AuthLayout>
  )
}
