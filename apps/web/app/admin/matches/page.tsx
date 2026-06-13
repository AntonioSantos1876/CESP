'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Edit3,
  MapPin,
  Play,
  Plus,
  RefreshCw,
  Save,
  Square,
  Video,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type UserRole = 'super_admin' | 'team_admin' | 'coach'
type FixtureStatus = 'scheduled' | 'live' | 'completed' | 'postponed'
type FilterTab = 'all' | FixtureStatus
type LineupStatus = 'starter' | 'bench' | 'out'

type Fixture = {
  id: string
  home_team_id: string | null
  away_team_id: string | null
  home_team: { name: string } | null
  away_team: { name: string } | null
  match_date: string
  status: FixtureStatus
  round: string | null
  knockout_round: string | null
  youtube_stream_id: string | null
  venue: string | null
  match_scores: { home_score: number; away_score: number } | null
}

type EditState = {
  id: string
  home_score: string
  away_score: string
  youtube: string
  match_date: string
  status: FixtureStatus
  home_team_id: string | null
  away_team_id: string | null
  round: string
  venue: string
}

type AddFixtureForm = {
  home_team_id: string
  away_team_id: string
  round: string
  match_date: string
  status: FixtureStatus
}

type TeamOption = { id: string; name: string }

type RosterPlayer = {
  id: string
  team_id: string
  full_name: string
  position: string | null
  jersey_number: number | null
  is_starter: boolean
}

type GoalEvent = {
  id: string
  player_id: string | null
  team_id: string
  event_minute: number | null
  notes: string | null
  player_name: string | null
  assist_player_id: string | null
  assist_player_name: string | null
}

type StoredLineupPlayer = {
  player_id: string
  full_name: string
  jersey_number: number | null
  position: string | null
  lineup_status: LineupStatus
  sort_order: number
}

type FormationRecord = {
  id: string
  fixture_id: string
  team_id: string
  formation: string
  lineup: StoredLineupPlayer[]
}

type DraftPlayer = {
  player_id: string
  full_name: string
  jersey_number: number | null
  base_position: string | null
  match_position: string
  lineup_status: LineupStatus
}

type LineupDraft = {
  formation: string
  players: DraftPlayer[]
}

const FORMATION_PRESETS = ['4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '3-4-3', '5-3-2']

const STATUS_BADGE: Record<FixtureStatus, { label: string; colour: string }> = {
  scheduled: { label: 'Scheduled', colour: 'bg-blue-500/15 text-blue-400' },
  live: { label: 'Live', colour: 'bg-green-500/15 text-green-400' },
  completed: { label: 'Full Time', colour: 'bg-bg-muted text-text-muted' },
  postponed: { label: 'Postponed', colour: 'bg-amber-500/15 text-amber-400' },
}

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'scheduled', label: 'Upcoming' },
  { key: 'live', label: 'Live' },
  { key: 'completed', label: 'Completed' },
  { key: 'postponed', label: 'Postponed' },
  { key: 'all', label: 'All' },
]

const LINEUP_STATUS_OPTIONS: { value: LineupStatus; label: string }[] = [
  { value: 'starter', label: 'Starter' },
  { value: 'bench', label: 'Bench' },
  { value: 'out', label: 'Out' },
]

function formationKey(fixtureId: string, teamId: string) {
  return `${fixtureId}:${teamId}`
}

function sortDraftPlayers(players: DraftPlayer[]) {
  const statusWeight: Record<LineupStatus, number> = { starter: 0, bench: 1, out: 2 }
  return [...players].sort((left, right) => {
    const statusDiff = statusWeight[left.lineup_status] - statusWeight[right.lineup_status]
    if (statusDiff !== 0) return statusDiff
    const leftNumber = left.jersey_number ?? 999
    const rightNumber = right.jersey_number ?? 999
    if (leftNumber !== rightNumber) return leftNumber - rightNumber
    return left.full_name.localeCompare(right.full_name)
  })
}

function normalizeStoredLineup(raw: unknown): StoredLineupPlayer[] {
  if (!Array.isArray(raw)) return []

  return raw.flatMap((item, index) => {
    if (!item || typeof item !== 'object') return []
    const candidate = item as Record<string, unknown>
    const playerId = typeof candidate.player_id === 'string' ? candidate.player_id : ''
    const fullName = typeof candidate.full_name === 'string' ? candidate.full_name : ''
    if (!playerId || !fullName) return []

    const lineupStatus = candidate.lineup_status === 'starter' || candidate.lineup_status === 'bench' || candidate.lineup_status === 'out'
      ? candidate.lineup_status
      : 'bench'

    return [{
      player_id: playerId,
      full_name: fullName,
      jersey_number: typeof candidate.jersey_number === 'number' ? candidate.jersey_number : null,
      position: typeof candidate.position === 'string' ? candidate.position : null,
      lineup_status: lineupStatus,
      sort_order: typeof candidate.sort_order === 'number' ? candidate.sort_order : index,
    }]
  })
}

function buildDraftPlayers(roster: RosterPlayer[], formation?: FormationRecord) {
  const savedByPlayerId = new Map(
    normalizeStoredLineup(formation?.lineup).map((player) => [player.player_id, player])
  )

  return sortDraftPlayers(
    roster.map((player) => {
      const saved = savedByPlayerId.get(player.id)
      return {
        player_id: player.id,
        full_name: player.full_name,
        jersey_number: player.jersey_number,
        base_position: player.position,
        match_position: saved?.position ?? player.position ?? '',
        lineup_status: saved?.lineup_status ?? (player.is_starter ? 'starter' : 'bench'),
      }
    })
  )
}

function summarisePlayers(players: DraftPlayer[], status: LineupStatus) {
  const list = players
    .filter((player) => player.lineup_status === status)
    .map((player) => player.full_name)
  return list.length > 0 ? list.join(', ') : 'None selected'
}

function getFixtureEditTeams(fixture: Fixture, role: UserRole | null, assignedTeamId: string | null) {
  const options = [
    { teamId: fixture.home_team_id, teamName: fixture.home_team?.name ?? 'Home Team' },
    { teamId: fixture.away_team_id, teamName: fixture.away_team?.name ?? 'Away Team' },
  ].filter((option) => option.teamId !== null) as { teamId: string; teamName: string }[]

  if (role === 'super_admin') return options
  return options.filter((option) => option.teamId === assignedTeamId)
}

export default function AdminMatchesPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [assignedTeamId, setAssignedTeamId] = useState<string | null>(null)
  const [assignedTeamName, setAssignedTeamName] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [edit, setEdit] = useState<EditState | null>(null)
  const [filterTab, setFilterTab] = useState<FilterTab>('scheduled')
  const [rostersByTeam, setRostersByTeam] = useState<Record<string, RosterPlayer[]>>({})
  const [formationsByKey, setFormationsByKey] = useState<Record<string, FormationRecord>>({})
  const [lineupDrafts, setLineupDrafts] = useState<Record<string, LineupDraft>>({})
  const [lineupEditKey, setLineupEditKey] = useState<string | null>(null)
  const [lineupSavingKey, setLineupSavingKey] = useState<string | null>(null)
  const [lineupErrors, setLineupErrors] = useState<Record<string, string>>({})
  const [allTeams, setAllTeams] = useState<TeamOption[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState<AddFixtureForm>({
    home_team_id: '', away_team_id: '', round: '', match_date: '', status: 'scheduled',
  })
  const [addSaving, setAddSaving] = useState(false)
  const [goalsByFixture, setGoalsByFixture] = useState<Record<string, GoalEvent[]>>({})
  const [goalFormOpen, setGoalFormOpen] = useState(false)
  const [goalFormTeamId, setGoalFormTeamId] = useState('')
  const [goalFormPlayerId, setGoalFormPlayerId] = useState('')
  const [goalFormAssistId, setGoalFormAssistId] = useState('')
  const [goalFormMinute, setGoalFormMinute] = useState('')
  const [savingGoal, setSavingGoal] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setFixtures([])
      setLoading(false)
      return
    }

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('role, team_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      setFixtures([])
      setLoading(false)
      return
    }

    const nextRole = profile.role as UserRole
    setUserRole(nextRole)
    setAssignedTeamId(profile.team_id ?? null)
    setLineupDrafts({})
    setLineupEditKey(null)
    setLineupErrors({})

    if (nextRole !== 'super_admin' && !profile.team_id) {
      setAssignedTeamName('')
      setFixtures([])
      setRostersByTeam({})
      setFormationsByKey({})
      setLoading(false)
      return
    }

    if (profile.team_id) {
      const { data: teamRow } = await (supabase as any)
        .from('teams')
        .select('name')
        .eq('id', profile.team_id)
        .single()

      setAssignedTeamName(teamRow?.name ?? '')
    } else {
      setAssignedTeamName('')
    }

    let fixturesQuery = (supabase as any)
      .from('fixtures')
      .select(`
        id, home_team_id, away_team_id, match_date, status, round, knockout_round, youtube_stream_id, venue,
        home_team:teams!fixtures_home_team_id_fkey(name),
        away_team:teams!fixtures_away_team_id_fkey(name),
        match_scores(home_score, away_score)
      `)
      .order('match_date', { ascending: true })

    if (nextRole !== 'super_admin' && profile.team_id) {
      fixturesQuery = fixturesQuery.or(`home_team_id.eq.${profile.team_id},away_team_id.eq.${profile.team_id}`)
    }

    const { data: fixtureRows } = await fixturesQuery
    const nextFixtures = (fixtureRows ?? []) as Fixture[]
    setFixtures(nextFixtures)

    const teamIdsToLoad = nextRole === 'super_admin'
      ? [...new Set(nextFixtures.flatMap((fixture) => [fixture.home_team_id, fixture.away_team_id]).filter(Boolean) as string[])]
      : profile.team_id
        ? [profile.team_id]
        : []

    if (nextRole === 'super_admin') {
      const { data: teamsRows } = await (supabase as any)
        .from('teams').select('id, name').order('name', { ascending: true })
      setAllTeams((teamsRows ?? []) as TeamOption[])
    }

    const fixtureIds = nextFixtures.map((fixture) => fixture.id)

    if (teamIdsToLoad.length > 0) {
      const { data: rosterRows } = await (supabase as any)
        .from('players')
        .select('id, team_id, full_name, position, jersey_number, is_starter')
        .in('team_id', teamIdsToLoad)
        .eq('is_active', true)
        .order('jersey_number', { ascending: true, nullsFirst: false })
        .order('full_name', { ascending: true })

      const nextRosters: Record<string, RosterPlayer[]> = {}
      for (const row of (rosterRows ?? []) as RosterPlayer[]) {
        nextRosters[row.team_id] = [...(nextRosters[row.team_id] ?? []), row]
      }
      setRostersByTeam(nextRosters)
    } else {
      setRostersByTeam({})
    }

    if (fixtureIds.length > 0 && teamIdsToLoad.length > 0) {
      const { data: formationRows } = await (supabase as any)
        .from('formations')
        .select('id, fixture_id, team_id, formation, lineup')
        .in('fixture_id', fixtureIds)
        .in('team_id', teamIdsToLoad)

      const nextFormations: Record<string, FormationRecord> = {}
      for (const row of (formationRows ?? []) as any[]) {
        const record: FormationRecord = {
          id: row.id,
          fixture_id: row.fixture_id,
          team_id: row.team_id,
          formation: row.formation ?? '4-4-2',
          lineup: normalizeStoredLineup(row.lineup),
        }
        nextFormations[formationKey(record.fixture_id, record.team_id)] = record
      }
      setFormationsByKey(nextFormations)
    } else {
      setFormationsByKey({})
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(
    () => filterTab === 'all' ? fixtures : fixtures.filter((fixture) => fixture.status === filterTab),
    [filterTab, fixtures]
  )

  function openEdit(fixture: Fixture) {
    setEditId(fixture.id)
    setEdit({
      id: fixture.id,
      home_score: String(fixture.match_scores?.home_score ?? 0),
      away_score: String(fixture.match_scores?.away_score ?? 0),
      youtube: fixture.youtube_stream_id ?? '',
      match_date: fixture.match_date ? fixture.match_date.slice(0, 16) : '',
      status: fixture.status,
      home_team_id: fixture.home_team_id,
      away_team_id: fixture.away_team_id,
      round: fixture.round ?? '',
      venue: fixture.venue ?? '',
    })
    setGoalFormOpen(false)
    setGoalFormTeamId(fixture.home_team_id ?? '')
    setGoalFormPlayerId('')
    setGoalFormMinute('')
    if (fixture.status === 'live' || fixture.status === 'completed') {
      loadGoals(fixture.id)
    }
  }

  async function loadGoals(fixtureId: string) {
    const supabase = createClient()
    const { data } = await (supabase as any)
      .from('match_stats')
      .select('id, player_id, assist_player_id, team_id, event_minute, notes, player:players!player_id(full_name), assist:players!assist_player_id(full_name)')
      .eq('fixture_id', fixtureId)
      .eq('event_type', 'goal')
      .order('event_minute', { ascending: true, nullsFirst: false })

    const goals = ((data ?? []) as any[]).map(row => ({
      id: row.id,
      player_id: row.player_id,
      team_id: row.team_id,
      event_minute: row.event_minute,
      notes: row.notes,
      player_name: Array.isArray(row.player) ? (row.player[0]?.full_name ?? null) : (row.player?.full_name ?? null),
      assist_player_id: row.assist_player_id,
      assist_player_name: Array.isArray(row.assist) ? (row.assist[0]?.full_name ?? null) : (row.assist?.full_name ?? null),
    }))

    setGoalsByFixture(prev => ({ ...prev, [fixtureId]: goals }))
  }

  function formatGoalMinute(goal: GoalEvent) {
    const raw = goal.notes ?? (goal.event_minute !== null ? String(goal.event_minute) : null)
    if (!raw) return '?'
    return raw.endsWith("'") ? raw : `${raw}'`
  }

  async function logGoal(fixture: Fixture) {
    if (!goalFormTeamId || !editId) return
    setSavingGoal(true)
    const supabase = createClient()

    const minuteRaw = goalFormMinute.trim()
    const minuteMatch = minuteRaw.match(/^(\d+)/)
    const minuteNum = minuteMatch ? parseInt(minuteMatch[1], 10) : null

    await (supabase as any).from('match_stats').insert({
      fixture_id: editId,
      player_id: goalFormPlayerId || null,
      assist_player_id: goalFormAssistId || null,
      team_id: goalFormTeamId,
      event_type: 'goal',
      event_minute: minuteNum,
      notes: minuteRaw || null,
    })

    const homeTeamId = edit?.home_team_id ?? fixture.home_team_id
    const awayTeamId = edit?.away_team_id ?? fixture.away_team_id
    const existing = goalsByFixture[editId] ?? []
    const isHome = goalFormTeamId === homeTeamId
    const homeCount = existing.filter(g => g.team_id === homeTeamId).length + (isHome ? 1 : 0)
    const awayCount = existing.filter(g => g.team_id === awayTeamId).length + (!isHome ? 1 : 0)

    const { data: scoreRow } = await (supabase as any)
      .from('match_scores')
      .select('id')
      .eq('fixture_id', editId)
      .maybeSingle()

    if (scoreRow) {
      await (supabase as any).from('match_scores').update({ home_score: homeCount, away_score: awayCount }).eq('fixture_id', editId)
    } else {
      await (supabase as any).from('match_scores').insert({ fixture_id: editId, home_score: homeCount, away_score: awayCount })
    }

    setGoalFormPlayerId('')
    setGoalFormAssistId('')
    setGoalFormMinute('')
    setSavingGoal(false)
    await loadGoals(editId)
    load()
  }

  async function updateStatus(id: string, status: FixtureStatus) {
    setSaving(id)
    const supabase = createClient()
    await (supabase as any).from('fixtures').update({ status }).eq('id', id)
    setSaving(null)
    load()
  }

  async function saveEdit() {
    if (!edit) return
    setSaving(edit.id)
    const supabase = createClient()

    await (supabase as any).from('fixtures').update({
      youtube_stream_id: edit.youtube || null,
      status: edit.status,
      match_date: edit.match_date || null,
      home_team_id: edit.home_team_id || null,
      away_team_id: edit.away_team_id || null,
      round: edit.round || null,
      venue: edit.venue || null,
    }).eq('id', edit.id)

    const { data: existing } = await (supabase as any)
      .from('match_scores')
      .select('id')
      .eq('fixture_id', edit.id)
      .maybeSingle()

    const payload = {
      fixture_id: edit.id,
      home_score: Number(edit.home_score) || 0,
      away_score: Number(edit.away_score) || 0,
    }

    if (existing) {
      await (supabase as any).from('match_scores').update(payload).eq('fixture_id', edit.id)
    } else {
      await (supabase as any).from('match_scores').insert(payload)
    }

    // Auto-advance knockout bracket when a semi-final is completed
    const fixture = fixtures.find((f) => f.id === edit.id)
    if (fixture?.knockout_round && (fixture.knockout_round === 'semi_1' || fixture.knockout_round === 'semi_2') && edit.status === 'completed') {
      const homeScore = Number(edit.home_score) || 0
      const awayScore = Number(edit.away_score) || 0
      const winnerId = homeScore > awayScore
        ? (edit.home_team_id ?? fixture.home_team_id)
        : awayScore > homeScore
          ? (edit.away_team_id ?? fixture.away_team_id)
          : null
      const loserId = homeScore > awayScore
        ? (edit.away_team_id ?? fixture.away_team_id)
        : awayScore > homeScore
          ? (edit.home_team_id ?? fixture.home_team_id)
          : null

      if (winnerId || loserId) {
        const isSemi1 = fixture.knockout_round === 'semi_1'
        const finalField = isSemi1 ? { home_team_id: winnerId } : { away_team_id: winnerId }
        const thirdField = isSemi1 ? { home_team_id: loserId } : { away_team_id: loserId }

        if (winnerId) {
          await (supabase as any).from('fixtures').update(finalField)
            .eq('knockout_round', 'final')
        }
        if (loserId) {
          await (supabase as any).from('fixtures').update(thirdField)
            .eq('knockout_round', 'third_place')
        }
      }
    }

    setSaving(null)
    setEditId(null)
    setEdit(null)
    load()
  }

  async function addFixture() {
    if (!addForm.home_team_id || !addForm.away_team_id || !addForm.round) return
    if (addForm.home_team_id === addForm.away_team_id) return
    setAddSaving(true)
    const supabase = createClient()
    await (supabase as any).from('fixtures').insert({
      home_team_id: addForm.home_team_id,
      away_team_id: addForm.away_team_id,
      round: addForm.round,
      match_date: addForm.match_date ? new Date(addForm.match_date).toISOString() : new Date().toISOString(),
      status: addForm.status,
    })
    setAddSaving(false)
    setShowAddForm(false)
    setAddForm({ home_team_id: '', away_team_id: '', round: '', match_date: '', status: 'scheduled' })
    load()
  }

  function startLineupEdit(fixtureId: string, teamId: string) {
    const key = formationKey(fixtureId, teamId)
    const roster = rostersByTeam[teamId] ?? []
    const formation = formationsByKey[key]

    setLineupDrafts((current) => ({
      ...current,
      [key]: {
        formation: formation?.formation ?? '4-4-2',
        players: buildDraftPlayers(roster, formation),
      },
    }))
    setLineupErrors((current) => ({ ...current, [key]: '' }))
    setLineupEditKey(key)
  }

  function updateDraftPlayer(fixtureId: string, teamId: string, playerId: string, changes: Partial<DraftPlayer>) {
    const key = formationKey(fixtureId, teamId)
    const draft = lineupDrafts[key]
    if (!draft) return

    const nextPlayers = sortDraftPlayers(
      draft.players.map((player) => player.player_id === playerId ? { ...player, ...changes } : player)
    )

    const starterCount = nextPlayers.filter((player) => player.lineup_status === 'starter').length
    if (starterCount > 11) {
      setLineupErrors((current) => ({ ...current, [key]: 'Only 11 players can be selected as starters.' }))
      return
    }

    setLineupDrafts((current) => ({
      ...current,
      [key]: { ...draft, players: nextPlayers },
    }))
    setLineupErrors((current) => ({ ...current, [key]: '' }))
  }

  async function saveLineup(fixtureId: string, teamId: string) {
    const key = formationKey(fixtureId, teamId)
    const draft = lineupDrafts[key]
    if (!draft) return

    const starters = draft.players.filter((player) => player.lineup_status === 'starter')
    if (starters.length !== 11) {
      setLineupErrors((current) => ({ ...current, [key]: 'Select exactly 11 starters before saving this lineup.' }))
      return
    }

    setLineupSavingKey(key)
    const supabase = createClient()
    const lineupPayload = draft.players
      .filter((player) => player.lineup_status !== 'out')
      .map((player, index) => ({
        player_id: player.player_id,
        full_name: player.full_name,
        jersey_number: player.jersey_number,
        position: player.match_position.trim() || player.base_position || null,
        lineup_status: player.lineup_status,
        sort_order: index,
      }))

    const { data, error } = await (supabase as any)
      .from('formations')
      .upsert({
        fixture_id: fixtureId,
        team_id: teamId,
        formation: draft.formation,
        lineup: lineupPayload,
      }, { onConflict: 'fixture_id,team_id' })
      .select('id, fixture_id, team_id, formation, lineup')
      .single()

    if (error) {
      setLineupErrors((current) => ({ ...current, [key]: error.message }))
      setLineupSavingKey(null)
      return
    }

    const record: FormationRecord = {
      id: data.id,
      fixture_id: data.fixture_id,
      team_id: data.team_id,
      formation: data.formation ?? draft.formation,
      lineup: normalizeStoredLineup(data.lineup),
    }

    setFormationsByKey((current) => ({ ...current, [key]: record }))
    setLineupDrafts((current) => ({
      ...current,
      [key]: {
        formation: record.formation,
        players: buildDraftPlayers(rostersByTeam[teamId] ?? [], record),
      },
    }))
    setLineupEditKey(null)
    setLineupSavingKey(null)
    setLineupErrors((current) => ({ ...current, [key]: '' }))
  }

  const counts: Record<FilterTab, number> = {
    all: fixtures.length,
    scheduled: fixtures.filter((fixture) => fixture.status === 'scheduled').length,
    live: fixtures.filter((fixture) => fixture.status === 'live').length,
    completed: fixtures.filter((fixture) => fixture.status === 'completed').length,
    postponed: fixtures.filter((fixture) => fixture.status === 'postponed').length,
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Match Lineups</h1>
          <p className="mt-1 text-sm text-text-muted">
            {userRole === 'super_admin'
              ? 'Update match details and set lineups for either team.'
              : assignedTeamName
                ? `You can only manage lineup, bench, formation, and positions for ${assignedTeamName}.`
                : 'You can only manage lineups for your assigned team.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {userRole === 'super_admin' && (
            <button
              onClick={() => setShowAddForm((prev) => !prev)}
              className="flex items-center gap-2 rounded-xl bg-brand-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90"
            >
              <Play size={14} />
              Add fixture
            </button>
          )}
          <button
            onClick={load}
            className="flex items-center gap-2 rounded-xl border border-bg-border bg-bg-muted px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {userRole === 'super_admin' && showAddForm && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-brand-primary/20 bg-brand-primary/5">
          <div className="border-b border-brand-primary/15 px-5 py-3">
            <p className="text-sm font-semibold text-brand-secondary">Add new fixture</p>
          </div>
          <div className="grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs text-text-muted">Home team</label>
              <select
                value={addForm.home_team_id}
                onChange={(e) => setAddForm({ ...addForm, home_team_id: e.target.value })}
                className="input w-full"
              >
                <option value="">Select team</option>
                {allTeams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-text-muted">Away team</label>
              <select
                value={addForm.away_team_id}
                onChange={(e) => setAddForm({ ...addForm, away_team_id: e.target.value })}
                className="input w-full"
              >
                <option value="">Select team</option>
                {allTeams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-text-muted">Round / label</label>
              <input
                type="text"
                value={addForm.round}
                onChange={(e) => setAddForm({ ...addForm, round: e.target.value })}
                placeholder="e.g. Group Stage, Quarter-Final 1"
                className="input w-full"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-text-muted">Match date &amp; time</label>
              <input
                type="datetime-local"
                value={addForm.match_date}
                onChange={(e) => setAddForm({ ...addForm, match_date: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-text-muted">Status</label>
              <select
                value={addForm.status}
                onChange={(e) => setAddForm({ ...addForm, status: e.target.value as FixtureStatus })}
                className="input w-full"
              >
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
                <option value="postponed">Postponed</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={addFixture}
                disabled={addSaving || !addForm.home_team_id || !addForm.away_team_id || !addForm.round || addForm.home_team_id === addForm.away_team_id}
                className="flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-50"
              >
                <Save size={14} />
                {addSaving ? 'Saving...' : 'Create fixture'}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex items-center gap-2 rounded-xl border border-bg-border bg-bg-muted px-4 py-2 text-sm text-text-secondary hover:text-text-primary"
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTER_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterTab(key)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
              filterTab === key
                ? 'border-brand-primary/20 bg-brand-primary/10 text-brand-secondary'
                : 'border-bg-border bg-bg-muted text-text-secondary hover:text-text-primary'
            }`}
          >
            {label}
            {counts[key] > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-xs ${filterTab === key ? 'bg-brand-primary/20 text-brand-primary' : 'bg-bg-hover text-text-muted'}`}>
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-text-muted">
          No {filterTab === 'all' ? '' : filterTab === 'scheduled' ? 'upcoming' : filterTab} fixtures found.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((fixture, index) => {
            const badge = STATUS_BADGE[fixture.status] ?? STATUS_BADGE.scheduled
            const isEditing = editId === fixture.id
            const isSavingFixture = saving === fixture.id
            const teamEditors = getFixtureEditTeams(fixture, userRole, assignedTeamId)

            return (
              <motion.div
                key={fixture.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                className="overflow-hidden rounded-2xl border border-[#1e1e1e] bg-[#111111]"
              >
                <div className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10">
                    <CalendarDays size={14} className="text-brand-primary" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text-primary">
                      {fixture.home_team?.name ?? 'TBA'} vs {fixture.away_team?.name ?? 'TBA'}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                      <span>{fixture.round ?? 'Match'}</span>
                      <span>
                        {fixture.match_date
                          ? new Date(fixture.match_date).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'TBD'}
                      </span>
                      {(fixture.status === 'live' || fixture.status === 'completed') && fixture.match_scores && (
                        <span className="font-bold text-text-primary">
                          {fixture.match_scores.home_score} - {fixture.match_scores.away_score}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${badge.colour}`}>
                    {badge.label}
                  </span>

                  {userRole === 'super_admin' && (
                    <div className="flex items-center gap-2">
                      {fixture.status === 'scheduled' && (
                        <button
                          onClick={() => updateStatus(fixture.id, 'live')}
                          disabled={isSavingFixture}
                          className="flex items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 transition-colors hover:bg-green-500/20 disabled:opacity-50"
                        >
                          <Play size={12} />
                          Start
                        </button>
                      )}
                      {fixture.status === 'live' && (
                        <button
                          onClick={() => updateStatus(fixture.id, 'completed')}
                          disabled={isSavingFixture}
                          className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                        >
                          <Square size={12} />
                          End
                        </button>
                      )}
                      <button
                        onClick={() => isEditing ? (setEditId(null), setEdit(null)) : openEdit(fixture)}
                        className="flex items-center gap-1.5 rounded-lg border border-bg-border bg-bg-muted px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
                      >
                        {isEditing ? <X size={12} /> : <Edit3 size={12} />}
                        {isEditing ? 'Cancel' : 'Edit'}
                      </button>
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {isEditing && edit && userRole === 'super_admin' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-[#1a1a1a]"
                    >
                      <div className="grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-2 lg:grid-cols-3">
                        {fixture.knockout_round && (
                          <>
                            <div>
                              <label className="mb-1.5 block text-xs text-text-muted">Home team (TBA)</label>
                              <select
                                value={edit.home_team_id ?? ''}
                                onChange={(event) => setEdit({ ...edit, home_team_id: event.target.value || null })}
                                className="input w-full"
                              >
                                <option value="">TBA</option>
                                {allTeams.map((team) => (
                                  <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="mb-1.5 block text-xs text-text-muted">Away team (TBA)</label>
                              <select
                                value={edit.away_team_id ?? ''}
                                onChange={(event) => setEdit({ ...edit, away_team_id: event.target.value || null })}
                                className="input w-full"
                              >
                                <option value="">TBA</option>
                                {allTeams.map((team) => (
                                  <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                              </select>
                            </div>
                          </>
                        )}
                        <div>
                          <label className="mb-1.5 block text-xs text-text-muted">{edit.home_team_id ? (allTeams.find(t => t.id === edit.home_team_id)?.name ?? fixture.home_team?.name ?? 'Home') : (fixture.home_team?.name ?? 'Home')} score</label>
                          <input
                            type="number"
                            min={0}
                            value={edit.home_score}
                            onChange={(event) => setEdit({ ...edit, home_score: event.target.value })}
                            className="input w-full"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs text-text-muted">{edit.away_team_id ? (allTeams.find(t => t.id === edit.away_team_id)?.name ?? fixture.away_team?.name ?? 'Away') : (fixture.away_team?.name ?? 'Away')} score</label>
                          <input
                            type="number"
                            min={0}
                            value={edit.away_score}
                            onChange={(event) => setEdit({ ...edit, away_score: event.target.value })}
                            className="input w-full"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs text-text-muted">Match date &amp; time</label>
                          <input
                            type="datetime-local"
                            value={edit.match_date}
                            onChange={(event) => setEdit({ ...edit, match_date: event.target.value })}
                            className="input w-full"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs text-text-muted">Status</label>
                          <select
                            value={edit.status}
                            onChange={(event) => setEdit({ ...edit, status: event.target.value as FixtureStatus })}
                            className="input w-full"
                          >
                            <option value="scheduled">Scheduled</option>
                            <option value="live">Live</option>
                            <option value="completed">Completed</option>
                            <option value="postponed">Postponed</option>
                          </select>
                        </div>
                        <div className="sm:col-span-1 lg:col-span-2">
                          <label className="mb-1.5 flex items-center gap-1.5 text-xs text-text-muted">
                            <Video size={12} className="text-red-400" />
                            YouTube stream ID
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. dQw4w9WgXcQ"
                            value={edit.youtube}
                            onChange={(event) => setEdit({ ...edit, youtube: event.target.value })}
                            className="input w-full"
                          />
                        </div>
                        <div className="sm:col-span-2 lg:col-span-3">
                          <label className="mb-1.5 flex items-center gap-1.5 text-xs text-text-muted">
                            <MapPin size={12} className="text-brand-secondary" />
                            Venue
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Glenmuir High School"
                            value={edit.venue}
                            onChange={(event) => setEdit({ ...edit, venue: event.target.value })}
                            className="input w-full"
                          />
                        </div>
                        {(edit.status === 'live' || edit.status === 'completed') && (edit.home_team_id || fixture.home_team_id) && (edit.away_team_id || fixture.away_team_id) && (
                          <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-[#1e1e1e] bg-[#0a0a0a] p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Goals</p>
                              <button
                                onClick={() => {
                                  setGoalFormOpen(open => !open)
                                  setGoalFormTeamId(edit.home_team_id ?? fixture.home_team_id ?? '')
                                  setGoalFormPlayerId('')
                                  setGoalFormMinute('')
                                }}
                                className="flex items-center gap-1 rounded-lg bg-brand-primary/10 px-2.5 py-1 text-xs font-medium text-brand-secondary hover:bg-brand-primary/20 transition-colors"
                              >
                                <Plus size={11} />
                                Log goal
                              </button>
                            </div>

                            {(() => {
                              const goals = goalsByFixture[fixture.id] ?? []
                              const homeTeamId = edit.home_team_id ?? fixture.home_team_id ?? ''
                              const awayTeamId = edit.away_team_id ?? fixture.away_team_id ?? ''
                              const homeGoals = goals.filter(g => g.team_id === homeTeamId)
                              const awayGoals = goals.filter(g => g.team_id === awayTeamId)
                              const homeName = edit.home_team_id ? (allTeams.find(t => t.id === edit.home_team_id)?.name ?? fixture.home_team?.name ?? 'Home') : (fixture.home_team?.name ?? 'Home')
                              const awayName = edit.away_team_id ? (allTeams.find(t => t.id === edit.away_team_id)?.name ?? fixture.away_team?.name ?? 'Away') : (fixture.away_team?.name ?? 'Away')
                              const homeScore = homeGoals.length
                              const awayScore = awayGoals.length

                              return (
                                <div>
                                  <div className="mb-3 flex items-center gap-2">
                                    <div className="flex-1 text-center">
                                      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">{homeName.split(' ')[0]}</p>
                                      {homeGoals.length === 0 ? (
                                        <p className="text-xs text-text-muted italic">No goals</p>
                                      ) : (
                                        <div className="space-y-0.5">
                                          {homeGoals.map(g => (
                                            <p key={g.id} className="text-xs text-text-primary">
                                              {g.player_name ?? 'Unknown'} <span className="text-text-muted">{formatGoalMinute(g)}</span>
                                              {g.assist_player_name && <span className="text-text-muted"> (ast. {g.assist_player_name})</span>}
                                            </p>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <div className="px-3 text-center">
                                      <p className="text-lg font-bold text-text-primary tabular-nums">{homeScore} - {awayScore}</p>
                                    </div>
                                    <div className="flex-1 text-center">
                                      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">{awayName.split(' ')[0]}</p>
                                      {awayGoals.length === 0 ? (
                                        <p className="text-xs text-text-muted italic">No goals</p>
                                      ) : (
                                        <div className="space-y-0.5">
                                          {awayGoals.map(g => (
                                            <p key={g.id} className="text-xs text-text-primary">
                                              {g.player_name ?? 'Unknown'} <span className="text-text-muted">{formatGoalMinute(g)}</span>
                                              {g.assist_player_name && <span className="text-text-muted"> (ast. {g.assist_player_name})</span>}
                                            </p>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {goalFormOpen && (
                                    <div className="mt-3 border-t border-[#1e1e1e] pt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                      <div>
                                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">Team</label>
                                        <div className="flex gap-1.5">
                                          <button
                                            onClick={() => { setGoalFormTeamId(homeTeamId); setGoalFormPlayerId(''); setGoalFormAssistId('') }}
                                            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${goalFormTeamId === homeTeamId ? 'bg-brand-primary text-white' : 'border border-[#333] bg-[#111] text-text-secondary hover:text-text-primary'}`}
                                          >
                                            {homeName.split(' ')[0]}
                                          </button>
                                          <button
                                            onClick={() => { setGoalFormTeamId(awayTeamId); setGoalFormPlayerId(''); setGoalFormAssistId('') }}
                                            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${goalFormTeamId === awayTeamId ? 'bg-brand-primary text-white' : 'border border-[#333] bg-[#111] text-text-secondary hover:text-text-primary'}`}
                                          >
                                            {awayName.split(' ')[0]}
                                          </button>
                                        </div>
                                      </div>
                                      <div>
                                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">Minute</label>
                                        <div className="flex gap-2">
                                          <input
                                            type="text"
                                            placeholder="e.g. 45 or 90+3"
                                            value={goalFormMinute}
                                            onChange={e => setGoalFormMinute(e.target.value)}
                                            className="input flex-1 text-xs py-1.5"
                                          />
                                          <button
                                            onClick={() => logGoal(fixture)}
                                            disabled={savingGoal || !goalFormTeamId}
                                            className="flex items-center gap-1 rounded-xl bg-brand-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50 transition-colors"
                                          >
                                            <Save size={11} />
                                            {savingGoal ? '...' : 'Add'}
                                          </button>
                                        </div>
                                      </div>
                                      <div>
                                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">Scorer</label>
                                        <select
                                          value={goalFormPlayerId}
                                          onChange={e => setGoalFormPlayerId(e.target.value)}
                                          className="input w-full text-xs py-1.5"
                                        >
                                          <option value="">Unknown / no scorer</option>
                                          {(rostersByTeam[goalFormTeamId] ?? []).map(p => (
                                            <option key={p.id} value={p.id}>
                                              {p.jersey_number ? `#${p.jersey_number} ` : ''}{p.full_name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <div>
                                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">Assist (optional)</label>
                                        <select
                                          value={goalFormAssistId}
                                          onChange={e => setGoalFormAssistId(e.target.value)}
                                          className="input w-full text-xs py-1.5"
                                        >
                                          <option value="">No assist</option>
                                          {(rostersByTeam[goalFormTeamId] ?? [])
                                            .filter(p => p.id !== goalFormPlayerId)
                                            .map(p => (
                                              <option key={p.id} value={p.id}>
                                                {p.jersey_number ? `#${p.jersey_number} ` : ''}{p.full_name}
                                              </option>
                                            ))}
                                        </select>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })()}
                          </div>
                        )}

                        <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
                          <button
                            onClick={saveEdit}
                            disabled={isSavingFixture}
                            className="flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-50"
                          >
                            <Save size={14} />
                            Save changes
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="border-t border-[#1a1a1a] px-5 py-4">
                  <div className="mb-3 flex items-center gap-2">
                    <ClipboardList size={15} className="text-brand-primary" />
                    <p className="text-sm font-semibold text-text-primary">Lineups and bench</p>
                  </div>

                  {teamEditors.length === 0 ? (
                    <p className="text-sm text-text-muted">You are not assigned to either team in this fixture.</p>
                  ) : (
                    <div className="space-y-4">
                      {teamEditors.map((teamEditor) => {
                        const key = formationKey(fixture.id, teamEditor.teamId)
                        const roster = rostersByTeam[teamEditor.teamId] ?? []
                        const record = formationsByKey[key]
                        const savedView = {
                          formation: record?.formation ?? '4-4-2',
                          players: buildDraftPlayers(roster, record),
                        }
                        const isEditingLineup = lineupEditKey === key
                        const draft = isEditingLineup
                          ? lineupDrafts[key] ?? savedView
                          : savedView
                        const starters = draft.players.filter((player) => player.lineup_status === 'starter').length
                        const bench = draft.players.filter((player) => player.lineup_status === 'bench').length
                        const saveError = lineupErrors[key]

                        return (
                          <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-text-primary">{teamEditor.teamName}</p>
                                <div className="mt-1 flex flex-wrap gap-2 text-xs text-text-muted">
                                  <span className="rounded-full border border-white/10 px-2.5 py-1">
                                    Formation: {draft.formation}
                                  </span>
                                  <span className="rounded-full border border-white/10 px-2.5 py-1">
                                    Starters: {starters}/11
                                  </span>
                                  <span className="rounded-full border border-white/10 px-2.5 py-1">
                                    Bench: {bench}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {isEditingLineup ? (
                                  <>
                                    <button
                                      onClick={() => {
                                        setLineupEditKey(null)
                                        setLineupDrafts((current) => {
                                          const next = { ...current }
                                          delete next[key]
                                          return next
                                        })
                                        setLineupErrors((current) => ({ ...current, [key]: '' }))
                                      }}
                                      className="flex items-center gap-1.5 rounded-lg border border-bg-border bg-bg-muted px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
                                    >
                                      <X size={12} />
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => saveLineup(fixture.id, teamEditor.teamId)}
                                      disabled={lineupSavingKey === key}
                                      className="flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-50"
                                    >
                                      <Save size={12} />
                                      Save lineup
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => startLineupEdit(fixture.id, teamEditor.teamId)}
                                    className="flex items-center gap-1.5 rounded-lg bg-brand-primary/10 px-3 py-1.5 text-xs font-medium text-brand-secondary transition-colors hover:bg-brand-primary/20"
                                  >
                                    <Edit3 size={12} />
                                    {record ? 'Edit lineup' : 'Create lineup'}
                                  </button>
                                )}
                              </div>
                            </div>

                            {isEditingLineup && (
                              <div className="mt-4 space-y-4">
                                <div className="max-w-xs">
                                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                                    Formation
                                  </label>
                                  <div className="relative">
                                    <select
                                      value={draft.formation}
                                      onChange={(event) => setLineupDrafts((current) => ({
                                        ...current,
                                        [key]: {
                                          ...draft,
                                          formation: event.target.value,
                                        },
                                      }))}
                                      className="w-full appearance-none rounded-xl border border-[#333] bg-[#111] px-4 py-2.5 pr-10 text-sm text-text-primary focus:border-brand-primary focus:outline-none"
                                    >
                                      {FORMATION_PRESETS.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                      ))}
                                    </select>
                                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                  </div>
                                </div>

                                {saveError && (
                                  <p className="text-sm text-red-400">{saveError}</p>
                                )}

                                {roster.length === 0 ? (
                                  <p className="text-sm text-text-muted">
                                    No active players found for this team yet. Add the roster first on the Teams page.
                                  </p>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="border-b border-[#1e1e1e]">
                                          <th className="w-16 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-text-muted">#</th>
                                          <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-text-muted">Player</th>
                                          <th className="w-40 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-text-muted">Match status</th>
                                          <th className="w-48 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-text-muted">Match position</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {draft.players.map((player) => (
                                          <tr key={player.player_id} className="border-b border-[#1e1e1e]">
                                            <td className="px-3 py-2 font-mono text-text-muted">
                                              {player.jersey_number ?? '--'}
                                            </td>
                                            <td className="px-3 py-2">
                                              <p className="font-medium text-text-primary">{player.full_name}</p>
                                              <p className="text-xs text-text-muted">
                                                {player.base_position ?? 'Position pending'}
                                              </p>
                                            </td>
                                            <td className="px-3 py-2">
                                              <select
                                                value={player.lineup_status}
                                                onChange={(event) => updateDraftPlayer(fixture.id, teamEditor.teamId, player.player_id, {
                                                  lineup_status: event.target.value as LineupStatus,
                                                })}
                                                className="w-full rounded-lg border border-[#333] bg-bg-base px-2 py-1.5 text-sm text-text-primary focus:border-brand-primary focus:outline-none"
                                              >
                                                {LINEUP_STATUS_OPTIONS.map((option) => (
                                                  <option key={option.value} value={option.value}>{option.label}</option>
                                                ))}
                                              </select>
                                            </td>
                                            <td className="px-3 py-2">
                                              <input
                                                value={player.match_position}
                                                onChange={(event) => updateDraftPlayer(fixture.id, teamEditor.teamId, player.player_id, {
                                                  match_position: event.target.value,
                                                })}
                                                className="w-full rounded-lg border border-[#333] bg-bg-base px-2 py-1.5 text-sm text-text-primary focus:border-brand-primary focus:outline-none"
                                                placeholder="GK, CB, CM, ST..."
                                              />
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            )}

                            {!isEditingLineup && (
                              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                                <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Starting XI</p>
                                  <p className="text-sm text-text-secondary">{summarisePlayers(draft.players, 'starter')}</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Bench</p>
                                  <p className="text-sm text-text-secondary">{summarisePlayers(draft.players, 'bench')}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
