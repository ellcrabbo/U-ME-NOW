import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { AppShell } from './AppShell'
import { Logo } from './Brand'

export function TemplateNotice() {
  return (
    <div className="mb-6 rounded-2xl border border-signal/40 bg-signal/10 p-4 text-sm text-warm-mute" data-testid="template-notice">
      <span className="font-semibold text-signal">TEMPLATE — requires review.</span> This starter copy
      is provided for development. It must be reviewed and finalised by your legal/business advisors
      before public launch.
    </div>
  )
}

export function DocLayout({ title, children }: { title: string; children: ReactNode }) {
  const nav = useNavigate()
  return (
    <AppShell nav={false}>
      <div className="py-8">
        <div className="flex items-center justify-between">
          <button onClick={() => nav(-1)} className="text-warm-mute" data-testid="doc-back">
            <ChevronLeft size={26} />
          </button>
          <Logo className="text-base" />
          <span className="w-6" />
        </div>
        <h1 className="display mt-6 text-4xl font-bold">{title}</h1>
        <div className="prose-doc mt-6 space-y-4 text-[15px] leading-relaxed text-warm-mute">{children}</div>
      </div>
    </AppShell>
  )
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="display pt-4 text-xl font-bold text-warm-white">{children}</h2>
}
