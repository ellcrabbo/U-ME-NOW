import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { AppShell } from '../components/AppShell'
import { Spinner } from '../components/Brand'

const MAX_FILE_BYTES = 10 * 1024 * 1024

export default function AgeVerification() {
  const nav = useNavigate()
  const [status, setStatus] = useState<string>('required')
  const [idFile, setIdFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const { data } = await supabase
        .from('profile_private')
        .select('age_verification_status')
        .eq('id', user.id)
        .maybeSingle()
      if (!cancelled) setStatus(data?.age_verification_status || 'required')
    }
    void load()
    return () => { cancelled = true }
  }, [])

  function validateFile(file: File | null, label: string) {
    if (!file) return `${label} is required.`
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
      return `${label} must be a JPG, PNG, WebP or PDF.`
    }
    if (file.size > MAX_FILE_BYTES) return `${label} must be 10 MB or smaller.`
    return ''
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!isSupabaseConfigured) return
    setErr('')

    const idError = validateFile(idFile, 'Government ID')
    const selfieError = validateFile(selfieFile, 'Selfie')
    if (idError || selfieError) {
      setErr(idError || selfieError)
      return
    }

    setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !idFile || !selfieFile) {
      setBusy(false)
      setErr('Your session has expired. Please sign in again.')
      return
    }

    // A rejected user may submit again. Remove only their own previous submission;
    // the storage cleanup is performed before replacing the record.
    const { data: old } = await supabase
      .from('age_verification_submissions')
      .select('id_storage_path,selfie_storage_path,status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (old?.status === 'approved') {
      setBusy(false)
      nav('/discover')
      return
    }

    if (old) {
      await supabase.storage.from('age-verification').remove([old.id_storage_path, old.selfie_storage_path])
      await supabase.from('age_verification_submissions').delete().eq('user_id', user.id)
    }

    const suffix = crypto.randomUUID()
    const idExt = idFile.name.split('.').pop()?.toLowerCase() || 'bin'
    const selfieExt = selfieFile.name.split('.').pop()?.toLowerCase() || 'bin'
    const idPath = `${user.id}/${suffix}-id.${idExt}`
    const selfiePath = `${user.id}/${suffix}-selfie.${selfieExt}`

    const idUpload = await supabase.storage.from('age-verification').upload(idPath, idFile, { upsert: false })
    if (idUpload.error) {
      setBusy(false)
      setErr(`Could not upload your ID: ${idUpload.error.message}`)
      return
    }

    const selfieUpload = await supabase.storage.from('age-verification').upload(selfiePath, selfieFile, { upsert: false })
    if (selfieUpload.error) {
      await supabase.storage.from('age-verification').remove([idPath])
      setBusy(false)
      setErr(`Could not upload your selfie: ${selfieUpload.error.message}`)
      return
    }

    const { error } = await supabase.from('age_verification_submissions').insert({
      user_id: user.id,
      id_storage_path: idPath,
      selfie_storage_path: selfiePath,
      status: 'pending'
    })

    if (error) {
      await supabase.storage.from('age-verification').remove([idPath, selfiePath])
      setBusy(false)
      setErr(`Could not submit verification: ${error.message}`)
      return
    }

    await supabase
      .from('profile_private')
      .update({ age_verification_status: 'pending' })
      .eq('id', user.id)

    setStatus('pending')
    setSubmitted(true)
    setBusy(false)
  }

  if (status === 'approved') {
    return (
      <AppShell nav={false}>
        <div className="mx-auto max-w-lg pt-12">
          <div className="card p-6 text-center">
            <ShieldCheck className="mx-auto text-signal" size={42} />
            <h1 className="display mt-4 text-3xl font-bold">You're verified</h1>
            <p className="mt-2 text-sm text-warm-mute">Your 18+ verification has been approved.</p>
            <button onClick={() => nav('/discover')} className="btn-signal mt-6 w-full">Continue</button>
          </div>
        </div>
      </AppShell>
    )
  }

  if (status === 'pending' || submitted) {
    return (
      <AppShell nav={false}>
        <div className="mx-auto max-w-lg pt-12">
          <div className="card p-6 text-center">
            <Spinner />
            <h1 className="display mt-4 text-3xl font-bold">Verification pending</h1>
            <p className="mt-2 text-sm text-warm-mute">
              We've received your documents. Your account will remain unavailable until an authorised reviewer completes the check.
            </p>
            <p className="mt-4 text-xs text-warm-faint">
              Your ID and selfie are used only for this review and should be deleted after the review is completed.
            </p>
            <button onClick={() => nav('/')} className="btn-ghost mt-6 w-full">Return home</button>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell nav={false}>
      <div className="mx-auto max-w-lg pt-8 pb-12">
        <div className="card p-6">
          <ShieldCheck className="text-signal" size={32} />
          <h1 className="display mt-4 text-3xl font-bold">Verify you're 18+</h1>
          <p className="mt-2 text-sm text-warm-mute">
            U, ME, NOW is for adults aged 18 and over. Before you can use discovery or messaging, we need to confirm your age.
          </p>

          <div className="mt-5 rounded-2xl border border-ink-line p-4 text-sm text-warm-mute">
            <p className="font-semibold text-warm-white">What you'll submit</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>A government-issued photo ID showing your date of birth.</li>
              <li>A current selfie so the reviewer can compare you with the ID.</li>
            </ul>
          </div>

          <p className="mt-4 text-xs text-warm-faint">
            We do not ask you to send these documents by email. They are uploaded to a private verification area. Access is restricted to authorised reviewers and the files should be deleted after review; the account retains only the verification outcome and review metadata.
          </p>

          <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="label">Government ID</label>
              <input
                className="field"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                required
              />
              <p className="mt-1 text-xs text-warm-faint">JPG, PNG, WebP or PDF · max 10 MB</p>
            </div>
            <div>
              <label className="label">Current selfie</label>
              <input
                className="field"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="user"
                onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                required
              />
              <p className="mt-1 text-xs text-warm-faint">Take a new selfie where possible · max 10 MB</p>
            </div>
            {err && <p className="text-sm text-signal">{err}</p>}
            <button className="btn-signal mt-2" disabled={busy}>
              {busy ? 'Submitting…' : 'Submit for review'}
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  )
}
