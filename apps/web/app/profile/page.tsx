'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  User, Mail, Shield, Edit3, Save, X, CheckCircle,
  LogOut, Key, Trophy, HandHeart, Star, Users, PlusCircle,
} from 'lucide-react'

type RequestedRole = 'fan' | 'supporter' | 'volunteer' | 'photographer' | 'coach' | 'livestream_operator' | 'team_admin'
type TeamRequestType = 'none' | 'existing' | 'new'
type AccessRequestStatus = 'pending' | 'approved' | 'rejected'

type TeamOption = {
  id: string
  name: string
  short_name: string
}

type AccessRequest = {
  id: string
  requested_role: RequestedRole
  requested_team_id: string | null
  requested_team_name: string | null
  requested_team_short_name: string | null
  status: AccessRequestStatus
  admin_notes: string | null
}

type PlayerRow = {
  id: string
  full_name: string
  position: string | null
  jersey_number: number | null
  is_active: boolean
}

type Profile = {
  id: string
  email: string | undefined
  full_name: string | null
  role: string
  created_at?: string
  team_id: string | null
  team_name: string | null
  team_short_name: string | null
}

const ROLE_LABELS: Record<string, { label: string; colour: string }> = {
  super_admin: { label: 'Super Admin', colour: 'bg-red-500/15 text-red-400 border-red-500/20' },
  team_admin: { label: 'Team Admin', colour: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  coach: { label: 'Coach', colour: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  livestream_operator: { label: 'Livestream', colour: 'bg-green-500/15 text-green-400 border-green-500/20' },
  photographer: { label: 'Photographer', colour: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' },
  volunteer: { label: 'Volunteer', colour: 'bg-brand-primary/15 text-brand-secondary border-brand-primary/20' },
  fan: { label: 'Fan', colour: 'bg-bg-muted text-text-muted border-bg-border' },
}

const REQUEST_ROLE_OPTIONS: { value: RequestedRole; label: string; desc: string }[] = [
  { value: 'supporter', label: 'Supporter', desc: 'Stay on fan access and attach yourself to a team.' },
  { value: 'volunteer', label: 'Volunteer', desc: 'Ask for volunteer access and review.' },
  { value: 'photographer', label: 'Photographer', desc: 'Request media access.' },
  { value: 'coach', label: 'Coach', desc: 'Manage one team and its players once approved.' },
  { value: 'livestream_operator', label: 'Livestream Operator', desc: 'Request live-production permissions.' },
  { value: 'team_admin', label: 'Team Admin', desc: 'Help run one specific team.' },
]

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [teams, setTeams] = useState<TeamOption[]>([])
  const [request, setRequest] = useState<AccessRequest | null>(null)
  const [requestRole, setRequestRole] = useState<RequestedRole>('supporter')
  const [teamRequestType, setTeamRequestType] = useState<TeamRequestType>('existing')
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamShortName, setNewTeamShortName] = useState('')
  const [requestSaving, setRequestSaving] = useState(false)
  const [requestMessage, setRequestMessage] = useState('')
  const [players, setPlayers] = useState<PlayerRow[]>([])
  const [playerName, setPlayerName] = useState('')
  const [playerPosition, setPlayerPosition] = useState('')
  const [playerNumber, setPlayerNumber] = useState('')
  const [playerSaving, setPlayerSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: profileData }, { data: teamsData }, { data: requestData }] = await Promise.all([
        (supabase as any)
          .from('profiles')
          .select('id, full_name, role, created_at, team_id')
          .eq('id', user.id)
          .single(),
        (supabase as any)
          .from('teams')
          .select('id, name, short_name')
          .order('name', { ascending: true }),
        (supabase as any)
          .from('access_requests')
          .select('id, requested_role, requested_team_id, requested_team_name, requested_team_short_name, status, admin_notes')
          .eq('user_id', user.id)
          .maybeSingle(),
      ])

      const teamsList = (teamsData ?? []) as TeamOption[]
      const currentTeam = teamsList.find(team => team.id === profileData?.team_id) ?? null
      const nextProfile: Profile = {
        id: user.id,
        email: user.email,
        full_name: profileData?.full_name ?? null,
        role: profileData?.role ?? 'fan',
        created_at: profileData?.created_at,
        team_id: profileData?.team_id ?? null,
        team_name: currentTeam?.name ?? null,
        team_short_name: currentTeam?.short_name ?? null,
      }

      setTeams(teamsList)
      setProfile(nextProfile)
      setName(nextProfile.full_name ?? '')

      const typedRequest = (requestData as AccessRequest | null) ?? null
      setRequest(typedRequest)

      if (typedRequest) {
        setRequestRole(typedRequest.requested_role)
        setSelectedTeamId(typedRequest.requested_team_id ?? nextProfile.team_id ?? '')
        setNewTeamName(typedRequest.requested_team_name ?? '')
        setNewTeamShortName(typedRequest.requested_team_short_name ?? '')
        setTeamRequestType(
          typedRequest.requested_team_name
            ? 'new'
            : typedRequest.requested_team_id
              ? 'existing'
              : 'none'
        )
      } else {
        setSelectedTeamId(nextProfile.team_id ?? '')
      }

      if (nextProfile.team_id && ['coach', 'team_admin', 'super_admin'].includes(nextProfile.role)) {
        const { data: playerData } = await (supabase as any)
          .from('players')
          .select('id, full_name, position, jersey_number, is_active')
          .eq('team_id', nextProfile.team_id)
          .order('jersey_number', { ascending: true, nullsFirst: false })
          .order('full_name', { ascending: true })

        setPlayers(playerData ?? [])
      } else {
        setPlayers([])
      }

      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (requestRole === 'supporter') {
      setTeamRequestType('existing')
    }

    if (requestRole === 'coach' || requestRole === 'team_admin') {
      if (teamRequestType === 'none') setTeamRequestType('existing')
    }

    if (requestRole === 'volunteer' || requestRole === 'photographer' || requestRole === 'livestream_operator') {
      if (teamRequestType === 'new') {
        setTeamRequestType('none')
        setNewTeamName('')
        setNewTeamShortName('')
      }
    }
  }, [requestRole, teamRequestType])

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
    setProfile(prev => prev ? { ...prev, full_name: name.trim() || null } : prev)
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

  function validateRequestForm() {
    if (requestRole === 'supporter' && !selectedTeamId) {
      return 'Please pick the team you want to support.'
    }

    if ((requestRole === 'coach' || requestRole === 'team_admin') && teamRequestType === 'none') {
      return 'Please choose an existing team or request a new one.'
    }

    if (teamRequestType === 'existing' && !selectedTeamId) {
      return 'Please choose a team.'
    }

    if (teamRequestType === 'new') {
      if (!newTeamName.trim()) return 'Please enter a new team name.'
      if (!newTeamShortName.trim()) return 'Please enter a short team name.'
    }

    return ''
  }

  async function handleAccessRequestSave() {
    if (!profile) return

    const validationError = validateRequestForm()
    if (validationError) {
      setRequestMessage(validationError)
      return
    }

    setRequestSaving(true)
    setRequestMessage('')
    const supabase = createClient()

    if (requestRole === 'supporter') {
      const { error: updateError } = await (supabase as any)
        .from('profiles')
        .update({ team_id: selectedTeamId || null })
        .eq('id', profile.id)

      if (updateError) {
        setRequestMessage(updateError.message)
      } else {
        if (request) {
          await (supabase as any).from('access_requests').delete().eq('id', request.id)
        }
        const selectedTeam = teams.find(team => team.id === selectedTeamId) ?? null
        setProfile(prev => prev ? {
          ...prev,
          team_id: selectedTeamId || null,
          team_name: selectedTeam?.name ?? null,
          team_short_name: selectedTeam?.short_name ?? null,
        } : prev)
        setRequest(null)
        setRequestMessage('Supporter team saved.')
      }

      setRequestSaving(false)
      return
    }

    const payload = {
      user_id: profile.id,
      requested_role: requestRole,
      requested_team_id: teamRequestType === 'existing' ? selectedTeamId : null,
      requested_team_name: teamRequestType === 'new' ? newTeamName.trim() : null,
      requested_team_short_name: teamRequestType === 'new' ? newTeamShortName.trim() : null,
      status: 'pending' as const,
      admin_notes: null,
    }

    const { data, error: upsertError } = await (supabase as any)
      .from('access_requests')
      .upsert(payload, { onConflict: 'user_id' })
      .select('id, requested_role, requested_team_id, requested_team_name, requested_team_short_name, status, admin_notes')
      .single()

    if (upsertError) {
      setRequestMessage(upsertError.message)
    } else {
      setRequest(data as AccessRequest)
      setRequestMessage('Request submitted for admin review.')
    }

    setRequestSaving(false)
  }

  async function handleAddPlayer() {
    if (!profile?.team_id || !playerName.trim()) return

    setPlayerSaving(true)
    const supabase = createClient()
    const { data, error: insertError } = await (supabase as any)
      .from('players')
      .insert({
        team_id: profile.team_id,
        full_name: playerName.trim(),
        position: playerPosition.trim() || null,
        jersey_number: playerNumber ? Number(playerNumber) : null,
      })
      .select('id, full_name, position, jersey_number, is_active')
      .single()

    if (!insertError && data) {
      setPlayers(prev => [...prev, data as PlayerRow].sort((a, b) => {
        const left = a.jersey_number ?? Number.MAX_SAFE_INTEGER
        const right = b.jersey_number ?? Number.MAX_SAFE_INTEGER
        if (left !== right) return left - right
        return a.full_name.localeCompare(b.full_name)
      }))
      setPlayerName('')
      setPlayerPosition('')
      setPlayerNumber('')
    }

    if (insertError) {
      setRequestMessage(insertError.message)
    }

    setPlayerSaving(false)
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
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const isAdmin = profile.role === 'super_admin' || profile.role === 'team_admin'
  const canManagePlayers = !!profile.team_id && ['coach', 'team_admin', 'super_admin'].includes(profile.role)

  return (
    <main className="min-h-screen bg-bg-base">
      <div className="container-cesp py-12 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-brand-primary/20 border border-brand-primary/25 flex items-center justify-center text-xl font-bold text-brand-primary shrink-0">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                {profile.full_name ?? 'Your Profile'}
              </h1>
              <p className="text-sm text-text-muted">{profile.email}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-xs font-semibold ${roleInfo.colour}`}>
                  <Shield size={10} />
                  {roleInfo.label}
                </span>
                {profile.team_name && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border border-brand-primary/20 bg-brand-primary/10 text-xs font-semibold text-brand-secondary">
                    <Users size={10} />
                    {profile.team_name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {saved && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm mb-6"
            >
              <CheckCircle size={16} />
              Profile saved successfully.
            </motion.div>
          )}

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
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-bg-muted flex items-center justify-center shrink-0">
                  <Mail size={15} className="text-text-muted" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Email</p>
                  <p className="text-sm font-medium text-text-primary">{profile.email}</p>
                </div>
              </div>

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

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-bg-muted flex items-center justify-center shrink-0">
                  <Shield size={15} className="text-text-muted" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Role</p>
                  <p className={`text-sm font-semibold ${roleInfo.colour.split(' ').find(token => token.startsWith('text-'))}`}>
                    {roleInfo.label}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-bg-muted flex items-center justify-center shrink-0">
                  <Users size={15} className="text-text-muted" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Team</p>
                  <p className="text-sm font-medium text-text-primary">
                    {profile.team_name ?? <span className="text-text-muted italic">No team linked yet</span>}
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

          <div className="card mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest">Role & team request</h2>
                <p className="text-sm text-text-secondary mt-2">
                  Request a reviewed role, attach yourself to a team as a supporter, or ask to create a new team.
                </p>
              </div>
              {request && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${
                  request.status === 'approved'
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : request.status === 'rejected'
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {request.status}
                </span>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {REQUEST_ROLE_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRequestRole(option.value)}
                  className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                    requestRole === option.value
                      ? 'border-brand-primary bg-brand-primary/10'
                      : 'border-bg-border bg-bg-muted hover:border-brand-primary/30'
                  }`}
                >
                  <p className="text-sm font-semibold text-text-primary">{option.label}</p>
                  <p className="mt-1 text-xs leading-5 text-text-muted">{option.desc}</p>
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-4 rounded-2xl border border-bg-border bg-bg-muted/40 p-4">
              {(requestRole === 'supporter' || requestRole === 'coach' || requestRole === 'team_admin') && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setTeamRequestType('existing')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      teamRequestType === 'existing'
                        ? 'bg-brand-primary text-white border-brand-primary'
                        : 'bg-bg-card border-bg-border text-text-secondary'
                    }`}
                  >
                    Choose existing team
                  </button>
                  {(requestRole === 'coach' || requestRole === 'team_admin') && (
                    <button
                      type="button"
                      onClick={() => setTeamRequestType('new')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                        teamRequestType === 'new'
                          ? 'bg-brand-primary text-white border-brand-primary'
                          : 'bg-bg-card border-bg-border text-text-secondary'
                      }`}
                    >
                      Request a new team
                    </button>
                  )}
                  {requestRole !== 'supporter' && (
                    <button
                      type="button"
                      onClick={() => setTeamRequestType('none')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                        teamRequestType === 'none'
                          ? 'bg-brand-primary text-white border-brand-primary'
                          : 'bg-bg-card border-bg-border text-text-secondary'
                      }`}
                    >
                      No team yet
                    </button>
                  )}
                </div>
              )}

              {teamRequestType === 'existing' && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-text-secondary">Existing team</label>
                  <select
                    value={selectedTeamId}
                    onChange={e => setSelectedTeamId(e.target.value)}
                    className="input"
                  >
                    <option value="">Select a team</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name} ({team.short_name})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {teamRequestType === 'new' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-text-secondary">New team name</label>
                    <input
                      type="text"
                      value={newTeamName}
                      onChange={e => setNewTeamName(e.target.value)}
                      placeholder="Clarendon Rangers"
                      className="input"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-text-secondary">Short name</label>
                    <input
                      type="text"
                      value={newTeamShortName}
                      onChange={e => setNewTeamShortName(e.target.value.toUpperCase())}
                      placeholder="CR"
                      className="input"
                      maxLength={12}
                    />
                  </div>
                </div>
              )}

              {request?.admin_notes && (
                <div className="rounded-xl border border-bg-border bg-bg-card px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Admin note</p>
                  <p className="mt-2 text-sm text-text-secondary">{request.admin_notes}</p>
                </div>
              )}

              {requestMessage && (
                <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/10 px-4 py-3 text-sm text-brand-secondary">
                  {requestMessage}
                </div>
              )}

              <button
                onClick={handleAccessRequestSave}
                disabled={requestSaving}
                className="btn-primary"
              >
                {requestSaving ? 'Saving...' : requestRole === 'supporter' ? 'Save team preference' : 'Submit request for review'}
              </button>
            </div>
          </div>

          {canManagePlayers && (
            <div className="card mb-4">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest">Team roster</h2>
                  <p className="text-sm text-text-secondary mt-2">
                    Add players for {profile.team_name}. Coaches and team admins can manage their assigned squad here.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr_0.6fr_auto]">
                <input
                  type="text"
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  placeholder="Player name"
                  className="input"
                />
                <input
                  type="text"
                  value={playerPosition}
                  onChange={e => setPlayerPosition(e.target.value)}
                  placeholder="Position"
                  className="input"
                />
                <input
                  type="number"
                  value={playerNumber}
                  onChange={e => setPlayerNumber(e.target.value)}
                  placeholder="No."
                  className="input"
                />
                <button
                  onClick={handleAddPlayer}
                  disabled={playerSaving || !playerName.trim()}
                  className="btn-primary px-4"
                >
                  <PlusCircle size={15} />
                  {playerSaving ? 'Adding...' : 'Add'}
                </button>
              </div>

              <div className="mt-5 space-y-2">
                {players.length === 0 ? (
                  <div className="rounded-xl border border-bg-border bg-bg-muted/40 px-4 py-5 text-sm text-text-muted">
                    No players added yet.
                  </div>
                ) : (
                  players.map(player => (
                    <div key={player.id} className="flex items-center justify-between gap-4 rounded-xl border border-bg-border bg-bg-muted/40 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{player.full_name}</p>
                        <p className="text-xs text-text-muted">
                          {player.position ?? 'Position TBC'}{player.jersey_number ? ` • #${player.jersey_number}` : ''}
                        </p>
                      </div>
                      <span className={`text-xs font-medium ${player.is_active ? 'text-green-400' : 'text-text-muted'}`}>
                        {player.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

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
                    <p className="text-xs text-text-muted">Manage users, requests, matches, and news</p>
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
