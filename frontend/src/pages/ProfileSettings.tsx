import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Trash2, Plus, X, ArrowUp, ArrowDown, ShieldQuestion, Check } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AppShell } from '../components/AppShell'
import { Logo, Spinner } from '../components/Brand'
import { Photo } from '../components/Photo'
import { ConfigBanner } from '../components/ConfigBanner'
import { BROAD_AREAS, INTENTS, MAX_PHOTOS, BIO_MAX } from '../lib/constants'
import { ProfilePhoto } from '../lib/types'

export default function ProfileSettings() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const nav = useNavigate()
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [intents, setIntents] = useState<string[]>([])
  const [area, setArea] = useState('')
  const [discoverable, setDiscoverable] = useState(false)
  const [photos, setPhotos] = useState<ProfilePhoto[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured || !user) {
      setLoading(false)
      return
    }
    const load = async () => {
      const [{ data: priv }, { data: ph }] = await Promise.all([
        supabase.from('profile_private').select('broad_area').eq('id', user.id).maybeSingle(),
        supabase.from('profile_photos').select('*').eq('user_id', user.id).order('sort_order', { ascending: true })
      ])
      setDisplayName(profile?.display_name || '')
      setBio(profile?.bio || '')
      setIntents(profile?.intents || [])
      setDiscoverable(profile?.discoverable ?? false)
      setArea(priv?.broad_area || '')
      setPhotos((ph as ProfilePhoto[]) || [])
      setLoading(false)
    }
    load()
  }, [user, profile])

  function toggleIntent(i: string) {
    setIntents((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]))
  }

  async function addPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f || !user || photos.length >= MAX_PHOTOS) return
    const ext = (f.name.split('.').pop() || 'jpg').toLowerCase()
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`
    const { error: upErr } = await supabase.storage.from('profile-photos').upload(path, f, { contentType: f.type })
    if (upErr) {
      setErr(upErr.message)
      return
    }
    const { data, error } = await supabase
      .from('profile_photos')
      .insert({ user_id: user.id, storage_path: path, sort_order: photos.length })
      .select()
      .single()
    if (!error && data) setPhotos((p) => [...p, data as ProfilePhoto])
  }

  async function deletePhoto(p: ProfilePhoto) {
    await supabase.storage.from('profile-photos').remove([p.storage_path])
    await supabase.from('profile_photos').delete().eq('id', p.id)
    setPhotos((list) => list.filter((x) => x.id !== p.id))
  }

  async function move(idx: number, dir: -1 | 1) {
    const next = [...photos]
    const j = idx + dir
    if (j < 0 || j >= next.length) return
    ;[next[idx], next[j]] = [next[j], next[idx]]
    setPhotos(next)
    await Promise.all(
      next.map((p, i) => supabase.from('profile_photos').update({ sort_order: i }).eq('id', p.id))
    )
  }

  async function save() {
    if (!user) return
    if (displayName.trim().length < 2) {
      setErr('Display name is required.')
      return
    }
    if (intents.length === 0) {
      setErr('Select at least one intent.')
      return
    }
    setSaving(true)
    setErr('')
    setSaved(false)
    const { error: pErr } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim(), bio: bio.trim() || null, intents, discoverable })
      .eq('id', user.id)
    const { error: prErr } = await supabase
      .from('profile_private')
      .update({ broad_area: area })
      .eq('id', user.id)
    setSaving(false)
    if (pErr || prErr) {
      setErr((pErr || prErr)!.message)
      return
    }
    setSaved(true)
    await refreshProfile()
    setTimeout(() => setSaved(false), 2500)
  }

  async function doDelete() {
    setDeleting(true)
    const { error } = await supabase.functions.invoke('delete-account')
    if (error) {
      setErr('Account deletion failed: ' + error.message)
      setDeleting(false)
      return
    }
    await signOut()
    nav('/', { replace: true })
  }

  if (loading)
    return (
      <AppShell>
        <Spinner />
      </AppShell>
    )

  const suspended = profile && profile.account_status !== 'active'

  return (
    <AppShell>
      <div className="pt-8">
        <div className="flex items-center justify-between">
          <Logo className="text-lg" />
          <button onClick={() => signOut().then(() => nav('/'))} className="inline-flex items-center gap-1.5 text-sm text-warm-mute" data-testid="signout-btn">
            <LogOut size={16} /> Sign out
          </button>
        </div>

        <h1 className="display mt-6 text-4xl font-bold">Your profile</h1>

        <ConfigBanner />

        {suspended && (
          <div className="mt-5 rounded-2xl border border-signal/50 bg-signal/10 p-4" data-testid="account-status-banner">
            <p className="font-semibold text-warm-white">Account {profile!.account_status}</p>
            <p className="mt-1 text-sm text-warm-mute">
              {profile!.account_status === 'banned'
                ? 'Your account has been banned for violating our Community Guidelines. You cannot be discovered or start new chats.'
                : 'Your account is temporarily suspended. Discovery and new chats are paused while our team reviews.'}{' '}
              Questions? Visit Contact.
            </p>
          </div>
        )}

        {/* Photos */}
        <div className="mt-8">
          <label className="label">Photos ({photos.length}/{MAX_PHOTOS})</label>
          <div className="grid grid-cols-3 gap-3" data-testid="settings-photos">
            {photos.map((p, i) => (
              <div key={p.id} className="relative aspect-[4/5] overflow-hidden rounded-2xl">
                <Photo path={p.storage_path} name={displayName} rounded="rounded-2xl" />
                <button onClick={() => deletePhoto(p)} className="absolute right-1 top-1 rounded-full bg-black/60 p-1" data-testid={`delete-photo-${i}`}>
                  <X size={14} />
                </button>
                <div className="absolute bottom-1 left-1 flex gap-1">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded-full bg-black/60 p-1 disabled:opacity-30" data-testid={`photo-up-${i}`}>
                    <ArrowUp size={13} />
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === photos.length - 1} className="rounded-full bg-black/60 p-1 disabled:opacity-30" data-testid={`photo-down-${i}`}>
                    <ArrowDown size={13} />
                  </button>
                </div>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <label className="flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-ink-line text-warm-faint">
                <Plus size={22} />
                <span className="text-xs">Add</span>
                <input type="file" accept="image/*" className="hidden" onChange={addPhoto} data-testid="settings-add-photo" />
              </label>
            )}
          </div>
        </div>

        <div className="mt-6">
          <label className="label">Display name</label>
          <input className="field" value={displayName} maxLength={30} onChange={(e) => setDisplayName(e.target.value)} data-testid="settings-name" />
        </div>

        <div className="mt-5">
          <label className="label">Bio</label>
          <textarea className="field min-h-[90px]" value={bio} maxLength={BIO_MAX} onChange={(e) => setBio(e.target.value)} data-testid="settings-bio" />
        </div>

        <div className="mt-5">
          <label className="label">Looking for</label>
          <div className="flex flex-wrap gap-2">
            {INTENTS.map((i) => (
              <button key={i} onClick={() => toggleIntent(i)} className={`chip ${intents.includes(i) ? 'chip-on' : ''}`} data-testid={`settings-intent-${i}`}>
                {intents.includes(i) && <Check size={14} />} {i}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <label className="label">Broad area (private)</label>
          <div className="flex flex-wrap gap-2">
            {BROAD_AREAS.map((a) => (
              <button key={a} onClick={() => setArea(a)} className={`chip ${area === a ? 'chip-on' : ''}`} data-testid={`settings-area-${a}`}>
                {a}
              </button>
            ))}
          </div>
        </div>

        <label className="mt-6 flex items-start gap-3" data-testid="settings-discoverable">
          <button onClick={() => setDiscoverable((v) => !v)} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${discoverable ? 'bg-signal' : 'bg-ink-line'}`}>
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-warm-white transition-all ${discoverable ? 'left-6' : 'left-1'}`} />
          </button>
          <span className="text-sm text-warm-white">
            Discoverable
            <span className="block text-warm-faint">Turn off to hide from discovery. Existing chats stay.</span>
          </span>
        </label>

        {err && <p className="mt-5 text-sm text-signal" data-testid="settings-error">{err}</p>}

        <button className="btn-signal mt-6 w-full" onClick={save} disabled={saving} data-testid="settings-save">
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
        </button>

        {/* Legal + danger zone */}
        <div className="mt-10 flex flex-wrap gap-x-4 gap-y-2 text-sm text-warm-faint">
          <a href="/safety">Safety</a>
          <a href="/guidelines">Guidelines</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/contact">Contact</a>
        </div>

        <div className="mt-8 rounded-2xl border border-ink-line p-4">
          <div className="flex items-center gap-2 text-warm-white">
            <ShieldQuestion size={18} className="text-signal" />
            <p className="font-semibold">Delete account</p>
          </div>
          <p className="mt-2 text-sm text-warm-mute">
            Permanently deletes your profile, photos, messages, likes, and matches. This cannot be undone.
          </p>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} className="mt-4 inline-flex items-center gap-2 rounded-full border border-signal/60 px-5 py-3 text-sm font-semibold text-signal" data-testid="delete-account-btn">
              <Trash2 size={16} /> Delete my account
            </button>
          ) : (
            <div className="mt-4 space-y-3" data-testid="delete-confirm">
              <p className="text-sm font-semibold text-warm-white">Are you absolutely sure?</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(false)} className="btn-ghost flex-1" data-testid="delete-cancel">
                  Cancel
                </button>
                <button onClick={doDelete} disabled={deleting} className="flex-1 rounded-full bg-signal px-5 py-3 font-semibold text-ink disabled:opacity-60" data-testid="delete-confirm-btn">
                  {deleting ? 'Deleting…' : 'Delete forever'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
