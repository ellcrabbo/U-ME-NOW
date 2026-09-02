import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ExternalLink, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { AppShell } from '../components/AppShell'
import { Spinner } from '../components/Brand'

interface Submission {
  id: string
  user_id: string
  id_storage_path: string
  selfie_storage_path: string
  status: 'pending' | 'approved' | 'rejected'
  reviewer_note: string | null
  created_at: string
  reviewed_at: string | null
}

export default function AdminAgeVerification() {
  const nav = useNavigate()
  const [rows, setRows] = useState<Submission[]>([])
  const [urls, setUrls] = useState<Record<string, { id: string; selfie: string }>>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setErr('')
    const { data, error } = await supabase.rpc('admin_list_age_verifications')
    if (error) {
      setErr(error.message)
      setRows([])
      setLoading(false)
      return
    }
    const submissions = (data || []) as Submission[]
    setRows(submissions)

    const pending = submissions.filter((r) => r.status === 'pending')
    const next: Record<string, { id: string; selfie: string }> = {}
    await Promise.all(pending.map(async (r) => {
      const [idUrl, selfieUrl] = await Promise.all([
        supabase.storage.from('age-verification').createSignedUrl(r.id_storage_path, 300),
        supabase.storage.from('age-verification').createSignedUrl(r.selfie_storage_path, 300)
      ])
      if (idUrl.data?.signedUrl && selfieUrl.data?.signedUrl) {
        next[r.id] = { id: idUrl.data.signedUrl, selfie: selfieUrl.data.signedUrl }
      }
    }))
    setUrls(next)
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  async function review(row: Submission, status: 'approved' | 'rejected') {
    setBusy(row.id)
    setErr('')
    const { error } = await supabase.rpc('admin_review_age_verification', {
      p_submission: row.id,
      p_status: status,
      p_note: notes[row.id] || null
    })

    if (error) {
      setErr(error.message)
      setBusy(null)
      return
    }

    // Once a decision is recorded, remove the underlying ID/selfie immediately.
    const cleanup = await supabase.storage.from('age-verification').remove([
      row.id_storage_path,
      row.selfie_storage_path
    ])
    if (cleanup.error) setErr(`Review saved, but document cleanup failed: ${cleanup.error.message}`)

    await load()
    setBusy(null)
  }

  return (
    <AppShell>
      <div className="pt-8 pb-12">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/admin')} className="text-warm-mute" aria-label="Back to moderation">
            <ChevronLeft size={24} />
          </button>
          <ShieldCheck size={22} className="text-signal" />
          <div>
            <h1 className="display text-3xl font-bold">Age verification</h1>
            <p className="text-sm text-warm-faint">Manual 18+ review queue</p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-signal/30 bg-signal/5 p-4 text-sm text-warm-mute">
          <strong className="text-warm-white">Reviewer rule:</strong> confirm the ID shows the user is 18+ and compare the ID photograph with the contemporaneous selfie. Do not copy or record unnecessary identity information. After the decision, the uploaded files are deleted.
        </div>

        {err && <p className="mt-4 text-sm text-signal">{err}</p>}

        <div className="mt-5 flex flex-col gap-4">
          {loading ? <Spinner /> : rows.filter((r) => r.status === 'pending').length === 0 ? (
            <p className="py-10 text-center text-warm-mute">No pending age verifications.</p>
          ) : rows.filter((r) => r.status === 'pending').map((r) => (
            <div key={r.id} className="card p-4">
              <p className="text-xs text-warm-faint">User: {r.user_id}</p>
              <p className="mt-1 text-xs text-warm-faint">Submitted: {new Date(r.created_at).toLocaleString()}</p>

              {urls[r.id] ? (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <a href={urls[r.id].id} target="_blank" rel="noreferrer" className="block">
                    <img src={urls[r.id].id} alt="Government ID for review" className="h-48 w-full rounded-xl object-contain bg-ink" />
                    <span className="mt-1 flex items-center gap-1 text-xs text-warm-mute">Open ID <ExternalLink size={12} /></span>
                  </a>
                  <a href={urls[r.id].selfie} target="_blank" rel="noreferrer" className="block">
                    <img src={urls[r.id].selfie} alt="Selfie for review" className="h-48 w-full rounded-xl object-contain bg-ink" />
                    <span className="mt-1 flex items-center gap-1 text-xs text-warm-mute">Open selfie <ExternalLink size={12} /></span>
                  </a>
                </div>
              ) : (
                <p className="mt-4 text-sm text-signal">Verification files could not be opened. Do not approve until both are available.</p>
              )}

              <textarea
                className="field mt-4 min-h-20"
                placeholder="Optional reviewer note"
                value={notes[r.id] || ''}
                onChange={(e) => setNotes((current) => ({ ...current, [r.id]: e.target.value }))}
              />

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => review(r, 'approved')}
                  disabled={busy === r.id || !urls[r.id]}
                  className="btn-signal flex-1"
                >
                  {busy === r.id ? 'Saving…' : 'Approve 18+'}
                </button>
                <button
                  onClick={() => review(r, 'rejected')}
                  disabled={busy === r.id || !urls[r.id]}
                  className="btn-ghost flex-1"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
