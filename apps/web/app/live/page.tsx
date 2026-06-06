'use client'

import { motion } from 'framer-motion'
import { Radio, Clock, Calendar, Bell } from 'lucide-react'

const nextMatch = {
  home: 'Chapelton FC',
  away: 'Manchester United Clarendon',
  date: '2026-07-05',
  time: '15:00',
  venue: 'Denbigh Field',
}

const recentResults = [
  { home: 'Chapelton FC', away: 'Spaldings All Stars', homeScore: 3, awayScore: 1, date: '28 Jun' },
  { home: 'Rock River Rangers', away: 'Porus United', homeScore: 2, awayScore: 2, date: '28 Jun' },
  { home: 'Frankfield Boys', away: 'MU Clarendon', homeScore: 1, awayScore: 3, date: '27 Jun' },
]

export default function LivePage() {
  return (
    <main className="min-h-screen bg-bg-base">
      <div className="container-cesp py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <Radio size={24} className="text-brand-primary" />
            <h1 className="text-4xl font-bold text-text-primary">Live</h1>
          </div>
          <p className="text-text-secondary">Real-time scores and match coverage</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="card border-bg-border text-center py-16 mb-10 relative overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-brand-primary/3 blur-3xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-bg-muted border border-bg-border text-text-muted text-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-status-success" />
              No match in progress
            </div>

            <h2 className="text-2xl font-bold text-text-primary mb-2">Next up</h2>
            <p className="text-text-muted text-sm mb-8">{nextMatch.venue}</p>

            <div className="flex items-center justify-center gap-8 mb-6">
              <div className="text-right">
                <p className="font-bold text-text-primary text-lg">{nextMatch.home}</p>
              </div>
              <div className="px-5 py-3 rounded-2xl bg-bg-muted border border-bg-border">
                <p className="text-text-muted text-xs mb-1">vs</p>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Clock size={11} />
                  {nextMatch.time}
                </div>
              </div>
              <div className="text-left">
                <p className="font-bold text-text-primary text-lg">{nextMatch.away}</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-sm text-text-muted mb-8">
              <Calendar size={14} />
              {new Date(nextMatch.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>

            <button className="btn-primary gap-2">
              <Bell size={16} />
              Notify me when it starts
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-lg font-bold text-text-primary mb-4">Recent Results</h2>
          <div className="space-y-3">
            {recentResults.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.06 }}
                className="card flex items-center justify-between"
              >
                <div className="flex-1 text-right">
                  <p className="font-medium text-sm text-text-primary">{r.home}</p>
                </div>
                <div className="mx-6 flex items-center gap-2">
                  <span className="text-xl font-bold text-text-primary">{r.homeScore}</span>
                  <span className="text-text-muted">-</span>
                  <span className="text-xl font-bold text-text-primary">{r.awayScore}</span>
                </div>
                <div className="flex-1 flex items-center gap-3">
                  <p className="font-medium text-sm text-text-primary">{r.away}</p>
                  <span className="text-xs text-text-muted ml-auto">{r.date}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  )
}
