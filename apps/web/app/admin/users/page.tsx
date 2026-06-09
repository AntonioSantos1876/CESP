'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Users, Save, RefreshCw, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react'

type UserRole = 'fan' | 'super_admin' | 'team_admin' | 'coach' | 'livestream_operator' | 'photographer' | 'volunteer'
type RequestedRole = 'supporter' | 'volunteer' | 'photographer' | 'coach' | 'livestream_operator' | 'team_admin'
type RequestStatus = 'pending' | 'approved' | 'rejected'

type Profile = {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
  team_id: string | null
}

type Team = {
  id: string
  name: string
  short_name: string
}

type AccessRequest = {
  id: string
  user_id: string
  requested_role: RequestedRole
  requested_team_id: string | null
  requested_team_name: string | null
  requested_team_short_name: string | null
  status: RequestStatus
  admin_notes: string | null
  created_at: string
}

const ROLES: UserRole[] = ['fan', 'volunteer', 'photographer', 'coach', 'livestream_operator', 'team_admin', 'super_admin']

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null)
  const [edited, setEdited] = useState<Record<string, UserRole>>({})
  const [editedTeam, setEditedTeam] = useState<Record<string, string | null>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [requestMessage, setRequestMessage] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: self } = await (supabase as any)
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (self) setCurrentUserRole(self.role as UserRole)
    }

    const [{ data: profileData }, { data: requestData }, { data: teamData }] = await Promise.all([
      (supabase as any)
        .from('profiles')
        .select('id, email, full_name, role, created_at, team_id')
        .order('created_at', { ascending: false }),
      (supabase as any)
        .from('access_requests')
        .select('id, user_id, requested_role, requested_team_id, requested_team_name, requested_team_short_name, status, admin_notes, created_at')
        .order('created_at', { ascending: false }),
      (supabase as any)
        .from('teams')
        .select('id, name, short_name')
        .order('name', { ascending: true }),
    ])

    setProfiles(profileData ?? [])
    setRequests(requestData ?? [])
    setTeams(teamData ?? [])
    setEdited({})
    setEditedTeam({})
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function saveUser(profile: Profile) {
    const newRole = edited[profile.id]
    const newTeamId = editedTeam[profile.id]
    const roleChanged = newRole && newRole !== profile.role
    const teamChanged = newTeamId !== undefined && newTeamId !== profile.team_id
    if (!roleChanged && !teamChanged) return

    setSaving(profile.id)
    const supabase = createClient()
    const patch: Record<string, unknown> = {}
    if (roleChanged) patch.role = newRole
    if (teamChanged) patch.team_id = newTeamId ?? null
    await (supabase as any).from('profiles').update(patch).eq('id', profile.id)
    setSaving(null)
    load()
  }

  async function approveRequest(request: AccessRequest) {
    const supabase = createClient()
    const profile = profiles.find(item => item.id === request.user_id)
    if (!profile) return

    setSaving(request.id)
    setRequestMessage('')

    let targetTeamId = request.requested_team_id

    if (request.requested_team_name && request.requested_team_short_name) {
      const existingTeam = teams.find(team =>
        team.name.toLowerCase() === request.requested_team_name!.toLowerCase() ||
        team.short_name.toLowerCase() === request.requested_team_short_name!.toLowerCase()
      )

      if (existingTeam) {
        targetTeamId = existingTeam.id
      } else {
        const { data: createdTeam, error: createError } = await (supabase as any)
          .from('teams')
          .insert({
            name: request.requested_team_name.trim(),
            short_name: request.requested_team_short_name.trim(),
          })
          .select('id, name, short_name')
          .single()

        if (createError) {
          setRequestMessage(createError.message)
          setSaving(null)
          return
        }

        targetTeamId = createdTeam.id
      }
    }

    if (['coach', 'team_admin'].includes(profile.role) && profile.team_id && targetTeamId && profile.team_id !== targetTeamId) {
      setRequestMessage('This user is already assigned to a different team.')
      setSaving(null)
      return
    }

    const nextRole = request.requested_role === 'supporter' ? 'fan' : request.requested_role
    const { error: profileError } = await (supabase as any)
      .from('profiles')
      .update({
        role: nextRole,
        team_id: targetTeamId ?? profile.team_id ?? null,
      })
      .eq('id', request.user_id)

    if (profileError) {
      setRequestMessage(profileError.message)
      setSaving(null)
      return
    }

    const { error: requestError } = await (supabase as any)
      .from('access_requests')
      .update({ status: 'approved', admin_notes: null })
      .eq('id', request.id)

    if (requestError) {
      setRequestMessage(requestError.message)
      setSaving(null)
      return
    }

    setSaving(null)
    setRequestMessage('Request approved.')
    load()
  }

  async function rejectRequest(request: AccessRequest) {
    const supabase = createClient()
    setSaving(request.id)
    setRequestMessage('')

    const { error } = await (supabase as any)
      .from('access_requests')
      .update({ status: 'rejected' })
      .eq('id', request.id)

    if (error) {
      setRequestMessage(error.message)
    } else {
      setRequestMessage('Request rejected.')
      load()
    }

    setSaving(null)
  }

  const filteredProfiles = profiles.filter(profile =>
    !search ||
    profile.email.toLowerCase().includes(search.toLowerCase()) ||
    (profile.full_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const pendingRequests = requests.filter(request => request.status === 'pending').filter(request => {
    const profile = profiles.find(item => item.id === request.user_id)
    if (!profile) return true
    return (
      !search ||
      profile.email.toLowerCase().includes(search.toLowerCase()) ||
      (profile.full_name ?? '').toLowerCase().includes(search.toLowerCase())
    )
  })

  function requestTeamLabel(request: AccessRequest) {
    if (request.requested_team_name) {
      return `${request.requested_team_name} (${request.requested_team_short_name ?? 'NEW'})`
    }

    if (request.requested_team_id) {
      const team = teams.find(item => item.id === request.requested_team_id)
      return team ? `${team.name} (${team.short_name})` : 'Existing team'
    }

    return 'No team selected'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Users</h1>
          <p className="text-text-muted text-sm mt-1">Manage user roles and review team or access requests.</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-muted text-text-secondary hover:text-text-primary hover:bg-bg-hover border border-bg-border transition-colors text-sm"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div className="mb-5">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="input w-full max-w-sm"
        />
      </div>

      {requestMessage && (
        <div className="mb-5 rounded-xl border border-brand-primary/20 bg-brand-primary/10 px-4 py-3 text-sm text-brand-secondary">
          {requestMessage}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest">Pending access requests</h2>
              <span className="text-xs text-text-muted">{pendingRequests.length} pending</span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl py-12 text-center text-text-muted text-sm">
                No pending requests right now.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((request, index) => {
                  const profile = profiles.find(item => item.id === request.user_id)
                  const isSaving = saving === request.id
                  return (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: index * 0.03 }}
                      className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-text-primary">
                            {profile?.full_name ?? profile?.email ?? 'Unknown user'}
                          </p>
                          <p className="text-xs text-text-muted mt-1">{profile?.email}</p>
                          <div className="mt-3 space-y-1 text-sm text-text-secondary">
                            <p><span className="text-text-muted">Requested role:</span> {request.requested_role.replace('_', ' ')}</p>
                            <p><span className="text-text-muted">Team:</span> {requestTeamLabel(request)}</p>
                            <p><span className="text-text-muted">Current role:</span> {profile?.role ?? 'fan'}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => approveRequest(request)}
                            disabled={isSaving}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            <CheckCircle2 size={14} />
                            Approve
                          </button>
                          <button
                            onClick={() => rejectRequest(request)}
                            disabled={isSaving}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            <XCircle size={14} />
                            Reject
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {filteredProfiles.length === 0 ? (
            <div className="text-center py-20 text-text-muted text-sm">No users found.</div>
          ) : (
            <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
              <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 border-b border-[#1a1a1a]">
                <p className="text-xs font-medium text-text-muted uppercase tracking-widest">User</p>
                <p className="text-xs font-medium text-text-muted uppercase tracking-widest">Role</p>
                <p className="text-xs font-medium text-text-muted uppercase tracking-widest">Action</p>
              </div>

              {filteredProfiles.map((profile, index) => {
                const currentRole = edited[profile.id] ?? profile.role
                const currentTeamId = editedTeam[profile.id] !== undefined ? editedTeam[profile.id] : profile.team_id
                const roleChanged = edited[profile.id] && edited[profile.id] !== profile.role
                const teamChanged = editedTeam[profile.id] !== undefined && editedTeam[profile.id] !== profile.team_id
                const isDirty = roleChanged || teamChanged
                const isSaving = saving === profile.id
                const displayTeam = teams.find(item => item.id === profile.team_id)

                return (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    className={`flex flex-col gap-3 sm:grid sm:grid-cols-[1fr_auto_auto] sm:gap-4 sm:items-center px-5 py-3.5 ${index < filteredProfiles.length - 1 ? 'border-b border-[#1a1a1a]' : ''}`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-brand-primary/15 flex items-center justify-center shrink-0 text-xs font-bold text-brand-primary">
                          {(profile.full_name ?? profile.email)[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-text-primary truncate">
                              {profile.full_name ?? profile.email.split('@')[0]}
                            </p>
                            {profile.role === 'super_admin' && (
                              <ShieldCheck size={14} className="text-brand-primary shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-text-muted truncate">{profile.email}</p>
                          {currentUserRole === 'super_admin' ? (
                            <div className="mt-1.5">
                              <select
                                value={currentTeamId ?? ''}
                                onChange={e => setEditedTeam(prev => ({ ...prev, [profile.id]: e.target.value || null }))}
                                className="text-xs bg-[#1a1a1a] border border-[#2a2a2a] text-text-secondary rounded-lg px-2 py-1 focus:outline-none focus:border-brand-primary/50 max-w-[200px]"
                              >
                                <option value="">No team</option>
                                {teams.map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </select>
                            </div>
                          ) : displayTeam ? (
                            <p className="text-xs text-brand-secondary truncate mt-0.5">{displayTeam.name}</p>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:contents">
                      <div className="flex-1 sm:flex-none">
                        <select
                          value={currentRole}
                          onChange={e => setEdited({ ...edited, [profile.id]: e.target.value as UserRole })}
                          className="input text-xs py-1.5 px-2.5 pr-7 w-full sm:w-auto"
                        >
                          {ROLES.map(role => (
                            <option key={role} value={role}>{role.replace('_', ' ')}</option>
                          ))}
                        </select>
                      </div>

                      <div className="shrink-0">
                        <button
                          onClick={() => saveUser(profile)}
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
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </>
      )}

      <p className="text-xs text-text-muted mt-4">
        {profiles.length} user{profiles.length !== 1 ? 's' : ''} total.
      </p>
    </div>
  )
}
