import { ShieldCheck, Ban, Flag, EyeOff, AlertTriangle } from 'lucide-react'
import { DocLayout, H2 } from '../components/DocLayout'
import { SUPPORT_EMAIL } from '../lib/supabase'

export default function Safety() {
  return (
    <DocLayout title="Safety">
      <p>U, ME, NOW. is designed for adults to meet and communicate in Jakarta. We provide safety tools, but we cannot guarantee the conduct of other users or the safety of an offline meeting.</p>

      <div className="mt-4 space-y-3">
        <Tile icon={<EyeOff size={18} />} title="Your location stays private">
          The launch service does not use device GPS for discovery. Your date of birth, exact location and broad-area data are not displayed to other users. Profiles show Jakarta rather than an exact address or coordinates.
        </Tile>
        <Tile icon={<Ban size={18} />} title="Block anyone, instantly">
          Blocking prevents the blocked user from interacting with you through the supported discovery, matching and chat controls.
        </Tile>
        <Tile icon={<Flag size={18} />} title="Report profiles, photos and messages">
          Use the in-app report controls. Reports can be reviewed by authorised moderators, and serious matters may be escalated or referred to competent authorities where required or legally permitted.
        </Tile>
        <Tile icon={<ShieldCheck size={18} />} title="You control discovery">
          Turn discovery off and delete your account through the available account controls. Deletion is subject to data that must be retained for legal, security or safety purposes.
        </Tile>
      </div>

      <H2>Before meeting someone</H2>
      <p>Keep early conversations on-platform. Be cautious with requests to move immediately to another service, send money, invest, share financial information or disclose your home address. Consider a video call before meeting.</p>

      <H2>When meeting</H2>
      <p>Choose a public place, tell a friend where you are going, arrange your own transport and consider a check-in plan. Do not rely on U, ME, NOW. as an emergency-response service.</p>

      <H2>Romance scams</H2>
      <p>Never send money, cryptocurrency, gift cards, loans or financial credentials to someone you met through the service because of a romantic or emotional request. Report suspicious behaviour even if you are not certain it is a scam.</p>

      <H2>Sexual safety</H2>
      <p>A match is not consent to anything. Respect boundaries and a person's decision to stop communicating. Do not request, share or threaten to share intimate images without consent.</p>

      <H2>Under-18 users</H2>
      <p>U, ME, NOW. is strictly 18+. If you believe an account belongs to someone under 18, report it immediately and do not attempt to investigate, contact or meet the person.</p>

      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-signal/40 bg-signal/10 p-4 text-sm text-warm-white">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-signal" />
        <p>
          In immediate danger, contact local emergency services first. For other concerns, report the user in-app or email {SUPPORT_EMAIL}.
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
