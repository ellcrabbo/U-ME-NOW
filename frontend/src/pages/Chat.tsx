import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Send, MoreVertical, Ban, Flag } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AppShell } from '../components/AppShell'
import { Spinner } from '../components/Brand'
import { Photo } from '../components/Photo'
import { ReportModal, ReportTarget } from '../components/ReportModal'
import { Message } from '../lib/types'
import { clockTime } from '../lib/utils'

interface Meta {
  other_user_id: string
  other_display_name: string | null
  other_photo_path: string | null
}

export default function Chat() {
  const { conversationId } = useParams()
  const { user } = useAuth()
  const nav = useNavigate()
  const [meta, setMeta] = useState<Meta | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)
  const [menu, setMenu] = useState(false)
  const [report, setReport] = useState<ReportTarget | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!isSupabaseConfigured || !conversationId) return
    let active = true
    const init = async () => {
      const { data: m, error } = await supabase.rpc('conversation_meta', { p_conversation: conversationId })
      if (!active) return
      if (error || !m || (Array.isArray(m) && m.length === 0)) {
        setDenied(true)
        setLoading(false)
        return
      }
      setMeta(Array.isArray(m) ? m[0] : m)
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
      if (!active) return
      setMessages((msgs as Message[]) || [])
      setLoading(false)
      await supabase.rpc('mark_conversation_read', { p_conversation: conversationId })
    }
    init()

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const msg = payload.new as Message
          setMessages((prev) => (prev.some((x) => x.id === msg.id) ? prev : [...prev, msg]))
          if (msg.sender_id !== user?.id) supabase.rpc('mark_conversation_read', { p_conversation: conversationId })
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [conversationId, user?.id])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    const content = text.trim()
    if (!content) return
    setText('')
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: user!.id, content })
      .select()
      .single()
    if (!error && data) {
      const msg = data as Message
      setMessages((prev) => (prev.some((x) => x.id === msg.id) ? prev : [...prev, msg]))
    }
  }

  async function block() {
    if (!meta) return
    await supabase.from('blocks').insert({ blocker_id: user!.id, blocked_id: meta.other_user_id })
    nav('/connections')
  }

  if (denied) {
    return (
      <AppShell nav={false}>
        <div className="flex min-h-screen flex-col items-center justify-center text-center" data-testid="chat-denied">
          <p className="display text-2xl font-bold">Conversation unavailable</p>
          <p className="mt-2 text-warm-mute">This chat is no longer accessible.</p>
          <button className="btn-ghost mt-6" onClick={() => nav('/connections')}>
            Back to Connections
          </button>
        </div>
      </AppShell>
    )
  }

  return (
    <div className="mx-auto flex h-screen w-full max-w-md flex-col bg-ink">
      <header className="flex items-center gap-3 border-b border-ink-line px-4 py-3 pt-safe">
        <button onClick={() => nav('/connections')} className="text-warm-mute" data-testid="chat-back">
          <ChevronLeft size={26} />
        </button>
        <div className="h-10 w-10 overflow-hidden rounded-full">
          <Photo path={meta?.other_photo_path} name={meta?.other_display_name ?? null} rounded="rounded-full" />
        </div>
        <p className="flex-1 truncate font-semibold text-warm-white" data-testid="chat-title">
          {meta?.other_display_name || 'Chat'}
        </p>
        <div className="relative">
          <button onClick={() => setMenu((m) => !m)} className="text-warm-mute" data-testid="chat-menu">
            <MoreVertical size={22} />
          </button>
          {menu && (
            <div className="absolute right-0 top-9 z-10 w-40 overflow-hidden rounded-2xl border border-ink-line bg-ink-card text-sm">
              <button
                className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-ink-soft"
                onClick={() => {
                  setMenu(false)
                  if (meta) setReport({ reportedUserId: meta.other_user_id, context: 'user' })
                }}
                data-testid="chat-report"
              >
                <Flag size={16} /> Report
              </button>
              <button
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-signal hover:bg-ink-soft"
                onClick={block}
                data-testid="chat-block"
              >
                <Ban size={16} /> Block
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <Spinner />
        ) : messages.length === 0 ? (
          <p className="mt-10 text-center text-warm-faint" data-testid="chat-empty">
            You connected. Send the first message.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((m) => {
              const mine = m.sender_id === user?.id
              return (
                <div
                  key={m.id}
                  className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
                    mine ? 'self-end bg-signal text-ink' : 'self-start bg-ink-card text-warm-white'
                  }`}
                  data-testid="chat-message"
                  onDoubleClick={() => !mine && setReport({ reportedUserId: m.sender_id, messageId: m.id, context: 'message' })}
                >
                  <p className="whitespace-pre-wrap break-words text-[15px]">{m.content}</p>
                  <p className={`mt-1 text-right text-[10px] ${mine ? 'text-ink/60' : 'text-warm-faint'}`}>
                    {clockTime(m.created_at)}
                    {mine && m.read_at ? ' · Read' : ''}
                  </p>
                </div>
              )
            })}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t border-ink-line px-3 py-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}>
        <input
          className="field flex-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
          maxLength={1000}
          data-testid="chat-input"
        />
        <button className="btn-signal !px-4" disabled={!text.trim()} data-testid="chat-send">
          <Send size={20} />
        </button>
      </form>

      {report && <ReportModal target={report} onClose={() => setReport(null)} />}
    </div>
  )
}
