'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Calendar, Clock, MapPin, Radio, Play,
  ChevronLeft, ChevronRight, Trophy
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type FixtureStatus = 'upcoming' | 'live' | 'result'
type DetailTab = 'info' | 'lineups'
type LineupTeam = 'home' | 'away'

type Player = {
  number: number
  name: string
  position: string
  x: number
  y: number
}

type LineupData = {
  formation: string
  players: Player[]
}

type FixtureData = {
  id: number
  home: string
  away: string
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
}

const ALL_FIXTURES: FixtureData[] = [
  {
    id: 9, home: 'Chapelton FC', away: 'Porus United', date: '2026-06-06', time: '15:00',
    venue: 'Glenmuir High School', homeScore: 1, awayScore: 0, status: 'live',
    round: 'Round 6', season: '2026 Clarendon Elite Cup', referee: 'M. Thompson',
    youtubeId: 'dQw4w9WgXcQ',
  },
  {
    id: 1, home: 'Chapelton FC', away: 'Manchester United Clarendon', date: '2026-07-05', time: '15:00',
    venue: 'Glenmuir High School', homeScore: null, awayScore: null, status: 'upcoming',
    round: 'Round 7', season: '2026 Clarendon Elite Cup', referee: 'J. Brown',
    youtubeId: null,
  },
  {
    id: 2, home: 'Spaldings All Stars', away: 'Rock River Rangers', date: '2026-07-05', time: '17:00',
    venue: 'Glenmuir High School', homeScore: null, awayScore: null, status: 'upcoming',
    round: 'Round 7', season: '2026 Clarendon Elite Cup', referee: 'D. Wilson',
    youtubeId: null,
  },
  {
    id: 3, home: 'Porus United', away: 'Frankfield Boys', date: '2026-07-06', time: '14:00',
    venue: 'Glenmuir High School', homeScore: null, awayScore: null, status: 'upcoming',
    round: 'Round 7', season: '2026 Clarendon Elite Cup', referee: 'A. Clarke',
    youtubeId: null,
  },
  {
    id: 4, home: 'Chapelton FC', away: 'Spaldings All Stars', date: '2026-06-28', time: '15:00',
    venue: 'Glenmuir High School', homeScore: 3, awayScore: 1, status: 'result',
    round: 'Round 5', season: '2026 Clarendon Elite Cup', referee: 'M. Thompson',
    youtubeId: null,
  },
  {
    id: 5, home: 'Rock River Rangers', away: 'Porus United', date: '2026-06-28', time: '17:00',
    venue: 'Glenmuir High School', homeScore: 2, awayScore: 2, status: 'result',
    round: 'Round 5', season: '2026 Clarendon Elite Cup', referee: 'J. Brown',
    youtubeId: null,
  },
  {
    id: 6, home: 'Frankfield Boys', away: 'Manchester United Clarendon', date: '2026-06-27', time: '15:30',
    venue: 'Glenmuir High School', homeScore: 1, awayScore: 3, status: 'result',
    round: 'Round 5', season: '2026 Clarendon Elite Cup', referee: 'R. Davis',
    youtubeId: null,
  },
  {
    id: 7, home: 'Spaldings All Stars', away: 'Porus United', date: '2026-06-21', time: '15:00',
    venue: 'Glenmuir High School', homeScore: 0, awayScore: 1, status: 'result',
    round: 'Round 4', season: '2026 Clarendon Elite Cup', referee: 'D. Wilson',
    youtubeId: null,
  },
  {
    id: 8, home: 'Manchester United Clarendon', away: 'Rock River Rangers', date: '2026-06-20', time: '14:00',
    venue: 'MUC Ground', homeScore: 4, awayScore: 0, status: 'result',
    round: 'Round 4', season: '2026 Clarendon Elite Cup', referee: 'A. Clarke',
    youtubeId: null,
  },
]

const HOME_LINEUP: LineupData = {
  formation: '4-3-3',
  players: [
    { number: 1, name: 'D. Brown', position: 'GK', x: 150, y: 393 },
    { number: 2, name: 'A. Smith', position: 'RB', x: 238, y: 330 },
    { number: 5, name: 'M. Taylor', position: 'CB', x: 186, y: 315 },
    { number: 6, name: 'R. Wilson', position: 'CB', x: 114, y: 315 },
    { number: 3, name: 'J. Clarke', position: 'LB', x: 62, y: 330 },
    { number: 10, name: 'T. White', position: 'RCM', x: 213, y: 237 },
    { number: 4, name: 'O. Davis', position: 'CM', x: 150, y: 222 },
    { number: 8, name: 'K. Johnson', position: 'LCM', x: 87, y: 237 },
    { number: 7, name: 'E. Thompson', position: 'RW', x: 232, y: 143 },
    { number: 9, name: 'B. Martin', position: 'ST', x: 150, y: 120 },
    { number: 11, name: 'C. Harris', position: 'LW', x: 68, y: 143 },
  ],
}

const AWAY_LINEUP: LineupData = {
  formation: '4-4-2',
  players: [
    { number: 1, name: 'S. Green', position: 'GK', x: 150, y: 27 },
    { number: 2, name: 'P. Lee', position: 'RB', x: 62, y: 90 },
    { number: 5, name: 'F. Garcia', position: 'CB', x: 114, y: 105 },
    { number: 6, name: 'H. Roberts', position: 'CB', x: 186, y: 105 },
    { number: 3, name: 'I. Lewis', position: 'LB', x: 238, y: 90 },
    { number: 7, name: 'L. Walker', position: 'RM', x: 68, y: 170 },
    { number: 8, name: 'N. Hall', position: 'RCM', x: 120, y: 188 },
    { number: 4, name: 'Y. Allen', position: 'LCM', x: 180, y: 188 },
    { number: 11, name: 'Q. Young', position: 'LM', x: 232, y: 170 },
    { number: 9, name: 'U. King', position: 'ST', x: 116, y: 283 },
    { number: 10, name: 'V. Scott', position: 'ST', x: 184, y: 283 },
  ],
}

function PitchViewer({
  homeTeam,
  awayTeam,
  activeTeam,
}: {
  homeTeam: string
  awayTeam: string
  activeTeam: LineupTeam
}) {
  const [selectedPlayer, setSelectedPlayer] = useState<(Player & { team: LineupTeam }) | null>(null)

  function handlePlayerClick(player: Player, team: LineupTeam) {
    if (selectedPlayer?.number === player.number && selectedPlayer.team === team) {
      setSelectedPlayer(null)
    } else {
      setSelectedPlayer({ ...player, team })
    }
  }

  function renderPlayers(lineup: LineupData, team: LineupTeam) {
    const isActive = activeTeam === team
    const color = team === 'home' ? '#E85D04' : '#374151'
    const borderColor = team === 'home' ? '#FF8C42' : '#6B7280'

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

  const currentLineup = activeTeam === 'home' ? HOME_LINEUP : AWAY_LINEUP

  return (
    <div>
      <div className="relative">
        <svg
          viewBox="0 0 300 420"
          className="w-full max-w-xs mx-auto block"
          style={{ maxHeight: 440 }}
        >
          {/* Grass base */}
          <rect x="5" y="5" width="290" height="410" fill="#1a5c2a" rx="3" />
          {/* Outer border */}
          <rect x="5" y="5" width="290" height="410" fill="none" stroke="white" strokeWidth="2" rx="3" />
          {/* Halfway line */}
          <line x1="5" y1="210" x2="295" y2="210" stroke="white" strokeWidth="1.5" strokeOpacity="0.65" />
          {/* Center circle */}
          <circle cx="150" cy="210" r="45" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.65" />
          {/* Center spot */}
          <circle cx="150" cy="210" r="3" fill="white" fillOpacity="0.65" />
          {/* Top penalty area */}
          <rect x="78" y="5" width="144" height="72" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.65" />
          {/* Top goal area */}
          <rect x="108" y="5" width="84" height="27" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.65" />
          {/* Top penalty spot */}
          <circle cx="150" cy="64" r="2.5" fill="white" fillOpacity="0.65" />
          {/* Bottom penalty area */}
          <rect x="78" y="343" width="144" height="72" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.65" />
          {/* Bottom goal area */}
          <rect x="108" y="388" width="84" height="27" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.65" />
          {/* Bottom penalty spot */}
          <circle cx="150" cy="356" r="2.5" fill="white" fillOpacity="0.65" />
          {/* Team labels */}
          <text x="150" y="410" textAnchor="middle" fill="white" fontSize="8" opacity="0.5"
            style={{ fontFamily: 'system-ui, sans-serif' }}>
            {homeTeam.split(' ')[0]} attacking
          </text>
          <text x="150" y="18" textAnchor="middle" fill="white" fontSize="8" opacity="0.5"
            style={{ fontFamily: 'system-ui, sans-serif' }}>
            {awayTeam.split(' ')[0]} attacking
          </text>
          {/* Players */}
          {renderPlayers(AWAY_LINEUP, 'away')}
          {renderPlayers(HOME_LINEUP, 'home')}
        </svg>
      </div>

      {/* Selected player popup */}
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
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-white text-sm ${selectedPlayer.team === 'home' ? 'bg-brand-primary' : 'bg-bg-hover'}`}>
              {selectedPlayer.number}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-text-primary text-sm">{selectedPlayer.name}</p>
              <p className="text-xs text-text-muted">{selectedPlayer.position} &middot; {selectedPlayer.team === 'home' ? homeTeam : awayTeam}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formation + legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-text-muted">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-brand-primary inline-block" />
          {homeTeam.split(' ')[0]} ({HOME_LINEUP.formation})
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-bg-hover border border-bg-border inline-block" />
          {awayTeam.split(' ')[0]} ({AWAY_LINEUP.formation})
        </div>
      </div>

      {/* Active team player list */}
      <div className="mt-4 grid grid-cols-2 gap-1.5">
        {currentLineup.players.map(p => (
          <button
            key={p.number}
            onClick={() => handlePlayerClick(p, activeTeam)}
            className={`flex items-center gap-2 text-left px-3 py-2 rounded-lg text-xs transition-colors ${
              selectedPlayer?.number === p.number && selectedPlayer.team === activeTeam
                ? 'bg-brand-primary/20 text-brand-secondary'
                : 'hover:bg-bg-muted text-text-secondary'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[9px] shrink-0 ${activeTeam === 'home' ? 'bg-brand-primary' : 'bg-bg-hover'}`}>
              {p.number}
            </span>
            <span className="truncate">{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function FixtureDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [tab, setTab] = useState<DetailTab>('info')
  const [lineupTeam, setLineupTeam] = useState<LineupTeam>('home')
  const [liveStatus, setLiveStatus] = useState<FixtureStatus | null>(null)

  const fixture = ALL_FIXTURES.find(f => f.id === Number(params.id))

  const currentStatus = liveStatus ?? fixture?.status ?? 'upcoming'
  const isLive = currentStatus === 'live'
  const isResult = currentStatus === 'result'
  const hasScore = isLive || isResult

  useEffect(() => {
    if (!fixture) return

    const supabase = createClient()
    const channel = supabase
      .channel(`fixture_${fixture.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'fixtures', filter: `id=eq.${fixture.id}` },
        (payload) => {
          const updated = payload.new as { status: FixtureStatus }
          setLiveStatus(updated.status)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fixture?.id])

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

  const matchDate = new Date(fixture.date + 'T' + fixture.time + ':00')
  const formattedDate = new Date(fixture.date + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <main className="min-h-screen bg-bg-base">
      <div className="container-cesp py-8 max-w-3xl">
        {/* Back button */}
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

        {/* Match header card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="card mb-6"
        >
          {/* Status / date strip */}
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

          {/* Teams + score */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center mx-auto mb-2">
                <Trophy size={24} className="text-brand-primary" />
              </div>
              <p className="font-bold text-text-primary text-sm leading-tight">{fixture.home}</p>
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
              <div className="w-14 h-14 rounded-2xl bg-bg-hover flex items-center justify-center mx-auto mb-2">
                <Trophy size={24} className="text-text-muted" />
              </div>
              <p className="font-bold text-text-primary text-sm leading-tight">{fixture.away}</p>
            </div>
          </div>

          {/* Venue */}
          <div className="mt-4 pt-4 border-t border-bg-border flex items-center justify-center gap-2 text-xs text-text-muted">
            <MapPin size={11} />
            <span>{fixture.venue}</span>
          </div>
        </motion.div>

        {/* Watch Live / Replay CTA */}
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

        {/* Info / Lineups tabs */}
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
                {/* Home / Away toggle */}
                <div className="flex items-center gap-2 mb-5">
                  <button
                    onClick={() => setLineupTeam('home')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      lineupTeam === 'home'
                        ? 'bg-brand-primary text-white'
                        : 'bg-bg-muted text-text-secondary hover:text-text-primary border border-bg-border'
                    }`}
                  >
                    {fixture.home.split(' ')[0]}
                  </button>
                  <button
                    onClick={() => setLineupTeam('away')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      lineupTeam === 'away'
                        ? 'bg-brand-primary text-white'
                        : 'bg-bg-muted text-text-secondary hover:text-text-primary border border-bg-border'
                    }`}
                  >
                    {fixture.away.split(' ')[0]}
                  </button>
                </div>

                <PitchViewer
                  homeTeam={fixture.home}
                  awayTeam={fixture.away}
                  activeTeam={lineupTeam}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Prev / Next fixture nav */}
        <div className="mt-6 flex items-center justify-between">
          {(() => {
            const currentIndex = ALL_FIXTURES.findIndex(f => f.id === fixture.id)
            const prev = ALL_FIXTURES[currentIndex - 1]
            const next = ALL_FIXTURES[currentIndex + 1]
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
