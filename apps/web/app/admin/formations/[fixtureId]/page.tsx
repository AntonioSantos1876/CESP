'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, ChevronDown, UserX, RotateCcw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getTeamBranding } from '@/lib/school-teams'

type UserRole = 'super_admin' | 'team_admin' | 'coach'

type SquadPlayer = {
  id: string
  full_name: string
  jersey_number: number | null
  position: string | null
  photo_url: string | null
}

type PitchSlot = {
  index: number
  label: string
  x: number
  y: number
  player: SquadPlayer | null
}

type TeamEdit = {
  teamId: string
  teamName: string
  side: 'home' | 'away'
}

const FORMATIONS = [
  '4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '5-3-2',
  '4-1-4-1', '3-4-3', '5-4-1', '4-5-1', '4-4-1-1',
]

const ROW_LABELS_3: Record<number, string[][]> = {
  3: [['LCB', 'CB', 'RCB'], ['LM', 'CM', 'RM'], ['ST', 'ST', 'ST']],
  4: [['LB', 'LCB', 'RCB', 'RB'], ['LM', 'CM', 'CM', 'RM'], ['LW', 'ST', 'RW', 'ST']],
  5: [['LWB', 'CB', 'CB', 'CB', 'RWB'], ['LM', 'CM', 'DM', 'CM', 'RM'], ['LW', 'ST', 'RW', 'ST', 'ST']],
}

const ROW_LABELS_4_DEFAULT = [
  ['LB', 'CB', 'CB', 'RB'],
  ['DM', 'DM'],
  ['LM', 'CAM', 'RM'],
  ['ST'],
]

function getRowY(numRows: number): number[] {
  const map: Record<number, number[]> = {
    2: [310, 155],
    3: [325, 237, 140],
    4: [330, 277, 205, 115],
    5: [332, 287, 240, 178, 110],
  }
  return map[numRows] ?? map[3]
}

function spreadX(count: number, index: number): number {
  const left = 35
  const right = 265
  if (count === 1) return 150
  return Math.round(left + ((right - left) / (count - 1)) * index)
}

function buildSlots(formation: string): PitchSlot[] {
  const rowCounts = formation.split('-').map(Number).filter(n => n > 0)
  const numRows = rowCounts.length
  const rowYs = getRowY(numRows)
  const slots: PitchSlot[] = []

  // GK
  slots.push({ index: 0, label: 'GK', x: 150, y: 393, player: null })

  rowCounts.forEach((count, ri) => {
    const y = rowYs[ri]
    const labelRow = numRows === 4
      ? (ROW_LABELS_4_DEFAULT[ri] ?? [])
      : (ROW_LABELS_3[count]?.[ri] ?? [])

    for (let i = 0; i < count; i++) {
      slots.push({
        index: slots.length,
        label: labelRow[i] ?? (ri === 0 ? 'DEF' : ri === numRows - 1 ? 'FWD' : 'MID'),
        x: spreadX(count, i),
        y,
        player: null,
      })
    }
  })

  return slots
}

function reMergeSlots(oldSlots: PitchSlot[], newSlots: PitchSlot[]): PitchSlot[] {
  const players = oldSlots.map(s => s.player).filter(Boolean) as SquadPlayer[]
  return newSlots.map((slot, i) => ({ ...slot, player: players[i] ?? null }))
}

export default function FormationEditorPage() {
  const { fixtureId } = useParams<{ fixtureId: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveOk, setSaveOk] = useState(false)

  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [assignedTeamId, setAssignedTeamId] = useState<string | null>(null)

  const [homeTeamId, setHomeTeamId] = useState<string | null>(null)
  const [awayTeamId, setAwayTeamId] = useState<string | null>(null)
  const [homeTeamName, setHomeTeamName] = useState('')
  const [awayTeamName, setAwayTeamName] = useState('')

  const [activeTeam, setActiveTeam] = useState<'home' | 'away'>('home')
  const [squads, setSquads] = useState<Record<string, SquadPlayer[]>>({})

  const [homeFormation, setHomeFormation] = useState('4-4-2')
  const [awayFormation, setAwayFormation] = useState('4-4-2')
  const [homeSlots, setHomeSlots] = useState<PitchSlot[]>(() => buildSlots('4-4-2'))
  const [awaySlots, setAwaySlots] = useState<PitchSlot[]>(() => buildSlots('4-4-2'))

  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null)
  const [showPlayerPicker, setShowPlayerPicker] = useState(false)

  const svgRef = useRef<SVGSVGElement>(null)
  const draggingRef = useRef<{ slotIndex: number } | null>(null)

  const currentTeamId = activeTeam === 'home' ? homeTeamId : awayTeamId
  const currentSquad = squads[currentTeamId ?? ''] ?? []
  const currentFormation = activeTeam === 'home' ? homeFormation : awayFormation
  const currentSlots = activeTeam === 'home' ? homeSlots : awaySlots
  const setCurrentSlots = activeTeam === 'home' ? setHomeSlots : setAwaySlots
  const setCurrentFormation = activeTeam === 'home' ? setHomeFormation : setAwayFormation

  const branding = getTeamBranding(activeTeam === 'home' ? homeTeamName : awayTeamName)

  const assignedSlotCount = currentSlots.filter(s => s.player !== null).length
  const starterCount = Math.min(assignedSlotCount, 11)
  const benched = currentSquad.filter(p => !currentSlots.some(s => s.player?.id === p.id))

  useEffect(() => {
    async function load() {
      setLoading(true)
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth/login'); return }

      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('role, team_id')
        .eq('id', user.id)
        .single()

      if (!profile || !['super_admin', 'team_admin', 'coach'].includes(profile.role)) {
        router.replace('/')
        return
      }

      setUserRole(profile.role as UserRole)
      setAssignedTeamId(profile.team_id ?? null)

      const { data: fixture } = await (supabase as any)
        .from('fixtures')
        .select(`
          home_team_id, away_team_id,
          home_team:teams!fixtures_home_team_id_fkey(id, name),
          away_team:teams!fixtures_away_team_id_fkey(id, name)
        `)
        .eq('id', fixtureId)
        .single()

      if (!fixture) { router.replace('/admin/matches'); return }

      const hid = fixture.home_team_id as string | null
      const aid = fixture.away_team_id as string | null
      setHomeTeamId(hid)
      setAwayTeamId(aid)
      setHomeTeamName(fixture.home_team?.name ?? '')
      setAwayTeamName(fixture.away_team?.name ?? '')

      const teamIds = [hid, aid].filter(Boolean) as string[]

      const [squadsRes, formationsRes] = await Promise.all([
        Promise.all(teamIds.map(tid =>
          (supabase as any)
            .from('players')
            .select('id, full_name, jersey_number, position, photo_url')
            .eq('team_id', tid)
            .eq('is_active', true)
            .order('jersey_number', { ascending: true })
            .then(({ data }: { data: SquadPlayer[] | null }) => ({ tid, players: data ?? [] }))
        )),
        (supabase as any)
          .from('formations')
          .select('team_id, formation, lineup')
          .eq('fixture_id', fixtureId)
          .in('team_id', teamIds),
      ])

      const nextSquads: Record<string, SquadPlayer[]> = {}
      squadsRes.forEach(({ tid, players }: { tid: string, players: SquadPlayer[] }) => {
        nextSquads[tid] = players
      })
      setSquads(nextSquads)

      const formRows = (formationsRes.data ?? []) as { team_id: string; formation: string; lineup: unknown[] }[]
      for (const row of formRows) {
        const squad = nextSquads[row.team_id] ?? []
        const savedFormation = row.formation ?? '4-4-2'
        const slots = buildSlots(savedFormation)
        const lineup = Array.isArray(row.lineup) ? row.lineup : []
        lineup.forEach((entry: unknown) => {
          if (!entry || typeof entry !== 'object') return
          const e = entry as { player_id?: string; lineup_status?: string; sort_order?: number }
          if (e.lineup_status !== 'starter') return
          const player = squad.find(p => p.id === e.player_id)
          if (!player) return
          const slotIndex = typeof e.sort_order === 'number' ? e.sort_order : -1
          if (slotIndex >= 0 && slotIndex < slots.length && !slots[slotIndex].player) {
            slots[slotIndex].player = player
          } else {
            const emptySlot = slots.find(s => !s.player)
            if (emptySlot) emptySlot.player = player
          }
        })

        if (row.team_id === hid) {
          setHomeFormation(savedFormation)
          setHomeSlots(slots)
        } else if (row.team_id === aid) {
          setAwayFormation(savedFormation)
          setAwaySlots(slots)
        }
      }

      if (profile.role !== 'super_admin' && profile.team_id) {
        if (profile.team_id === aid && profile.team_id !== hid) {
          setActiveTeam('away')
        }
      }

      setLoading(false)
    }
    load()
  }, [fixtureId, router])

  function handleFormationChange(value: string) {
    setCurrentFormation(value)
    const newSlots = buildSlots(value)
    setCurrentSlots(prev => reMergeSlots(prev, newSlots))
    setSelectedSlotIndex(null)
    setShowPlayerPicker(false)
  }

  function handleSlotClick(slotIndex: number) {
    if (selectedSlotIndex === slotIndex) {
      setSelectedSlotIndex(null)
      setShowPlayerPicker(false)
      return
    }
    setSelectedSlotIndex(slotIndex)
    setShowPlayerPicker(true)
  }

  function assignPlayer(player: SquadPlayer | null) {
    if (selectedSlotIndex === null) return
    setCurrentSlots(prev => {
      const next = prev.map(s => {
        if (s.player?.id === player?.id && player !== null) return { ...s, player: null }
        return s
      }).map((s, i) => i === selectedSlotIndex ? { ...s, player } : s)
      return next
    })
    setSelectedSlotIndex(null)
    setShowPlayerPicker(false)
  }

  function clearSlot(slotIndex: number) {
    setCurrentSlots(prev => prev.map((s, i) => i === slotIndex ? { ...s, player: null } : s))
    setSelectedSlotIndex(null)
    setShowPlayerPicker(false)
  }

  function resetLineup() {
    setCurrentSlots(buildSlots(currentFormation))
    setSelectedSlotIndex(null)
    setShowPlayerPicker(false)
  }

  function getSvgPoint(e: React.PointerEvent): { x: number; y: number } | null {
    const svg = svgRef.current
    if (!svg) return null
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return null
    return pt.matrixTransform(ctm.inverse())
  }

  function handlePointerDown(e: React.PointerEvent, slotIndex: number) {
    if (!currentSlots[slotIndex].player) {
      handleSlotClick(slotIndex)
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    draggingRef.current = { slotIndex }
    setSelectedSlotIndex(slotIndex)
    setShowPlayerPicker(false)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!draggingRef.current) return
    const pt = getSvgPoint(e)
    if (!pt) return
    const { slotIndex } = draggingRef.current
    setCurrentSlots(prev => prev.map((s, i) =>
      i === slotIndex ? { ...s, x: Math.max(20, Math.min(280, pt.x)), y: Math.max(20, Math.min(405, pt.y)) } : s
    ))
  }

  function handlePointerUp(e: React.PointerEvent) {
    draggingRef.current = null
  }

  async function save() {
    if (!currentTeamId) return
    setSaving(true)
    setSaveError('')
    setSaveOk(false)

    const lineup = currentSlots.map((slot, index) => ({
      player_id: slot.player?.id ?? null,
      full_name: slot.player?.full_name ?? '',
      jersey_number: slot.player?.jersey_number ?? null,
      position: slot.player?.position ?? slot.label,
      lineup_status: slot.player ? 'starter' : 'bench',
      sort_order: index,
    })).filter(e => e.player_id)

    const benchPlayers = benched.map((p, i) => ({
      player_id: p.id,
      full_name: p.full_name,
      jersey_number: p.jersey_number ?? null,
      position: p.position ?? null,
      lineup_status: 'bench',
      sort_order: lineup.length + i,
    }))

    const supabase = createClient()
    const { error } = await (supabase as any)
      .from('formations')
      .upsert({
        fixture_id: fixtureId,
        team_id: currentTeamId,
        formation: currentFormation,
        lineup: [...lineup, ...benchPlayers],
      }, { onConflict: 'fixture_id,team_id' })

    setSaving(false)
    if (error) {
      setSaveError(error.message)
    } else {
      setSaveOk(true)
      setTimeout(() => setSaveOk(false), 2500)
    }
  }

  const canEdit = (teamId: string | null) => {
    if (userRole === 'super_admin') return true
    return assignedTeamId === teamId
  }

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const editable = canEdit(currentTeamId)
  const teamEditors: TeamEdit[] = [
    ...(homeTeamId ? [{ teamId: homeTeamId, teamName: homeTeamName, side: 'home' as const }] : []),
    ...(awayTeamId ? [{ teamId: awayTeamId, teamName: awayTeamName, side: 'away' as const }] : []),
  ].filter(t => canEdit(t.teamId))

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/matches"
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={14} />
          Back to matches
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-text-primary">Formation Editor</h1>
        <p className="mt-1 text-sm text-text-muted">
          {homeTeamName} vs {awayTeamName}
        </p>
      </div>

      {teamEditors.length > 1 && (
        <div className="flex gap-2">
          {teamEditors.map(t => (
            <button
              key={t.teamId}
              onClick={() => { setActiveTeam(t.side); setSelectedSlotIndex(null); setShowPlayerPicker(false) }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTeam === t.side
                  ? 'text-white'
                  : 'bg-bg-muted text-text-secondary hover:text-text-primary border border-bg-border'
              }`}
              style={activeTeam === t.side ? { backgroundColor: getTeamBranding(t.teamName).primary } : undefined}
            >
              {t.teamName}
            </button>
          ))}
        </div>
      )}

      {teamEditors.length === 0 && (
        <p className="text-sm text-text-muted">You do not have permission to edit lineups for this fixture.</p>
      )}

      {editable && (
        <>
          <div className="flex items-end gap-4 flex-wrap">
            <div className="flex-1 min-w-[160px]">
              <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Formation
              </label>
              <div className="relative">
                <select
                  value={currentFormation}
                  onChange={e => handleFormationChange(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-[#333] bg-[#111] px-4 py-2.5 pr-10 text-sm text-text-primary focus:border-brand-primary focus:outline-none"
                >
                  {FORMATIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={resetLineup}
                className="flex items-center gap-1.5 rounded-xl border border-[#333] bg-[#111] px-3 py-2.5 text-xs text-text-muted hover:text-text-primary transition-colors"
                title="Clear all players from the pitch"
              >
                <RotateCcw size={12} />
                Reset
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-50"
              >
                <Save size={14} />
                {saving ? 'Saving...' : saveOk ? 'Saved!' : 'Save lineup'}
              </button>
            </div>
          </div>

          {saveError && <p className="text-sm text-red-400">{saveError}</p>}

          <div className="rounded-2xl border border-[#1e1e1e] bg-[#111] p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted px-1">
              Click a slot to assign a player. Drag to reposition.
            </p>
            <svg
              ref={svgRef}
              viewBox="0 0 300 420"
              className="w-full max-w-xs mx-auto block select-none"
              style={{ maxHeight: 440, touchAction: 'none' }}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <rect x="5" y="5" width="290" height="410" fill="#1a5c2a" rx="3" />
              <rect x="5" y="5" width="290" height="410" fill="none" stroke="white" strokeWidth="2" rx="3" />
              <line x1="5" y1="210" x2="295" y2="210" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" />
              <circle cx="150" cy="210" r="45" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" />
              <circle cx="150" cy="210" r="3" fill="white" fillOpacity="0.5" />
              <rect x="78" y="5" width="144" height="72" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" />
              <rect x="108" y="5" width="84" height="27" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" />
              <circle cx="150" cy="64" r="2.5" fill="white" fillOpacity="0.5" />
              <rect x="78" y="343" width="144" height="72" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" />
              <rect x="108" y="388" width="84" height="27" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" />
              <circle cx="150" cy="356" r="2.5" fill="white" fillOpacity="0.5" />

              {currentSlots.map(slot => {
                const isSelected = selectedSlotIndex === slot.index
                const hasPlayer = slot.player !== null
                return (
                  <g
                    key={slot.index}
                    style={{ cursor: hasPlayer ? 'grab' : 'pointer' }}
                    onPointerDown={e => handlePointerDown(e, slot.index)}
                  >
                    <circle
                      cx={slot.x}
                      cy={slot.y}
                      r={16}
                      fill={hasPlayer ? branding.primary : '#1e2a1e'}
                      stroke={isSelected ? 'white' : hasPlayer ? branding.secondary : '#3a4a3a'}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      opacity={0.95}
                    />
                    {hasPlayer ? (
                      <>
                        <text
                          x={slot.x}
                          y={slot.y + 0.5}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="white"
                          fontSize={10}
                          fontWeight={700}
                          style={{ fontFamily: 'system-ui, sans-serif', pointerEvents: 'none' }}
                        >
                          {slot.player!.jersey_number ?? '?'}
                        </text>
                        <text
                          x={slot.x}
                          y={slot.y + 25}
                          textAnchor="middle"
                          fill="white"
                          fontSize={7.5}
                          opacity={0.9}
                          style={{ fontFamily: 'system-ui, sans-serif', pointerEvents: 'none' }}
                        >
                          {slot.player!.full_name.split(' ').slice(-1)[0]}
                        </text>
                      </>
                    ) : (
                      <text
                        x={slot.x}
                        y={slot.y + 0.5}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={isSelected ? 'white' : '#5a7a5a'}
                        fontSize={8}
                        fontWeight={600}
                        style={{ fontFamily: 'system-ui, sans-serif', pointerEvents: 'none' }}
                      >
                        {slot.label}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>

            <div className="mt-3 flex items-center justify-center gap-3 text-xs text-text-muted">
              <span>{starterCount}/11 starters</span>
              <span className="opacity-40">|</span>
              <span>{benched.length} on bench</span>
            </div>
          </div>

          {showPlayerPicker && selectedSlotIndex !== null && (
            <div className="rounded-2xl border border-[#1e1e1e] bg-[#111] p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-text-primary">
                  Assign player to <span style={{ color: branding.accent }}>{currentSlots[selectedSlotIndex]?.label}</span> slot
                </p>
                {currentSlots[selectedSlotIndex]?.player && (
                  <button
                    onClick={() => clearSlot(selectedSlotIndex)}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    <UserX size={12} />
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-1.5 max-h-64 overflow-y-auto">
                {currentSquad.map(player => {
                  const inSlot = currentSlots.findIndex(s => s.player?.id === player.id)
                  const isAssigned = inSlot >= 0 && inSlot !== selectedSlotIndex
                  const isCurrent = currentSlots[selectedSlotIndex]?.player?.id === player.id
                  return (
                    <button
                      key={player.id}
                      onClick={() => assignPlayer(player)}
                      disabled={isAssigned}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                        isCurrent
                          ? 'border border-brand-primary/30 bg-brand-primary/10 text-text-primary'
                          : isAssigned
                            ? 'opacity-30 cursor-not-allowed text-text-muted'
                            : 'bg-white/[0.03] hover:bg-white/[0.07] text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px] shrink-0"
                        style={{ backgroundColor: isAssigned ? '#333' : branding.primary }}
                      >
                        {player.jersey_number ?? '?'}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block truncate font-medium">{player.full_name}</span>
                        <span className="block text-xs text-text-muted">{player.position ?? 'Position pending'}</span>
                      </span>
                      {isAssigned && (
                        <span className="text-[10px] text-text-muted shrink-0">
                          Slot {inSlot}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {benched.length > 0 && (
            <div className="rounded-2xl border border-[#1e1e1e] bg-[#0d0d0d] p-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Bench</p>
              <div className="grid grid-cols-2 gap-1.5">
                {benched.map(player => (
                  <div
                    key={player.id}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-text-muted bg-white/[0.02] border border-white/[0.05]"
                  >
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 bg-[#1e1e1e] border border-[#333] text-text-muted">
                      {player.jersey_number ?? '?'}
                    </span>
                    <span className="truncate">{player.full_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
