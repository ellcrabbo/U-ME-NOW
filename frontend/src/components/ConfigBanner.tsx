import { AlertTriangle } from 'lucide-react'
import { isSupabaseConfigured } from '../lib/supabase'

// Shown when VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY are not set.
export function ConfigBanner() {
  if (isSupabaseConfigured) return null
  return (
    <div
      data-testid="supabase-config-banner"
      className="mb-5 flex items-start gap-3 rounded-2xl border border-signal/40 bg-signal/10 p-4 text-sm text-warm-white"
    >
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-signal" />
      <div>
        <p className="font-semibold">Supabase not connected yet</p>
        <p className="mt-1 text-warm-mute">
          Set <code className="text-signal">VITE_SUPABASE_URL</code> and{' '}
          <code className="text-signal">VITE_SUPABASE_PUBLISHABLE_KEY</code> in the environment,
          then reload. Auth, discovery, and chat activate automatically once configured.
        </p>
      </div>
    </div>
  )
}
