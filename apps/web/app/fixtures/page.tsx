'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Calendar, Clock, MapPin, ChevronRight } from 'lucide-react'
import Link from 'next/link'

type Filter = 'all' | 'upcoming' | 'results'

const fixtures = [
  { id: 1, home: 'Chapelton FC', away: 'Manchester United Clarendon', date: '2026-07-05', time: '15:00', venue: 'Denbigh Field', homeScore: null, awayScore: null, status: 'upcoming' },
  { id: 2, home: 'Spaldings All Stars', away: 'Rock River Rangers', date: '2026-07-05', time: '17:00', venue: 'Kellits Park', homeScore: null, awayScore: null, status: 'upcoming' },
  { id: 3, home: 'Porus United', away: 'Frankfield Boys', date: '2026-07-06', time: '14:00', venue: 'Porus Oval', homeScore: null, awayScore: null, status: 'upcoming' },
  { id: 4, home: 'Chapelton FC', away: 'Spaldings All Stars', date: '2026-06-28', time: '15:00', venue: 'Denbigh Field', homeScore: 3, awayScore: 1, status: 'result' },
  { id: 5, home: 'Rock River Rangers', away: 'Porus United', date: '2026-06-28', time: '17:00', venue: 'Rock River Ground', homeScore: 2, awayScore: 2, status: 'result' },
  { id: 6, home: 'Frankfield Boys', away: 'Manchester United Clarendon', date: '2026-06-27', time: '15:30', venue: 'Frankfield Park', homeScore: 1, awayScore: 3, status: 'result' },
  { id: 7, home: 'Spaldings All Stars', away: 'Porus United', date: '2026-06-21', time: '15:00', venue: 'Kellits Park', homeScore: 0, awayScore: 1, status: 'result' },
  { id: 8, home: 'Manchester United Clarendon', away: 'Rock River Rangers', date: '2026-06-20', time: '14:00', venue: 'MUC Ground', homeScore: 4, awayScore: 0, status: 'result' },
]

const standings = [
  { pos: 1, team: 'Manchester United Clarendon', p: 5, w: 4, d: 0, l: 1, gd: 9, pts: 12 },
  { pos: 2, team: 'Chapelton FC', p: 5, w: 3, d: 1, l: 1, gd: 4, pts: 10 },
  { pos: 3, team: 'Porus United', p: 5, w: 3, d: 1, l: 1, gd: 2, pts: 10 },
  { pos: 4, team: 'Rock River Rangers', p: 5, w: 1, d: 2, l: 2, gd: -3, pts: 5 },
  { pos: 5, team: 'Spaldings All Stars', p: 5, w: 1, d: 1, l: 3, gd: -5, pts: 4 },
  { pos: 6, team: 'Frankfield Boys', p: 4, w: 0, d: 0, l: 4, gd: -7, pts: 0 },
]

function FixtureCard({ fixture, index }: { fixture: typeof fixtures[0]; index: number }) {
  const isResult = fixture.status === 'result'
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="card-hover"
    >
      <div className="flex items-center gap-2 text-xs text-text-muted mb-3">
        <Calendar size={12} />
        <span>{new Date(fixture.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
        <Clock size={12} className="ml-1" />
        <span>{fixture.time}</span>
        <MapPin size={12} className="ml-1" />
        <span>{fixture.venue}</span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 text-right">
          <p className="font-semibold text-text-primary text-sm leading-tight">{fixture.home}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isResult ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold text-text-primary w-6 text-right">{fixture.homeScore}</span>
              <span className="text-text-muted text-sm">-</span>
              <span className="text-xl font-bold text-text-primary w-6">{fixture.awayScore}</span>
            </div>
          ) : (
            <span className="px-3 py-1 rounded-lg bg-brand-primary/10 text-brand-secondary text-xs font-medium border border-brand-primary/20">
              vs
            </span>
          )}
        </div>

        <div className="flex-1">
          <p className="font-semibold text-text-primary text-sm leading-tight">{fixture.away}</p>
        </div>
      </div>
    </motion.div>
  )
}

export default function FixturesPage() {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = fixtures.filter(f => {
    if (filter === 'upcoming') return f.status === 'upcoming'
    if (filter === 'results') return f.status === 'result'
    return true
  })

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
              {(['all', 'upcoming', 'results'] as Filter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${
                    filter === f
                      ? 'bg-brand-primary text-white'
                      : 'bg-bg-muted text-text-secondary hover:text-text-primary border border-bg-border'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filtered.map((f, i) => (
                <FixtureCard key={f.id} fixture={f} index={i} />
              ))}
              {filtered.length === 0 && (
                <div className="card text-center py-12 text-text-muted">No fixtures in this category.</div>
              )}
            </div>
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
                    {standings.map((row, i) => (
                      <tr key={row.team} className={`border-b border-bg-border last:border-0 ${i < 2 ? 'text-text-primary' : 'text-text-secondary'}`}>
                        <td className="py-2.5 pl-4 pr-2 font-medium">{row.pos}</td>
                        <td className="py-2.5 pr-2 leading-tight">
                          <span className={`font-medium text-xs ${i === 0 ? 'text-brand-secondary' : ''}`}>{row.team}</span>
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
