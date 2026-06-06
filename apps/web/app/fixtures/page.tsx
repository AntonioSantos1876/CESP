'use client'

import { Suspense, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, Clock, MapPin, ChevronRight, Radio } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Tab = 'upcoming' | 'live' | 'results'
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

const FIXTURES: Fixture[] = [
  { id: 9, home: 'Chapelton FC', away: 'Porus United', date: '2026-06-06', time: '15:00', venue: 'Denbigh Field', homeScore: 1, awayScore: 0, status: 'live' },
  { id: 1, home: 'Chapelton FC', away: 'Manchester United Clarendon', date: '2026-07-05', time: '15:00', venue: 'Denbigh Field', homeScore: null, awayScore: null, status: 'upcoming' },
  { id: 2, home: 'Spaldings All Stars', away: 'Rock River Rangers', date: '2026-07-05', time: '17:00', venue: 'Kellits Park', homeScore: null, awayScore: null, status: 'upcoming' },
  { id: 3, home: 'Porus United', away: 'Frankfield Boys', date: '2026-07-06', time: '14:00', venue: 'Porus Oval', homeScore: null, awayScore: null, status: 'upcoming' },
  { id: 4, home: 'Chapelton FC', away: 'Spaldings All Stars', date: '2026-06-28', time: '15:00', venue: 'Denbigh Field', homeScore: 3, awayScore: 1, status: 'result' },
  { id: 5, home: 'Rock River Rangers', away: 'Porus United', date: '2026-06-28', time: '17:00', venue: 'Rock River Ground', homeScore: 2, awayScore: 2, status: 'result' },
  { id: 6, home: 'Frankfield Boys', away: 'Manchester United Clarendon', date: '2026-06-27', time: '15:30', venue: 'Frankfield Park', homeScore: 1, awayScore: 3, status: 'result' },
  { id: 7, home: 'Spaldings All Stars', away: 'Porus United', date: '2026-06-21', time: '15:00', venue: 'Kellits Park', homeScore: 0, awayScore: 1, status: 'result' },
  { id: 8, home: 'Manchester United Clarendon', away: 'Rock River Rangers', date: '2026-06-20', time: '14:00', venue: 'MUC Ground', homeScore: 4, awayScore: 0, status: 'result' },
]

const STANDINGS = [
  { pos: 1, team: 'Manchester United Clarendon', p: 5, w: 4, d: 0, l: 1, gd: 9, pts: 12 },
  { pos: 2, team: 'Chapelton FC', p: 6, w: 3, d: 1, l: 2, gd: 5, pts: 10 },
  { pos: 3, team: 'Porus United', p: 6, w: 3, d: 1, l: 2, gd: 1, pts: 10 },
  { pos: 4, team: 'Rock River Rangers', p: 5, w: 1, d: 2, l: 2, gd: -3, pts: 5 },
  { pos: 5, team: 'Spaldings All Stars', p: 5, w: 1, d: 1, l: 3, gd: -5, pts: 4 },
  { pos: 6, team: 'Frankfield Boys', p: 5, w: 0, d: 0, l: 5, gd: -7, pts: 0 },
]

function formatMatchDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
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

function FixturesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = (searchParams.get('tab') ?? 'upcoming') as Tab
  const [liveCount, setLiveCount] = useState(0)

  useEffect(() => {
    setLiveCount(FIXTURES.filter(f => f.status === 'live').length)

    const supabase = createClient()
    const channel = supabase
      .channel('fixtures_list_live')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'fixtures' }, () => {
        // production: refetch live count from supabase
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  function setTab(t: Tab) {
    router.push(`/fixtures?tab=${t}`, { scroll: false })
  }

  const filtered = FIXTURES.filter(f => {
    if (tab === 'upcoming') return f.status === 'upcoming'
    if (tab === 'live') return f.status === 'live'
    return f.status === 'result'
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
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'live', label: 'Live' },
    { key: 'results', label: 'Results' },
  ]

  return (
    <main className="min-h-screen bg-bg-base">
      <div className="container-cesp py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <h1 className="text-4xl font-bold text-text-primary mb-2">Fixtures &amp; Results</h1>
          <p className="text-text-secondary">2026 Clarendon Elite Cup season schedule</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
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
                className="space-y-6"
              >
                {tab === 'live' && filtered.length > 0 && (
                  <div className="flex items-center gap-2 text-brand-secondary text-sm font-medium">
                    <Radio size={14} />
                    <span>{filtered.length} match{filtered.length !== 1 ? 'es' : ''} in progress</span>
                  </div>
                )}

                {sortedDates.length === 0 ? (
                  <div className="card text-center py-16 text-text-muted">
                    {tab === 'live' ? 'No matches are currently live.' : 'No fixtures in this category.'}
                  </div>
                ) : (
                  sortedDates.map(date => (
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
                  ))
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className="text-lg font-bold text-text-primary mb-4">Standings</h2>
              <div className="card overflow-hidden p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-bg-border">
                      <th className="text-left text-text-muted font-medium py-3 pl-4 pr-2">#</th>
                      <th className="text-left text-text-muted font-medium py-3 pr-2">Team</th>
                      <th className="text-center text-text-muted font-medium py-3 px-2">P</th>
                      <th className="text-center text-text-muted font-medium py-3 px-2">W</th>
                      <th className="text-center text-text-muted font-medium py-3 px-2">D</th>
                      <th className="text-center text-text-muted font-medium py-3 px-2">L</th>
                      <th className="text-center text-text-muted font-medium py-3 px-2">GD</th>
                      <th className="text-center text-text-muted font-medium py-3 pr-4">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STANDINGS.map((row, i) => (
                      <tr
                        key={row.team}
                        className={`border-b border-bg-border last:border-0 ${i < 2 ? 'text-text-primary' : 'text-text-secondary'}`}
                      >
                        <td className="py-2.5 pl-4 pr-2 font-medium">{row.pos}</td>
                        <td className="py-2.5 pr-2 leading-tight">
                          <span className={`font-medium text-xs ${i === 0 ? 'text-brand-secondary' : ''}`}>
                            {row.team}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center">{row.p}</td>
                        <td className="py-2.5 px-2 text-center">{row.w}</td>
                        <td className="py-2.5 px-2 text-center">{row.d}</td>
                        <td className="py-2.5 px-2 text-center">{row.l}</td>
                        <td className="py-2.5 px-2 text-center">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                        <td className="py-2.5 pr-4 text-center font-bold">{row.pts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6">
                <Link href="/teams" className="btn-secondary w-full justify-center">
                  View all teams <ChevronRight size={16} />
                </Link>
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
