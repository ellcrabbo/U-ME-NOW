import { ShieldCheck, Ban, Flag, EyeOff, AlertTriangle } from 'lucide-react'
import { DocLayout, H2 } from '../components/DocLayout'
import { SUPPORT_EMAIL } from '../lib/supabase'

export default function Safety() {
  return (
    <DocLayout title="Safety">
      <p>Your safety comes first. Here's how U, ME, NOW protects you and how to get help.</p>

      <div className="mt-4 space-y-3">
        <Tile icon={<EyeOff size={18} />} title="Your location stays private">
          We never use GPS. Your date of birth and broad area are private — others only ever see
          "Jakarta" and, when relevant, a "Nearby" label.
        </Tile>
        <Tile icon={<Ban size={18} />} title="Block anyone, instantly">
          Blocking hides you both from each other, stops new likes and matches, and closes any chat.
        </Tile>
        <Tile icon={<Flag size={18} />} title="Report bad behaviour">
          Report a profile, photo, or message. Our moderators review every report.
        </Tile>
        <Tile icon={<ShieldCheck size={18} />} title="You control discovery">
          Turn discovery off any time. Delete your account and data permanently whenever you want.
        </Tile>
      </div>

      <H2>Meeting safely</H2>
      <p>Meet in public places, tell a friend where you're going, and trust your instincts. Never send money to anyone you meet here.</p>

      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-signal/40 bg-signal/10 p-4 text-sm text-warm-white">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-signal" />
        <p>
          In immediate danger? Contact local emergency services first. For other concerns, report the
          user in-app or email {SUPPORT_EMAIL}.
        </p>
      </div>
    </DocLayout>
  )
}

function Tile({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-ink-line p-4">
      <div className="flex items-center gap-2 text-warm-white">
        <span className="text-signal">{icon}</span>
        <p className="font-semibold">{title}</p>
      </div>
      <p className="mt-1.5 text-sm text-warm-mute">{children}</p>
    </div>
  )
}
