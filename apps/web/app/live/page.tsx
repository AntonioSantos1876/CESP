'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Radio, Bell, Play, Clock, Calendar, Eye, Film, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type StreamStatus = 'live' | 'upcoming' | 'vod'

type Stream = {
  id: number
  home: string
  away: string
  date: string
  time: string
  venue: string
  homeScore: number | null
  awayScore: number | null
  status: StreamStatus
  youtubeId?: string
  viewers?: number
}

const STREAMS: Stream[] = [
  {
    id: 9,
    home: 'Excelsior High School',
    away: 'Mona High School',
    date: '2026-06-06',
    time: '15:00',
    venue: 'Glenmuir High School',
    homeScore: 1,
    awayScore: 0,
    status: 'live',
    youtubeId: 'live_stream_id',
    viewers: 312,
  },
  {
    id: 1,
    home: 'Vere Technical High School',
    away: 'Mona High School',
    date: '2026-07-31',
    time: '10:00',
    venue: 'Glenmuir High School',
    homeScore: null,
    awayScore: null,
    status: 'upcoming',
  },
  {
    id: 2,
    home: 'Denbigh High School',
    away: 'Excelsior High School',
    date: '2026-07-31',
    time: '12:00',
    venue: 'Glenmuir High School',
    homeScore: null,
    awayScore: null,
    status: 'upcoming',
  },
  {
    id: 3,
    home: 'Kingston College',
    away: 'Manchester High School',
    date: '2026-07-31',
    time: '14:00',
    venue: 'Glenmuir High School',
    homeScore: null,
    awayScore: null,
    status: 'upcoming',
  },
  {
    id: 4,
    home: 'Glenmuir High School',
    away: 'Munro College',
    date: '2026-07-31',
    time: '16:00',
    venue: 'Glenmuir High School',
    homeScore: 0,
    awayScore: 0,
    status: 'vod',
    youtubeId: 'dQw4w9WgXcQ',
  },
  {
    id: 5,
    home: 'Denbigh High School',
    away: 'Glenmuir High School',
    date: '2026-08-01',
    time: '14:00',
    venue: 'Glenmuir High School',
    homeScore: 2,
    awayScore: 1,
    status: 'vod',
    youtubeId: 'dQw4w9WgXcQ',
  },
  {
    id: 6,
    home: 'Kingston College',
    away: 'Munro College',
    date: '2026-08-01',
    time: '16:00',
    venue: 'Glenmuir High School',
    homeScore: 1,
    awayScore: 3,
    status: 'vod',
    youtubeId: 'dQw4w9WgXcQ',
  },
]

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export default function LivePage() {
  const [reminders, setReminders] = useState<Set<number>>(new Set())
  const [viewers, setViewers] = useState(STREAMS.find(s => s.status === 'live')?.viewers ?? 0)

  const liveMatch = STREAMS.find(s => s.status === 'live')
  const upcoming = STREAMS.filter(s => s.status === 'upcoming')
  const vods = STREAMS.filter(s => s.status === 'vod')

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('live_hub_presence')
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setViewers(Object.keys(state).length || 312)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  function toggleReminder(id: number) {
    setReminders(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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
            <h1 className="text-4xl font-bold text-text-primary">Live Streams</h1>
          </div>
          <p className="text-text-secondary">Watch Clarendon Elite Cup matches live and on demand</p>
        </motion.div>

        {/* LIVE NOW */}
        {liveMatch && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mb-12"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="live-dot" />
              <h2 className="text-sm font-bold text-brand-secondary uppercase tracking-widest">Live Now</h2>
            </div>

            <Link href={`/live/${liveMatch.id}`}>
              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
                className="relative rounded-2xl overflow-hidden border border-brand-primary/30 bg-gradient-to-br from-brand-primary/10 via-bg-card to-bg-card cursor-pointer group"
              >
                <div className="absolute inset-0 pointer-events-none">
                  <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full bg-brand-primary/8 blur-3xl"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>

                <div className="relative z-10 p-8 md:p-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                      <span className="live-dot" />
                      <span className="text-brand-secondary text-sm font-bold">LIVE</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-text-muted text-sm">
                      <Eye size={14} />
                      <span>{viewers.toLocaleString()} watching</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-6 md:gap-12 mb-8">
                    <div className="flex-1 text-center">
                      <p className="font-bold text-white text-lg md:text-2xl">{liveMatch.home}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <motion.span
                        key={liveMatch.homeScore}
                        initial={{ scale: 1.4, color: '#E85D04' }}
                        animate={{ scale: 1, color: '#FFFFFF' }}
                        transition={{ duration: 0.4 }}
                        className="text-5xl md:text-6xl font-black text-white tabular-nums"
                      >
                        {liveMatch.homeScore ?? 0}
                      </motion.span>
                      <span className="text-2xl text-text-muted font-light">-</span>
                      <motion.span
                        key={liveMatch.awayScore}
                        initial={{ scale: 1.4, color: '#E85D04' }}
                        animate={{ scale: 1, color: '#FFFFFF' }}
                        transition={{ duration: 0.4 }}
                        className="text-5xl md:text-6xl font-black text-white tabular-nums"
                      >
                        {liveMatch.awayScore ?? 0}
                      </motion.span>
                    </div>

                    <div className="flex-1 text-center">
                      <p className="font-bold text-white text-lg md:text-2xl">{liveMatch.away}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-text-muted text-sm mb-8">
                    <Clock size={13} />
                    <span>{liveMatch.time}</span>
                    <span className="mx-1 text-bg-border">|</span>
                    <span>{liveMatch.venue}</span>
                  </div>

                  <div className="flex justify-center">
                    <span className="btn-primary inline-flex items-center gap-2 px-8 py-3">
                      <Play size={16} fill="currentColor" />
                      Watch Live
                      <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </motion.div>
            </Link>
          </motion.section>
        )}

        {/* Upcoming */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-12"
        >
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-4">Upcoming Streams</h2>
          <div className="space-y-3">
            {upcoming.map((match, i) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.07 }}
                className="card flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-text-muted text-xs shrink-0">
                    <Calendar size={12} />
                    <span>{formatDate(match.date)}</span>
                    <span className="ml-1">{match.time}</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-sm text-text-primary min-w-0">
                    <span className="truncate">{match.home}</span>
                    <span className="text-text-muted shrink-0">vs</span>
                    <span className="truncate">{match.away}</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleReminder(match.id)}
                  className={`shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    reminders.has(match.id)
                      ? 'bg-brand-primary/15 border-brand-primary/30 text-brand-secondary'
                      : 'bg-bg-muted border-bg-border text-text-muted hover:text-text-primary'
                  }`}
                >
                  <Bell size={12} />
                  {reminders.has(match.id) ? 'Reminder set' : 'Remind me'}
                </button>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Past VODs */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-4">Match Replays</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vods.map((match, i) => (
              <Link key={match.id} href={`/live/${match.id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.06 }}
                  className="card-hover group cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Film size={14} className="text-text-muted" />
                    <span className="text-xs text-text-muted">{formatDate(match.date)} replay</span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 text-right">
                      <p className="font-semibold text-sm text-text-primary">{match.home}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xl font-bold text-text-primary">{match.homeScore}</span>
                      <span className="text-text-muted text-sm">-</span>
                      <span className="text-xl font-bold text-text-primary">{match.awayScore}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-text-primary">{match.away}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1 text-xs text-text-muted group-hover:text-brand-secondary transition-colors">
                    <Play size={11} />
                    Watch replay
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.section>
      </div>
    </main>
  )
}
