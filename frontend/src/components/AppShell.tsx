import { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

// Mobile-first shell. Discovery can opt into a wider layout for dense profile grids.
export function AppShell({ children, nav = true, wide = false }: { children: ReactNode; nav?: boolean; wide?: boolean }) {
  return (
    <div className="min-h-screen bg-ink">
      <main className={`mx-auto w-full ${wide ? 'max-w-5xl' : 'max-w-md'} px-5 ${nav ? 'pb-safe' : ''} pt-safe`}>
        {children}
      </main>
      {nav && <BottomNav />}
    </div>
  )
}
