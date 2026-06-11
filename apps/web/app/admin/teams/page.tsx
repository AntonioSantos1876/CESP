'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, ChevronDown, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { TeamLogo } from '@/components/TeamLogo'

type UserRole = 'super_admin' | 'coach' | 'team_admin' | 'photographer'
type LeadershipRole = 'captain' | 'vice_captain' | null
type LeadershipValue = '' | 'captain' | 'vice_captain'

type Team = {
  id: string
  name: string
  short_name: string
}

type Player = {
  id: string
  team_id: string
  full_name: string
  position: string | null
  jersey_number: number | null
  is_active: boolean
  leadership_role: LeadershipRole
  is_starter: boolean
  photo_url: string | null
}

type EditState = {
  full_name: string
  position: string
  jersey_number: string
  is_active: boolean
  leadership_role: LeadershipValue
  is_starter: boolean
}

const POSITION_SUGGESTIONS = [
  'GK',
  'CB',
  'RB',
  'LB',
  'RWB',
  'LWB',
  'CDM',
  'CM',
  'CAM',
  'RM',
  'LM',
  'RW',
  'LW',
  'CF',
  'ST',
  'CB / CDM',
  'RB / RWB',
  'LB / LWB',
  'RWB / CB',
  'LWB / LW',
  'LW / LWB / ST',
  'CDM / CM',
  'CAM / RW',
  'CM / CAM',
  'CM / RWB',
  'RWB / RW',
  'LW / LWB',
  'CDM / CB',
]

const LEADERSHIP_OPTIONS = [
  { value: '', label: 'No leadership role' },
  { value: 'captain', label: 'Captain' },
  { value: 'vice_captain', label: 'Vice captain' },
] as const

const BLANK_EDIT: EditState = {
  full_name: '',
  position: '',
  jersey_number: '',
  is_active: true,
  leadership_role: '',
  is_starter: false,
}

function sortPlayers(list: Player[]) {
  return [...list].sort((left, right) => {
    if (left.is_starter !== right.is_starter) return left.is_starter ? -1 : 1
    const leftNumber = left.jersey_number ?? 999
    const rightNumber = right.jersey_number ?? 999
    if (leftNumber !== rightNumber) return leftNumber - rightNumber
    return left.full_name.localeCompare(right.full_name)
  })
}

function formatLeadership(role: LeadershipRole) {
  if (role === 'captain') return 'Captain'
  if (role === 'vice_captain') return 'Vice captain'
  return 'None'
}

export default function AdminTeamsPage() {
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [playersLoading, setPlayersLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>(BLANK_EDIT)
  const [adding, setAdding] = useState(false)
  const [newPlayer, setNewPlayer] = useState<EditState>(BLANK_EDIT)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploadingPhotoId, setUploadingPhotoId] = useState<string | null>(null)

  const selectedTeam = teams.find(team => team.id === selectedTeamId) ?? null
  const starterCount = players.filter(player => player.is_starter).length
  const viceCaptainCount = players.filter(player => player.leadership_role === 'vice_captain').length
  const captain = players.find(player => player.leadership_role === 'captain') ?? null

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('role, team_id')
        .eq('id', user.id)
        .single()

      if (!profile) return

      const role = profile.role as UserRole
      setUserRole(role)

      if (role === 'super_admin') {
        const { data: teamsData } = await (supabase as any)
          .from('teams')
          .select('id, name, short_name')
          .order('name', { ascending: true })
        setTeams((teamsData ?? []) as Team[])
      } else if (profile.team_id) {
        const { data: teamRow } = await (supabase as any)
          .from('teams')
          .select('id, name, short_name')
          .eq('id', profile.team_id)
          .single()

        if (teamRow) {
          setTeams([teamRow as Team])
          setSelectedTeamId(teamRow.id)
        }
      }

      setLoading(false)
    }

    load()
  }, [])

  useEffect(() => {
    if (!selectedTeamId) {
      setPlayers([])
      return
    }

    loadPlayers(selectedTeamId)
  }, [selectedTeamId])

  async function loadPlayers(teamId: string) {
    setPlayersLoading(true)
    const supabase = createClient()
    const { data } = await (supabase as any)
      .from('players')
      .select('id, team_id, full_name, position, jersey_number, is_active, leadership_role, is_starter, photo_url')
      .eq('team_id', teamId)
      .order('jersey_number', { ascending: true, nullsFirst: false })
      .order('full_name', { ascending: true })

    setPlayers(sortPlayers((data ?? []) as Player[]))
    setPlayersLoading(false)
  }

  function startEdit(player: Player) {
    setEditingId(player.id)
    setEditState({
      full_name: player.full_name,
      position: player.position ?? '',
      jersey_number: player.jersey_number?.toString() ?? '',
      is_active: player.is_active,
      leadership_role: player.leadership_role ?? '',
      is_starter: player.is_starter,
    })
    setError('')
    setAdding(false)
  }

  function validateLeadership(role: LeadershipValue, playerId?: string) {
    if (role === 'vice_captain') {
      const viceCaptains = players.filter(player => player.leadership_role === 'vice_captain' && player.id !== playerId)
      if (viceCaptains.length >= 3) {
        return 'This team already has three vice captains.'
      }
    }

    return ''
  }

  async function clearExistingCaptain(playerId?: string) {
    const currentCaptain = players.find(player => player.leadership_role === 'captain' && player.id !== playerId)
    if (!currentCaptain) return ''

    const supabase = createClient()
    const { error: clearError } = await (supabase as any)
      .from('players')
      .update({ leadership_role: null })
      .eq('id', currentCaptain.id)

    return clearError?.message ?? ''
  }

  function validateStarter(nextIsStarter: boolean, playerId?: string, nextIsActive = true) {
    if (!nextIsStarter) return ''
    if (!nextIsActive) return 'Only active players can be selected in the starting lineup.'

    const otherStarters = players.filter(player => player.is_starter && player.id !== playerId)
    if (otherStarters.length >= 11) {
      return 'The starting lineup already has 11 players.'
    }

    return ''
  }

  async function saveEdit(playerId: string) {
    if (!editState.full_name.trim()) {
      setError('Name is required')
      return
    }

    const leadershipError = validateLeadership(editState.leadership_role, playerId)
    if (leadershipError) {
      setError(leadershipError)
      return
    }

    const starterError = validateStarter(editState.is_starter, playerId, editState.is_active)
    if (starterError) {
      setError(starterError)
      return
    }

    setSaving(true)
    const supabase = createClient()

    if (editState.leadership_role === 'captain') {
      const clearCaptainError = await clearExistingCaptain(playerId)
      if (clearCaptainError) {
        setError(clearCaptainError)
        setSaving(false)
        return
      }
    }

    const { error: err } = await (supabase as any)
      .from('players')
      .update({
        full_name: editState.full_name.trim(),
        position: editState.position.trim() || null,
        jersey_number: editState.jersey_number ? parseInt(editState.jersey_number, 10) : null,
        is_active: editState.is_active,
        leadership_role: editState.leadership_role || null,
        is_starter: editState.is_active ? editState.is_starter : false,
      })
      .eq('id', playerId)

    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }

    setEditingId(null)
    setSaving(false)
    if (selectedTeamId) await loadPlayers(selectedTeamId)
  }

  async function deletePlayer(playerId: string) {
    if (!confirm('Remove this player from the squad?')) return

    const supabase = createClient()
    await (supabase as any).from('players').delete().eq('id', playerId)

    if (selectedTeamId) await loadPlayers(selectedTeamId)
  }

  async function addPlayer() {
    if (!newPlayer.full_name.trim()) {
      setError('Name is required')
      return
    }

    if (!selectedTeamId) return

    const leadershipError = validateLeadership(newPlayer.leadership_role)
    if (leadershipError) {
      setError(leadershipError)
      return
    }

    const starterError = validateStarter(newPlayer.is_starter, undefined, newPlayer.is_active)
    if (starterError) {
      setError(starterError)
      return
    }

    setSaving(true)
    const supabase = createClient()

    if (newPlayer.leadership_role === 'captain') {
      const clearCaptainError = await clearExistingCaptain()
      if (clearCaptainError) {
        setError(clearCaptainError)
        setSaving(false)
        return
      }
    }

    const { error: err } = await (supabase as any)
      .from('players')
      .insert({
        team_id: selectedTeamId,
        full_name: newPlayer.full_name.trim(),
        position: newPlayer.position.trim() || null,
        jersey_number: newPlayer.jersey_number ? parseInt(newPlayer.jersey_number, 10) : null,
        is_active: newPlayer.is_active,
        leadership_role: newPlayer.leadership_role || null,
        is_starter: newPlayer.is_active ? newPlayer.is_starter : false,
      })

    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }

    setAdding(false)
    setNewPlayer(BLANK_EDIT)
    setSaving(false)
    await loadPlayers(selectedTeamId)
  }

  async function updateLeadershipRole(player: Player, nextRole: LeadershipValue) {
    setError('')

    if (nextRole === 'vice_captain') {
      const leadershipError = validateLeadership(nextRole, player.id)
      if (leadershipError) {
        setError(leadershipError)
        return
      }
    }

    setSaving(true)

    if (nextRole === 'captain') {
      const clearCaptainError = await clearExistingCaptain(player.id)
      if (clearCaptainError) {
        setError(clearCaptainError)
        setSaving(false)
        return
      }
    }

    const supabase = createClient()
    const { error: err } = await (supabase as any)
      .from('players')
      .update({ leadership_role: nextRole || null })
      .eq('id', player.id)

    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }

    setSaving(false)
    if (selectedTeamId) await loadPlayers(selectedTeamId)
  }

  async function toggleStarter(player: Player) {
    setError('')

    const nextStarter = !player.is_starter
    const starterError = validateStarter(nextStarter, player.id, player.is_active)
    if (starterError) {
      setError(starterError)
      return
    }

    setSaving(true)
    const supabase = createClient()
    const { error: err } = await (supabase as any)
      .from('players')
      .update({ is_starter: nextStarter })
      .eq('id', player.id)

    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }

    setSaving(false)
    if (selectedTeamId) await loadPlayers(selectedTeamId)
  }

  async function uploadPhoto(playerId: string, file: File) {
    setUploadingPhotoId(playerId)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('player_id', playerId)

    const res = await fetch('/api/player-photo', { method: 'POST', body: formData })
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Upload failed' }))
      setError(body.error ?? 'Upload failed')
    } else {
      if (selectedTeamId) await loadPlayers(selectedTeamId)
    }
    setUploadingPhotoId(null)
  }

  const starterNames = useMemo(
    () => players.filter(player => player.is_starter).map(player => player.full_name),
    [players]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="mb-1 text-2xl font-bold text-text-primary">Team Sheet Management</h1>
        <p className="text-sm text-text-muted">
          Build the team list first, then choose the captain, up to three vice captains, and the starting XI from that roster.
        </p>
      </div>

      {userRole === 'super_admin' && (
        <div className="mb-6">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-muted">Select Team</label>
          <div className="relative w-72">
            <select
              value={selectedTeamId ?? ''}
              onChange={event => {
                setSelectedTeamId(event.target.value || null)
                setEditingId(null)
                setAdding(false)
                setError('')
              }}
              className="w-full appearance-none rounded-xl border border-[#333] bg-[#111] px-4 py-2.5 pr-10 text-sm text-text-primary focus:border-brand-primary focus:outline-none"
            >
              <option value="">Choose a team...</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
          </div>
        </div>
      )}

      {!selectedTeamId ? (
        <div className="card py-16 text-center text-sm text-text-muted">
          {userRole === 'super_admin'
            ? 'Select a team above to manage its roster and team sheet.'
            : 'You are not assigned to a team yet. Ask a super admin to assign you.'}
        </div>
      ) : (
        <div className="card">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-3">
              {selectedTeam && <TeamLogo teamName={selectedTeam.name} size={36} />}
              <div>
                <h2 className="font-bold text-text-primary">{selectedTeam?.name ?? 'Your Team'}</h2>
                <p className="text-xs text-text-muted">
                  {players.length} player{players.length !== 1 ? 's' : ''} in roster
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-text-secondary">
                Starters: {starterCount}/11
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-text-secondary">
                Captain: {captain?.full_name ?? 'Not set'}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-text-secondary">
                Vice captains: {viceCaptainCount}/3
              </span>
              <button
                onClick={() => {
                  setAdding(true)
                  setEditingId(null)
                  setError('')
                }}
                disabled={adding}
                className="flex items-center gap-2 rounded-xl bg-brand-primary/10 px-4 py-2 text-sm font-medium text-brand-secondary transition-colors hover:bg-brand-primary/20 disabled:opacity-50"
              >
                <Plus size={15} />
                Add player
              </button>
            </div>
          </div>

          {starterNames.length > 0 && (
            <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Starting XI</p>
              <p className="text-sm leading-6 text-text-secondary">{starterNames.join(', ')}</p>
            </div>
          )}

          {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

          {adding && (
            <div className="mb-5 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">New player</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
                <input
                  className="sm:col-span-2 rounded-lg border border-[#333] bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-[#555] focus:border-brand-primary focus:outline-none"
                  placeholder="Full name *"
                  value={newPlayer.full_name}
                  onChange={event => setNewPlayer(state => ({ ...state, full_name: event.target.value }))}
                  onKeyDown={event => event.key === 'Enter' && addPlayer()}
                />
                <input
                  className="rounded-lg border border-[#333] bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-[#555] focus:border-brand-primary focus:outline-none"
                  placeholder="# Jersey"
                  type="number"
                  min={1}
                  max={99}
                  value={newPlayer.jersey_number}
                  onChange={event => setNewPlayer(state => ({ ...state, jersey_number: event.target.value }))}
                />
                <input
                  className="sm:col-span-2 rounded-lg border border-[#333] bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-[#555] focus:border-brand-primary focus:outline-none"
                  placeholder="Position"
                  list="team-position-suggestions"
                  value={newPlayer.position}
                  onChange={event => setNewPlayer(state => ({ ...state, position: event.target.value }))}
                />
                <select
                  className="rounded-lg border border-[#333] bg-bg-base px-3 py-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none"
                  value={newPlayer.leadership_role}
                  onChange={event => setNewPlayer(state => ({ ...state, leadership_role: event.target.value as LeadershipValue }))}
                >
                  {LEADERSHIP_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    checked={newPlayer.is_active}
                    onChange={event =>
                      setNewPlayer(state => ({
                        ...state,
                        is_active: event.target.checked,
                        is_starter: event.target.checked ? state.is_starter : false,
                      }))
                    }
                  />
                  Active in squad
                </label>
                <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    checked={newPlayer.is_starter}
                    onChange={event => setNewPlayer(state => ({ ...state, is_starter: event.target.checked }))}
                    disabled={!newPlayer.is_active}
                  />
                  Include in starting XI
                </label>
                <div className="flex-1" />
                <button
                  onClick={() => {
                    setAdding(false)
                    setNewPlayer(BLANK_EDIT)
                    setError('')
                  }}
                  className="px-3 py-1.5 text-sm text-text-muted transition-colors hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  onClick={addPlayer}
                  disabled={saving}
                  className="rounded-lg bg-brand-primary px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Add'}
                </button>
              </div>
            </div>
          )}

          {playersLoading ? (
            <div className="py-10 text-center text-sm text-text-muted">Loading roster...</div>
          ) : players.length === 0 ? (
            <div className="py-10 text-center text-sm text-text-muted">No players in this squad yet. Add the team list first, then pick the lineup from it.</div>
          ) : (
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e1e1e]">
                    <th className="w-16 px-5 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-text-muted">#</th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-text-muted">Name</th>
                    <th className="w-44 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-text-muted">Position</th>
                    <th className="w-40 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-text-muted">Leadership</th>
                    <th className="w-28 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-text-muted">Lineup</th>
                    <th className="w-20 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-text-muted">Status</th>
                    <th className="w-20 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-text-muted">Photo</th>
                    <th className="w-20" />
                  </tr>
                </thead>
                <tbody>
                  {players.map(player => (
                    editingId === player.id ? (
                      <tr key={player.id} className="border-b border-[#1e1e1e] bg-[#141414]">
                        <td className="px-5 py-2">
                          <input
                            className="w-14 rounded border border-[#444] bg-bg-base px-2 py-1 text-sm text-text-primary focus:border-brand-primary focus:outline-none"
                            type="number"
                            min={1}
                            max={99}
                            placeholder="#"
                            value={editState.jersey_number}
                            onChange={event => setEditState(state => ({ ...state, jersey_number: event.target.value }))}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            className="w-full rounded border border-[#444] bg-bg-base px-2 py-1 text-sm text-text-primary focus:border-brand-primary focus:outline-none"
                            value={editState.full_name}
                            onChange={event => setEditState(state => ({ ...state, full_name: event.target.value }))}
                            onKeyDown={event => event.key === 'Enter' && saveEdit(player.id)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            className="w-full rounded border border-[#444] bg-bg-base px-2 py-1 text-sm text-text-primary focus:border-brand-primary focus:outline-none"
                            list="team-position-suggestions"
                            value={editState.position}
                            onChange={event => setEditState(state => ({ ...state, position: event.target.value }))}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            className="w-full rounded border border-[#444] bg-bg-base px-2 py-1 text-sm text-text-primary focus:border-brand-primary focus:outline-none"
                            value={editState.leadership_role}
                            onChange={event => setEditState(state => ({ ...state, leadership_role: event.target.value as LeadershipValue }))}
                          >
                            {LEADERSHIP_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <label className="flex cursor-pointer select-none items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editState.is_starter}
                              disabled={!editState.is_active}
                              onChange={event => setEditState(state => ({ ...state, is_starter: event.target.checked }))}
                            />
                            <span className="text-xs text-text-muted">Starter</span>
                          </label>
                        </td>
                        <td className="px-3 py-2">
                          <label className="flex cursor-pointer select-none items-center gap-1.5">
                            <input
                              type="checkbox"
                              checked={editState.is_active}
                              onChange={event =>
                                setEditState(state => ({
                                  ...state,
                                  is_active: event.target.checked,
                                  is_starter: event.target.checked ? state.is_starter : false,
                                }))
                              }
                            />
                            <span className="text-xs text-text-muted">Active</span>
                          </label>
                        </td>
                        <td className="px-3 py-2" />
                        <td className="px-5 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => saveEdit(player.id)}
                              disabled={saving}
                              className="rounded-lg p-1.5 text-green-400 transition-colors hover:bg-green-400/10 disabled:opacity-50"
                              title="Save"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null)
                                setError('')
                              }}
                              className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-bg-muted"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={player.id} className="group border-b border-[#1e1e1e] transition-colors hover:bg-[#141414]">
                        <td className="px-5 py-3 font-mono text-sm text-text-muted">
                          {player.jersey_number ?? <span className="text-[#444]">--</span>}
                        </td>
                        <td className="px-3 py-3">
                          <div className="min-w-0">
                            <p className="font-medium text-text-primary">{player.full_name}</p>
                            {(player.leadership_role || player.is_starter) && (
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {player.leadership_role && (
                                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-secondary">
                                    {formatLeadership(player.leadership_role)}
                                  </span>
                                )}
                                {player.is_starter && (
                                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                                    Starting XI
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          {player.position ? (
                            <span className="text-text-secondary">{player.position}</span>
                          ) : (
                            <span className="text-xs italic text-[#555]">Position pending</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <select
                            className="w-full rounded-lg border border-[#333] bg-bg-base px-2 py-1.5 text-sm text-text-primary focus:border-brand-primary focus:outline-none"
                            value={player.leadership_role ?? ''}
                            onChange={event => updateLeadershipRole(player, event.target.value as LeadershipValue)}
                            disabled={saving}
                          >
                            {LEADERSHIP_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3">
                          <button
                            onClick={() => toggleStarter(player)}
                            disabled={saving || !player.is_active}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                              player.is_starter
                                ? 'bg-emerald-500/12 text-emerald-300 hover:bg-emerald-500/18'
                                : 'bg-white/[0.04] text-text-muted hover:bg-white/[0.08] hover:text-text-primary'
                            }`}
                          >
                            {player.is_starter ? 'Starting XI' : 'Bench'}
                          </button>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`text-xs font-medium ${player.is_active ? 'text-green-400' : 'text-[#555]'}`}>
                            {player.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <label className="relative block h-9 w-9 cursor-pointer" title="Upload player photo">
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              disabled={uploadingPhotoId === player.id}
                              onChange={e => {
                                const file = e.target.files?.[0]
                                if (file) uploadPhoto(player.id, file)
                                e.target.value = ''
                              }}
                            />
                            {player.photo_url ? (
                              <img
                                src={player.photo_url}
                                alt={player.full_name}
                                className="h-9 w-9 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-9 w-9 rounded-full bg-[#1e1e1e] flex items-center justify-center text-xs font-bold text-text-muted">
                                {player.full_name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity hover:opacity-100">
                              {uploadingPhotoId === player.id ? (
                                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              ) : (
                                <Camera size={13} className="text-white" />
                              )}
                            </div>
                          </label>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={() => startEdit(player)}
                              className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-bg-muted hover:text-text-primary"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => deletePlayer(player.id)}
                              className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-red-400/10 hover:text-red-400"
                              title="Remove"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <datalist id="team-position-suggestions">
        {POSITION_SUGGESTIONS.map(position => (
          <option key={position} value={position} />
        ))}
      </datalist>
    </div>
  )
}
