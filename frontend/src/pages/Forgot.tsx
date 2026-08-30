import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { AuthLayout } from '../components/AuthLayout'
import { ConfigBanner } from '../components/ConfigBanner'

export default function Forgot() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!isSupabaseConfigured) return
    setBusy(true)
    setErr('')
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset`
    })
    setBusy(false)
    if (error) setErr(error.message)
    else setSent(true)
  }

  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your email and we'll send you a secure reset link.">
      <ConfigBanner />
      {sent ? (
        <div className="card p-5 text-sm text-warm-mute" data-testid="forgot-sent">
          If an account exists for {email}, we've sent a secure password-reset link. Check your
          inbox, and your spam or junk folder if you don't see it.
          <Link to="/auth/sign-in" className="mt-4 block text-center text-warm-mute underline">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div>
            <label className="label">Email address</label>
            <input
              className="field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="forgot-email"
            />
          </div>
          {err && <p className="text-sm text-signal">{err}</p>}
          <button className="btn-signal mt-2" disabled={busy} data-testid="forgot-submit">
            {busy ? 'Sending…' : 'Email me a reset link'}
          </button>
          <Link to="/auth/sign-in" className="mt-2 text-center text-sm text-warm-mute">
            Back to sign in
          </Link>
        </form>
      )}
    </AuthLayout>
  )
}
