import { Presence } from '../lib/utils'

export function PresenceDot({ presence }: { presence: Presence }) {
  if (presence === 'online')
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-signal">
        <span className="h-2 w-2 rounded-full bg-signal shadow-[0_0_8px_2px_rgba(255,92,56,0.7)]" />
        Online now
      </span>
    )
  if (presence === 'recent')
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-warm-mute">
        <span className="h-2 w-2 rounded-full bg-warm-faint" />
        Recently active
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-warm-faint">
      <span className="h-2 w-2 rounded-full border border-warm-faint" />
      Offline
    </span>
  )
}
