'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Radio, MessageSquare, BarChart2, Users, ChevronLeft,
  Eye, Send, Plus, Minus, Timer, StopCircle, AlertCircle,
  Pencil, Check, X, Maximize, Minimize,
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { TeamLink } from '@/components/TeamLink'
import { createClient } from '@/lib/supabase/client'
import { getTeamBranding, hexToRgba } from '@/lib/school-teams'

type StreamStatus = 'live' | 'vod'
type Tab = 'chat' | 'stats' | 'lineups'

type MatchData = {
  id: number
  home: string
  away: string
  date: string
  time: string
  venue: string
  homeScore: number
  awayScore: number
  status: StreamStatus
  youtubeId: string
  clock: string
}

type ChatMessage = {
  id: string
  author: string
  text: string
  ts: number
}

type Player = { num: number; name: string; pos: string }
type TeamLineup = { formation: string; players: Player[] }
type Lineups = { home: TeamLineup; away: TeamLineup }

const MATCHES: Record<string, MatchData> = {
  '9': { id: 9, home: 'Excelsior High School', away: 'Mona High School', date: '2026-06-06', time: '15:00', venue: 'Glenmuir High School', homeScore: 1, awayScore: 0, status: 'live', youtubeId: 'live_placeholder', clock: "62'" },
  '4': { id: 4, home: 'Munro College', away: 'Vere Technical High School', date: '2026-07-31', time: '16:00', venue: 'Glenmuir High School', homeScore: 0, awayScore: 0, status: 'vod', youtubeId: 'dQw4w9WgXcQ', clock: 'FT' },
  '5': { id: 5, home: 'Denbigh High School', away: 'Glenmuir High School', date: '2026-08-01', time: '14:00', venue: 'Glenmuir High School', homeScore: 2, awayScore: 1, status: 'vod', youtubeId: 'dQw4w9WgXcQ', clock: 'FT' },
  '6': { id: 6, home: 'Kingston College', away: 'Munro College', date: '2026-08-01', time: '16:00', venue: 'Glenmuir High School', homeScore: 1, awayScore: 3, status: 'vod', youtubeId: 'dQw4w9WgXcQ', clock: 'FT' },
}

const MOCK_CHAT: ChatMessage[] = [
  { id: '1', author: 'TrevorMac', text: 'Chapelton looking sharp today!', ts: Date.now() - 480000 },
  { id: '2', author: 'DenbighFan', text: 'Come on Porus, equalise!', ts: Date.now() - 360000 },
  { id: '3', author: 'CESPOfficial', text: 'GOAL! Chapelton take the lead in the 38th minute!', ts: Date.now() - 180000 },
  { id: '4', author: 'KingstonKid', text: 'What a strike that was', ts: Date.now() - 120000 },
  { id: '5', author: 'PaulusR', text: 'Porus have a corner coming up...', ts: Date.now() - 30000 },
]

const DEFAULT_LINEUPS: Lineups = {
  home: {
    formation: '4-3-3',
    players: [
      { num: 1, name: 'Dwayne Brown', pos: 'GK' },
      { num: 2, name: 'Marcus Reid', pos: 'RB' },
      { num: 5, name: 'Joel Campbell', pos: 'CB' },
      { num: 6, name: 'Damion White', pos: 'CB' },
      { num: 3, name: 'Andre Thomas', pos: 'LB' },
      { num: 8, name: 'Kerron Ellis', pos: 'CM' },
      { num: 4, name: 'Fabian Lewis', pos: 'CM' },
      { num: 10, name: 'Devon Clarke', pos: 'CAM' },
      { num: 11, name: 'Rajiv Graham', pos: 'RW' },
      { num: 9, name: 'Omar Grant', pos: 'ST' },
      { num: 7, name: 'Curtis Dean', pos: 'LW' },
    ],
  },
  away: {
    formation: '4-4-2',
    players: [
      { num: 1, name: 'Leroy Shaw', pos: 'GK' },
      { num: 2, name: 'Marlon Green', pos: 'RB' },
      { num: 5, name: 'Deon Murray', pos: 'CB' },
      { num: 6, name: 'Clive Salmon', pos: 'CB' },
      { num: 3, name: 'Kirk Powell', pos: 'LB' },
      { num: 7, name: 'Noel Blake', pos: 'RM' },
      { num: 8, name: 'Roy Williams', pos: 'CM' },
      { num: 4, name: 'Bryan Henry', pos: 'CM' },
      { num: 11, name: 'Lance Foster', pos: 'LM' },
      { num: 10, name: 'Patrick Reid', pos: 'ST' },
      { num: 9, name: 'Everton Small', pos: 'ST' },
    ],
  },
}

const STATS = [
  { label: 'Possession', home: '58%', away: '42%', homeVal: 58, awayVal: 42 },
  { label: 'Shots', home: '9', away: '4', homeVal: 9, awayVal: 4 },
  { label: 'Shots on Target', home: '4', away: '2', homeVal: 4, awayVal: 2 },
  { label: 'Corners', home: '5', away: '2', homeVal: 5, awayVal: 2 },
  { label: 'Fouls', home: '7', away: '11', homeVal: 7, awayVal: 11 },
  { label: 'Yellow Cards', home: '1', away: '2', homeVal: 1, awayVal: 2 },
]

// ---- Pitch formation coordinates ----
// Pitch viewBox: 0 0 100 160; home GK near y=148, away GK near y=12 (mirrored)
const PITCH_COORDS: Record<string, { x: number; y: number }[]> = {
  '4-3-3': [
    {x:50,y:148},{x:15,y:118},{x:38,y:115},{x:62,y:115},{x:85,y:118},
    {x:25,y:82},{x:50,y:76},{x:75,y:82},
    {x:12,y:44},{x:50,y:34},{x:88,y:44},
  ],
  '4-4-2': [
    {x:50,y:148},{x:15,y:118},{x:38,y:115},{x:62,y:115},{x:85,y:118},
    {x:10,y:80},{x:37,y:78},{x:63,y:78},{x:90,y:80},
    {x:35,y:40},{x:65,y:40},
  ],
  '4-2-3-1': [
    {x:50,y:148},{x:15,y:118},{x:38,y:115},{x:62,y:115},{x:85,y:118},
    {x:35,y:90},{x:65,y:90},
    {x:12,y:60},{x:50,y:58},{x:88,y:60},
    {x:50,y:34},
  ],
  '3-5-2': [
    {x:50,y:148},{x:22,y:112},{x:50,y:108},{x:78,y:112},
    {x:8,y:78},{x:30,y:80},{x:50,y:75},{x:70,y:80},{x:92,y:78},
    {x:35,y:40},{x:65,y:40},
  ],
  '5-3-2': [
    {x:50,y:148},{x:8,y:116},{x:28,y:112},{x:50,y:108},{x:72,y:112},{x:92,y:116},
    {x:25,y:78},{x:50,y:74},{x:75,y:78},
    {x:35,y:40},{x:65,y:40},
  ],
  '4-1-4-1': [
    {x:50,y:148},{x:15,y:118},{x:38,y:115},{x:62,y:115},{x:85,y:118},
    {x:50,y:92},
    {x:10,y:66},{x:35,y:64},{x:65,y:64},{x:90,y:66},
    {x:50,y:36},
  ],
  '4-3-2-1': [
    {x:50,y:148},{x:15,y:118},{x:38,y:115},{x:62,y:115},{x:85,y:118},
    {x:25,y:88},{x:50,y:84},{x:75,y:88},
    {x:30,y:56},{x:70,y:56},
    {x:50,y:34},
  ],
  '3-4-3': [
    {x:50,y:148},{x:22,y:112},{x:50,y:108},{x:78,y:112},
    {x:10,y:78},{x:37,y:76},{x:63,y:76},{x:90,y:78},
    {x:12,y:42},{x:50,y:32},{x:88,y:42},
  ],
  '4-5-1': [
    {x:50,y:148},{x:15,y:118},{x:38,y:115},{x:62,y:115},{x:85,y:118},
    {x:8,y:76},{x:28,y:74},{x:50,y:72},{x:72,y:74},{x:92,y:76},
    {x:50,y:36},
  ],
  '3-6-1': [
    {x:50,y:148},{x:20,y:112},{x:50,y:108},{x:80,y:112},
    {x:8,y:78},{x:28,y:76},{x:42,y:74},{x:58,y:74},{x:72,y:76},{x:92,y:78},
    {x:50,y:36},
  ],
}

const FORMATION_PRESETS = Object.keys(PITCH_COORDS)
const ALL_POSITIONS = ['GK','CB','LB','RB','LWB','RWB','CDM','DM','CM','CAM','LM','RM','LW','RW','SS','CF','ST','WF']

function mirrorCoord(c: { x: number; y: number }) {
  return { x: 100 - c.x, y: 160 - c.y }
}

function getFallbackCoords(count: number): { x: number; y: number }[] {
  const rows = Math.ceil(count / 4)
  return Array.from({ length: count }, (_, i) => ({
    x: 10 + (i % 4) * 27,
    y: 148 - Math.floor(i / 4) * (100 / rows),
  }))
}

function getCoords(formation: string, count: number) {
  const known = PITCH_COORDS[formation]
  if (known) return known.slice(0, count)
  return getFallbackCoords(count)
}

function FootballPitch({ lineups, homeTeam, awayTeam }: {
  lineups: Lineups
  homeTeam: string
  awayTeam: string
}) {
  const homeCoords = getCoords(lineups.home.formation, lineups.home.players.length)
  const awayCoords = getCoords(lineups.away.formation, lineups.away.players.length)
  const homeBranding = getTeamBranding(homeTeam)
  const awayBranding = getTeamBranding(awayTeam)

  return (
    <svg viewBox="0 0 100 160" className="w-full max-w-[300px] mx-auto block rounded-2xl shadow-2xl overflow-hidden">
      {/* Pitch stripes */}
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x="0" y={i * 16} width="100" height="16" fill={i % 2 === 0 ? '#14532d' : '#166534'} />
      ))}
      {/* Field markings */}
      <rect x="3" y="3" width="94" height="154" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.7" />
      <line x1="3" y1="80" x2="97" y2="80" stroke="rgba(255,255,255,0.5)" strokeWidth="0.7" />
      <circle cx="50" cy="80" r="13" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.7" />
      <circle cx="50" cy="80" r="0.9" fill="rgba(255,255,255,0.7)" />
      {/* Home box (bottom) */}
      <rect x="21" y="126" width="58" height="31" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.7" />
      <rect x="36" y="143" width="28" height="14" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.7" />
      <circle cx="50" cy="139" r="0.9" fill="rgba(255,255,255,0.7)" />
      {/* Away box (top) */}
      <rect x="21" y="3" width="58" height="31" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.7" />
      <rect x="36" y="3" width="28" height="14" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.7" />
      <circle cx="50" cy="21" r="0.9" fill="rgba(255,255,255,0.7)" />

      {/* Home players */}
      {lineups.home.players.map((p, i) => {
        const c = homeCoords[i]
        if (!c) return null
        return (
          <g key={`h${p.num}`}>
            <circle cx={c.x} cy={c.y} r="5" fill={homeBranding.primary} stroke={homeBranding.secondary} strokeWidth="0.8" />
            <text x={c.x} y={c.y} textAnchor="middle" dominantBaseline="central" fontSize="4" fill="white" fontWeight="bold">{p.num}</text>
            <text x={c.x} y={c.y + 8} textAnchor="middle" fontSize="2.8" fill="rgba(255,255,255,0.85)">{p.name.split(' ').slice(-1)[0]}</text>
          </g>
        )
      })}

      {/* Away players */}
      {lineups.away.players.map((p, i) => {
        const raw = awayCoords[i]
        if (!raw) return null
        const c = mirrorCoord(raw)
        return (
          <g key={`a${p.num}`}>
            <circle cx={c.x} cy={c.y} r="5" fill={awayBranding.primary} stroke={awayBranding.secondary} strokeWidth="0.8" />
            <text x={c.x} y={c.y} textAnchor="middle" dominantBaseline="central" fontSize="4" fill="white" fontWeight="bold">{p.num}</text>
            <text x={c.x} y={c.y - 8} textAnchor="middle" fontSize="2.8" fill="rgba(255,255,255,0.85)">{p.name.split(' ').slice(-1)[0]}</text>
          </g>
        )
      })}

      {/* Team attack direction labels */}
      <text x="50" y="157" textAnchor="middle" fontSize="3" fill={hexToRgba(homeBranding.accent, 0.9)}>{homeTeam.split(' ')[0]} attacking up</text>
      <text x="50" y="7.5" textAnchor="middle" fontSize="3" fill={hexToRgba(awayBranding.accent, 0.9)}>{awayTeam.split(' ')[0]} attacking down</text>
    </svg>
  )
}

function LineupsTab({ lineups, setLineups, homeTeam, awayTeam, loggedIn }: {
  lineups: Lineups
  setLineups: (l: Lineups) => void
  homeTeam: string
  awayTeam: string
  loggedIn: boolean
}) {
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState<Lineups>(lineups)

  function startEdit() {
    setEditData(JSON.parse(JSON.stringify(lineups)))
    setEditMode(true)
  }

  function saveEdit() {
    setLineups(editData)
    setEditMode(false)
  }

  function cancelEdit() {
    setEditMode(false)
  }

  function setFormation(side: 'home' | 'away', f: string) {
    setEditData(prev => ({ ...prev, [side]: { ...prev[side], formation: f } }))
  }

  function setPlayerField(side: 'home' | 'away', idx: number, field: keyof Player, value: string | number) {
    setEditData(prev => {
      const players = [...prev[side].players]
      players[idx] = { ...players[idx], [field]: field === 'num' ? Number(value) : value }
      return { ...prev, [side]: { ...prev[side], players } }
    })
  }

  const sides: { key: 'home' | 'away'; name: string; color: string }[] = [
    { key: 'home', name: homeTeam, color: getTeamBranding(homeTeam).accent },
    { key: 'away', name: awayTeam, color: getTeamBranding(awayTeam).accent },
  ]

  return (
    <div className="space-y-5">
      {/* Player lists */}
      <div className="grid grid-cols-2 gap-3">
        {sides.map(({ key, name, color }) => {
          const lineup = lineups[key]
          return (
            <div key={key} className="card">
              <div className="mb-3">
                <p className="font-bold text-sm truncate" style={{ color }}>{name}</p>
                <span className="text-xs text-text-muted">{lineup.formation}</span>
              </div>
              <div className="space-y-1.5">
                {lineup.players.map(p => (
                  <div key={p.num} className="flex items-center gap-2 text-sm">
                    <span className="text-xs font-bold w-5 shrink-0 text-center" style={{ color }}>{p.num}</span>
                    <span className="text-text-primary truncate flex-1">{p.name}</span>
                    <span className="text-[10px] text-text-muted ml-auto shrink-0 bg-bg-muted px-1.5 py-0.5 rounded">{p.pos}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Pitch visualization */}
      <div className="card">
        <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 text-center">Pitch Formation</p>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-3">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getTeamBranding(homeTeam).primary }} />
            <span className="text-text-secondary">{homeTeam} ({lineups.home.formation})</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getTeamBranding(awayTeam).primary }} />
            <span className="text-text-secondary">{awayTeam} ({lineups.away.formation})</span>
          </div>
        </div>
        <FootballPitch lineups={lineups} homeTeam={homeTeam} awayTeam={awayTeam} />
      </div>

      {/* Edit formation (login required) */}
      {!loggedIn && (
        <div className="card border-dashed border-bg-border flex items-center justify-between gap-3">
          <p className="text-sm text-text-muted">Coaches and admins can edit lineups and formations.</p>
          <Link href="/auth/login" className="btn-secondary text-xs shrink-0">
            Log in
          </Link>
        </div>
      )}

      {loggedIn && !editMode && (
        <button
          onClick={startEdit}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-brand-primary/30 bg-brand-primary/8 text-brand-secondary text-sm font-medium hover:bg-brand-primary/15 transition-colors"
        >
          <Pencil size={14} />
          Edit formation and lineup
        </button>
      )}

      {loggedIn && editMode && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card space-y-5 border-brand-primary/30"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-text-primary">Edit lineup</p>
            <div className="flex items-center gap-2">
              <button onClick={cancelEdit} className="btn-ghost text-xs flex items-center gap-1 text-text-muted">
                <X size={12} /> Cancel
              </button>
              <button onClick={saveEdit} className="btn-primary text-xs flex items-center gap-1 py-1.5 px-3">
                <Check size={12} /> Save
              </button>
            </div>
          </div>

          {sides.map(({ key, name, color }) => (
            <div key={key} className="space-y-2">
              <p className={`text-xs font-bold uppercase tracking-widest ${color}`}>{name}</p>

              {/* Formation selector */}
              <div>
                <p className="text-[11px] text-text-muted mb-1.5">Formation</p>
                <div className="flex flex-wrap gap-1.5">
                  {FORMATION_PRESETS.map(f => (
                    <button
                      key={f}
                      onClick={() => setFormation(key, f)}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-all ${
                        editData[key].formation === f
                          ? 'bg-brand-primary border-brand-primary text-white'
                          : 'bg-bg-muted border-bg-border text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                  <input
                    type="text"
                    value={FORMATION_PRESETS.includes(editData[key].formation) ? '' : editData[key].formation}
                    onChange={e => setFormation(key, e.target.value)}
                    placeholder="Custom..."
                    className="input text-[11px] py-1 px-2 w-20"
                  />
                </div>
              </div>

              {/* Player rows */}
              <div className="space-y-1">
                <div className="grid grid-cols-[32px_1fr_1fr_72px] gap-1 text-[10px] text-text-muted px-1">
                  <span>#</span><span>Name</span><span></span><span>Position</span>
                </div>
                {editData[key].players.map((p, i) => (
                  <div key={i} className="grid grid-cols-[32px_1fr_1fr_72px] gap-1 items-center">
                    <input
                      type="number"
                      value={p.num}
                      onChange={e => setPlayerField(key, i, 'num', e.target.value)}
                      className="input text-[11px] py-1 px-1.5 text-center"
                      min={1} max={99}
                    />
                    <input
                      type="text"
                      value={p.name}
                      onChange={e => setPlayerField(key, i, 'name', e.target.value)}
                      className="input text-[11px] py-1 px-2 col-span-1"
                      placeholder="Player name"
                    />
                    <div />
                    <select
                      value={p.pos}
                      onChange={e => setPlayerField(key, i, 'pos', e.target.value)}
                      className="input text-[11px] py-1 px-1.5"
                    >
                      {ALL_POSITIONS.map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}

export default function StreamPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? '9'
  const match = MATCHES[id] ?? MATCHES['9']
  const homeBranding = getTeamBranding(match.home)
  const awayBranding = getTeamBranding(match.away)

  const [tab, setTab] = useState<Tab>('chat')
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_CHAT)
  const [chatInput, setChatInput] = useState('')
  const [viewers, setViewers] = useState(312)
  const [homeScore, setHomeScore] = useState(match.homeScore)
  const [awayScore, setAwayScore] = useState(match.awayScore)
  const [clock, setClock] = useState(match.clock)
  const [showAdmin, setShowAdmin] = useState(false)
  const [clockRunning, setClockRunning] = useState(match.status === 'live')
  const [extraTime, setExtraTime] = useState(0)
  const [lineups, setLineups] = useState<Lineups>(DEFAULT_LINEUPS)
  const [loggedIn, setLoggedIn] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const clockRef = useRef<number>(62)
  const playerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!clockRunning || match.status !== 'live') return
    const interval = setInterval(() => {
      clockRef.current += 1
      const mins = clockRef.current
      setClock(mins <= 90 ? `${mins}'` : `90+${mins - 90}'`)
    }, 60000)
    return () => clearInterval(interval)
  }, [clockRunning, match.status])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setLoggedIn(!!data.user)
    })
    const matchChannel = supabase.channel(`match_${match.id}`)
    matchChannel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_chat', filter: `match_id=eq.${match.id}` }, payload => {
        const row = payload.new as { id: string; author: string; text: string; created_at: string }
        setMessages(prev => [...prev, { id: row.id, author: row.author, text: row.text, ts: new Date(row.created_at).getTime() }])
      })
      .on('presence', { event: 'sync' }, () => {
        const state = matchChannel.presenceState()
        const count = Object.keys(state).length
        if (count > 0) setViewers(count)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await matchChannel.track({ user: `anon_${Math.random().toString(36).slice(2, 7)}` })
        }
      })
    return () => { supabase.removeChannel(matchChannel) }
  }, [match.id])

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      playerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const sendMessage = useCallback(() => {
    const text = chatInput.trim()
    if (!text) return
    setMessages(prev => [...prev, { id: `local_${Date.now()}`, author: 'You', text, ts: Date.now() }])
    setChatInput('')
  }, [chatInput])

  const isLive = match.status === 'live'
  const youtubeEmbedUrl = `https://www.youtube-nocookie.com/embed/${match.youtubeId}?autoplay=1&modestbranding=1&rel=0&color=white`

  const TABS: { key: Tab; label: string; icon: typeof MessageSquare }[] = [
    { key: 'chat', label: 'Live Chat', icon: MessageSquare },
    { key: 'stats', label: 'Match Stats', icon: BarChart2 },
    { key: 'lineups', label: 'Lineups', icon: Users },
  ]

  return (
    <main className="min-h-screen bg-bg-base">
      <div className="container-cesp pt-6 pb-2">
        <Link href="/live" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
          <ChevronLeft size={16} />
          All streams
        </Link>
      </div>

      <div className="container-cesp pb-12">
        {/* Score bar */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-bg-card border border-bg-border rounded-xl px-5 py-4 mb-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1 justify-end">
            <TeamLink
              teamName={match.home}
              logoSize={42}
              reverse
              className="max-w-full justify-end"
              nameClassName="text-right text-sm font-bold text-white md:text-base"
            />
          </div>

          <div className="mx-4 md:mx-6 flex items-center gap-3 shrink-0">
            {isLive && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-brand-secondary mr-2">
                <span className="live-dot" />
                {clock}
              </span>
            )}
            <motion.span key={homeScore} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="text-3xl md:text-4xl font-black text-white tabular-nums">
              {homeScore}
            </motion.span>
            <span className="text-text-muted text-xl font-light">-</span>
            <motion.span key={awayScore} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="text-3xl md:text-4xl font-black text-white tabular-nums">
              {awayScore}
            </motion.span>
            {!isLive && <span className="hidden sm:block text-xs font-bold text-text-muted ml-2">FT</span>}
          </div>

          <div className="flex items-center gap-3 min-w-0 flex-1">
            <TeamLink
              teamName={match.away}
              logoSize={42}
              className="max-w-full justify-start"
              nameClassName="text-sm font-bold text-white md:text-base"
            />
          </div>

          <div className="ml-4 flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-1 text-xs text-text-muted">
              <Eye size={12} />
              <span>{viewers}</span>
            </div>
            {isLive && (
              <span className="px-2 py-0.5 rounded bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold">LIVE</span>
            )}
          </div>
        </motion.div>

        {/* YouTube player */}
        <motion.div
          ref={playerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative w-full rounded-xl overflow-hidden bg-black mb-4 group"
          style={{ paddingTop: '56.25%' }}
        >
          <iframe
            src={youtubeEmbedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            title={`${match.home} vs ${match.away}`}
          />
          {match.youtubeId === 'live_placeholder' && (
            <div className="absolute inset-0 bg-bg-card flex flex-col items-center justify-center gap-4 text-text-muted">
              <div className="flex items-center gap-2">
                <span className="live-dot" />
                <span className="text-brand-secondary font-semibold text-sm">LIVE - Stream will appear here</span>
              </div>
              <p className="text-xs">YouTube stream link will be added by the operator</p>
            </div>
          )}
          <button
            onClick={toggleFullscreen}
            className="absolute bottom-3 right-3 p-2 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 z-10"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Tab bar */}
            <div className="flex items-center gap-1 mb-4">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    tab === key
                      ? 'bg-brand-primary text-white'
                      : 'bg-bg-muted text-text-secondary hover:text-text-primary border border-bg-border'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {tab === 'chat' && (
                  <div className="card p-0 overflow-hidden flex flex-col" style={{ height: '420px' }}>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messages.map(msg => (
                        <div key={msg.id} className="flex gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                            style={{ backgroundColor: hexToRgba(homeBranding.primary, 0.2) }}
                          >
                            <span className="text-[10px] font-bold" style={{ color: homeBranding.accent }}>
                              {msg.author.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-brand-secondary mr-2">{msg.author}</span>
                            <span className="text-sm text-text-primary break-words">{msg.text}</span>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>

                    <div className="border-t border-bg-border p-3 flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') sendMessage() }}
                        placeholder="Say something..."
                        className="input flex-1 text-sm py-2"
                        maxLength={200}
                      />
                      <button onClick={sendMessage} disabled={!chatInput.trim()} className="btn-primary px-3 py-2 disabled:opacity-40">
                        <Send size={15} />
                      </button>
                    </div>
                  </div>
                )}

                {tab === 'stats' && (
                  <div className="card space-y-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-text-muted mb-2">
                      <Link href={`/teams/${getTeamBranding(match.home).slug}`} className="truncate max-w-[40%] text-text-primary hover:text-white">
                        {match.home}
                      </Link>
                      <span>Stat</span>
                      <Link href={`/teams/${getTeamBranding(match.away).slug}`} className="truncate max-w-[40%] text-right text-text-primary hover:text-white">
                        {match.away}
                      </Link>
                    </div>
                    {STATS.map(stat => {
                      const total = stat.homeVal + stat.awayVal || 1
                      const homePct = (stat.homeVal / total) * 100
                      return (
                        <div key={stat.label}>
                          <div className="flex items-center justify-between text-sm mb-1.5">
                            <span className="font-semibold text-text-primary">{stat.home}</span>
                            <span className="text-xs text-text-muted">{stat.label}</span>
                            <span className="font-semibold text-text-primary">{stat.away}</span>
                          </div>
                          <div className="flex h-1.5 rounded-full overflow-hidden bg-bg-muted">
                            <div className="rounded-l-full transition-all duration-700" style={{ width: `${homePct}%`, backgroundColor: homeBranding.primary }} />
                            <div className="bg-text-muted rounded-r-full transition-all duration-700" style={{ width: `${100 - homePct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {tab === 'lineups' && (
                  <LineupsTab
                    lineups={lineups}
                    setLineups={setLineups}
                    homeTeam={match.home}
                    awayTeam={match.away}
                    loggedIn={loggedIn}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Match Info</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Venue</span>
                  <span className="text-text-primary font-medium">{match.venue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Date</span>
                  <span className="text-text-primary font-medium">
                    {new Date(match.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Kick-off</span>
                  <span className="text-text-primary font-medium">{match.time}</span>
                </div>
                {isLive && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Viewers</span>
                    <span className="text-brand-secondary font-medium">{viewers.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowAdmin(v => !v)}
              className="w-full text-left text-xs text-text-muted hover:text-text-primary transition-colors flex items-center gap-1.5 px-1"
            >
              <AlertCircle size={11} />
              {showAdmin ? 'Hide' : 'Show'} operator panel
            </button>

            <AnimatePresence>
              {showAdmin && isLive && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="card border-brand-primary/30">
                    <p className="text-xs font-bold text-brand-secondary uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <Radio size={11} />
                      Operator Panel
                    </p>

                    <div className="space-y-3 mb-4">
                      {[
                        { label: match.home, score: homeScore, setScore: setHomeScore },
                        { label: match.away, score: awayScore, setScore: setAwayScore },
                      ].map(({ label, score, setScore }) => (
                        <div key={label}>
                          <p className="text-xs text-text-muted mb-1.5 truncate">{label}</p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setScore(v => Math.max(0, v - 1))}
                              className="w-8 h-8 rounded-lg bg-bg-muted border border-bg-border flex items-center justify-center hover:border-brand-primary/40 transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="flex-1 text-center font-bold text-xl text-white">{score}</span>
                            <button
                              onClick={() => setScore(v => v + 1)}
                              className="w-8 h-8 rounded-lg bg-brand-primary/15 border border-brand-primary/30 flex items-center justify-center hover:bg-brand-primary/25 transition-colors text-brand-secondary"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="divider mb-4" />

                    <div className="mb-4">
                      <p className="text-xs text-text-muted mb-2">Clock</p>
                      <button
                        onClick={() => setClockRunning(v => !v)}
                        className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
                          clockRunning
                            ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/25'
                            : 'bg-brand-primary/15 border-brand-primary/30 text-brand-secondary hover:bg-brand-primary/25'
                        }`}
                      >
                        <Timer size={12} />
                        {clockRunning ? 'Pause' : 'Resume'}
                      </button>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-text-muted mb-2">Extra time (min)</p>
                      <div className="flex items-center gap-2">
                        {[2, 3, 4, 5, 6].map(n => (
                          <button
                            key={n}
                            onClick={() => setExtraTime(n)}
                            className={`flex-1 py-1.5 rounded text-xs font-medium border transition-colors ${
                              extraTime === n
                                ? 'bg-brand-primary border-brand-primary text-white'
                                : 'bg-bg-muted border-bg-border text-text-muted hover:text-text-primary'
                            }`}
                          >
                            +{n}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/25 transition-colors">
                      <StopCircle size={15} />
                      End Match
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  )
}
