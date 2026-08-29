import { useState } from 'react'
import { X, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { REPORT_REASONS, SUPPORT_EMAIL_NA } from '../lib/reportConstants'

export interface ReportTarget {
  reportedUserId: string
  messageId?: string | null
  photoId?: string | null
  context: string // human label, e.g. "profile", "message", "photo"
}

export function ReportModal({
  target,
  onClose
}: {
  target: ReportTarget
  onClose: () => void
}) {
  const [reason, setReason] = useState<string>(REPORT_REASONS[0])
  const [details, setDetails] = useState('')
  const [status, setStatus] = useState<'form' | 'sending' | 'done' | 'error'>('form')
  const [err, setErr] = useState('')

  async function submit() {
    setStatus('sending')
    const { error } = await supabase.from('reports').insert({
      reported_user_id: target.reportedUserId,
      message_id: target.messageId ?? null,
      photo_id: target.photoId ?? null,
      reason,
      details: details.trim() || null
    })
    if (error) {
      setErr(error.message)
      setStatus('error')
    } else {
      setStatus('done')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      data-testid="report-modal"
    >
      <div
        className="w-full max-w-md rounded-t-3xl border border-ink-line bg-ink-card p-6 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {status === 'done' ? (
          <div className="text-center">
            <ShieldCheck size={40} className="mx-auto text-signal" />
            <h3 className="display mt-4 text-2xl font-bold">Report received</h3>
            <p className="mt-2 text-sm text-warm-mute">
              Thank you. Our moderators will review this {target.context}. If you feel unsafe,
              consider blocking this person too. For urgent danger, contact local emergency
              services. You can also reach us at {SUPPORT_EMAIL_NA}.
            </p>
            <button className="btn-signal mt-6 w-full" onClick={onClose} data-testid="report-done-btn">
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="display text-2xl font-bold">Report {target.context}</h3>
              <button onClick={onClose} className="text-warm-faint" data-testid="report-close-btn">
                <X size={22} />
              </button>
            </div>
            <p className="mt-1 text-sm text-warm-mute">Reports are confidential.</p>

            <label className="label mt-5">Reason</label>
            <div className="flex flex-col gap-2" data-testid="report-reasons">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
                    reason === r
                      ? 'border-signal bg-signal/10 text-warm-white'
                      : 'border-ink-line text-warm-mute'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <label className="label mt-5">Details (optional)</label>
            <textarea
              className="field min-h-[90px]"
              value={details}
              maxLength={500}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Add anything that helps our moderators."
              data-testid="report-details-input"
            />

            {status === 'error' && <p className="mt-3 text-sm text-signal">{err}</p>}

            <button
              className="btn-signal mt-5 w-full disabled:opacity-60"
              onClick={submit}
              disabled={status === 'sending'}
              data-testid="report-submit-btn"
            >
              {status === 'sending' ? 'Sending…' : 'Submit report'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
