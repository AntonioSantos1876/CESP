'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Users, Save, RefreshCw, ShieldCheck } from 'lucide-react'

type UserRole = 'fan' | 'super_admin' | 'team_admin' | 'coach' | 'livestream_operator' | 'photographer' | 'volunteer'

type Profile = {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
  team_id: string | null
}

const ROLES: UserRole[] = ['fan', 'volunteer', 'photographer', 'coach', 'livestream_operator', 'team_admin', 'super_admin']

const ROLE_COLOUR: Record<UserRole, string> = {
  fan: 'bg-bg-muted text-text-muted',
  volunteer: 'bg-blue-500/15 text-blue-400',
  photographer: 'bg-purple-500/15 text-purple-400',
  coach: 'bg-cyan-500/15 text-cyan-400',
  livestream_operator: 'bg-pink-500/15 text-pink-400',
  team_admin: 'bg-amber-500/15 text-amber-400',
  super_admin: 'bg-brand-primary/15 text-brand-secondary',
}

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [edited, setEdited] = useState<Record<string, UserRole>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await (supabase as any)
      .from('profiles')
      .select('id, email, full_name, role, created_at, team_id')
      .order('created_at', { ascending: false })
    if (data) setProfiles(data)
    setEdited({})
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function saveRole(profile: Profile) {
    const newRole = edited[profile.id]
    if (!newRole || newRole === profile.role) return
    setSaving(profile.id)
    const supabase = createClient()
    await (supabase as any).from('profiles').update({ role: newRole }).eq('id', profile.id)
    setSaving(null)
    load()
  }

  const filtered = profiles.filter(p =>
    !search ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    (p.full_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Users</h1>
          <p className="text-text-muted text-sm mt-1">Manage roles for all registered users.</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-muted text-text-secondary hover:text-text-primary hover:bg-bg-hover border border-bg-border transition-colors text-sm"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="input w-full max-w-sm"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-text-muted text-sm">No users found.</div>
      ) : (
        <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 border-b border-[#1a1a1a]">
            <p className="text-xs font-medium text-text-muted uppercase tracking-widest">User</p>
            <p className="text-xs font-medium text-text-muted uppercase tracking-widest">Role</p>
            <p className="text-xs font-medium text-text-muted uppercase tracking-widest">Action</p>
          </div>

          {filtered.map((profile, i) => {
            const currentRole = edited[profile.id] ?? profile.role
            const isDirty = edited[profile.id] && edited[profile.id] !== profile.role
            const isSaving = saving === profile.id
            return (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
                className={`grid grid-cols-[1fr_auto_auto] gap-4 items-center px-5 py-3.5 ${i < filtered.length - 1 ? 'border-b border-[#1a1a1a]' : ''}`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-brand-primary/15 flex items-center justify-center shrink-0 text-xs font-bold text-brand-primary">
                      {(profile.full_name ?? profile.email)[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {profile.full_name ?? profile.email.split('@')[0]}
                      </p>
                      <p className="text-xs text-text-muted truncate">{profile.email}</p>
                    </div>
                    {profile.role === 'super_admin' && (
                      <ShieldCheck size={14} className="text-brand-primary shrink-0" />
                    )}
                  </div>
                </div>

                <div>
                  <select
                    value={currentRole}
                    onChange={e => setEdited({ ...edited, [profile.id]: e.target.value as UserRole })}
                    className="input text-xs py-1.5 px-2.5 pr-7"
                  >
                    {ROLES.map(r => (
                      <option key={r} value={r}>{r.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <button
                    onClick={() => saveRole(profile)}
                    disabled={!isDirty || isSaving}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isDirty
                        ? 'bg-brand-primary text-white hover:bg-brand-primary/90'
                        : 'bg-bg-muted text-text-muted cursor-not-allowed opacity-40 border border-bg-border'
                    }`}
                  >
                    {isSaving ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save size={12} />
                    )}
                    Save
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <p className="text-xs text-text-muted mt-4">
        {profiles.length} user{profiles.length !== 1 ? 's' : ''} total.
        Role changes take effect immediately.
      </p>
    </div>
  )
}
