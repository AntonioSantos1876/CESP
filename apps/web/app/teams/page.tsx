'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Trophy, Target, TrendingUp, ChevronRight } from 'lucide-react'
import { TeamLogo } from '@/components/TeamLogo'
import { createClient } from '@/lib/supabase/client'
import { SCHOOL_TEAM_ORDER, getTeamBranding, getTeamHref } from '@/lib/school-teams'

type TeamRow = {
  id: string
  name: string
  short_name: string
  home_colour: string
  description: string | null
}

type ProfileRow = {
  full_name: string | null
  role: 'coach' | 'team_admin'
  team_id: string | null
}

type FixtureRow = {
  home_team_id: string
  away_team_id: string
  status: 'scheduled' | 'live' | 'completed' | 'postponed' | 'cancelled'
  match_scores: { home_score: number; away_score: number }[] | { home_score: number; away_score: number } | null
}

type GoalRow = {
  team_id: string
  player: { full_name: string } | { full_name: string }[] | null
}

type TeamCard = {
  id: string
  name: string
  shortName: string
  color: string
  manager: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  topScorer: string
  points: number
  description: string | null
}

const FALLBACK_TEAMS: TeamRow[] = SCHOOL_TEAM_ORDER.map(name => {
  const branding = getTeamBranding(name)
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name,
    short_name: branding.shortName,
    home_colour: branding.primary,
    description: null,
  }
})

function getScore(matchScores: FixtureRow['match_scores']) {
  if (!matchScores) return null
  return Array.isArray(matchScores) ? matchScores[0] ?? null : matchScores
}

function getPlayerName(player: GoalRow['player']) {
  if (!player) return 'Unknown player'
  return Array.isArray(player) ? (player[0]?.full_name ?? 'Unknown player') : player.full_name
}

function TeamCardItem({ team, index }: { team: TeamCard; index: number }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link href={getTeamHref(team.name)} className="block">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -4 }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        className="card overflow-hidden transition-all duration-200 hover:shadow-card-hover"
        style={{
          borderColor: hovered ? team.color : undefined,
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
        }}
      >
        <div
          className="h-1.5 w-full rounded-t-lg -mt-5 -mx-5 mb-4"
          style={{ backgroundColor: team.color, width: 'calc(100% + 2.5rem)' }}
        />

        <div className="mb-4 flex items-center gap-3">
          <TeamLogo teamName={team.name} size={52} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-bold leading-tight text-text-primary">{team.name}</h2>
                <p className="text-xs text-text-muted">Staff lead: {team.manager}</p>
              </div>
              <span
                className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.28em]"
                style={{ backgroundColor: `${team.color}22`, color: team.color }}
              >
                {team.shortName}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-4 gap-2">
          {[
            { label: 'P', value: team.played },
            { label: 'W', value: team.won },
            { label: 'D', value: team.drawn },
            { label: 'L', value: team.lost },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl bg-bg-muted p-2 text-center">
              <div className="text-lg font-bold text-text-primary">{stat.value}</div>
              <div className="text-xs text-text-muted">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-text-secondary">
            <Target size={14} className="shrink-0" />
            <span>{team.goalsFor} scored, {team.goalsAgainst} conceded</span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <TrendingUp size={14} className="shrink-0" />
            <span>Top scorer: {team.topScorer}</span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <Trophy size={14} className="shrink-0" />
            <span className="font-semibold" style={{ color: team.color }}>
              {team.points} pts
            </span>
          </div>
        </div>

        {team.description && (
          <p className="mt-4 text-sm leading-6 text-text-muted">
            {team.description}
          </p>
        )}

        <div className="mt-5 flex items-center gap-2 text-sm font-semibold" style={{ color: team.color }}>
          View team page
          <ChevronRight size={15} />
        </div>
      </motion.div>
    </Link>
  )
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: teamsData }, { data: staffData }, { data: fixturesData }, { data: goalsData }] = await Promise.all([
        (supabase as any)
          .from('teams')
          .select('id, name, short_name, home_colour, description')
          .order('name', { ascending: true }),
        (supabase as any)
          .from('profiles')
          .select('full_name, role, team_id')
          .in('role', ['coach', 'team_admin']),
        (supabase as any)
          .from('fixtures')
          .select('home_team_id, away_team_id, status, match_scores(home_score, away_score)')
          .in('status', ['live', 'completed']),
        (supabase as any)
          .from('match_stats')
          .select('team_id, player:players(full_name)')
          .eq('event_type', 'goal'),
      ])

      const staffByTeam = new Map<string, ProfileRow[]>()
      ;((staffData ?? []) as ProfileRow[]).forEach(member => {
        if (!member.team_id) return
        const list = staffByTeam.get(member.team_id) ?? []
        list.push(member)
        staffByTeam.set(member.team_id, list)
      })

      const goalCounts = new Map<string, Map<string, number>>()
      ;((goalsData ?? []) as GoalRow[]).forEach(goal => {
        const playerName = getPlayerName(goal.player)
        const teamGoals = goalCounts.get(goal.team_id) ?? new Map<string, number>()
        teamGoals.set(playerName, (teamGoals.get(playerName) ?? 0) + 1)
        goalCounts.set(goal.team_id, teamGoals)
      })

      const sourceTeams = ((teamsData ?? []) as TeamRow[]).length > 0 ? (teamsData as TeamRow[]) : FALLBACK_TEAMS

      const cards = sourceTeams.map(team => ({
        id: team.id,
        name: team.name,
        shortName: team.short_name,
        color: getTeamBranding(team.name)?.primary ?? team.home_colour,
        manager: 'Team staff pending',
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        topScorer: 'No goals recorded yet',
        points: 0,
        description: team.description,
      }))

      const teamMap = new Map(cards.map(team => [team.id, team]))

      ;((fixturesData ?? []) as FixtureRow[]).forEach(fixture => {
        const score = getScore(fixture.match_scores)
        if (!score) return

        const homeTeam = teamMap.get(fixture.home_team_id)
        const awayTeam = teamMap.get(fixture.away_team_id)
        if (!homeTeam || !awayTeam) return

        homeTeam.played += 1
        awayTeam.played += 1
        homeTeam.goalsFor += score.home_score
        homeTeam.goalsAgainst += score.away_score
        awayTeam.goalsFor += score.away_score
        awayTeam.goalsAgainst += score.home_score

        if (score.home_score > score.away_score) {
          homeTeam.won += 1
          awayTeam.lost += 1
        } else if (score.home_score < score.away_score) {
          awayTeam.won += 1
          homeTeam.lost += 1
        } else {
          homeTeam.drawn += 1
          awayTeam.drawn += 1
        }
      })

      cards.forEach(team => {
        team.points = team.won * 3 + team.drawn

        const staff = staffByTeam.get(team.id) ?? []
        const coach = staff.find(member => member.role === 'coach')
        const teamAdmin = staff.find(member => member.role === 'team_admin')
        team.manager = coach?.full_name ?? teamAdmin?.full_name ?? 'Team staff pending'

        const scorers = goalCounts.get(team.id)
        if (scorers && scorers.size > 0) {
          const [name, goals] = [...scorers.entries()].sort((left, right) => right[1] - left[1])[0]
          team.topScorer = `${name} (${goals})`
        }
      })

      setTeams(cards.sort((left, right) => left.name.localeCompare(right.name)))
      setLoading(false)
    }

    load()
  }, [])

  return (
    <main className="min-h-screen bg-bg-base">
      <div className="container-cesp py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <h1 className="text-4xl font-bold text-text-primary mb-2">Teams</h1>
          <p className="text-text-secondary">
            {loading ? 'Loading schools...' : `All ${teams.length} registered schools competing in the Clarendon Elite Cup`}
          </p>
        </motion.div>

        {loading ? (
          <div className="card text-center py-16 text-text-muted">Loading teams...</div>
        ) : teams.length === 0 ? (
          <div className="card text-center py-16 text-text-muted">No teams have been registered yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {teams.map((team, index) => (
              <TeamCardItem key={team.id} team={team} index={index} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
