'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { TeamLogo } from '@/components/TeamLogo'

type UserRole = 'super_admin' | 'coach' | 'team_admin'

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
}

type EditState = {
  full_name: string
  position: string
  jersey_number: string
  is_active: boolean
}

const POSITIONS = [
  { value: '', label: 'Position pending' },
  { value: 'GK', label: 'GK - Goalkeeper' },
  { value: 'DEF', label: 'DEF - Defender' },
  { value: 'MID', label: 'MID - Midfielder' },
  { value: 'FWD', label: 'FWD - Forward' },
]

const BLANK_EDIT: EditState = { full_name: '', position: '', jersey_number: '', is_active: true }

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
    if (!selectedTeamId) { setPlayers([]); return }
    loadPlayers(selectedTeamId)
  }, [selectedTeamId])

  async function loadPlayers(teamId: string) {
    setPlayersLoading(true)
    const supabase = createClient()
    const { data } = await (supabase as any)
      .from('players')
      .select('id, team_id, full_name, position, jersey_number, is_active')
      .eq('team_id', teamId)
      .order('jersey_number', { ascending: true, nullsFirst: false })
    setPlayers((data ?? []) as Player[])
    setPlayersLoading(false)
  }

  function startEdit(player: Player) {
    setEditingId(player.id)
    setEditState({
      full_name: player.full_name,
      position: player.position ?? '',
      jersey_number: player.jersey_number?.toString() ?? '',
      is_active: player.is_active,
    })
    setError('')
    setAdding(false)
  }

  async function saveEdit(playerId: string) {
    if (!editState.full_name.trim()) { setError('Name is required'); return }
    setSaving(true)
    const supabase = createClient()
    const { error: err } = await (supabase as any)
      .from('players')
      .update({
        full_name: editState.full_name.trim(),
        position: editState.position || null,
        jersey_number: editState.jersey_number ? parseInt(editState.jersey_number, 10) : null,
        is_active: editState.is_active,
      })
      .eq('id', playerId)

    if (err) { setError(err.message); setSaving(false); return }
    setEditingId(null)
    setSaving(false)
    if (selectedTeamId) loadPlayers(selectedTeamId)
  }

  async function deletePlayer(playerId: string) {
    if (!confirm('Remove this player from the squad?')) return
    const supabase = createClient()
    await (supabase as any).from('players').delete().eq('id', playerId)
    if (selectedTeamId) loadPlayers(selectedTeamId)
  }

  async function addPlayer() {
    if (!newPlayer.full_name.trim()) { setError('Name is required'); return }
    if (!selectedTeamId) return
    setSaving(true)
    const supabase = createClient()
    const { error: err } = await (supabase as any)
      .from('players')
      .insert({
        team_id: selectedTeamId,
        full_name: newPlayer.full_name.trim(),
        position: newPlayer.position || null,
        jersey_number: newPlayer.jersey_number ? parseInt(newPlayer.jersey_number, 10) : null,
        is_active: newPlayer.is_active,
      })

    if (err) { setError(err.message); setSaving(false); return }
    setAdding(false)
    setNewPlayer(BLANK_EDIT)
    setSaving(false)
    loadPlayers(selectedTeamId)
  }

  const selectedTeam = teams.find(t => t.id === selectedTeamId) ?? null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Squad Management</h1>
        <p className="text-text-muted text-sm">Edit player names, positions, and jersey numbers.</p>
      </div>

      {userRole === 'super_admin' && (
        <div className="mb-6">
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Select Team</label>
          <div className="relative w-72">
            <select
              value={selectedTeamId ?? ''}
              onChange={e => { setSelectedTeamId(e.target.value || null); setEditingId(null); setAdding(false); setError('') }}
              className="w-full appearance-none bg-[#111] border border-[#333] text-text-primary rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-brand-primary"
            >
              <option value="">Choose a team...</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
        </div>
      )}

      {!selectedTeamId ? (
        <div className="card py-16 text-center text-text-muted text-sm">
          {userRole === 'super_admin'
            ? 'Select a team above to manage its squad.'
            : 'You are not assigned to a team yet. Ask a super admin to assign you.'}
        </div>
      ) : (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {selectedTeam && <TeamLogo teamName={selectedTeam.name} size={36} />}
              <div>
                <h2 className="font-bold text-text-primary">{selectedTeam?.name ?? 'Your Team'}</h2>
                <p className="text-xs text-text-muted">{players.length} player{players.length !== 1 ? 's' : ''} in squad</p>
              </div>
            </div>
            <button
              onClick={() => { setAdding(true); setEditingId(null); setError('') }}
              disabled={adding}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary/10 text-brand-secondary hover:bg-brand-primary/20 transition-colors text-sm font-medium disabled:opacity-50"
            >
              <Plus size={15} />
              Add player
            </button>
          </div>

          {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

          {adding && (
            <div className="mb-5 p-4 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-3">New player</p>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  className="sm:col-span-2 bg-bg-base border border-[#333] text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary placeholder:text-[#555]"
                  placeholder="Full name *"
                  value={newPlayer.full_name}
                  onChange={e => setNewPlayer(s => ({ ...s, full_name: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addPlayer()}
                />
                <input
                  className="bg-bg-base border border-[#333] text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary placeholder:text-[#555]"
                  placeholder="# Jersey"
                  type="number"
                  min={1}
                  max={99}
                  value={newPlayer.jersey_number}
                  onChange={e => setNewPlayer(s => ({ ...s, jersey_number: e.target.value }))}
                />
                <select
                  className="bg-bg-base border border-[#333] text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary"
                  value={newPlayer.position}
                  onChange={e => setNewPlayer(s => ({ ...s, position: e.target.value }))}
                >
                  {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newPlayer.is_active}
                    onChange={e => setNewPlayer(s => ({ ...s, is_active: e.target.checked }))}
                  />
                  Active in squad
                </label>
                <div className="flex-1" />
                <button
                  onClick={() => { setAdding(false); setNewPlayer(BLANK_EDIT); setError('') }}
                  className="px-3 py-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addPlayer}
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Add'}
                </button>
              </div>
            </div>
          )}

          {playersLoading ? (
            <div className="py-10 text-center text-text-muted text-sm">Loading squad...</div>
          ) : players.length === 0 ? (
            <div className="py-10 text-center text-text-muted text-sm">No players in this squad yet. Add the first one above.</div>
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e1e1e]">
                    <th className="text-left py-2 px-5 text-[10px] font-semibold text-text-muted uppercase tracking-wider w-16">#</th>
                    <th className="text-left py-2 px-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Name</th>
                    <th className="text-left py-2 px-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider w-44">Position</th>
                    <th className="text-left py-2 px-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider w-20">Status</th>
                    <th className="w-20" />
                  </tr>
                </thead>
                <tbody>
                  {players.map(player => (
                    editingId === player.id ? (
                      <tr key={player.id} className="border-b border-[#1e1e1e] bg-[#141414]">
                        <td className="py-2 px-5">
                          <input
                            className="w-14 bg-bg-base border border-[#444] text-text-primary rounded px-2 py-1 text-sm focus:outline-none focus:border-brand-primary"
                            type="number"
                            min={1}
                            max={99}
                            placeholder="#"
                            value={editState.jersey_number}
                            onChange={e => setEditState(s => ({ ...s, jersey_number: e.target.value }))}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            className="w-full bg-bg-base border border-[#444] text-text-primary rounded px-2 py-1 text-sm focus:outline-none focus:border-brand-primary"
                            value={editState.full_name}
                            onChange={e => setEditState(s => ({ ...s, full_name: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && saveEdit(player.id)}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <select
                            className="w-full bg-bg-base border border-[#444] text-text-primary rounded px-2 py-1 text-sm focus:outline-none focus:border-brand-primary"
                            value={editState.position}
                            onChange={e => setEditState(s => ({ ...s, position: e.target.value }))}
                          >
                            {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={editState.is_active}
                              onChange={e => setEditState(s => ({ ...s, is_active: e.target.checked }))}
                            />
                            <span className="text-xs text-text-muted">Active</span>
                          </label>
                        </td>
                        <td className="py-2 px-5">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => saveEdit(player.id)}
                              disabled={saving}
                              className="p-1.5 rounded-lg text-green-400 hover:bg-green-400/10 disabled:opacity-50 transition-colors"
                              title="Save"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => { setEditingId(null); setError('') }}
                              className="p-1.5 rounded-lg text-text-muted hover:bg-bg-muted transition-colors"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={player.id} className="border-b border-[#1e1e1e] group hover:bg-[#141414] transition-colors">
                        <td className="py-3 px-5 text-text-muted font-mono text-sm">
                          {player.jersey_number ?? <span className="text-[#444]">--</span>}
                        </td>
                        <td className="py-3 px-3 text-text-primary font-medium">{player.full_name}</td>
                        <td className="py-3 px-3">
                          {player.position ? (
                            <span className="text-text-secondary">{player.position}</span>
                          ) : (
                            <span className="text-[#555] italic text-xs">Position pending</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-xs font-medium ${player.is_active ? 'text-green-400' : 'text-[#555]'}`}>
                            {player.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEdit(player)}
                              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-muted transition-colors"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => deletePlayer(player.id)}
                              className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
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
    </div>
  )
}
