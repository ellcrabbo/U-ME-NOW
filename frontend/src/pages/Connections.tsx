import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Crown } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { AppShell } from '../components/AppShell'
import { Logo, Spinner } from '../components/Brand'
import { Photo } from '../components/Photo'
import { ConfigBanner } from '../components/ConfigBanner'
import { ConversationRow, DiscoverRow } from '../lib/types'
import { timeAgo } from '../lib/utils'

export default function Connections() {
  const [rows, setRows] = useState<ConversationRow[]>([])
  const [likedBy, setLikedBy] = useState<DiscoverRow[]>([])
  const [premium, setPremium] = useState(false)
  const [loading, setLoading] = useState(true)
  const [likesLoading, setLikesLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); setLikesLoading(false); return }
    Promise.all([
      supabase.rpc('my_conversations'),
      supabase.rpc('my_subscription'),
      supabase.rpc('received_likes')
    ]).then(([conversations, subscription, received]) => {
      setRows((conversations.data as ConversationRow[]) || [])
      const s = subscription.data?.[0]
      setPremium(Boolean(s && ['active', 'trialing'].includes(s.status) && (!s.current_period_end || new Date(s.current_period_end) > new Date())))
      setLikedBy((received.data as DiscoverRow[]) || [])
      setLoading(false)
      setLikesLoading(false)
    })
  }, [])

  return (
    <AppShell>
      <div className="pt-8">
        <Logo className="text-lg" />
        <h1 className="display mt-6 text-4xl font-bold">Connections</h1>
        <p className="mt-1 text-warm-mute">People you both liked. Say hi.</p>
        <ConfigBanner />

        <section className="mt-7" data-testid="liked-by-section">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-warm-white">Who liked you</p>
              <p className="mt-1 text-xs text-warm-faint">See incoming likes before you match.</p>
            </div>
            {!premium && <Link to="/premium" className="flex items-center gap-1 text-xs font-semibold text-signal">U-ME+ <ArrowRight size={13} /></Link>}
          </div>
          {premium ? (
            likesLoading ? <div className="mt-4"><Spinner /></div> : likedBy.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-ink-line bg-ink-card p-4 text-sm text-warm-mute">No new likes to reveal yet.</div>
            ) : (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {likedBy.slice(0, 6).map((p) => (
                  <Link key={p.id} to="/discover" className="relative overflow-hidden rounded-2xl border border-ink-line bg-ink-card" data-testid={`liked-by-${p.id}`}>
                    <div className="aspect-[4/5]"><Photo path={p.photo_paths?.[0] || null} name={p.display_name} rounded="rounded-2xl" /></div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-2 pt-8">
                      <p className="truncate text-xs font-semibold text-warm-white">{p.display_name}, {p.public_age}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : (
            <Link to="/premium" className="mt-4 block rounded-2xl border border-signal/30 bg-signal/5 p-4" data-testid="liked-by-upsell">
              <div className="flex items-center gap-2 text-signal"><Crown size={16} /><span className="text-sm font-semibold">Unlock your likes</span></div>
              <p className="mt-1 text-sm text-warm-mute">See who already liked you with U-ME-NOW+.</p>
            </Link>
          )}
        </section>

        <div className="mt-8 flex flex-col gap-2">
          {loading ? <Spinner /> : rows.length === 0 ? (
            <div className="py-14 text-center" data-testid="connections-empty">
              <p className="display text-2xl font-bold">No connections yet</p>
              <p className="mt-2 text-warm-mute">When you and someone else both like each other, you&rsquo;ll be able to chat here.</p>
              <Link to="/discover" className="btn-signal mt-6 inline-flex">Discover people</Link>
            </div>
          ) : rows.map((c) => (
            <Link key={c.conversation_id} to={`/chat/${c.conversation_id}`} className="flex items-center gap-3 rounded-2xl border border-ink-line bg-ink-card p-3 transition-colors active:bg-ink-soft" data-testid={`connection-${c.conversation_id}`}>
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl"><Photo path={c.other_photo_path} name={c.other_display_name} rounded="rounded-2xl" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between"><p className="truncate font-semibold text-warm-white">{c.other_display_name}</p>{c.last_message_at && <span className="ml-2 shrink-0 text-xs text-warm-faint">{timeAgo(c.last_message_at)}</span>}</div>
                <p className="truncate text-sm text-warm-mute">{c.last_message || 'You connected — start the conversation.'}</p>
              </div>
              {c.unread_count > 0 && <span className="ml-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-signal px-1.5 text-xs font-bold text-ink" data-testid={`unread-${c.conversation_id}`}>{c.unread_count}</span>}
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
