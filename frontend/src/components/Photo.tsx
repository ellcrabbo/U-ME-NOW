import { useEffect, useState } from 'react'
import { signedPhotoUrl } from '../lib/photos'
import { placeholderGradient, initialsOf } from '../lib/utils'

// Renders a private photo via a signed URL, or a polished branded placeholder
// when no photo exists (no stock-photo dependence).
export function Photo({
  path,
  name,
  className = '',
  rounded = 'rounded-card'
}: {
  path: string | null | undefined
  name: string | null
  className?: string
  rounded?: string
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    setUrl(null)
    setFailed(false)
    if (path) signedPhotoUrl(path).then((u) => active && setUrl(u))
    return () => {
      active = false
    }
  }, [path])

  if (path && url && !failed) {
    return (
      <img
        src={url}
        alt={name || 'Profile photo'}
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover ${rounded} ${className}`}
      />
    )
  }

  return (
    <div
      className={`flex h-full w-full items-center justify-center ${rounded} ${className}`}
      style={{ background: placeholderGradient(path || name || 'x') }}
    >
      <span className="display text-5xl font-bold text-warm-white/85">{initialsOf(name)}</span>
    </div>
  )
}
