import { useState } from 'react'
import { MapPin, Sparkles, Flag, Ban, MoreHorizontal, Zap } from 'lucide-react'
import { DiscoverRow } from '../lib/types'
import { Photo } from './Photo'
import { PresenceDot } from './PresenceDot'
import { presenceOf } from '../lib/utils'

export function ProfileCard({
  row,
  liked,
  onLike,
  onReport,
  onBlock
}: {
  row: DiscoverRow
  liked: boolean
  onLike: (row: DiscoverRow) => void
  onReport: (row: DiscoverRow) => void
  onBlock: (row: DiscoverRow) => void
}) {
  const [idx, setIdx] = useState(0)
  const [menu, setMenu] = useState(false)
  const presence = presenceOf(row.last_active_at)
  const paths = row.photo_paths?.length ? row.photo_paths : [null]
  const activePath = paths[Math.min(idx, paths.length - 1)]

  return (
    <article
      className="card animate-rise overflow-hidden"
      data-testid={`profile-card-${row.id}`}
    >
      <div className="relative aspect-[4/5] w-full">
        <div
          className="h-full w-full"
          onClick={() => paths.length > 1 && setIdx((i) => (i + 1) % paths.length)}
        >
          <Photo path={activePath} name={row.display_name} rounded="rounded-none" />
        </div>

        {paths.length > 1 && (
          <div className="absolute left-3 right-3 top-3 flex gap-1.5">
            {paths.map((_, i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full ${i === idx ? 'bg-warm-white' : 'bg-warm-white/30'}`}
              />
            ))}
          </div>
        )}

        <button
          onClick={() => setMenu((m) => !m)}
          className="absolute right-3 top-3 rounded-full bg-black/45 p-2 text-warm-white backdrop-blur"
          data-testid={`card-menu-btn-${row.id}`}
          aria-label="More options"
        >
          <MoreHorizontal size={20} />
        </button>

        {menu && (
          <div className="absolute right-3 top-14 z-10 w-40 overflow-hidden rounded-2xl border border-ink-line bg-ink-card text-sm">
            <button
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-warm-white hover:bg-ink-soft"
              onClick={() => {
                setMenu(false)
                onReport(row)
              }}
              data-testid={`card-report-btn-${row.id}`}
            >
              <Flag size={16} /> Report
            </button>
            <button
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-signal hover:bg-ink-soft"
              onClick={() => {
                setMenu(false)
                onBlock(row)
              }}
              data-testid={`card-block-btn-${row.id}`}
            >
              <Ban size={16} /> Block
            </button>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/85 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="flex items-end justify-between">
            <h2 className="display text-3xl font-bold text-warm-white">
              {row.display_name}
              <span className="ml-2 text-warm-white/70">{row.public_age}</span>
            </h2>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1 text-sm text-warm-mute">
              <MapPin size={14} /> {row.city}
            </span>
            {row.is_nearby && (
              <span className="inline-flex items-center gap-1 rounded-full bg-signal/20 px-2 py-0.5 text-xs font-semibold text-signal">
                <Sparkles size={12} /> Nearby
              </span>
            )}
            <PresenceDot presence={presence} />
          </div>
        </div>
      </div>

      <div className="p-4">
        {row.intents?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {row.intents.map((i) => (
              <span key={i} className="chip chip-on">
                {i}
              </span>
            ))}
          </div>
        )}
        {row.bio && <p className="mt-3 text-[15px] leading-relaxed text-warm-mute">{row.bio}</p>}

        <button
          onClick={() => onLike(row)}
          disabled={liked}
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-full py-4 font-semibold transition-transform active:scale-[0.98] ${
            liked ? 'border border-ink-line text-warm-faint' : 'bg-signal text-ink'
          }`}
          data-testid={`card-like-btn-${row.id}`}
        >
          <Zap size={18} fill={liked ? 'none' : 'currentColor'} />
          {liked ? 'Liked' : 'Like'}
        </button>
      </div>
    </article>
  )
}
