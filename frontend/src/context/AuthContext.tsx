import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { Profile } from '../lib/types'

interface AuthState {
  loading: boolean
  session: Session | null
  user: User | null
  profile: Profile | null
  isAdmin: boolean
  ageVerified: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [ageVerified, setAgeVerified] = useState(false)

  const loadProfile = useCallback(async (uid: string | undefined) => {
    if (!uid || !isSupabaseConfigured) {
      setProfile(null)
      setIsAdmin(false)
      setAgeVerified(false)
      return
    }

    const [profileResult, adminResult, ageResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
      supabase.from('admin_roles').select('user_id').eq('user_id', uid).maybeSingle(),
      supabase.from('profile_private').select('age_verification_status').eq('id', uid).maybeSingle()
    ])

    setProfile((profileResult.data as Profile) ?? null)
    setIsAdmin(Boolean(adminResult.data))
    setAgeVerified(ageResult.data?.age_verification_status === 'approved')
  }, [])

  const refreshProfile = useCallback(async () => {
    await loadProfile(session?.user?.id)
  }, [loadProfile, session?.user?.id])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    let initialised = false

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      await loadProfile(data.session?.user?.id)
      initialised = true
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      void loadProfile(s?.user?.id)
      if (initialised) setLoading(false)
    })

    return () => sub.subscription.unsubscribe()
  }, [loadProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setIsAdmin(false)
    setAgeVerified(false)
  }, [])

  return (
    <Ctx.Provider
      value={{
        loading,
        session,
        user: session?.user ?? null,
        profile,
        isAdmin,
        ageVerified,
        refreshProfile,
        signOut
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}
