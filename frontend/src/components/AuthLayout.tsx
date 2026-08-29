import { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Logo } from './Brand'

export function AuthLayout({
  title,
  subtitle,
  children
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  const nav = useNavigate()
  return (
    <div className="min-h-screen bg-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pt-safe">
        <header className="flex items-center justify-between pt-6">
          <button onClick={() => nav('/')} className="text-warm-mute" data-testid="auth-back-btn" aria-label="Back">
            <ChevronLeft size={26} />
          </button>
          <Logo className="text-lg" />
          <span className="w-6" />
        </header>
        <div className="flex flex-1 flex-col justify-center pb-16">
          <h1 className="display text-4xl font-bold text-warm-white">{title}</h1>
          {subtitle && <p className="mt-2 text-warm-mute">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          <p className="mt-6 text-center text-xs text-warm-faint">
            By continuing you confirm you are 18+ and agree to our{' '}
            <Link to="/terms" className="text-warm-mute underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-warm-mute underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
