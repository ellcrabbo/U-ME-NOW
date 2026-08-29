import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Plus, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AppShell } from '../components/AppShell'
import { Logo } from '../components/Brand'
import { BROAD_AREAS, INTENTS, CITY, MAX_PHOTOS, BIO_MAX } from '../lib/constants'
import { calcAge, isAdult } from '../lib/utils'

function maxDob(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 18)
  return d.toISOString().slice(0, 10)
}

export default function Onboarding() {
  const { user, profile, refreshProfile } = useAuth()
  const nav = useNavigate()

  const [confirm18, setConfirm18] = useState(false)
  const [dob, setDob] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [area, setArea] = useState('')
  const [intents, setIntents] = useState<string[]>([])
  const [bio, setBio] = useState('')
  const [discoverable, setDiscoverable] = useState(true)
  const [consentTerms, setConsentTerms] = useState(false)
  const [consentPrivacy, setConsentPrivacy] = useState(false)
  const [consentGuidelines, setConsentGuidelines] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (profile?.onboarding_complete) nav('/discover', { replace: true })
    if (profile?.display_name) setDisplayName(profile.display_name)
  }, [profile, nav])

  function toggleIntent(i: string) {
    setIntents((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]))
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || [])
    const next = [...files, ...picked].slice(0, MAX_PHOTOS)
    setFiles(next)
    setPreviews(next.map((f) => URL.createObjectURL(f)))
  }

  function removePhoto(i: number) {
    const next = files.filter((_, idx) => idx !== i)
    setFiles(next)
    setPreviews(next.map((f) => URL.createObjectURL(f)))
  }

  function validate(): string | null {
    if (!confirm18) return 'Please confirm you are 18 or older.'
    if (!dob) return 'Please enter your date of birth.'
    if (!isAdult(dob)) return 'You must be 18+ to use U, ME, NOW.'
    if (displayName.trim().length < 2) return 'Please enter a display name.'
    if (!area) return 'Please select your broad area.'
    if (intents.length === 0) return 'Select at least one thing you are looking for.'
    if (!consentTerms || !consentPrivacy || !consentGuidelines)
      return 'Please accept the Terms, Privacy Policy, and Community Guidelines.'
    return null
  }

  async function submit() {
    const problem = validate()
    if (problem) {
      setErr(problem)
      return
    }
    if (!user) return
    setErr('')
    setBusy(true)
    try {
      // 1. Upload photos to the private bucket under {uid}/...
      for (let i = 0; i < files.length; i++) {
        const f = files[i]
        const ext = (f.name.split('.').pop() || 'jpg').toLowerCase()
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('profile-photos')
          .upload(path, f, { contentType: f.type, upsert: false })
        if (upErr) throw upErr
        const { error: rowErr } = await supabase
          .from('profile_photos')
          .insert({ user_id: user.id, storage_path: path, sort_order: i })
        if (rowErr) throw rowErr
      }

      const now = new Date().toISOString()

      // 2. Public profile
      const { error: pErr } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          public_age: calcAge(dob),
          city: CITY,
          bio: bio.trim() || null,
          intents,
          discoverable,
          onboarding_complete: true,
          last_active_at: now
        })
        .eq('id', user.id)
      if (pErr) throw pErr

      // 3. Private profile (never exposed publicly)
      const { error: prErr } = await supabase
        .from('profile_private')
        .update({
          date_of_birth: dob,
          broad_area: area,
          consent_terms_at: now,
          consent_privacy_at: now,
          consent_guidelines_at: now
        })
        .eq('id', user.id)
      if (prErr) throw prErr

      await refreshProfile()
      nav('/discover', { replace: true })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell nav={false}>
      <div className="py-8">
        <Logo className="text-lg" />
        <h1 className="display mt-6 text-4xl font-bold">Set up your profile</h1>
        <p className="mt-2 text-warm-mute">A few basics so people can find you.</p>

        {/* 18+ */}
        <label className="mt-8 flex items-start gap-3" data-testid="onboard-18">
          <Toggle on={confirm18} onClick={() => setConfirm18((v) => !v)} />
          <span className="text-sm text-warm-white">I confirm I am 18 years or older.</span>
        </label>

        {/* DOB */}
        <div className="mt-6">
          <label className="label">Date of birth (private)</label>
          <input
            className="field"
            type="date"
            max={maxDob()}
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            data-testid="onboard-dob"
          />
          <p className="mt-1 text-xs text-warm-faint">
            Kept private. Others only ever see your age{dob && isAdult(dob) ? ` (${calcAge(dob)})` : ''}.
          </p>
        </div>

        {/* Name */}
        <div className="mt-6">
          <label className="label">Display name</label>
          <input
            className="field"
            value={displayName}
            maxLength={30}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="What should people call you?"
            data-testid="onboard-name"
          />
        </div>

        {/* City + Area */}
        <div className="mt-6">
          <label className="label">City</label>
          <div className="field flex items-center text-warm-mute">{CITY}</div>
        </div>
        <div className="mt-4">
          <label className="label">Broad area (private)</label>
          <div className="flex flex-wrap gap-2" data-testid="onboard-areas">
            {BROAD_AREAS.map((a) => (
              <button
                key={a}
                onClick={() => setArea(a)}
                className={`chip ${area === a ? 'chip-on' : ''}`}
                data-testid={`onboard-area-${a}`}
              >
                {a}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-warm-faint">
            Never shown publicly. Used only to tell if someone is in your area.
          </p>
        </div>

        {/* Intents */}
        <div className="mt-6">
          <label className="label">I'm here to…</label>
          <div className="flex flex-wrap gap-2" data-testid="onboard-intents">
            {INTENTS.map((i) => (
              <button
                key={i}
                onClick={() => toggleIntent(i)}
                className={`chip ${intents.includes(i) ? 'chip-on' : ''}`}
                data-testid={`onboard-intent-${i}`}
              >
                {intents.includes(i) && <Check size={14} />} {i}
              </button>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div className="mt-6">
          <label className="label">Short bio</label>
          <textarea
            className="field min-h-[90px]"
            value={bio}
            maxLength={BIO_MAX}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Say something real. Keep it classy."
            data-testid="onboard-bio"
          />
          <p className="mt-1 text-right text-xs text-warm-faint">
            {bio.length}/{BIO_MAX}
          </p>
        </div>

        {/* Photos */}
        <div className="mt-6">
          <label className="label">Photos (up to {MAX_PHOTOS})</label>
          <div className="grid grid-cols-3 gap-3" data-testid="onboard-photos">
            {previews.map((src, i) => (
              <div key={i} className="relative aspect-[4/5] overflow-hidden rounded-2xl">
                <img src={src} className="h-full w-full object-cover" alt="" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-warm-white"
                  data-testid={`onboard-remove-photo-${i}`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {files.length < MAX_PHOTOS && (
              <label className="flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-ink-line text-warm-faint">
                <Plus size={22} />
                <span className="text-xs">Add</span>
                <input type="file" accept="image/*" className="hidden" onChange={onPick} data-testid="onboard-photo-input" />
              </label>
            )}
          </div>
          <p className="mt-1 text-xs text-warm-faint">No explicit content. Real photos of you.</p>
        </div>

        {/* Discoverable */}
        <label className="mt-6 flex items-start gap-3" data-testid="onboard-discoverable">
          <Toggle on={discoverable} onClick={() => setDiscoverable((v) => !v)} />
          <span className="text-sm text-warm-white">
            Make me discoverable
            <span className="block text-warm-faint">Show my profile to others nearby. You can change this anytime.</span>
          </span>
        </label>

        {/* Consents */}
        <div className="mt-6 space-y-3">
          <Consent on={consentTerms} set={setConsentTerms} testid="consent-terms">
            I agree to the <a href="/terms" className="text-signal underline">Terms of Service</a>.
          </Consent>
          <Consent on={consentPrivacy} set={setConsentPrivacy} testid="consent-privacy">
            I agree to the <a href="/privacy" className="text-signal underline">Privacy Policy</a>.
          </Consent>
          <Consent on={consentGuidelines} set={setConsentGuidelines} testid="consent-guidelines">
            I agree to the <a href="/guidelines" className="text-signal underline">Community Guidelines</a>.
          </Consent>
        </div>

        {err && <p className="mt-5 text-sm text-signal" data-testid="onboard-error">{err}</p>}

        <button className="btn-signal mt-6 w-full" disabled={busy} onClick={submit} data-testid="onboard-submit">
          {busy ? 'Saving…' : 'Enter U, ME, NOW'}
        </button>
      </div>
    </AppShell>
  )
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? 'bg-signal' : 'bg-ink-line'}`}
      aria-pressed={on}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-warm-white transition-all ${on ? 'left-6' : 'left-1'}`}
      />
    </button>
  )
}

function Consent({
  on,
  set,
  children,
  testid
}: {
  on: boolean
  set: (v: boolean) => void
  children: React.ReactNode
  testid: string
}) {
  return (
    <label className="flex items-start gap-3" data-testid={testid}>
      <button
        onClick={() => set(!on)}
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
          on ? 'border-signal bg-signal text-ink' : 'border-ink-line'
        }`}
      >
        {on && <Check size={16} />}
      </button>
      <span className="text-sm text-warm-mute">{children}</span>
    </label>
  )
}
