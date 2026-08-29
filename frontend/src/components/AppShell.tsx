import { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

// Mobile-first shell: content is capped to a phone width and centered so the
// desktop fallback is a clean, deliberate column rather than a stretched app.
export function AppShell({ children, nav = true }: { children: ReactNode; nav?: boolean }) {
  return (
    <div className="min-h-screen bg-ink">
      <main className={`mx-auto w-full max-w-md px-5 ${nav ? 'pb-safe' : ''} pt-safe`}>
        {children}
      </main>
      {nav && <BottomNav />}
    </div>
  )
}
