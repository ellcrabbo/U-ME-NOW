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

export async function signedPhotoUrls(paths: string[]): Promise<string[]> {
  const out = await Promise.all(paths.map((p) => signedPhotoUrl(p)))
  return out.filter((u): u is string => Boolean(u))
}

export function invalidatePhoto(path: string) {
  cache.delete(path)
}
