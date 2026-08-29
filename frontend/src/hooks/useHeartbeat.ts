import { useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

// Updates last_active_at while the app is open, but at most once per interval
// and only when the tab is visible — avoiding excessive database writes.
const HEARTBEAT_MS = 60 * 1000

export function useHeartbeat(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !isSupabaseConfigured) return
    let last = 0
    const beat = async () => {
      if (document.visibilityState !== 'visible') return
      const now = Date.now()
      if (now - last < HEARTBEAT_MS - 1000) return
      last = now
      await supabase.rpc('touch_last_active')
    }
    beat()
    const id = window.setInterval(beat, HEARTBEAT_MS)
    document.addEventListener('visibilitychange', beat)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', beat)
    }
  }, [enabled])
}
