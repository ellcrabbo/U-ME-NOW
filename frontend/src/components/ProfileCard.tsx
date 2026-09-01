import { useState } from 'react'
import { Ban, Flag, Heart, MapPin, MoreHorizontal, Sparkles } from 'lucide-react'
import { DiscoverRow } from '../lib/types'
import { Photo } from './Photo'
import { PresenceDot } from './PresenceDot'
import { presenceOf } from '../lib/utils'

export function ProfileCard({
  row,
  liked,
  locked = false,
  onLike,
  onReport,
  onBlock
}: {
  row: DiscoverRow
  liked: boolean
  locked?: boolean
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
    <article className="group relative overflow-hidden rounded-2xl border border-ink-line bg-ink-card" data-testid={`profile-card-${row.id}`}>
      <div
        className="relative aspect-square w-full cursor-pointer"
        onClick={() => paths.length > 1 && setIdx((i) => (i + 1) % paths.length)}
      >
        <Photo path={activePath} name={row.display_name} rounded="rounded-none" />

        {paths.length > 1 && (
          <div className="absolute left-2 right-2 top-2 flex gap-1">
            {paths.map((_, i) => (
              <span key={i} className={`h-0.5 flex-1 rounded-full ${i === idx ? 'bg-warm-white' : 'bg-warm-white/30'}`} />
            ))}
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation()
            setMenu((m) => !m)
          }}
          className="absolute right-2 top-2 rounded-full bg-black/45 p-1.5 text-warm-white backdrop-blur"
          data-testid={`card-menu-btn-${row.id}`}
          aria-label="More options"
        >
          <MoreHorizontal size={17} />
        </button>

        {menu && (
          <div className="absolute right-2 top-11 z-20 w-36 overflow-hidden rounded-xl border border-ink-line bg-ink-card text-xs shadow-xl">
            <button
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-warm-white hover:bg-ink-soft"
              onClick={() => { setMenu(false); onReport(row) }}
              data-testid={`card-report-btn-${row.id}`}
            >
              <Flag size={14} /> Report
            </button>
            <button
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-signal hover:bg-ink-soft"
              onClick={() => { setMenu(false); onBlock(row) }}
              data-testid={`card-block-btn-${row.id}`}
            >
              <Ban size={14} /> Block
            </button>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-2.5">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold leading-tight text-warm-white">
                {row.display_name}, {row.public_age}
              </h2>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-warm-mute">
                <PresenceDot presence={presence} />
                <span className="truncate">{row.city}</span>
                {row.is_nearby && <Sparkles size={11} className="shrink-0 text-signal" />}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (!liked && !locked) onLike(row)
              }}
              disabled={liked || locked}
              aria-label={locked ? 'Unlock likes' : liked ? 'Liked' : `Like ${row.display_name}`}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full backdrop-blur transition-transform active:scale-95 ${
                liked
                  ? 'bg-warm-white/15 text-warm-white'
                  : locked
                    ? 'bg-black/50 text-warm-white/60'
                    : 'bg-signal text-ink'
              }`}
              data-testid={`card-like-btn-${row.id}`}
            >
              <Heart size={17} fill={liked ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>

      {(row.intents?.length > 0 || row.bio) && (
        <div className="hidden p-3">
          {row.intents?.length > 0 && row.intents.map((i) => <span key={i}>{i}</span>)}
          {row.bio && <p>{row.bio}</p>}
        </div>
      )}
    </article>
  )
}
