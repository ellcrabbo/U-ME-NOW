import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, ChevronLeft } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { AppShell } from '../components/AppShell'
import { Spinner } from '../components/Brand'
import { ReportRow, ReportStatus, ModerationAction } from '../lib/types'
import { timeAgo } from '../lib/utils'

const STATUSES: ReportStatus[] = ['open', 'reviewing', 'resolved', 'dismissed']

export default function Admin() {
  const nav = useNavigate()
  const [tab, setTab] = useState<'reports' | 'history'>('reports')
  const [filter, setFilter] = useState<ReportStatus>('open')
  const [reports, setReports] = useState<ReportRow[]>([])
  const [actions, setActions] = useState<ModerationAction[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const loadReports = useCallback(async () => {
    if (!isSupabaseConfigured) return
    setLoading(true)
    const { data } = await supabase.rpc('admin_list_reports', { p_status: filter })
    setReports((data as ReportRow[]) || [])
    setLoading(false)
  }, [filter])

  const loadHistory = useCallback(async () => {
    const { data } = await supabase.rpc('admin_list_actions')
    setActions((data as ModerationAction[]) || [])
  }, [])

  useEffect(() => {
    if (tab === 'reports') loadReports()
    else loadHistory()
  }, [tab, loadReports, loadHistory])

  async function setStatus(r: ReportRow, status: ReportStatus) {
    setBusyId(r.id)
    await supabase.rpc('admin_set_report_status', { p_report: r.id, p_status: status, p_reason: null })
    await loadReports()
    setBusyId(null)
  }

  async function moderate(userId: string, action: 'suspend' | 'ban' | 'unsuspend', reason: string) {
    await supabase.rpc('admin_moderate_user', { p_user: userId, p_action: action, p_reason: reason })
    await loadReports()
  }

  return (
    <AppShell>
      <div className="pt-8">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/discover')} className="text-warm-mute" data-testid="admin-back">
            <ChevronLeft size={24} />
          </button>
          <ShieldAlert size={22} className="text-signal" />
          <h1 className="display text-3xl font-bold">Moderation</h1>
        </div>

        <div className="mt-6 flex gap-2">
          <button onClick={() => setTab('reports')} className={`chip ${tab === 'reports' ? 'chip-on' : ''}`} data-testid="admin-tab-reports">
            Report queue
          </button>
          <button onClick={() => setTab('history')} className={`chip ${tab === 'history' ? 'chip-on' : ''}`} data-testid="admin-tab-history">
            Action history
          </button>
        </div>

        {tab === 'reports' ? (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button key={s} onClick={() => setFilter(s)} className={`chip ${filter === s ? 'chip-on' : ''}`} data-testid={`admin-filter-${s}`}>
                  {s}
                </button>
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-3">
              {loading ? (
                <Spinner />
              ) : reports.length === 0 ? (
                <p className="py-10 text-center text-warm-mute" data-testid="admin-empty">No {filter} reports.</p>
              ) : (
                reports.map((r) => (
                  <div key={r.id} className="card p-4" data-testid={`report-${r.id}`}>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-signal/15 px-2.5 py-1 text-xs font-semibold text-signal">{r.reason}</span>
                      <span className="text-xs text-warm-faint">{timeAgo(r.created_at)}</span>
                    </div>
                    {r.details && <p className="mt-2 text-sm text-warm-mute">{r.details}</p>}
                    <div className="mt-2 space-y-0.5 text-xs text-warm-faint">
                      <p>Reported user: <span className="text-warm-mute">{r.reported_user_id}</span></p>
                      {r.message_id && <p>Message ref: {r.message_id}</p>}
                      {r.photo_id && <p>Photo ref: {r.photo_id}</p>}
                      <p>Status: <span className="text-warm-mute">{r.status}</span></p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => setStatus(r, 'reviewing')} disabled={busyId === r.id} className="chip" data-testid={`report-reviewing-${r.id}`}>
                        Mark reviewing
                      </button>
                      <button onClick={() => setStatus(r, 'resolved')} disabled={busyId === r.id} className="chip" data-testid={`report-resolve-${r.id}`}>
                        Resolve
                      </button>
                      <button onClick={() => setStatus(r, 'dismissed')} disabled={busyId === r.id} className="chip" data-testid={`report-dismiss-${r.id}`}>
                        Dismiss
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button onClick={() => moderate(r.reported_user_id, 'suspend', `Report ${r.id}`)} className="rounded-full border border-signal/50 px-3 py-1.5 text-xs font-semibold text-signal" data-testid={`report-suspend-${r.id}`}>
                        Suspend user
                      </button>
                      <button onClick={() => moderate(r.reported_user_id, 'ban', `Report ${r.id}`)} className="rounded-full bg-signal px-3 py-1.5 text-xs font-semibold text-ink" data-testid={`report-ban-${r.id}`}>
                        Ban user
                      </button>
                      <button onClick={() => moderate(r.reported_user_id, 'unsuspend', `Report ${r.id}`)} className="rounded-full border border-ink-line px-3 py-1.5 text-xs font-semibold text-warm-mute" data-testid={`report-unsuspend-${r.id}`}>
                        Reinstate
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="mt-5 flex flex-col gap-2" data-testid="admin-history">
            {actions.length === 0 ? (
              <p className="py-10 text-center text-warm-mute">No moderation actions yet.</p>
            ) : (
              actions.map((a) => (
                <div key={a.id} className="rounded-2xl border border-ink-line p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-warm-white capitalize">{a.action}</span>
                    <span className="text-xs text-warm-faint">{timeAgo(a.created_at)}</span>
                  </div>
                  <p className="mt-1 text-xs text-warm-faint">Affected: {a.affected_user_id}</p>
                  <p className="text-xs text-warm-faint">By admin: {a.admin_id}</p>
                  {a.reason && <p className="mt-1 text-warm-mute">{a.reason}</p>}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
