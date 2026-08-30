import { NavLink } from 'react-router-dom'
import { Compass, MessageCircle, UserRound, Shield, Crown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const base = 'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors duration-200'

export function BottomNav() {
  const { isAdmin } = useAuth()
  const items = [
    { to: '/discover', label: 'Discover', icon: Compass, testid: 'nav-discover' },
    { to: '/connections', label: 'Connections', icon: MessageCircle, testid: 'nav-connections' },
    { to: '/premium', label: 'U-ME+', icon: Crown, testid: 'nav-premium' },
    { to: '/me', label: 'Profile', icon: UserRound, testid: 'nav-profile' }
  ]
  if (isAdmin) items.push({ to: '/admin', label: 'Admin', icon: Shield, testid: 'nav-admin' })

  return (
    <nav data-testid="bottom-nav" className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md items-stretch border-t border-ink-line bg-ink/95 backdrop-blur-md" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {items.map(({ to, label, icon: Icon, testid }) => (
        <NavLink key={to} to={to} data-testid={testid} className={({ isActive }) => `${base} ${isActive ? 'text-signal' : 'text-warm-faint hover:text-warm-mute'}`}>
          <Icon size={22} strokeWidth={2} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
