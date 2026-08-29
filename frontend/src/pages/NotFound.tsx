import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { PulseMark } from '../components/Brand'

export default function NotFound() {
  return (
    <AppShell nav={false}>
      <div className="flex min-h-screen flex-col items-center justify-center text-center" data-testid="not-found">
        <PulseMark size={90} />
        <h1 className="display mt-4 text-4xl font-bold">Nothing here</h1>
        <p className="mt-2 text-warm-mute">This page doesn&rsquo;t exist.</p>
        <Link to="/" className="btn-signal mt-6">
          Back to start
        </Link>
      </div>
    </AppShell>
  )
}
