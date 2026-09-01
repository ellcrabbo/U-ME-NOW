import { useCallback, useEffect, useState } from 'react'
import { Crown, Filter, RefreshCw, SlidersHorizontal, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AppShell } from '../components/AppShell'
import { Logo, Spinner, PulseMark } from '../components/Brand'
import { ProfileCard } from '../components/ProfileCard'
import { ReportModal, ReportTarget } from '../components/ReportModal'
import { ConfigBanner } from '../components/ConfigBanner'
import { INTENTS } from '../lib/constants'
import { DiscoverRow } from '../lib/types'

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
    if (quota && !quota.premium && quota.remaining_count <= 0) {
      setConnectMsg('You have reached today\'s free like limit. Unlock U-ME-NOW+ for unlimited likes.')
      return
    }

    setLiked((s) => new Set(s).add(row.id))
    const { error } = await supabase.from('likes').insert({ liker_id: user!.id, liked_id: row.id })
    if (error && !/duplicate/i.test(error.message)) {
      setLiked((s) => { const n = new Set(s); n.delete(row.id); return n })
      if (/row-level|policy|can_like|quota|limit/i.test(error.message)) {
        setConnectMsg('You have reached today\'s free like limit. Unlock U-ME-NOW+ for unlimited likes.')
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
  const likeLocked = Boolean(quota && !quota.premium && quota.remaining_count <= 0)

  return (
    <AppShell wide>
      <div className="pt-8 pb-10">
        <header className="flex items-center justify-between gap-4">
          <div>
            <Logo className="text-lg" />
            <div className="mt-1 flex items-center gap-1.5 text-xs text-warm-faint"><span className="h-1.5 w-1.5 rounded-full bg-signal" /> Jakarta · now</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilters((s) => !s)} className={`rounded-full border p-2.5 ${showFilters || onlineOnly || recentOnly || intent ? 'border-signal text-signal' : 'border-ink-line text-warm-mute'}`} data-testid="filter-toggle" aria-label="Filters"><SlidersHorizontal size={18} /></button>
            <button onClick={load} className="rounded-full border border-ink-line p-2.5 text-warm-mute" data-testid="discover-refresh" aria-label="Refresh"><RefreshCw size={18} /></button>
          </div>
        </header>

        <div className="mt-7 flex items-end justify-between gap-4">
          <div>
            <h1 className="display text-3xl font-bold sm:text-4xl">Who&rsquo;s around</h1>
            <p className="mt-1 text-sm text-warm-mute">People nearby, right now.</p>
          </div>
          {quota && !quota.premium && <span className="shrink-0 text-xs text-warm-faint" data-testid="like-quota">{quota.remaining_count} likes left</span>}
          {quota?.premium && <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-signal" data-testid="like-quota"><Crown size={13} /> Unlimited</span>}
        </div>

        <ConfigBanner />

        {suspended && <div className="mt-5 rounded-2xl border border-signal/40 bg-signal/10 p-4 text-sm text-warm-white" data-testid="discover-suspended">Your account is {profile?.account_status}. Discovery is paused. See your profile for details.</div>}

        {showFilters && (
          <div className="mt-5 rounded-2xl border border-ink-line bg-ink-card p-4" data-testid="filter-panel">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warm-faint"><Filter size={13} /> Filters</div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setOnlineOnly((v) => !v)} className={`chip ${onlineOnly ? 'chip-on' : ''}`} data-testid="filter-online">Online now</button>
              <button onClick={() => setRecentOnly((v) => !v)} className={`chip ${recentOnly ? 'chip-on' : ''}`} data-testid="filter-recent">Recently active</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {INTENTS.map((i) => <button key={i} onClick={() => setIntent((cur) => cur === i ? null : i)} className={`chip ${intent === i ? 'chip-on' : ''}`} data-testid={`filter-intent-${i}`}>{i}</button>)}
            </div>
          </div>
        )}

        {connectMsg && (
          <div className="mt-5 rounded-2xl border border-signal/40 bg-signal/10 p-4 text-sm text-warm-white" data-testid="connect-toast">
            <div className="flex items-start gap-3"><Sparkles size={18} className="mt-0.5 shrink-0 text-signal" /><span>{connectMsg}</span></div>
            {!quota?.premium && /free like limit/i.test(connectMsg) && <Link to="/premium" className="mt-3 inline-flex text-xs font-semibold text-signal">Unlock unlimited likes →</Link>}
          </div>
        )}

        {likeLocked && (
          <Link to="/premium" className="mt-5 block rounded-2xl border border-signal/40 bg-signal/10 p-4 transition-colors hover:bg-signal/15" data-testid="discovery-paywall">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-signal text-ink"><Crown size={17} /></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-warm-white">You&rsquo;ve used today&rsquo;s free likes</p>
                <p className="mt-0.5 text-xs text-warm-mute">Keep browsing, or unlock unlimited likes with U-ME-NOW+.</p>
              </div>
              <span className="text-sm font-semibold text-signal">Unlock →</span>
            </div>
          </Link>
        )}

        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {loading ? <div className="col-span-full py-12"><Spinner label="Finding people nearby…" /></div> : rows.length === 0 ? (
            <div className="col-span-full flex flex-col items-center py-14 text-center" data-testid="discover-empty">
              <PulseMark size={90} />
              <p className="display mt-4 text-2xl font-bold">Quiet right now</p>
              <p className="mt-2 max-w-xs text-warm-mute">No one matches yet. Try clearing filters, or check back soon — people come online throughout the day.</p>
            </div>
          ) : rows.map((row) => <ProfileCard key={row.id} row={row} liked={liked.has(row.id)} locked={likeLocked} onLike={like} onReport={(r) => setReport({ reportedUserId: r.id, context: 'profile' })} onBlock={block} />)}
        </div>
      </div>

      {report && <ReportModal target={report} onClose={() => setReport(null)} />}
    </AppShell>
  )
}
