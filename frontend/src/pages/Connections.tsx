import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { AppShell } from '../components/AppShell'
import { Logo, Spinner } from '../components/Brand'
import { Photo } from '../components/Photo'
import { ConfigBanner } from '../components/ConfigBanner'
import { ConversationRow } from '../lib/types'
import { timeAgo } from '../lib/utils'

export default function Connections() {
  const [rows, setRows] = useState<ConversationRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    supabase.rpc('my_conversations').then(({ data }) => {
      setRows((data as ConversationRow[]) || [])
      setLoading(false)
    })
  }, [])

  return (
    <AppShell>
      <div className="pt-8">
        <Logo className="text-lg" />
        <h1 className="display mt-6 text-4xl font-bold">Connections</h1>
        <p className="mt-1 text-warm-mute">People you both liked. Say hi.</p>

        <ConfigBanner />

        <div className="mt-6 flex flex-col gap-2">
          {loading ? (
            <Spinner />
          ) : rows.length === 0 ? (
            <div className="py-14 text-center" data-testid="connections-empty">
              <p className="display text-2xl font-bold">No connections yet</p>
              <p className="mt-2 text-warm-mute">
                When you and someone else both like each other, you&rsquo;ll be able to chat here.
              </p>
              <Link to="/discover" className="btn-signal mt-6 inline-flex">
                Discover people
              </Link>
            </div>
          ) : (
            rows.map((c) => (
              <Link
                key={c.conversation_id}
                to={`/chat/${c.conversation_id}`}
                className="flex items-center gap-3 rounded-2xl border border-ink-line bg-ink-card p-3 transition-colors active:bg-ink-soft"
                data-testid={`connection-${c.conversation_id}`}
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl">
                  <Photo path={c.other_photo_path} name={c.other_display_name} rounded="rounded-2xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate font-semibold text-warm-white">{c.other_display_name}</p>
                    {c.last_message_at && (
                      <span className="ml-2 shrink-0 text-xs text-warm-faint">{timeAgo(c.last_message_at)}</span>
                    )}
                  </div>
                  <p className="truncate text-sm text-warm-mute">
                    {c.last_message || 'You connected — start the conversation.'}
                  </p>
                </div>
                {c.unread_count > 0 && (
                  <span className="ml-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-signal px-1.5 text-xs font-bold text-ink" data-testid={`unread-${c.conversation_id}`}>
                    {c.unread_count}
                  </span>
                )}
              </Link>
            ))
          )}
        </div>
      </div>
    </AppShell>
  )
}
