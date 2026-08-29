import { ONLINE_WINDOW_MS, RECENT_WINDOW_MS } from './constants'

export function calcAge(dob: string): number {
  const b = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--
  return age
}

export function isAdult(dob: string): boolean {
  return calcAge(dob) >= 18
}

export type Presence = 'online' | 'recent' | 'offline'

export function presenceOf(lastActiveAt: string | null): Presence {
  if (!lastActiveAt) return 'offline'
  const diff = Date.now() - new Date(lastActiveAt).getTime()
  if (diff <= ONLINE_WINDOW_MS) return 'online'
  if (diff <= RECENT_WINDOW_MS) return 'recent'
  return 'offline'
}

export function presenceLabel(p: Presence): string {
  if (p === 'online') return 'Online now'
  if (p === 'recent') return 'Recently active'
  return 'Offline'
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return new Date(iso).toLocaleDateString()
}

export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Deterministic warm gradient placeholder derived from an id/name so profiles
// without photos still look polished and distinct (no stock photo dependence).
export function placeholderGradient(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffff
  const a = 12 + (h % 36) // hue near warm/orange band
  const b = (a + 24) % 360
  return `linear-gradient(145deg, hsl(${a} 70% 22%), hsl(${b} 60% 10%))`
}

export function initialsOf(name: string | null): string {
  if (!name) return '·'
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] || '').concat(parts[1]?.[0] || '').toUpperCase() || '·'
}
