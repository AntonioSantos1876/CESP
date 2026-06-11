'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Calendar, Clock, MapPin, Radio, Play,
  ChevronLeft, ChevronRight, Trophy
} from 'lucide-react'
import Link from 'next/link'
import { TeamLogo } from '@/components/TeamLogo'
import { createClient } from '@/lib/supabase/client'
import { getTeamBranding, getTeamHref, hexToRgba } from '@/lib/school-teams'

type FixtureStatus = 'upcoming' | 'live' | 'result'
type DetailTab = 'info' | 'lineups'
type LineupTeam = 'home' | 'away'

type Player = {
  number: number
  name: string
  position: string
  x: number
  y: number
  photo_url?: string | null
}

type BenchPlayer = {
  number: number
  name: string
  position: string | null
  photo_url?: string | null
}

type LineupData = {
  formation: string
  players: Player[]
  bench: BenchPlayer[]
}

type DbPlayer = {
  id: string
  full_name: string
  position: string | null
  jersey_number: number | null
  is_starter: boolean
  photo_url?: string | null
}

type LineupEntry = {
  full_name: string
  position: string | null
  jersey_number: number | null
  is_starter: boolean
  sort_order: number
  photo_url?: string | null
}

type DbFormation = {
  formation: string
  lineup: Array<{
    player_id?: string
    full_name?: string
    position?: string | null
    jersey_number?: number | null
    lineup_status?: 'starter' | 'bench' | 'out'
    sort_order?: number
  }> | null
}

type FixtureData = {
  id: string
  home: string
  away: string
  homeTeamId: string | null
  awayTeamId: string | null
  date: string
  time: string
  venue: string
  homeScore: number | null
  awayScore: number | null
  status: FixtureStatus
  round: string
  season: string
  referee: string
  youtubeId: string | null
  matchDate: string
}

type DbFixture = {
  id: string
  home_team_id: string
  away_team_id: string
  match_date: string
  venue: string | null
  round: string | null
  status: 'scheduled' | 'live' | 'completed' | 'postponed' | 'cancelled'
  home_team: { name: string } | null
  away_team: { name: string } | null
  match_scores: { home_score: number; away_score: number }[] | { home_score: number; away_score: number } | null
}

const ALL_FIXTURES: FixtureData[] = [
  {
    id: '1', home: 'Vere Technical High School', away: 'Mona High School', homeTeamId: null, awayTeamId: null, date: '2026-07-31', time: '10:00',
    venue: 'Glenmuir High School', homeScore: null, awayScore: null, status: 'upcoming',
    round: 'Quarter-final 1', season: '2026 Clarendon Elite Cup', referee: 'J. Brown',
    youtubeId: null, matchDate: '2026-07-31T10:00:00',
  },
  {
    id: '2', home: 'Denbigh High School', away: 'Excelsior High School', homeTeamId: null, awayTeamId: null, date: '2026-07-31', time: '12:00',
    venue: 'Glenmuir High School', homeScore: null, awayScore: null, status: 'upcoming',
    round: 'Quarter-final 2', season: '2026 Clarendon Elite Cup', referee: 'D. Wilson',
    youtubeId: null, matchDate: '2026-07-31T12:00:00',
  },
  {
    id: '3', home: 'Kingston College', away: 'Manchester High School', homeTeamId: null, awayTeamId: null, date: '2026-07-31', time: '14:00',
    venue: 'Glenmuir High School', homeScore: null, awayScore: null, status: 'upcoming',
    round: 'Quarter-final 3', season: '2026 Clarendon Elite Cup', referee: 'A. Clarke',
    youtubeId: null, matchDate: '2026-07-31T14:00:00',
  },
  {
    id: '4', home: 'Glenmuir High School', away: 'Munro College', homeTeamId: null, awayTeamId: null, date: '2026-07-31', time: '16:00',
    venue: 'Glenmuir High School', homeScore: null, awayScore: null, status: 'upcoming',
    round: 'Quarter-final 4', season: '2026 Clarendon Elite Cup', referee: 'R. Davis',
    youtubeId: null, matchDate: '2026-07-31T16:00:00',
  },
]

/**
 * Extract the date portion (YYYY-MM-DD) directly from an ISO datetime string
 * to avoid local-timezone shifts when displaying dates.
 */
function getDateKey(matchDate: string) {
  return matchDate.slice(0, 10) // 'YYYY-MM-DD'
}

/**
 * Extract HH:MM directly from an ISO datetime string without timezone conversion.
 * The time the admin enters is the intended wall-clock kickoff time.
 */
function formatMatchTime(matchDate: string) {
  const timePart = matchDate.slice(11, 16) // 'HH:MM'
  if (!timePart || timePart.length < 5) {
    return new Date(matchDate).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    })
  }
  return timePart
}

function mapDbStatus(status: DbFixture['status']): FixtureStatus {
  if (status === 'live') return 'live'
  if (status === 'completed') return 'result'
  return 'upcoming'
}

function getScore(matchScores: DbFixture['match_scores']) {
  if (!matchScores) return { home: null, away: null }
  const score = Array.isArray(matchScores) ? (matchScores[0] ?? null) : matchScores
  if (!score) return { home: null, away: null }
  return { home: score.home_score, away: score.away_score }
}

function toFixtureData(row: DbFixture): FixtureData {
  const home = row.home_team?.name ?? 'TBD'
  const away = row.away_team?.name ?? 'TBD'
  const date = getDateKey(row.match_date)
  const fallback = ALL_FIXTURES.find(
    fixture => fixture.home === home && fixture.away === away && fixture.date === date
  )
  const score = getScore(row.match_scores)

  return {
    id: row.id,
    home,
    away,
    homeTeamId: row.home_team_id,
    awayTeamId: row.away_team_id,
    date,
    time: formatMatchTime(row.match_date),
    venue: row.venue ?? fallback?.venue ?? 'Venue TBC',
    homeScore: score.home,
    awayScore: score.away,
    status: mapDbStatus(row.status),
    round: row.round ?? fallback?.round ?? 'Fixture',
    season: fallback?.season ?? '2026 Clarendon Elite Cup',
    referee: fallback?.referee ?? 'TBC',
    youtubeId: fallback?.youtubeId ?? null,
    matchDate: row.match_date,
  }
}

function categorizePosition(pos: string | null): 'GK' | 'DEF' | 'MID' | 'FWD' {
  if (!pos) return 'MID'
  const p = pos.toLowerCase()
  if (p.includes('gk') || p.includes('goal')) return 'GK'
  if (p.includes('def') || p.includes('back') || p === 'cb' || p === 'rb' || p === 'lb' || p === 'rwb' || p === 'lwb') return 'DEF'
  if (p.includes('fwd') || p.includes('forward') || p.includes('striker') || p.includes('wing') || p === 'st' || p === 'cf' || p === 'rw' || p === 'lw') return 'FWD'
  return 'MID'
}

function spreadX(count: number, index: number): number {
  const left = 35
  const right = 265
  if (count === 1) return 150
  return Math.round(left + ((right - left) / (count - 1)) * index)
}

function buildLineup(entries: LineupEntry[], side: 'home' | 'away', formationOverride?: string | null): LineupData | null {
  if (entries.length === 0) return null

  const starters = entries.filter(player => player.is_starter)
  const nonStarters = entries.filter(player => !player.is_starter)

  // Only place actual starters on the pitch; fall back to all entries if none are marked
  const pitchPlayers = starters.length > 0 ? starters : entries

  const gks = pitchPlayers.filter(p => categorizePosition(p.position) === 'GK')
  const outfield = pitchPlayers.filter(p => categorizePosition(p.position) !== 'GK')
  const gk = gks[0]
  const selected = outfield.slice(0, 10)

  // Bench is all non-starters (empty when no starters are set, since everyone is on pitch)
  const bench: BenchPlayer[] = (starters.length > 0 ? nonStarters : []).map(p => ({
    number: p.jersey_number ?? 0,
    name: p.full_name,
    position: p.position ?? null,
    photo_url: p.photo_url ?? null,
  }))

  const hasMeaningful = selected.some(p => {
    const pos = (p.position ?? '').toLowerCase()
    return pos && !pos.includes('pending') && !pos.includes('unknown') && pos !== ''
  })

  let defs: LineupEntry[], mids: LineupEntry[], fwds: LineupEntry[]

  if (hasMeaningful) {
    defs = selected.filter(p => categorizePosition(p.position) === 'DEF')
    mids = selected.filter(p => categorizePosition(p.position) === 'MID')
    fwds = selected.filter(p => categorizePosition(p.position) === 'FWD')
  } else {
    defs = selected.slice(0, 4)
    mids = selected.slice(4, 8)
    fwds = selected.slice(8)
  }

  const yGK = side === 'home' ? 393 : 27
  const yDEF = side === 'home' ? 325 : 95
  const yMID = side === 'home' ? 237 : 178
  const yFWD = side === 'home' ? 143 : 278

  const players: Player[] = []

  if (gk) {
    players.push({ number: gk.jersey_number ?? 1, name: gk.full_name, position: 'GK', x: 150, y: yGK, photo_url: gk.photo_url ?? null })
  }

  defs.forEach((p, i) => players.push({
    number: p.jersey_number ?? (i + 2),
    name: p.full_name,
    position: p.position ?? 'DEF',
    x: spreadX(defs.length, i),
    y: yDEF,
    photo_url: p.photo_url ?? null,
  }))

  mids.forEach((p, i) => players.push({
    number: p.jersey_number ?? (defs.length + i + 2),
    name: p.full_name,
    position: p.position ?? 'MID',
    x: spreadX(mids.length, i),
    y: yMID,
    photo_url: p.photo_url ?? null,
  }))

  fwds.forEach((p, i) => players.push({
    number: p.jersey_number ?? (defs.length + mids.length + i + 2),
    name: p.full_name,
    position: p.position ?? 'FWD',
    x: spreadX(fwds.length, i),
    y: yFWD,
    photo_url: p.photo_url ?? null,
  }))

  const formationParts = [defs.length, mids.length, fwds.length].filter(n => n > 0)
  const formation = formationOverride || (formationParts.length ? formationParts.join('-') : '4-3-3')

  return { formation, players, bench }
}

function normalizeFormationLineup(lineup: DbFormation['lineup']): LineupEntry[] {
  if (!Array.isArray(lineup)) return []

  return lineup.flatMap((player, index) => {
    if (!player?.full_name) return []

    return [{
      full_name: player.full_name,
      position: typeof player.position === 'string' ? player.position : null,
      jersey_number: typeof player.jersey_number === 'number' ? player.jersey_number : null,
      is_starter: player.lineup_status === 'starter',
      sort_order: typeof player.sort_order === 'number' ? player.sort_order : index,
      photo_url: null,
    }]
  }).sort((left, right) => left.sort_order - right.sort_order)
}

async function fetchLineup(teamId: string, fixtureId: string, side: 'home' | 'away'): Promise<LineupData | null> {
  const supabase = createClient()
  const { data: formationRow } = await (supabase as any)
    .from('formations')
    .select('formation, lineup')
    .eq('fixture_id', fixtureId)
    .eq('team_id', teamId)
    .maybeSingle()

  const savedEntries = normalizeFormationLineup((formationRow as DbFormation | null)?.lineup ?? null)
  if (savedEntries.length > 0) {
    return buildLineup(savedEntries, side, (formationRow as DbFormation | null)?.formation ?? null)
  }

  const { data: players } = await (supabase as any)
    .from('players')
    .select('id, full_name, position, jersey_number, is_starter, photo_url')
    .eq('team_id', teamId)
    .eq('is_active', true)
    .order('is_starter', { ascending: false })
    .order('jersey_number', { ascending: true })

  const fallbackEntries = ((players ?? []) as DbPlayer[]).map((player, index) => ({
    full_name: player.full_name,
    position: player.position,
    jersey_number: player.jersey_number,
    is_starter: player.is_starter,
    sort_order: index,
    photo_url: player.photo_url ?? null,
  }))

  return buildLineup(fallbackEntries, side)
}

function PitchViewer({
  homeTeam,
  awayTeam,
  activeTeam,
  homeLineup,
  awayLineup,
  lineupsLoading,
}: {
  homeTeam: string
  awayTeam: string
  activeTeam: LineupTeam
  homeLineup: LineupData | null
  awayLineup: LineupData | null
  lineupsLoading: boolean
}) {
  const [selectedPlayer, setSelectedPlayer] = useState<(Player & { team: LineupTeam }) | null>(null)
  const homeBranding = getTeamBranding(homeTeam)
  const awayBranding = getTeamBranding(awayTeam)

  function handlePlayerClick(player: Player, team: LineupTeam) {
    if (selectedPlayer?.number === player.number && selectedPlayer.team === team) {
      setSelectedPlayer(null)
    } else {
      setSelectedPlayer({ ...player, team })
    }
  }

  function renderPlayers(lineup: LineupData | null, team: LineupTeam) {
    if (!lineup) return null
    const isActive = activeTeam === team
    const branding = team === 'home' ? homeBranding : awayBranding
    const color = branding.primary
    const borderColor = branding.secondary

    return lineup.players.map(p => {
      const isSelected = selectedPlayer?.number === p.number && selectedPlayer.team === team
      return (
        <g
          key={`${team}-${p.number}`}
          style={{ cursor: 'pointer' }}
          opacity={isActive ? 1 : 0.32}
          onClick={() => handlePlayerClick(p, team)}
        >
          <circle
            cx={p.x}
            cy={p.y}
            r={15}
            fill={color}
            stroke={isSelected ? 'white' : borderColor}
            strokeWidth={isSelected ? 2.5 : 1.5}
          />
          <text
            x={p.x}
            y={p.y + 0.5}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={10}
            fontWeight={700}
            style={{ fontFamily: 'system-ui, sans-serif', pointerEvents: 'none' }}
          >
            {p.number}
          </text>
          <text
            x={p.x}
            y={p.y + 24}
            textAnchor="middle"
            fill="white"
            fontSize={8}
            opacity={0.85}
            style={{ fontFamily: 'system-ui, sans-serif', pointerEvents: 'none' }}
          >
            {p.name.split(' ').slice(-1)[0]}
          </text>
        </g>
      )
    })
  }

  const currentLineup = activeTeam === 'home' ? homeLineup : awayLineup

  if (lineupsLoading) {
    return <div className="py-10 text-center text-sm text-text-muted">Loading lineups...</div>
  }

  if (!homeLineup && !awayLineup) {
    return (
      <div className="py-10 text-center text-sm text-text-muted">
        Lineups will be announced closer to kickoff.
      </div>
    )
  }

  return (
    <div>
      <div className="relative">
        <svg
          viewBox="0 0 300 420"
          className="w-full max-w-xs mx-auto block"
          style={{ maxHeight: 440 }}
        >
          <rect x="5" y="5" width="290" height="410" fill="#1a5c2a" rx="3" />
          <rect x="5" y="5" width="290" height="410" fill="none" stroke="white" strokeWidth="2" rx="3" />
          <line x1="5" y1="210" x2="295" y2="210" stroke="white" strokeWidth="1.5" strokeOpacity="0.65" />
          <circle cx="150" cy="210" r="45" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.65" />
          <circle cx="150" cy="210" r="3" fill="white" fillOpacity="0.65" />
          <rect x="78" y="5" width="144" height="72" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.65" />
          <rect x="108" y="5" width="84" height="27" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.65" />
          <circle cx="150" cy="64" r="2.5" fill="white" fillOpacity="0.65" />
          <rect x="78" y="343" width="144" height="72" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.65" />
          <rect x="108" y="388" width="84" height="27" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.65" />
          <circle cx="150" cy="356" r="2.5" fill="white" fillOpacity="0.65" />
          <text x="150" y="410" textAnchor="middle" fontSize="8" opacity="0.5"
            style={{ fontFamily: 'system-ui, sans-serif', fill: homeBranding.accent }}>
            {homeTeam.split(' ')[0]} attacking
          </text>
          <text x="150" y="18" textAnchor="middle" fontSize="8" opacity="0.5"
            style={{ fontFamily: 'system-ui, sans-serif', fill: awayBranding.accent }}>
            {awayTeam.split(' ')[0]} attacking
          </text>
          {renderPlayers(awayLineup, 'away')}
          {renderPlayers(homeLineup, 'home')}
        </svg>
      </div>

      <AnimatePresence>
        {selectedPlayer && (
          <motion.div
            key={`${selectedPlayer.team}-${selectedPlayer.number}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="mt-3 mx-auto max-w-xs card flex items-center gap-4"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-white text-sm"
              style={{ backgroundColor: selectedPlayer.team === 'home' ? homeBranding.primary : awayBranding.primary }}
            >
              {selectedPlayer.number}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-text-primary text-sm">{selectedPlayer.name}</p>
              <p className="text-xs text-text-muted">{selectedPlayer.position} &middot; {selectedPlayer.team === 'home' ? homeTeam : awayTeam}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-text-muted">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: homeBranding.primary }} />
          {homeTeam.split(' ')[0]} {homeLineup ? `(${homeLineup.formation})` : '(TBA)'}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full inline-block border" style={{ backgroundColor: awayBranding.primary, borderColor: awayBranding.secondary }} />
          {awayTeam.split(' ')[0]} {awayLineup ? `(${awayLineup.formation})` : '(TBA)'}
        </div>
      </div>

      {currentLineup ? (
        <div className="mt-4">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Starting XI</p>
          <div className="grid grid-cols-2 gap-1.5">
            {currentLineup.players.map(p => (
              <button
                key={p.number}
                onClick={() => handlePlayerClick(p, activeTeam)}
                className={`flex items-center gap-2 text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                  selectedPlayer?.number === p.number && selectedPlayer.team === activeTeam
                    ? ''
                    : 'hover:bg-bg-muted text-text-secondary'
                }`}
                style={selectedPlayer?.number === p.number && selectedPlayer.team === activeTeam
                  ? {
                      backgroundColor: hexToRgba(activeTeam === 'home' ? homeBranding.primary : awayBranding.primary, 0.18),
                      color: activeTeam === 'home' ? homeBranding.accent : awayBranding.accent,
                    }
                  : undefined}
              >
                {p.photo_url ? (
                  <img
                    src={p.photo_url}
                    alt={p.name}
                    className="w-6 h-6 rounded-full object-cover shrink-0 border"
                    style={{ borderColor: activeTeam === 'home' ? homeBranding.primary : awayBranding.primary }}
                  />
                ) : (
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[9px] shrink-0"
                    style={{ backgroundColor: activeTeam === 'home' ? homeBranding.primary : awayBranding.primary }}
                  >
                    {p.number}
                  </span>
                )}
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
          {currentLineup.bench.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#1e1e1e]">
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Bench</p>
              <div className="grid grid-cols-2 gap-1">
                {currentLineup.bench.map(p => (
                  <div key={p.number} className="flex items-center gap-2 px-3 py-1.5 text-xs text-text-muted">
                    {p.photo_url ? (
                      <img
                        src={p.photo_url}
                        alt={p.name}
                        className="w-6 h-6 rounded-full object-cover shrink-0 border border-[#333]"
                      />
                    ) : (
                      <span className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 bg-[#1e1e1e] border border-[#333] text-text-muted">
                        {p.number || '?'}
                      </span>
                    )}
                    <span className="truncate">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-4 text-center text-xs text-text-muted">
          {activeTeam === 'home' ? homeTeam.split(' ')[0] : awayTeam.split(' ')[0]} lineup not yet announced.
        </p>
      )}
    </div>
  )
}

export default function FixtureDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [tab, setTab] = useState<DetailTab>('info')
  const [lineupTeam, setLineupTeam] = useState<LineupTeam>('home')
  const [fixture, setFixture] = useState<FixtureData | null>(null)
  const [fixtureList, setFixtureList] = useState<FixtureData[]>([])
  const [fixtureLoading, setFixtureLoading] = useState(true)
  const [liveStatus, setLiveStatus] = useState<FixtureStatus | null>(null)
  const [homeLineup, setHomeLineup] = useState<LineupData | null>(null)
  const [awayLineup, setAwayLineup] = useState<LineupData | null>(null)
  const [lineupsLoading, setLineupsLoading] = useState(true)

  const currentStatus = liveStatus ?? fixture?.status ?? 'upcoming'
  const isLive = currentStatus === 'live'
  const isResult = currentStatus === 'result'
  const hasScore = isLive || isResult
  const homeBranding = getTeamBranding(fixture?.home ?? '')
  const awayBranding = getTeamBranding(fixture?.away ?? '')

  useEffect(() => {
    let active = true

    async function loadFixture() {
      setFixtureLoading(true)
      const supabase = createClient()
      const { data: fixturesData } = await (supabase as any)
        .from('fixtures')
        .select(`
          id,
          home_team_id,
          away_team_id,
          match_date,
          venue,
          round,
          status,
          match_scores(home_score, away_score),
          home_team:teams!fixtures_home_team_id_fkey(name),
          away_team:teams!fixtures_away_team_id_fkey(name)
        `)
        .order('match_date', { ascending: true })

      if (!active) return

      const dbFixtures = ((fixturesData ?? []) as DbFixture[]).map(toFixtureData)
      const sourceFixtures = dbFixtures.length > 0 ? dbFixtures : ALL_FIXTURES
      const match = sourceFixtures.find(item => item.id === params.id) ?? null

      setFixtureList(sourceFixtures)
      setFixture(match)
      setLiveStatus(null)
      setFixtureLoading(false)
    }

    loadFixture()

    return () => { active = false }
  }, [params.id])

  useEffect(() => {
    if (!fixture) return

    const supabase = createClient()
    const channel = supabase
      .channel(`fixture_${fixture.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'fixtures', filter: `id=eq.${fixture.id}` },
        (payload) => {
          const updated = payload.new as { status: DbFixture['status'] }
          setLiveStatus(mapDbStatus(updated.status))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fixture?.id])

  useEffect(() => {
    if (!fixture || !fixture.homeTeamId || !fixture.awayTeamId) { setLineupsLoading(false); return }

    setLineupsLoading(true)
    Promise.all([
      fetchLineup(fixture.homeTeamId, fixture.id, 'home'),
      fetchLineup(fixture.awayTeamId, fixture.id, 'away'),
    ]).then(([home, away]) => {
      setHomeLineup(home)
      setAwayLineup(away)
      setLineupsLoading(false)
    })
  }, [fixture?.awayTeamId, fixture?.homeTeamId, fixture?.id])

  if (fixtureLoading) {
    return (
      <main className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  if (!fixture) {
    return (
      <main className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center">
          <Trophy size={48} className="text-text-muted mx-auto mb-4" />
          <h1 className="text-xl font-bold text-text-primary mb-2">Match not found</h1>
          <p className="text-text-muted mb-6">This fixture does not exist or has been removed.</p>
          <Link href="/fixtures" className="btn-primary">Back to fixtures</Link>
        </div>
      </main>
    )
  }

  const formattedDate = new Date(fixture.date + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <main className="min-h-screen bg-bg-base">
      <div className="container-cesp py-8 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={15} />
            Back to fixtures
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="card mb-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Calendar size={11} />
              <span>{formattedDate}</span>
              <Clock size={11} className="ml-1" />
              <span>{fixture.time}</span>
            </div>
            {isLive ? (
              <span className="flex items-center gap-1.5 text-brand-secondary text-xs font-bold uppercase tracking-wide">
                <span className="live-dot" />
                Live
              </span>
            ) : isResult ? (
              <span className="badge bg-bg-muted text-text-muted text-xs">Full Time</span>
            ) : (
              <span className="badge bg-brand-primary/10 text-brand-secondary border border-brand-primary/20 text-xs">
                Upcoming
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-center">
              <Link href={getTeamHref(fixture.home)} className="inline-flex flex-col items-center gap-2 transition-opacity hover:opacity-100">
                <TeamLogo teamName={fixture.home} size={56} />
                <p className="font-bold text-text-primary text-sm leading-tight">{fixture.home}</p>
              </Link>
            </div>

            <div className="shrink-0 text-center px-4">
              {hasScore ? (
                <div className="flex items-center gap-3">
                  <span className={`text-4xl font-bold ${isLive ? 'text-gradient' : 'text-text-primary'}`}>
                    {fixture.homeScore}
                  </span>
                  <span className="text-text-muted text-2xl font-light">-</span>
                  <span className={`text-4xl font-bold ${isLive ? 'text-gradient' : 'text-text-primary'}`}>
                    {fixture.awayScore}
                  </span>
                </div>
              ) : (
                <div>
                  <span className="text-2xl font-bold text-text-muted">vs</span>
                  <p className="text-xs text-text-muted mt-1">{fixture.time}</p>
                </div>
              )}
            </div>

            <div className="flex-1 text-center">
              <Link href={getTeamHref(fixture.away)} className="inline-flex flex-col items-center gap-2 transition-opacity hover:opacity-100">
                <TeamLogo teamName={fixture.away} size={56} />
                <p className="font-bold text-text-primary text-sm leading-tight">{fixture.away}</p>
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-bg-border flex items-center justify-center gap-2 text-xs text-text-muted">
            <MapPin size={11} />
            <span>{fixture.venue}</span>
          </div>
        </motion.div>

        {(isLive || (isResult && fixture.youtubeId)) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mb-6"
          >
            {isLive ? (
              <Link
                href={`/live${fixture.youtubeId ? `?stream=${fixture.youtubeId}` : ''}`}
                className="btn-primary w-full justify-center gap-2 py-3"
              >
                <Radio size={16} />
                Watch Live
              </Link>
            ) : (
              <a
                href={`https://www.youtube.com/watch?v=${fixture.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary w-full justify-center gap-2 py-3"
              >
                <Play size={16} />
                Watch Replay
              </a>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-5">
            {(['info', 'lineups'] as DetailTab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${
                  tab === t
                    ? 'bg-brand-primary text-white'
                    : 'bg-bg-muted text-text-secondary hover:text-text-primary border border-bg-border'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === 'info' ? (
              <motion.div
                key="info"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="card space-y-4"
              >
                {[
                  { label: 'Competition', value: fixture.season },
                  { label: 'Round', value: fixture.round },
                  { label: 'Venue', value: fixture.venue },
                  { label: 'Kickoff', value: `${formattedDate} at ${fixture.time}` },
                  { label: 'Referee', value: fixture.referee },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-bg-border last:border-0">
                    <span className="text-sm text-text-muted">{label}</span>
                    <span className="text-sm text-text-primary font-medium text-right max-w-[60%]">{value}</span>
                  </div>
                ))}

                {fixture.status === 'upcoming' && !fixture.youtubeId && (
                  <div className="mt-2 px-4 py-3 rounded-xl bg-bg-muted border border-bg-border text-sm text-text-muted text-center">
                    Stream details will be available closer to kickoff.
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="lineups"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="card"
              >
                <div className="flex items-center gap-2 mb-5">
                  <button
                    onClick={() => setLineupTeam('home')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      lineupTeam === 'home'
                        ? 'text-white'
                        : 'bg-bg-muted text-text-secondary hover:text-text-primary border border-bg-border'
                    }`}
                    style={lineupTeam === 'home' ? { backgroundColor: homeBranding.primary } : undefined}
                  >
                    {fixture.home.split(' ')[0]}
                  </button>
                  <button
                    onClick={() => setLineupTeam('away')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      lineupTeam === 'away'
                        ? 'text-white'
                        : 'bg-bg-muted text-text-secondary hover:text-text-primary border border-bg-border'
                    }`}
                    style={lineupTeam === 'away' ? { backgroundColor: awayBranding.primary } : undefined}
                  >
                    {fixture.away.split(' ')[0]}
                  </button>
                </div>

                <PitchViewer
                  homeTeam={fixture.home}
                  awayTeam={fixture.away}
                  activeTeam={lineupTeam}
                  homeLineup={homeLineup}
                  awayLineup={awayLineup}
                  lineupsLoading={lineupsLoading}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="mt-6 flex items-center justify-between">
          {(() => {
            const currentIndex = fixtureList.findIndex(f => f.id === fixture.id)
            const prev = currentIndex > 0 ? fixtureList[currentIndex - 1] : null
            const next = currentIndex >= 0 ? fixtureList[currentIndex + 1] ?? null : null
            return (
              <>
                {prev ? (
                  <Link href={`/fixtures/${prev.id}`} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
                    <ChevronLeft size={14} />
                    <span className="hidden sm:inline">{prev.home} vs {prev.away}</span>
                    <span className="sm:hidden">Prev</span>
                  </Link>
                ) : <div />}
                {next ? (
                  <Link href={`/fixtures/${next.id}`} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
                    <span className="hidden sm:inline">{next.home} vs {next.away}</span>
                    <span className="sm:hidden">Next</span>
                    <ChevronRight size={14} />
                  </Link>
                ) : <div />}
              </>
            )
          })()}
        </div>
      </div>
    </main>
  )
}
