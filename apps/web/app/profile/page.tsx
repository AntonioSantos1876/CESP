'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  User, Mail, Shield, Edit3, Save, X, CheckCircle,
  LogOut, Key, Trophy, HandHeart, Star,
} from 'lucide-react'

const ROLE_LABELS: Record<string, { label: string; colour: string }> = {
  super_admin:        { label: 'Super Admin',        colour: 'bg-red-500/15 text-red-400 border-red-500/20' },
  team_admin:         { label: 'Team Admin',          colour: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  coach:              { label: 'Coach',               colour: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  livestream_operator:{ label: 'Livestream',          colour: 'bg-green-500/15 text-green-400 border-green-500/20' },
  photographer:       { label: 'Photographer',        colour: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' },
  volunteer:          { label: 'Volunteer',           colour: 'bg-brand-primary/15 text-brand-secondary border-brand-primary/20' },
  fan:                { label: 'Fan',                 colour: 'bg-bg-muted text-text-muted border-bg-border' },
}

type Profile = {
  id: string
  email: string | undefined
  full_name: string | null
  role: string
  created_at?: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await (supabase as any)
        .from('profiles')
        .select('id, full_name, role, created_at')
        .eq('id', user.id)
        .single()

      setProfile({
        id: user.id,
        email: user.email,
        full_name: data?.full_name ?? null,
        role: data?.role ?? 'fan',
        created_at: data?.created_at,
      })
      setName(data?.full_name ?? '')
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { error: dbError } = await (supabase as any)
      .from('profiles')
      .update({ full_name: name.trim() || null })
      .eq('id', profile.id)

    if (dbError) {
      setError('Failed to save. Please try again.')
      setSaving(false)
      return
    }
    setProfile(p => p ? { ...p, full_name: name.trim() || null } : p)
    setSaving(false)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-bg-base flex items-center justify-center">
        <p className="text-text-muted">Profile not found.</p>
      </main>
    )
  }

  const roleInfo = ROLE_LABELS[profile.role] ?? ROLE_LABELS.fan
  const initials = (profile.full_name ?? profile.email ?? 'U')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const isAdmin = profile.role === 'super_admin' || profile.role === 'team_admin'

  return (
    <main className="min-h-screen bg-bg-base">
      <div className="container-cesp py-12 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-brand-primary/20 border border-brand-primary/25 flex items-center justify-center text-xl font-bold text-brand-primary shrink-0">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                {profile.full_name ?? 'Your Profile'}
              </h1>
              <p className="text-sm text-text-muted">{profile.email}</p>
              <span className={`mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-xs font-semibold ${roleInfo.colour}`}>
                <Shield size={10} />
                {roleInfo.label}
              </span>
            </div>
          </div>

          {saved && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm mb-6"
            >
              <CheckCircle size={16} />
              Profile saved successfully.
            </motion.div>
          )}

          {/* Profile details card */}
          <div className="card mb-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest">Account details</h2>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-muted border border-bg-border text-text-secondary hover:text-text-primary hover:bg-bg-hover text-xs font-medium transition-colors"
                >
                  <Edit3 size={12} />
                  Edit
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Email */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-bg-muted flex items-center justify-center shrink-0">
                  <Mail size={15} className="text-text-muted" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Email</p>
                  <p className="text-sm font-medium text-text-primary">{profile.email}</p>
                </div>
              </div>

              {/* Name */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-bg-muted flex items-center justify-center shrink-0">
                  <User size={15} className="text-text-muted" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-text-muted">Full name</p>
                  {editing ? (
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your full name"
                      className="input mt-1 py-1.5 text-sm"
                      autoFocus
                    />
                  ) : (
                    <p className="text-sm font-medium text-text-primary">
                      {profile.full_name ?? <span className="text-text-muted italic">Not set</span>}
                    </p>
                  )}
                </div>
              </div>

              {/* Role */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-bg-muted flex items-center justify-center shrink-0">
                  <Shield size={15} className="text-text-muted" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Role</p>
                  <p className={`text-sm font-semibold ${roleInfo.colour.split(' ').find(c => c.startsWith('text-'))}`}>
                    {roleInfo.label}
                  </p>
                </div>
              </div>
            </div>

            {editing && (
              <div className="mt-5 pt-4 border-t border-bg-border flex items-center gap-3">
                {error && <p className="text-xs text-error flex-1">{error}</p>}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => { setEditing(false); setName(profile.full_name ?? '') }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-bg-muted border border-bg-border text-text-secondary hover:text-text-primary text-sm transition-colors"
                  >
                    <X size={13} />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save size={13} />
                    )}
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="card mb-4">
            <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-4">Quick links</h2>
            <div className="space-y-2">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-primary/5 border border-brand-primary/15 hover:border-brand-primary/30 hover:bg-brand-primary/10 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-brand-primary/15 flex items-center justify-center shrink-0">
                    <Trophy size={14} className="text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Admin panel</p>
                    <p className="text-xs text-text-muted">Manage matches, news, volunteers</p>
                  </div>
                </Link>
              )}
              <Link
                href="/volunteer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-muted border border-bg-border hover:border-brand-primary/20 hover:bg-bg-hover transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-bg-hover flex items-center justify-center shrink-0">
                  <HandHeart size={14} className="text-brand-secondary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">Volunteer</p>
                  <p className="text-xs text-text-muted">Apply to help run the league</p>
                </div>
              </Link>
              <Link
                href="/donate"
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-muted border border-bg-border hover:border-brand-primary/20 hover:bg-bg-hover transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-bg-hover flex items-center justify-center shrink-0">
                  <Star size={14} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">Donate</p>
                  <p className="text-xs text-text-muted">Support the Clarendon Elite Cup</p>
                </div>
              </Link>
              <Link
                href="/auth/update-password"
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-muted border border-bg-border hover:border-brand-primary/20 hover:bg-bg-hover transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-bg-hover flex items-center justify-center shrink-0">
                  <Key size={14} className="text-text-muted" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">Change password</p>
                  <p className="text-xs text-text-muted">Update your account password</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-error/20 text-error hover:bg-error/5 transition-colors text-sm font-medium"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </motion.div>
      </div>
    </main>
  )
}
