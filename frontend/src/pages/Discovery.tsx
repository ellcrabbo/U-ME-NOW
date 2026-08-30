import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, SlidersHorizontal, Zap, Crown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AppShell } from '../components/AppShell'
import { Logo, Spinner, PulseMark } from '../components/Brand'
import { ProfileCard } from '../components/ProfileCard'
import { ReportModal, ReportTarget } from '../components/ReportModal'
import { ConfigBanner } from '../components/ConfigBanner'
import { INTENTS } from '../lib/constants'
import { DiscoverRow } from '../lib/types'
import { isSupabaseConfigured } from '../lib/supabase'

interface LikeQuota { premium: boolean; used_count: number; remaining_count: number }

export default function Discovery() {
  const { user, profile } = useAuth()
  const [rows, setRows] = useState<DiscoverRow[]>([])
  const [liked, setLiked] = useState<Set<string>>(new Set())
  const [quota, setQuota] = useState<LikeQuota | null>(null)
  const [loading, setLoading] = useState(true)
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [recentOnly, setRecentOnly] = useState(false)
  const [intent, setIntent] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [report, setReport] = useState<ReportTarget | null>(null)
  const [connectMsg, setConnectMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) { setLoading(false); return }
    setLoading(true)
    const { data, error } = await supabase.rpc('discover', { p_online: onlineOnly, p_recent: recentOnly, p_intent: intent })
    if (!error && data) setRows(data as DiscoverRow[])
    const { data: myLikes } = await supabase.from('likes').select('liked_id').eq('liker_id', user?.id)
    setLiked(new Set((myLikes || []).map((l: { liked_id: string }) => l.liked_id)))
    const { data: q } = await supabase.rpc('my_like_quota')
    setQuota((q?.[0] as LikeQuota) || null)
    setLoading(false)
  }, [onlineOnly, recentOnly, intent, user?.id])

  useEffect(() => { load() }, [load])

  async function like(row: DiscoverRow) {
    setLiked((s) => new Set(s).add(row.id))
    const { error } = await supabase.from('likes').insert({ liker_id: user!.id, liked_id: row.id })
    if (error && !/duplicate/i.test(error.message)) {
      setLiked((s) => { const n = new Set(s); n.delete(row.id); return n })
      if (/row-level|policy|can_like|quota|limit/i.test(error.message)) {
        setConnectMsg('You have used today\'s free likes. U-ME-NOW+ gives you unlimited likes.')
      }
      return
    }
    const { data: conv } = await supabase.rpc('conversation_for', { p_other: row.id })
    if (conv) setConnectMsg(`You and ${row.display_name} connected! Say hi from Connections.`)
    const { data: q } = await supabase.rpc('my_like_quota')
    setQuota((q?.[0] as LikeQuota) || null)
  }

  async function block(row: DiscoverRow) {
    await supabase.from('blocks').insert({ blocker_id: user!.id, blocked_id: row.id })
    setRows((r) => r.filter((x) => x.id !== row.id))
  }

  const suspended = profile?.account_status !== 'active'

  return (
    <AppShell>
      <div className="pt-8">
        <header className="flex items-center justify-between">
          <Logo className="text-lg" />
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilters((s) => !s)} className={`rounded-full border p-2.5 ${showFilters || onlineOnly || recentOnly || intent ? 'border-signal text-signal' : 'border-ink-line text-warm-mute'}`} data-testid="filter-toggle"><SlidersHorizontal size={18} /></button>
            <button onClick={load} className="rounded-full border border-ink-line p-2.5 text-warm-mute" data-testid="discover-refresh"><RefreshCw size={18} /></button>
          </div>
        </header>

        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="display text-4xl font-bold">Who&rsquo;s around</h1>
            <p className="mt-1 text-warm-mute">Active adults in Jakarta, right now.</p>
          </div>
          {quota && !quota.premium && <span className="shrink-0 text-xs text-warm-faint" data-testid="like-quota">{quota.remaining_count} likes left today</span>}
          {quota?.premium && <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-signal" data-testid="like-quota"><Crown size={13} /> Unlimited</span>}
        </div>

        <ConfigBanner />

        {suspended && <div className="mt-5 rounded-2xl border border-signal/40 bg-signal/10 p-4 text-sm text-warm-white" data-testid="discover-suspended">Your account is {profile?.account_status}. Discovery is paused. See your profile for details.</div>}

        {showFilters && (
          <div className="mt-5 card p-4" data-testid="filter-panel">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setOnlineOnly((v) => !v)} className={`chip ${onlineOnly ? 'chip-on' : ''}`} data-testid="filter-online">Online now</button>
              <button onClick={() => setRecentOnly((v) => !v)} className={`chip ${recentOnly ? 'chip-on' : ''}`} data-testid="filter-recent">Recently active</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {INTENTS.map((i) => <button key={i} onClick={() => setIntent((cur) => cur === i ? null : i)} className={`chip ${intent === i ? 'chip-on' : ''}`} data-testid={`filter-intent-${i}`}>{i}</button>)}
            </div>
          </div>
        )}

        {connectMsg && <div className="mt-5 flex items-center gap-2 rounded-2xl border border-signal bg-signal/15 p-4 text-sm text-warm-white" data-testid="connect-toast" onClick={() => setConnectMsg(null)}><Zap size={18} className="text-signal" /> {connectMsg}</div>}

        <div className="mt-6 flex flex-col gap-6">
          {loading ? <Spinner label="Finding people nearby…" /> : rows.length === 0 ? (
            <div className="flex flex-col items-center py-14 text-center" data-testid="discover-empty">
              <PulseMark size={90} />
              <p className="display mt-4 text-2xl font-bold">Quiet right now</p>
              <p className="mt-2 max-w-xs text-warm-mute">No one matches yet. Try clearing filters, or check back soon — people come online throughout the day.</p>
            </div>
          ) : rows.map((row) => <ProfileCard key={row.id} row={row} liked={liked.has(row.id)} onLike={like} onReport={(r) => setReport({ reportedUserId: r.id, context: 'profile' })} onBlock={block} />)}
        </div>
      </div>

      {report && <ReportModal target={report} onClose={() => setReport(null)} />}
    </AppShell>
  )
}
