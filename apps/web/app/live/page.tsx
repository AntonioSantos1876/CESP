'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Radio, Bell, Play, Clock, Calendar, Eye, Film, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { TeamLink } from '@/components/TeamLink'
import { createClient } from '@/lib/supabase/client'

type StreamStatus = 'live' | 'upcoming' | 'vod'

type Stream = {
  id: string
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

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export default function LivePage() {
  const [reminders, setReminders] = useState<Set<string>>(new Set())
  const [viewers, setViewers] = useState(0)
  const [streams, setStreams] = useState<Stream[]>([])

  const liveMatch = streams.find(s => s.status === 'live')
  const upcoming = streams.filter(s => s.status === 'upcoming')
  const vods = streams.filter(s => s.status === 'vod')

  useEffect(() => {
    const supabase = createClient()

    async function loadStreams() {
      const { data } = await (supabase as any)
        .from('fixtures')
        .select(`
          id, match_date, venue, status, youtube_stream_id,
          home_team:teams!fixtures_home_team_id_fkey(name),
          away_team:teams!fixtures_away_team_id_fkey(name),
          match_scores(home_score, away_score)
        `)
        .not('status', 'in', '(postponed,cancelled)')
        .order('match_date', { ascending: true })

      const rows = (data ?? []) as any[]
      const mapped: Stream[] = rows.map((row) => {
        const score = Array.isArray(row.match_scores) ? row.match_scores[0] : row.match_scores
        let streamStatus: StreamStatus = 'upcoming'
        if (row.status === 'live') streamStatus = 'live'
        else if (row.status === 'completed') streamStatus = 'vod'

        return {
          id: row.id,
          home: row.home_team?.name ?? 'TBA',
          away: row.away_team?.name ?? 'TBA',
          date: row.match_date?.slice(0, 10) ?? '',
          time: row.match_date?.slice(11, 16) ?? '',
          venue: row.venue ?? 'TBC',
          homeScore: score?.home_score ?? null,
          awayScore: score?.away_score ?? null,
          status: streamStatus,
          youtubeId: row.youtube_stream_id ?? undefined,
        }
      })
      setStreams(mapped)
    }

    loadStreams()

    const presenceChannel = supabase
      .channel('live_hub_presence')
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        setViewers(Object.keys(state).length || 312)
      })
      .subscribe()

    const dataChannel = supabase
      .channel('live_hub_data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fixtures' }, loadStreams)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_scores' }, loadStreams)
      .subscribe()

    return () => {
      supabase.removeChannel(presenceChannel)
      supabase.removeChannel(dataChannel)
    }
  }, [])

  function toggleReminder(id: string) {
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

            <motion.div
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className="relative overflow-hidden rounded-2xl border border-brand-primary/30 bg-gradient-to-br from-brand-primary/10 via-bg-card to-bg-card group"
            >
              <div className="absolute inset-0 pointer-events-none">
                <motion.div
                  className="absolute top-1/2 left-1/2 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-primary/8 blur-3xl"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>

              <div className="relative z-10 p-8 md:p-10">
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="live-dot" />
                    <span className="text-brand-secondary text-sm font-bold">LIVE</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-text-muted">
                    <Eye size={14} />
                    <span>{viewers.toLocaleString()} watching</span>
                  </div>
                </div>

                <div className="mb-8 flex items-center justify-center gap-6 md:gap-12">
                  <div className="flex-1 text-center">
                    <TeamLink
                      teamName={liveMatch.home}
                      logoSize={60}
                      className="inline-flex max-w-full flex-col items-center gap-3"
                      nameClassName="text-center text-lg font-bold text-white md:text-2xl"
                      showLogo
                    />
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <motion.span
                      key={liveMatch.homeScore}
                      initial={{ scale: 1.4, color: '#E85D04' }}
                      animate={{ scale: 1, color: '#FFFFFF' }}
                      transition={{ duration: 0.4 }}
                      className="text-5xl font-black text-white tabular-nums md:text-6xl"
                    >
                      {liveMatch.homeScore ?? 0}
                    </motion.span>
                    <span className="text-2xl font-light text-text-muted">-</span>
                    <motion.span
                      key={liveMatch.awayScore}
                      initial={{ scale: 1.4, color: '#E85D04' }}
                      animate={{ scale: 1, color: '#FFFFFF' }}
                      transition={{ duration: 0.4 }}
                      className="text-5xl font-black text-white tabular-nums md:text-6xl"
                    >
                      {liveMatch.awayScore ?? 0}
                    </motion.span>
                  </div>

                  <div className="flex-1 text-center">
                    <TeamLink
                      teamName={liveMatch.away}
                      logoSize={60}
                      className="inline-flex max-w-full flex-col items-center gap-3"
                      nameClassName="text-center text-lg font-bold text-white md:text-2xl"
                      showLogo
                    />
                  </div>
                </div>

                <div className="mb-8 flex items-center justify-center gap-2 text-sm text-text-muted">
                  <Clock size={13} />
                  <span>{liveMatch.time}</span>
                  <span className="mx-1 text-bg-border">|</span>
                  <span>{liveMatch.venue}</span>
                </div>

                <div className="flex justify-center">
                  <Link href={`/live/${liveMatch.id}`} className="btn-primary inline-flex items-center gap-2 px-8 py-3">
                    <Play size={16} fill="currentColor" />
                    Watch Live
                    <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </motion.div>
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
                className="card flex flex-col gap-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-text-muted text-xs">
                    <Calendar size={12} />
                    <span>{formatDate(match.date)}</span>
                    <span className="ml-1">{match.time}</span>
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
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <TeamLink
                    teamName={match.home}
                    logoSize={28}
                    truncate={false}
                    className="min-w-0"
                    nameClassName="text-sm font-medium text-text-primary leading-tight"
                  />
                  <span className="text-text-muted shrink-0 text-xs px-1">vs</span>
                  <TeamLink
                    teamName={match.away}
                    logoSize={28}
                    truncate={false}
                    className="min-w-0"
                    nameClassName="text-sm font-medium text-text-primary leading-tight"
                  />
                </div>
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
          {vods.length === 0 ? (
            <div className="card text-center text-text-muted">
              No match replays are available yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vods.map((match, i) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.06 }}
                  className="card-hover group"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <Film size={14} className="text-text-muted" />
                    <span className="text-xs text-text-muted">{formatDate(match.date)} replay</span>
                  </div>

                  <div className="mb-3 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <TeamLink
                        teamName={match.home}
                        logoSize={28}
                        truncate={false}
                        className="flex-1 min-w-0"
                        nameClassName="text-sm font-semibold text-text-primary leading-tight"
                      />
                      <div className="flex shrink-0 items-center gap-1">
                        <span className="text-lg font-bold text-text-primary">{match.homeScore}</span>
                        <span className="text-xs text-text-muted">-</span>
                        <span className="text-lg font-bold text-text-primary">{match.awayScore}</span>
                      </div>
                    </div>
                    <TeamLink
                      teamName={match.away}
                      logoSize={28}
                      truncate={false}
                      className="min-w-0"
                      nameClassName="text-sm font-medium text-text-secondary leading-tight"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-1 text-xs text-text-muted transition-colors group-hover:text-brand-secondary">
                    {match.youtubeId ? (
                      <a
                        href={`https://www.youtube.com/watch?v=${match.youtubeId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-brand-secondary"
                      >
                        <Play size={11} />
                        Watch replay
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1 opacity-40 cursor-not-allowed">
                        <Play size={11} />
                        Replay coming soon
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </main>
  )
}
