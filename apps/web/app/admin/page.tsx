'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CalendarDays,
  CheckCircle,
  Clock,
  ShieldCheck,
  Users2,
  UserSquare2,
  ClipboardList,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type UserRole = 'super_admin' | 'team_admin' | 'coach'

type DashboardStats = {
  primary: number
  secondary: number
  tertiary: number
  quaternary: number
}

type RecentFixture = {
  id: string
  label: string
  sub: string
  time: string
}

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      delay: i * 0.07,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<UserRole | null>(null)
  const [teamId, setTeamId] = useState<string | null>(null)
  const [teamName, setTeamName] = useState('')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activity, setActivity] = useState<RecentFixture[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('role, team_id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        setLoading(false)
        return
      }

      const nextRole = profile.role as UserRole
      setRole(nextRole)
      setTeamId(profile.team_id ?? null)

      if (nextRole === 'super_admin') {
        const [teams, upcoming, live, players] = await Promise.all([
          (supabase as any).from('teams').select('id', { count: 'exact', head: true }),
          (supabase as any).from('fixtures').select('id', { count: 'exact', head: true }).eq('status', 'scheduled'),
          (supabase as any).from('fixtures').select('id', { count: 'exact', head: true }).eq('status', 'live'),
          (supabase as any).from('players').select('id', { count: 'exact', head: true }).eq('is_active', true),
        ])

        setStats({
          primary: teams.count ?? 0,
          secondary: players.count ?? 0,
          tertiary: upcoming.count ?? 0,
          quaternary: live.count ?? 0,
        })

        const { data: recentFixtures } = await (supabase as any)
          .from('fixtures')
          .select('id, round, match_date, home_team:teams!fixtures_home_team_id_fkey(name), away_team:teams!fixtures_away_team_id_fkey(name)')
          .order('match_date', { ascending: true })
          .limit(5)

        setActivity(
          (recentFixtures ?? []).map((fixture: any) => ({
            id: fixture.id,
            label: `${fixture.home_team?.name ?? 'TBD'} vs ${fixture.away_team?.name ?? 'TBD'}`,
            sub: fixture.round ?? 'Fixture',
            time: fixture.match_date
              ? new Date(fixture.match_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
              : 'TBD',
          }))
        )

        setLoading(false)
        return
      }

      if (!profile.team_id) {
        setStats({ primary: 0, secondary: 0, tertiary: 0, quaternary: 0 })
        setActivity([])
        setLoading(false)
        return
      }

      const { data: teamRow } = await (supabase as any)
        .from('teams')
        .select('name')
        .eq('id', profile.team_id)
        .single()

      setTeamName(teamRow?.name ?? '')

      const teamFilter = `home_team_id.eq.${profile.team_id},away_team_id.eq.${profile.team_id}`
      const [roster, starters, upcoming, live, savedLineups, recentFixtures] = await Promise.all([
        (supabase as any).from('players').select('id', { count: 'exact', head: true }).eq('team_id', profile.team_id).eq('is_active', true),
        (supabase as any).from('players').select('id', { count: 'exact', head: true }).eq('team_id', profile.team_id).eq('is_active', true).eq('is_starter', true),
        (supabase as any).from('fixtures').select('id', { count: 'exact', head: true }).eq('status', 'scheduled').or(teamFilter),
        (supabase as any).from('fixtures').select('id', { count: 'exact', head: true }).eq('status', 'live').or(teamFilter),
        (supabase as any).from('formations').select('id', { count: 'exact', head: true }).eq('team_id', profile.team_id),
        (supabase as any)
          .from('fixtures')
          .select('id, round, match_date, home_team:teams!fixtures_home_team_id_fkey(name), away_team:teams!fixtures_away_team_id_fkey(name)')
          .or(teamFilter)
          .order('match_date', { ascending: true })
          .limit(5),
      ])

      setStats({
        primary: roster.count ?? 0,
        secondary: starters.count ?? 0,
        tertiary: upcoming.count ?? 0,
        quaternary: savedLineups.count ?? 0,
      })

      setActivity(
        (recentFixtures.data ?? recentFixtures ?? []).map((fixture: any) => ({
          id: fixture.id,
          label: `${fixture.home_team?.name ?? 'TBD'} vs ${fixture.away_team?.name ?? 'TBD'}`,
          sub: fixture.round ?? 'Fixture',
          time: fixture.match_date
            ? new Date(fixture.match_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
            : 'TBD',
        }))
      )

      setLoading(false)
    }

    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
      </div>
    )
  }

  const isSuperAdmin = role === 'super_admin'
  const statCards = isSuperAdmin
    ? [
        { label: 'Teams', value: stats?.primary ?? 0, icon: Users2, href: '/admin/teams', colour: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'Active Players', value: stats?.secondary ?? 0, icon: UserSquare2, href: '/admin/teams', colour: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'Upcoming Fixtures', value: stats?.tertiary ?? 0, icon: CalendarDays, href: '/admin/matches', colour: 'text-brand-secondary', bg: 'bg-brand-primary/10' },
        { label: 'Live Matches', value: stats?.quaternary ?? 0, icon: ShieldCheck, href: '/admin/matches', colour: 'text-red-400', bg: 'bg-red-500/10' },
      ]
    : [
        { label: 'Active Roster', value: stats?.primary ?? 0, icon: Users2, href: '/admin/teams', colour: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'Starting XI', value: stats?.secondary ?? 0, icon: UserSquare2, href: '/admin/teams', colour: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'Upcoming Matches', value: stats?.tertiary ?? 0, icon: CalendarDays, href: '/admin/matches', colour: 'text-brand-secondary', bg: 'bg-brand-primary/10' },
        { label: 'Saved Lineups', value: stats?.quaternary ?? 0, icon: ClipboardList, href: '/admin/matches', colour: 'text-amber-400', bg: 'bg-amber-500/10' },
      ]

  const quickActions = isSuperAdmin
    ? [
        { href: '/admin/matches', label: 'Manage matches', desc: 'Update schedules, scores, and streams' },
        { href: '/admin/teams', label: 'Manage team sheets', desc: 'Edit rosters, captains, and starters' },
      ]
    : [
        { href: '/admin/teams', label: 'Manage your roster', desc: 'Update player list, positions, and leadership roles' },
        { href: '/admin/matches', label: 'Set match lineup', desc: 'Choose starters, bench, and formation for your team' },
      ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">
          {isSuperAdmin ? 'Admin Dashboard' : teamName ? `${teamName} Admin` : 'Team Dashboard'}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {isSuperAdmin
            ? 'Control fixtures, squads, and platform content from one place.'
            : 'Your access is limited to your assigned team roster, lineup, bench, and formation.'}
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.label}
              custom={index}
              initial="hidden"
              animate="show"
              variants={CARD_VARIANTS}
            >
              <Link href={card.href} className="block">
                <div className="rounded-2xl border border-[#1e1e1e] bg-[#111111] p-4 transition-all duration-200 hover:border-brand-primary/20">
                  <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${card.bg}`}>
                    <Icon size={16} className={card.colour} />
                  </div>
                  <p className="text-2xl font-bold text-text-primary">{card.value}</p>
                  <p className="mt-0.5 text-xs text-text-muted">{card.label}</p>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-text-muted">Quick actions</h2>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.href}
                custom={index + 4}
                initial="hidden"
                animate="show"
                variants={CARD_VARIANTS}
              >
                <Link
                  href={action.href}
                  className="flex items-center gap-3 rounded-2xl border border-[#1e1e1e] bg-[#111111] px-4 py-3.5 transition-all duration-200 hover:border-brand-primary/20"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary/10">
                    <ArrowRight size={16} className="text-brand-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text-primary">{action.label}</p>
                    <p className="text-xs text-text-muted">{action.desc}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted">
              {isSuperAdmin ? 'Upcoming fixtures' : 'Your fixtures'}
            </h2>
            <Link href="/admin/matches" className="text-xs text-brand-secondary hover:underline">
              View all
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#1e1e1e] bg-[#111111]">
            {activity.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-text-muted">
                {teamId ? 'No fixtures available yet.' : 'You are not assigned to a team yet.'}
              </div>
            ) : (
              <div>
                {activity.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 px-5 py-3.5 ${index < activity.length - 1 ? 'border-b border-[#1a1a1a]' : ''}`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-muted">
                      <CalendarDays size={14} className="text-text-muted" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">{item.label}</p>
                      <p className="text-xs text-text-muted">{item.sub}</p>
                    </div>
                    <p className="text-xs text-text-muted">{item.time}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        {[
          { icon: CheckCircle, colour: 'text-green-400', label: 'Roster controls live' },
          { icon: Clock, colour: 'text-amber-400', label: 'Match lineup saving enabled' },
          { icon: ShieldCheck, colour: 'text-blue-400', label: isSuperAdmin ? 'Global admin access' : 'Team-only admin access' },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="flex items-center gap-2 text-xs text-text-muted">
              <Icon size={12} className={item.colour} />
              {item.label}
            </div>
          )
        })}
      </div>
    </div>
  )
}
