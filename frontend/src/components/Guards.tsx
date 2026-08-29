import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from './Brand'
import { AppShell } from './AppShell'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { loading, session } = useAuth()
  const loc = useLocation()
  if (loading)
    return (
      <AppShell nav={false}>
        <Spinner label="Loading" />
      </AppShell>
    )
  if (!session) return <Navigate to="/auth/sign-in" replace state={{ from: loc.pathname }} />
  return <>{children}</>
}

export function RequireOnboarded({ children }: { children: ReactNode }) {
  const { loading, session, profile } = useAuth()
  const loc = useLocation()
  if (loading)
    return (
      <AppShell nav={false}>
        <Spinner label="Loading" />
      </AppShell>
    )
  if (!session) return <Navigate to="/auth/sign-in" replace state={{ from: loc.pathname }} />
  if (!profile?.onboarding_complete) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { loading, session, isAdmin } = useAuth()
  if (loading)
    return (
      <AppShell nav={false}>
        <Spinner label="Loading" />
      </AppShell>
    )
  if (!session) return <Navigate to="/auth/sign-in" replace />
  if (!isAdmin) return <Navigate to="/discover" replace />
  return <>{children}</>
}
