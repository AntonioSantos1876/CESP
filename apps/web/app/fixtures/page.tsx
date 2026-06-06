'use client'

import { Suspense, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Calendar, Clock, MapPin, ChevronRight, Radio,
  Trophy, Camera, Star, HandHeart, Users,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Tab = 'bracket' | 'upcoming' | 'live' | 'results'
type FixtureStatus = 'upcoming' | 'live' | 'result'

type Fixture = {
  id: number
  home: string
  away: string
  date: string
  time: string
  venue: string
  homeScore: number | null
  awayScore: number | null
  status: FixtureStatus
}

type BracketSlot = { name: string; abbr: string; eliminated: boolean } | null

type BMatch = {
  id: string
  home: BracketSlot
  away: BracketSlot
  homeScore: number | null
  awayScore: number | null
  date: string
  time: string
  venue: string
}

function makeSlot(name: string, eliminated = false): BracketSlot {
  const words = name.split(' ')
  const abbr =
    words.length >= 2
      ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase()
  return { name, abbr, eliminated }
}

const QF: BMatch[] = [
  { id: 'qf1', home: makeSlot('Manchester United Clarendon'), away: makeSlot('Kellits United'), homeScore: null, awayScore: null, date: '2026-07-31', time: '10:00', venue: 'Denbigh Field' },
  { id: 'qf2', home: makeSlot('Chapelton FC'), away: makeSlot('Denbigh City FC'), homeScore: null, awayScore: null, date: '2026-07-31', time: '12:00', venue: 'Kellits Park' },
  { id: 'qf3', home: makeSlot('Porus United'), away: makeSlot('Frankfield Boys'), homeScore: null, awayScore: null, date: '2026-07-31', time: '14:00', venue: 'Porus Oval' },
  { id: 'qf4', home: makeSlot('Rock River Rangers'), away: makeSlot('Spaldings All Stars'), homeScore: null, awayScore: null, date: '2026-07-31', time: '16:00', venue: 'Rock River Ground' },
]

const SF: BMatch[] = [
  { id: 'sf1', home: null, away: null, homeScore: null, awayScore: null, date: '2026-08-01', time: '14:00', venue: 'Denbigh Field' },
  { id: 'sf2', home: null, away: null, homeScore: null, awayScore: null, date: '2026-08-01', time: '16:00', venue: 'Denbigh Field' },
]

const FINAL: BMatch = { id: 'final', home: null, away: null, homeScore: null, awayScore: null, date: '2026-08-02', time: '15:00', venue: 'Denbigh Field' }
const THIRD: BMatch = { id: '3rd', home: null, away: null, homeScore: null, awayScore: null, date: '2026-08-02', time: '12:00', venue: 'Denbigh Field' }

// ---- Bracket layout constants (px) ----
const CW = 190   // card width
const CH = 74    // card height
const CON = 40   // connector column width
const PAD = 16   // top padding
const QG = 12    // gap between QF cards

const qfTop = [PAD, PAD + CH + QG, PAD + 2 * (CH + QG), PAD + 3 * (CH + QG)]
const qfC = qfTop.map(t => t + CH / 2)
const sfC = [(qfC[0] + qfC[1]) / 2, (qfC[2] + qfC[3]) / 2]
const sfTop = sfC.map(c => c - CH / 2)
const finalC = (sfC[0] + sfC[1]) / 2
const finalTop = finalC - CH / 2
const thirdTop = finalTop + CH + 18
const BHEIGHT = Math.max(qfTop[3] + CH + PAD, thirdTop + CH + PAD)

const X_QF = 0
const X_CON1 = CW
const X_SF = CW + CON
const X_CON2 = CW + CON + CW
const X_FINAL = CW + CON + CW + CON
const BTOTAL_W = X_FINAL + CW

const LC = 'rgba(255,255,255,0.11)'

function BSlotRow({ s, score, border }: { s: BracketSlot; score: number | null; border: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-2.5 py-2 ${border ? 'border-t border-[#252525]' : ''}`}>
      <div className="w-6 h-6 rounded-md bg-[#1d1d1d] flex items-center justify-center text-[9px] font-black text-text-muted shrink-0 border border-[#2e2e2e]">
        {s ? s.abbr : '?'}
      </div>
      <span className={`flex-1 text-[11px] font-semibold truncate leading-tight ${s?.eliminated ? 'line-through opacity-35 text-text-muted' : s ? 'text-text-primary' : 'text-[#555] italic'}`}>
        {s ? s.name : 'TBD'}
      </span>
      {score !== null && (
        <span className={`text-xs font-black tabular-nums w-4 text-right shrink-0 ${s?.eliminated ? 'text-text-muted opacity-35' : 'text-white'}`}>
          {score}
        </span>
      )}
    </div>
  )
}

function BCard({ match }: { match: BMatch }) {
  return (
    <div className="rounded-xl overflow-hidden border border-[#222] bg-[#111]" style={{ width: CW, height: CH }}>
      <BSlotRow s={match.home} score={match.homeScore} border={false} />
      <BSlotRow s={match.away} score={match.awayScore} border={true} />
    </div>
  )
}

function BracketView() {
  return (
    <div className="w-full overflow-x-auto pb-4 -mx-2 px-2">
      {/* Round headers */}
      <div className="flex mb-3" style={{ width: BTOTAL_W, minWidth: BTOTAL_W }}>
        <div className="text-center" style={{ width: CW }}>
          <p className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest">Quarter-finals</p>
          <p className="text-[9px] text-text-muted mt-0.5">31 July 2026</p>
        </div>
        <div style={{ width: CON }} />
        <div className="text-center" style={{ width: CW }}>
          <p className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest">Semi-finals</p>
          <p className="text-[9px] text-text-muted mt-0.5">1 August 2026</p>
        </div>
        <div style={{ width: CON }} />
        <div className="text-center" style={{ width: CW }}>
          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Final + 3rd</p>
          <p className="text-[9px] text-text-muted mt-0.5">2 August 2026</p>
        </div>
      </div>

      {/* Bracket */}
      <div className="relative" style={{ width: BTOTAL_W, minWidth: BTOTAL_W, height: BHEIGHT }}>
        {/* QF cards */}
        {QF.map((m, i) => (
          <div key={m.id} className="absolute" style={{ left: X_QF, top: qfTop[i] }}>
            <BCard match={m} />
            <p className="text-[8px] text-[#444] mt-0.5 ml-1">{m.time} &middot; {m.venue}</p>
          </div>
        ))}

        {/* Connector SVG: QF to SF */}
        <svg
          className="absolute pointer-events-none"
          style={{ left: X_CON1, top: 0, width: CON, height: BHEIGHT }}
          viewBox={`0 0 ${CON} ${BHEIGHT}`}
          preserveAspectRatio="none"
        >
          <line x1="0" y1={qfC[0]} x2={CON / 2} y2={qfC[0]} stroke={LC} strokeWidth="1" />
          <line x1="0" y1={qfC[1]} x2={CON / 2} y2={qfC[1]} stroke={LC} strokeWidth="1" />
          <line x1={CON / 2} y1={qfC[0]} x2={CON / 2} y2={qfC[1]} stroke={LC} strokeWidth="1" />
          <line x1={CON / 2} y1={sfC[0]} x2={CON} y2={sfC[0]} stroke={LC} strokeWidth="1" />
          <line x1="0" y1={qfC[2]} x2={CON / 2} y2={qfC[2]} stroke={LC} strokeWidth="1" />
          <line x1="0" y1={qfC[3]} x2={CON / 2} y2={qfC[3]} stroke={LC} strokeWidth="1" />
          <line x1={CON / 2} y1={qfC[2]} x2={CON / 2} y2={qfC[3]} stroke={LC} strokeWidth="1" />
          <line x1={CON / 2} y1={sfC[1]} x2={CON} y2={sfC[1]} stroke={LC} strokeWidth="1" />
        </svg>

        {/* SF cards */}
        {SF.map((m, i) => (
          <div key={m.id} className="absolute" style={{ left: X_SF, top: sfTop[i] }}>
            <BCard match={m} />
            <p className="text-[8px] text-[#444] mt-0.5 ml-1">
              Winner QF{i * 2 + 1} vs Winner QF{i * 2 + 2}
            </p>
          </div>
        ))}

        {/* Connector SVG: SF to Finals */}
        <svg
          className="absolute pointer-events-none"
          style={{ left: X_CON2, top: 0, width: CON, height: BHEIGHT }}
          viewBox={`0 0 ${CON} ${BHEIGHT}`}
          preserveAspectRatio="none"
        >
          <line x1="0" y1={sfC[0]} x2={CON / 2} y2={sfC[0]} stroke={LC} strokeWidth="1" />
          <line x1="0" y1={sfC[1]} x2={CON / 2} y2={sfC[1]} stroke={LC} strokeWidth="1" />
          <line x1={CON / 2} y1={sfC[0]} x2={CON / 2} y2={sfC[1]} stroke={LC} strokeWidth="1" />
          <line x1={CON / 2} y1={finalC} x2={CON} y2={finalC} stroke={LC} strokeWidth="1.5" />
          <line x1={CON / 2} y1={thirdTop + CH / 2} x2={CON} y2={thirdTop + CH / 2} stroke={LC} strokeWidth="1" strokeDasharray="3,3" />
        </svg>

        {/* Final card */}
        <div className="absolute" style={{ left: X_FINAL, top: finalTop }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Trophy size={10} className="text-amber-400" />
            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">Final</span>
          </div>
          <BCard match={FINAL} />
        </div>

        {/* 3rd place card */}
        <div className="absolute" style={{ left: X_FINAL, top: thirdTop }}>
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[9px] font-bold text-[#555] uppercase tracking-widest">3rd Place</span>
          </div>
          <BCard match={THIRD} />
          <p className="text-[8px] text-[#444] mt-0.5 ml-1">Loser SF1 vs Loser SF2</p>
        </div>
      </div>

      <p className="text-[9px] text-[#444] mt-3 italic">
        Eliminated teams will appear with strikethrough once results are confirmed. Dashed line = 3rd place path.
      </p>
    </div>
  )
}

const FIXTURES: Fixture[] = [
  { id: 9, home: 'Chapelton FC', away: 'Porus United', date: '2026-06-06', time: '15:00', venue: 'Denbigh Field', homeScore: 1, awayScore: 0, status: 'live' },
  { id: 1, home: 'Manchester United Clarendon', away: 'Kellits United', date: '2026-07-31', time: '10:00', venue: 'Denbigh Field', homeScore: null, awayScore: null, status: 'upcoming' },
  { id: 2, home: 'Chapelton FC', away: 'Denbigh City FC', date: '2026-07-31', time: '12:00', venue: 'Kellits Park', homeScore: null, awayScore: null, status: 'upcoming' },
  { id: 3, home: 'Porus United', away: 'Frankfield Boys', date: '2026-07-31', time: '14:00', venue: 'Porus Oval', homeScore: null, awayScore: null, status: 'upcoming' },
  { id: 10, home: 'Rock River Rangers', away: 'Spaldings All Stars', date: '2026-07-31', time: '16:00', venue: 'Rock River Ground', homeScore: null, awayScore: null, status: 'upcoming' },
  { id: 4, home: 'Chapelton FC', away: 'Spaldings All Stars', date: '2026-06-28', time: '15:00', venue: 'Denbigh Field', homeScore: 3, awayScore: 1, status: 'result' },
  { id: 5, home: 'Rock River Rangers', away: 'Porus United', date: '2026-06-28', time: '17:00', venue: 'Rock River Ground', homeScore: 2, awayScore: 2, status: 'result' },
  { id: 6, home: 'Frankfield Boys', away: 'Manchester United Clarendon', date: '2026-06-27', time: '15:30', venue: 'Frankfield Park', homeScore: 1, awayScore: 3, status: 'result' },
  { id: 7, home: 'Spaldings All Stars', away: 'Porus United', date: '2026-06-21', time: '15:00', venue: 'Kellits Park', homeScore: 0, awayScore: 1, status: 'result' },
  { id: 8, home: 'Manchester United Clarendon', away: 'Rock River Rangers', date: '2026-06-20', time: '14:00', venue: 'MUC Ground', homeScore: 4, awayScore: 0, status: 'result' },
]

function formatMatchDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function FixtureCard({ fixture, index }: { fixture: Fixture; index: number }) {
  const isResult = fixture.status === 'result'
  const isLive = fixture.status === 'live'

  return (
    <Link href={`/fixtures/${fixture.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, delay: index * 0.055, ease: [0.22, 1, 0.36, 1] }}
        className="card-hover group cursor-pointer"
      >
        <div className="flex items-center gap-2 text-xs text-text-muted mb-3">
          <Clock size={11} />
          <span>{fixture.time}</span>
          <MapPin size={11} className="ml-1" />
          <span className="truncate">{fixture.venue}</span>
          {isLive && (
            <span className="ml-auto flex items-center gap-1.5 text-brand-secondary font-semibold">
              <span className="live-dot" />
              LIVE
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 text-right">
            <p className="font-semibold text-text-primary text-sm leading-tight group-hover:text-white transition-colors">
              {fixture.home}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isResult || isLive ? (
              <div className={`flex items-center gap-1.5 ${isLive ? 'ring-1 ring-brand-primary/40 rounded-lg px-2 py-0.5' : ''}`}>
                <span className="text-xl font-bold text-text-primary w-6 text-right">{fixture.homeScore}</span>
                <span className="text-text-muted text-sm font-medium">-</span>
                <span className="text-xl font-bold text-text-primary w-6">{fixture.awayScore}</span>
              </div>
            ) : (
              <span className="px-3 py-1 rounded-lg bg-brand-primary/10 text-brand-secondary text-xs font-medium border border-brand-primary/20">
                vs
              </span>
            )}
          </div>

          <div className="flex-1">
            <p className="font-semibold text-text-primary text-sm leading-tight group-hover:text-white transition-colors">
              {fixture.away}
            </p>
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <span className="text-xs text-text-muted group-hover:text-brand-secondary transition-colors flex items-center gap-1">
            Match details <ChevronRight size={12} />
          </span>
        </div>
      </motion.div>
    </Link>
  )
}

const QUICK_LINKS = [
  { href: '/gallery', label: 'Gallery', icon: Camera, desc: 'Match photos' },
  { href: '/sponsors', label: 'Sponsors', icon: Star, desc: 'Our partners' },
  { href: '/volunteer', label: 'Volunteer', icon: HandHeart, desc: 'Get involved' },
  { href: '/teams', label: 'Teams', icon: Users, desc: 'All 8 clubs' },
]

function FixturesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = (searchParams.get('tab') ?? 'bracket') as Tab
  const [liveCount, setLiveCount] = useState(0)

  useEffect(() => {
    setLiveCount(FIXTURES.filter(f => f.status === 'live').length)
    const supabase = createClient()
    const channel = supabase
      .channel('fixtures_list_live')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'fixtures' }, () => {})
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  function setTab(t: Tab) {
    router.push(`/fixtures?tab=${t}`, { scroll: false })
  }

  const filtered = FIXTURES.filter(f => {
    if (tab === 'upcoming') return f.status === 'upcoming'
    if (tab === 'live') return f.status === 'live'
    if (tab === 'results') return f.status === 'result'
    return false
  })

  const sorted = [...filtered].sort((a, b) =>
    tab === 'results' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)
  )

  const grouped = sorted.reduce<Record<string, Fixture[]>>((acc, f) => {
    if (!acc[f.date]) acc[f.date] = []
    acc[f.date].push(f)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort((a, b) =>
    tab === 'results' ? b.localeCompare(a) : a.localeCompare(b)
  )

  const TABS: { key: Tab; label: string }[] = [
    { key: 'bracket', label: 'Bracket' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'live', label: 'Live' },
    { key: 'results', label: 'Results' },
  ]

  return (
    <main className="min-h-screen bg-bg-base">
      <div className="container-cesp py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6"
        >
          <h1 className="text-4xl font-bold text-text-primary mb-1">Fixtures &amp; Results</h1>
          <p className="text-text-secondary">2026 Clarendon Elite Cup tournament</p>
        </motion.div>

        {/* Quick nav links */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="flex flex-wrap gap-2 mb-8"
        >
          {QUICK_LINKS.map(({ href, label, icon: Icon, desc }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-card border border-bg-border hover:border-brand-primary/30 hover:bg-bg-muted transition-all duration-200 group"
            >
              <Icon size={13} className="text-brand-secondary group-hover:text-brand-primary transition-colors" />
              <div>
                <p className="text-[11px] font-semibold text-text-primary leading-none">{label}</p>
                <p className="text-[9px] text-text-muted leading-none mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              {TABS.map(({ key, label }) => {
                const isActive = tab === key
                return (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-brand-primary text-white'
                        : 'bg-bg-muted text-text-secondary hover:text-text-primary border border-bg-border'
                    }`}
                  >
                    {label}
                    {key === 'live' && liveCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brand-primary text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-bg-base">
                        {liveCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {tab === 'bracket' && <BracketView />}

                {tab === 'live' && filtered.length > 0 && (
                  <div className="flex items-center gap-2 text-brand-secondary text-sm font-medium mb-4">
                    <Radio size={14} />
                    <span>{filtered.length} match{filtered.length !== 1 ? 'es' : ''} in progress</span>
                  </div>
                )}

                {tab !== 'bracket' && (
                  sortedDates.length === 0 ? (
                    <div className="card text-center py-16 text-text-muted">
                      {tab === 'live' ? 'No matches are currently live.' : 'No fixtures in this category.'}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {sortedDates.map(date => (
                        <div key={date}>
                          <div className="flex items-center gap-3 mb-3">
                            <Calendar size={13} className="text-brand-secondary shrink-0" />
                            <span className="text-xs font-semibold text-brand-secondary uppercase tracking-wide">
                              {formatMatchDate(date)}
                            </span>
                            <div className="flex-1 h-px bg-bg-border" />
                          </div>
                          <div className="space-y-3">
                            {grouped[date].map((f, i) => (
                              <FixtureCard key={f.id} fixture={f} index={i} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Tournament format */}
              <div className="card mb-6">
                <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Tournament Format</p>
                <div className="space-y-3">
                  {[
                    { round: 'Quarter-finals', date: '31 July', note: '8 teams, 4 matches', color: 'text-text-secondary' },
                    { round: 'Semi-finals', date: '1 August', note: '4 teams, 2 matches', color: 'text-brand-secondary' },
                    { round: 'Final', date: '2 August', note: '2 teams, 1 match', color: 'text-amber-400' },
                    { round: '3rd Place', date: '2 August', note: 'SF losers', color: 'text-text-muted' },
                  ].map(r => (
                    <div key={r.round} className="flex items-start justify-between gap-2">
                      <span className={`text-sm font-semibold ${r.color}`}>{r.round}</span>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-text-muted">{r.date}</p>
                        <p className="text-[10px] text-text-muted">{r.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="divider mt-4 mb-3" />
                <p className="text-xs text-text-muted leading-relaxed">
                  All 8 teams participate from the quarter-final stage. Venues confirmed 14 days before each round.
                </p>
              </div>

              {/* Page links in sidebar */}
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Explore</p>
              <div className="space-y-2">
                {QUICK_LINKS.map(({ href, label, icon: Icon, desc }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-card border border-bg-border hover:border-brand-primary/30 hover:bg-bg-muted transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
                      <Icon size={15} className="text-brand-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary">{label}</p>
                      <p className="text-xs text-text-muted">{desc}</p>
                    </div>
                    <ChevronRight size={14} className="text-text-muted group-hover:text-brand-secondary transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function FixturesPage() {
  return (
    <Suspense>
      <FixturesContent />
    </Suspense>
  )
}
