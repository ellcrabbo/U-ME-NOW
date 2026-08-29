import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

// The app is usable/inspectable even before Supabase is configured.
// When these are empty, `isSupabaseConfigured` is false and the UI shows a
// clear "connect Supabase" state instead of crashing.
export const isSupabaseConfigured = Boolean(url && key)

export const SUPPORT_EMAIL =
  (import.meta.env.VITE_SUPPORT_EMAIL as string) || 'support@umenow.app'

// A single shared client. If env is missing we still create a harmless client
// pointed at a placeholder so imports don't throw; guarded calls check config.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  key || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
)
