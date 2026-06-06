'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Radio, MessageSquare, BarChart2, Users, ChevronLeft,
  Eye, Send, Plus, Minus, Timer, StopCircle, AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

const MATCHES: Record<string, MatchData> = {
  '9': {
    id: 9,
    home: 'Chapelton FC',
    away: 'Porus United',
    date: '2026-06-06',
    time: '15:00',
    venue: 'Denbigh Field',
    homeScore: 1,
    awayScore: 0,
    status: 'live',
    youtubeId: 'live_placeholder',
    clock: "62'",
  },
  '4': {
    id: 4,
    home: 'Chapelton FC',
    away: 'Spaldings All Stars',
    date: '2026-06-28',
    time: '15:00',
    venue: 'Denbigh Field',
    homeScore: 3,
    awayScore: 1,
    status: 'vod',
    youtubeId: 'dQw4w9WgXcQ',
    clock: 'FT',
  },
  '5': {
    id: 5,
    home: 'Rock River Rangers',
    away: 'Porus United',
    date: '2026-06-28',
    time: '17:00',
    venue: 'Rock River Ground',
    homeScore: 2,
    awayScore: 2,
    status: 'vod',
    youtubeId: 'dQw4w9WgXcQ',
    clock: 'FT',
  },
  '6': {
    id: 6,
    home: 'Frankfield Boys',
    away: 'Manchester United Clarendon',
    date: '2026-06-27',
    time: '15:30',
    venue: 'Frankfield Park',
    homeScore: 1,
    awayScore: 3,
    status: 'vod',
    youtubeId: 'dQw4w9WgXcQ',
    clock: 'FT',
  },
}

const MOCK_CHAT: ChatMessage[] = [
  { id: '1', author: 'TrevorMac', text: 'Chapelton looking sharp today!', ts: Date.now() - 480000 },
  { id: '2', author: 'DenbighFan', text: 'Come on Porus, equalise!', ts: Date.now() - 360000 },
  { id: '3', author: 'CESPOfficial', text: 'GOAL! Chapelton take the lead in the 38th minute!', ts: Date.now() - 180000 },
  { id: '4', author: 'KingstonKid', text: 'What a strike that was', ts: Date.now() - 120000 },
  { id: '5', author: 'PaulusR', text: 'Porus have a corner coming up...', ts: Date.now() - 30000 },
]

const LINEUPS = {
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

export default function StreamPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? '9'
  const match = MATCHES[id] ?? MATCHES['9']

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
  const chatEndRef = useRef<HTMLDivElement>(null)
  const clockRef = useRef<number>(62)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!clockRunning || match.status !== 'live') return
    const interval = setInterval(() => {
      clockRef.current += 1
      const mins = clockRef.current
      if (mins <= 90) {
        setClock(`${mins}'`)
      } else {
        const et = mins - 90
        setClock(`90+${et}'`)
      }
    }, 60000)
    return () => clearInterval(interval)
  }, [clockRunning, match.status])

  useEffect(() => {
    const supabase = createClient()
    const matchChannel = supabase.channel(`match_${match.id}`)

    matchChannel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_chat', filter: `match_id=eq.${match.id}` }, payload => {
        const row = payload.new as { id: string; author: string; text: string; created_at: string }
        setMessages(prev => [...prev, {
          id: row.id,
          author: row.author,
          text: row.text,
          ts: new Date(row.created_at).getTime(),
        }])
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

  const sendMessage = useCallback(() => {
    const text = chatInput.trim()
    if (!text) return
    const newMsg: ChatMessage = {
      id: `local_${Date.now()}`,
      author: 'You',
      text,
      ts: Date.now(),
    }
    setMessages(prev => [...prev, newMsg])
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
      {/* Back nav */}
      <div className="container-cesp pt-6 pb-2">
        <Link href="/live" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
          <ChevronLeft size={16} />
          All streams
        </Link>
      </div>

      <div className="container-cesp pb-12">
        {/* Score overlay bar */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-bg-card border border-bg-border rounded-xl px-5 py-4 mb-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1 justify-end">
            <p className="font-bold text-white text-sm md:text-base truncate text-right">{match.home}</p>
          </div>

          <div className="mx-4 md:mx-6 flex items-center gap-3 shrink-0">
            {isLive && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-brand-secondary mr-2">
                <span className="live-dot" />
                {clock}
              </span>
            )}
            <motion.span
              key={homeScore}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className="text-3xl md:text-4xl font-black text-white tabular-nums"
            >
              {homeScore}
            </motion.span>
            <span className="text-text-muted text-xl font-light">-</span>
            <motion.span
              key={awayScore}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className="text-3xl md:text-4xl font-black text-white tabular-nums"
            >
              {awayScore}
            </motion.span>
            {!isLive && (
              <span className="hidden sm:block text-xs font-bold text-text-muted ml-2">FT</span>
            )}
          </div>

          <div className="flex items-center gap-3 min-w-0 flex-1">
            <p className="font-bold text-white text-sm md:text-base truncate">{match.away}</p>
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative w-full rounded-xl overflow-hidden bg-black mb-4"
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
                <span className="text-brand-secondary font-semibold text-sm">LIVE — Stream will appear here</span>
              </div>
              <p className="text-xs">YouTube stream link will be added by the operator</p>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tabs panel */}
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
                          <div className="w-6 h-6 rounded-full bg-brand-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[10px] font-bold text-brand-secondary">
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
                      <button
                        onClick={sendMessage}
                        disabled={!chatInput.trim()}
                        className="btn-primary px-3 py-2 disabled:opacity-40"
                      >
                        <Send size={15} />
                      </button>
                    </div>
                  </div>
                )}

                {tab === 'stats' && (
                  <div className="card space-y-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-text-muted mb-2">
                      <span className="truncate max-w-[40%] text-text-primary">{match.home}</span>
                      <span>Stat</span>
                      <span className="truncate max-w-[40%] text-right text-text-primary">{match.away}</span>
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
                            <div
                              className="bg-brand-primary rounded-l-full transition-all duration-700"
                              style={{ width: `${homePct}%` }}
                            />
                            <div
                              className="bg-text-muted rounded-r-full transition-all duration-700"
                              style={{ width: `${100 - homePct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {tab === 'lineups' && (
                  <div className="grid grid-cols-2 gap-4">
                    {(['home', 'away'] as const).map(side => {
                      const lineup = LINEUPS[side]
                      const teamName = side === 'home' ? match.home : match.away
                      return (
                        <div key={side} className="card">
                          <div className="mb-3">
                            <p className="font-bold text-text-primary text-sm truncate">{teamName}</p>
                            <p className="text-xs text-text-muted">{lineup.formation}</p>
                          </div>
                          <div className="space-y-1.5">
                            {lineup.players.map(p => (
                              <div key={p.num} className="flex items-center gap-2 text-sm">
                                <span className="text-xs font-bold text-brand-secondary w-5 shrink-0 text-center">{p.num}</span>
                                <span className="text-text-primary truncate">{p.name}</span>
                                <span className="text-xs text-text-muted ml-auto shrink-0">{p.pos}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sidebar: match info + admin panel */}
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

            {/* Admin panel toggle (operator/admin only in production) */}
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

                    {/* Score controls */}
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

                    {/* Clock controls */}
                    <div className="mb-4">
                      <p className="text-xs text-text-muted mb-2">Clock</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setClockRunning(v => !v)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
                            clockRunning
                              ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/25'
                              : 'bg-brand-primary/15 border-brand-primary/30 text-brand-secondary hover:bg-brand-primary/25'
                          }`}
                        >
                          <Timer size={12} />
                          {clockRunning ? 'Pause' : 'Resume'}
                        </button>
                      </div>
                    </div>

                    {/* Extra time */}
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
