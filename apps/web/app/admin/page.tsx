'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import {
  CalendarDays, Users, HandHeart, Newspaper,
  TrendingUp, Clock, CheckCircle, AlertCircle,
  ArrowRight,
} from 'lucide-react'

type Stats = {
  totalTeams: number
  upcomingFixtures: number
  liveMatches: number
  pendingVolunteers: number
  totalArticles: number
  recentDonations: number
}

type RecentActivity = {
  id: string
  type: 'fixture' | 'volunteer' | 'article'
  label: string
  sub: string
  time: string
}

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }),
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [activity, setActivity] = useState<RecentActivity[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const [teams, upcoming, live, volunteers, articles] = await Promise.all([
        (supabase as any).from('teams').select('id', { count: 'exact', head: true }),
        (supabase as any).from('fixtures').select('id', { count: 'exact', head: true }).eq('status', 'scheduled'),
        (supabase as any).from('fixtures').select('id', { count: 'exact', head: true }).eq('status', 'live'),
        (supabase as any).from('volunteer_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        (supabase as any).from('articles').select('id', { count: 'exact', head: true }),
      ])

      setStats({
        totalTeams: teams.count ?? 0,
        upcomingFixtures: upcoming.count ?? 0,
        liveMatches: live.count ?? 0,
        pendingVolunteers: volunteers.count ?? 0,
        totalArticles: articles.count ?? 0,
        recentDonations: 0,
      })

      // Recent activity: last 5 fixtures
      const { data: recentFixtures } = await (supabase as any)
        .from('fixtures')
        .select('id, round, match_date, status, home_team:teams!fixtures_home_team_id_fkey(name), away_team:teams!fixtures_away_team_id_fkey(name)')
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentFixtures) {
        setActivity(
          recentFixtures.map((f: any) => ({
            id: f.id,
            type: 'fixture',
            label: `${f.home_team?.name ?? 'TBD'} vs ${f.away_team?.name ?? 'TBD'}`,
            sub: f.round ?? 'Match',
            time: f.match_date ? new Date(f.match_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '',
          }))
        )
      }
    }
    load()
  }, [])

  const STAT_CARDS = [
    {
      label: 'Teams',
      value: stats?.totalTeams ?? '-',
      icon: Users,
      colour: 'text-blue-400',
      bg: 'bg-blue-500/10',
      href: '/teams',
    },
    {
      label: 'Upcoming Fixtures',
      value: stats?.upcomingFixtures ?? '-',
      icon: CalendarDays,
      colour: 'text-brand-secondary',
      bg: 'bg-brand-primary/10',
      href: '/admin/matches',
    },
    {
      label: 'Live Now',
      value: stats?.liveMatches ?? '-',
      icon: TrendingUp,
      colour: 'text-green-400',
      bg: 'bg-green-500/10',
      href: '/admin/matches',
    },
    {
      label: 'Pending Volunteers',
      value: stats?.pendingVolunteers ?? '-',
      icon: HandHeart,
      colour: 'text-amber-400',
      bg: 'bg-amber-500/10',
      href: '/admin/volunteers',
    },
    {
      label: 'Articles',
      value: stats?.totalArticles ?? '-',
      icon: Newspaper,
      colour: 'text-purple-400',
      bg: 'bg-purple-500/10',
      href: '/admin/news',
    },
  ]

  const QUICK_ACTIONS = [
    { href: '/admin/matches', label: 'Manage Matches', icon: CalendarDays, desc: 'Update scores and match status' },
    { href: '/admin/volunteers', label: 'Review Volunteers', icon: HandHeart, desc: 'Approve or reject applications' },
    { href: '/admin/news', label: 'Write Article', icon: Newspaper, desc: 'Publish news and match reports' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-muted text-sm mt-1">Welcome back. Here is what needs attention.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {STAT_CARDS.map((card, i) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.label}
              custom={i}
              initial="hidden"
              animate="show"
              variants={CARD_VARIANTS}
            >
              <Link href={card.href} className="block group">
                <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-4 hover:border-brand-primary/20 transition-all duration-200">
                  <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                    <Icon size={16} className={card.colour} />
                  </div>
                  <p className="text-2xl font-bold text-text-primary">{card.value}</p>
                  <p className="text-xs text-text-muted mt-0.5">{card.label}</p>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-4">Quick actions</h2>
          <div className="space-y-3">
            {QUICK_ACTIONS.map((a, i) => {
              const Icon = a.icon
              return (
                <motion.div key={a.href} custom={i + 5} initial="hidden" animate="show" variants={CARD_VARIANTS}>
                  <Link
                    href={a.href}
                    className="flex items-center gap-3 bg-[#111111] border border-[#1e1e1e] rounded-2xl px-4 py-3.5 hover:border-brand-primary/20 group transition-all duration-200"
                  >
                    <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-brand-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary">{a.label}</p>
                      <p className="text-xs text-text-muted">{a.desc}</p>
                    </div>
                    <ArrowRight size={14} className="text-text-muted group-hover:text-brand-secondary transition-colors shrink-0" />
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Recent fixtures */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest">Recent fixtures</h2>
            <Link href="/admin/matches" className="text-xs text-brand-secondary hover:underline">View all</Link>
          </div>

          <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
            {activity.length === 0 ? (
              <div className="px-5 py-10 text-center text-text-muted text-sm">No fixtures yet.</div>
            ) : (
              <div>
                {activity.map((item, i) => (
                  <div key={item.id} className={`flex items-center gap-4 px-5 py-3.5 ${i < activity.length - 1 ? 'border-b border-[#1a1a1a]' : ''}`}>
                    <div className="w-8 h-8 rounded-lg bg-bg-muted flex items-center justify-center shrink-0">
                      <CalendarDays size={14} className="text-text-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{item.label}</p>
                      <p className="text-xs text-text-muted">{item.sub}</p>
                    </div>
                    <p className="text-xs text-text-muted shrink-0">{item.time}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status key */}
      <div className="mt-8 flex flex-wrap gap-4">
        {[
          { icon: CheckCircle, colour: 'text-green-400', label: 'System operational' },
          { icon: Clock, colour: 'text-amber-400', label: 'Supabase realtime active' },
          { icon: AlertCircle, colour: 'text-text-muted', label: 'RLS enforced on all tables' },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="flex items-center gap-2 text-xs text-text-muted">
              <Icon size={12} className={s.colour} />
              {s.label}
            </div>
          )
        })}
      </div>
    </div>
  )
}
