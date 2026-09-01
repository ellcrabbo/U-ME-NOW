import { supabase } from './supabase'
import { STORAGE_BUCKET } from './constants'

// In-memory cache of signed URLs. Photos live in a PRIVATE bucket; we request
// short-lived signed URLs via storage RLS (never a public bucket).
const cache = new Map<string, { url: string; exp: number }>()
const TTL_MS = 55 * 60 * 1000 // refresh before the 1h signed-url expiry

export async function signedPhotoUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null
  const hit = cache.get(path)
  if (hit && hit.exp > Date.now()) return hit.url
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, 3600)
  if (error || !data?.signedUrl) return null
  cache.set(path, { url: data.signedUrl, exp: Date.now() + TTL_MS })
  return data.signedUrl
}

// Batch the first photos for discovery grids into one storage request instead
// of making one signed-URL request per profile card.
export async function prefetchSignedPhotoUrls(paths: string[]): Promise<void> {
  const unique = [...new Set(paths.filter(Boolean))]
  const missing = unique.filter((path) => {
    const hit = cache.get(path)
    return !hit || hit.exp <= Date.now()
  })
  if (!missing.length) return

  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrls(missing, 3600)
  if (error || !data) return

  for (const item of data) {
    if (item.path && item.signedUrl) {
      cache.set(item.path, { url: item.signedUrl, exp: Date.now() + TTL_MS })
    }
  }
}

export async function signedPhotoUrls(paths: string[]): Promise<string[]> {
  await prefetchSignedPhotoUrls(paths)
  const out = paths.map((path) => {
    const hit = cache.get(path)
    return hit && hit.exp > Date.now() ? hit.url : null
  })
  return out.filter((u): u is string => Boolean(u))
}

export function invalidatePhoto(path: string) {
  cache.delete(path)
}
