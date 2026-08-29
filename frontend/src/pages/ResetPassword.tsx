import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { AuthLayout } from '../components/AuthLayout'

export default function ResetPassword() {
  const nav = useNavigate()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    // The recovery link establishes a temporary session (detectSessionInUrl).
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setReady(Boolean(s)))
    return () => sub.subscription.unsubscribe()
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setErr('Password must be at least 8 characters.')
      return
    }
    setBusy(true)
    setErr('')
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) setErr(error.message)
    else setDone(true)
  }

  if (done) {
    return (
      <AuthLayout title="Password updated" subtitle="You're all set.">
        <button className="btn-signal w-full" onClick={() => nav('/discover')} data-testid="reset-continue">
          Continue
        </button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Choose a new password">
      {!ready ? (
        <p className="text-warm-mute" data-testid="reset-invalid">
          This reset link is missing or expired. Request a new one from the sign-in screen.
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div>
            <label className="label">New password</label>
            <input
              className="field"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              data-testid="reset-password"
            />
          </div>
          {err && <p className="text-sm text-signal">{err}</p>}
          <button className="btn-signal mt-2" disabled={busy} data-testid="reset-submit">
            {busy ? 'Saving…' : 'Update password'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
