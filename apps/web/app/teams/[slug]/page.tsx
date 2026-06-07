import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, ChevronRight, Shield, ShoppingBag, Target, Trophy, Users } from 'lucide-react'
import { TeamLogo } from '@/components/TeamLogo'
import { TeamLink } from '@/components/TeamLink'
import { createClient } from '@/lib/supabase/server'
import { getTeamBranding, getTeamHref, getTeamNameFromSlug, hexToRgba, SCHOOL_TEAM_ORDER } from '@/lib/school-teams'

type PageProps = {
  params: Promise<{ slug: string }>
}

type TeamRow = {
  id: string
  name: string
  short_name: string
  home_colour: string
  description: string | null
}

type StaffRow = {
  full_name: string | null
  role: 'coach' | 'team_admin'
}

type PlayerRow = {
  id: string
  full_name: string
  position: string | null
  jersey_number: number | null
  is_active: boolean
}

type FixtureRow = {
  id: string
  match_date: string
  venue: string | null
  round: string | null
  status: 'scheduled' | 'live' | 'completed' | 'postponed' | 'cancelled'
  home_team_id: string
  away_team_id: string
  home_team: { name: string } | null
  away_team: { name: string } | null
  match_scores: { home_score: number; away_score: number }[] | { home_score: number; away_score: number } | null
}

function getScore(matchScores: FixtureRow['match_scores']) {
  if (!matchScores) return null
  return Array.isArray(matchScores) ? (matchScores[0] ?? null) : matchScores
}

function formatLongDate(matchDate: string) {
  return new Date(matchDate).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(matchDate: string) {
  return new Date(matchDate).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function generateStaticParams() {
  return SCHOOL_TEAM_ORDER.map(name => ({
    slug: getTeamBranding(name).slug,
  }))
}

export default async function TeamDetailPage({ params }: PageProps) {
  const { slug } = await params
  const teamName = getTeamNameFromSlug(slug)

  if (!teamName) {
    notFound()
  }

  const branding = getTeamBranding(teamName)
  const supabase = await createClient()
  const { data: teamData } = await (supabase as any)
    .from('teams')
    .select('id, name, short_name, home_colour, description')
    .eq('name', teamName)
    .maybeSingle()

  const team = (teamData as TeamRow | null) ?? {
    id: branding.slug,
    name: teamName,
    short_name: branding.shortName,
    home_colour: branding.primary,
    description: null,
  }

  const [{ data: staffData }, { data: playersData }, { data: fixturesData }] = teamData
    ? await Promise.all([
        (supabase as any)
          .from('profiles')
          .select('full_name, role')
          .eq('team_id', team.id)
          .in('role', ['coach', 'team_admin'])
          .order('full_name', { ascending: true }),
        (supabase as any)
          .from('players')
          .select('id, full_name, position, jersey_number, is_active')
          .eq('team_id', team.id)
          .order('jersey_number', { ascending: true })
          .order('full_name', { ascending: true }),
        (supabase as any)
          .from('fixtures')
          .select(`
            id,
            match_date,
            venue,
            round,
            status,
            home_team_id,
            away_team_id,
            match_scores(home_score, away_score),
            home_team:teams!fixtures_home_team_id_fkey(name),
            away_team:teams!fixtures_away_team_id_fkey(name)
          `)
          .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
          .order('match_date', { ascending: true }),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }]

  const staff = (staffData ?? []) as StaffRow[]
  const players = ((playersData ?? []) as PlayerRow[]).sort((left, right) => {
    const leftNumber = left.jersey_number ?? 999
    const rightNumber = right.jersey_number ?? 999
    if (leftNumber !== rightNumber) return leftNumber - rightNumber
    return left.full_name.localeCompare(right.full_name)
  })
  const fixtures = (fixturesData ?? []) as FixtureRow[]

  let played = 0
  let won = 0
  let drawn = 0
  let lost = 0
  let goalsFor = 0
  let goalsAgainst = 0

  fixtures.forEach(fixture => {
    const score = getScore(fixture.match_scores)
    if (!score) return
    played += 1

    const isHome = fixture.home_team_id === team.id
    const teamGoals = isHome ? score.home_score : score.away_score
    const opponentGoals = isHome ? score.away_score : score.home_score

    goalsFor += teamGoals
    goalsAgainst += opponentGoals

    if (teamGoals > opponentGoals) won += 1
    else if (teamGoals < opponentGoals) lost += 1
    else drawn += 1
  })

  const points = won * 3 + drawn
  const coach = staff.find(member => member.role === 'coach')?.full_name ?? 'Pending assignment'
  const teamAdmin = staff.find(member => member.role === 'team_admin')?.full_name ?? 'Pending assignment'
  const activePlayers = players.filter(player => player.is_active)
  const upcomingFixtures = fixtures.filter(fixture => fixture.status === 'scheduled' || fixture.status === 'live').slice(0, 4)
  const recentFixtures = fixtures.filter(fixture => fixture.status === 'completed').slice(-4).reverse()
  const fixturePreview = upcomingFixtures.length > 0 ? upcomingFixtures : recentFixtures

  return (
    <main className="min-h-screen bg-bg-base">
      <div className="container-cesp py-8 md:py-12">
        <Link href="/teams" className="mb-6 inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text-primary">
          <ArrowLeft size={15} />
          Back to teams
        </Link>

        <section
          className="overflow-hidden rounded-[2rem] border border-white/10 p-6 md:p-8"
          style={{
            background: `linear-gradient(145deg, ${hexToRgba(branding.primary, 0.2)} 0%, rgba(15,15,15,0.98) 42%, rgba(10,10,10,1) 100%)`,
          }}
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr),minmax(20rem,0.8fr)] lg:items-start">
            <div>
              <div className="mb-5 flex items-center gap-4">
                <TeamLogo teamName={team.name} size={84} />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.35em]" style={{ color: branding.accent }}>
                    {team.short_name}
                  </p>
                  <h1 className="mt-2 text-3xl font-black text-text-primary md:text-5xl">{team.name}</h1>
                </div>
              </div>

              <p className="max-w-2xl text-base leading-7 text-text-secondary">
                {team.description ?? `${team.name} is one of the eight schools competing in the Clarendon Elite Cup knockout tournament.`}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/fixtures" className="btn-primary inline-flex items-center gap-2">
                  <Calendar size={15} />
                  View fixtures
                </Link>
                <Link href={`/shop?team=${branding.slug}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-white/[0.06]">
                  <ShoppingBag size={15} />
                  Shop team merch
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: 'Matches played', value: String(played) },
                { label: 'Points', value: String(points) },
                { label: 'Goals scored', value: String(goalsFor) },
                { label: 'Active players', value: String(activePlayers.length) },
              ].map(stat => (
                <div key={stat.label} className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-text-muted">{stat.label}</p>
                  <p className="mt-3 text-3xl font-black text-text-primary">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.2fr),minmax(21rem,0.8fr)]">
          <div className="space-y-6">
            <div className="card">
              <div className="mb-5 flex items-center gap-2">
                <Users size={18} className="text-brand-primary" />
                <h2 className="text-xl font-bold text-text-primary">Squad</h2>
              </div>
              {players.length === 0 ? (
                <p className="text-sm text-text-muted">Player registration will appear here once the coach or team admin adds the squad.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {players.map(player => (
                    <div key={player.id} className="rounded-[1.25rem] border border-white/10 bg-white/[0.02] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black"
                          style={{
                            backgroundColor: hexToRgba(branding.primary, 0.18),
                            color: branding.secondary,
                            border: `1px solid ${hexToRgba(branding.primary, 0.35)}`,
                          }}
                        >
                          {player.jersey_number ?? '--'}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-text-primary">{player.full_name}</p>
                          <p className="text-xs text-text-muted">{player.position ?? 'Position pending'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="mb-5 flex items-center gap-2">
                <Calendar size={18} className="text-brand-primary" />
                <h2 className="text-xl font-bold text-text-primary">Matches</h2>
              </div>
              {fixturePreview.length === 0 ? (
                <p className="text-sm text-text-muted">Fixtures will appear here once the tournament schedule is loaded for this team.</p>
              ) : (
                <div className="space-y-3">
                  {fixturePreview.map(fixture => {
                    const isHome = fixture.home_team_id === team.id
                    const opponent = isHome ? fixture.away_team?.name ?? 'TBD' : fixture.home_team?.name ?? 'TBD'
                    const score = getScore(fixture.match_scores)
                    const teamScore = score ? (isHome ? score.home_score : score.away_score) : null
                    const opponentScore = score ? (isHome ? score.away_score : score.home_score) : null
                    const isResult = fixture.status === 'completed'

                    return (
                      <div key={fixture.id} className="rounded-[1.35rem] border border-white/10 bg-white/[0.02] p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold uppercase tracking-[0.26em] text-text-muted">
                              {fixture.round ?? (isResult ? 'Result' : 'Upcoming')}
                            </p>
                            <div className="mt-2 flex items-center gap-2 text-sm text-text-secondary">
                              <span>{formatLongDate(fixture.match_date)}</span>
                              <span className="text-bg-border">•</span>
                              <span>{formatTime(fixture.match_date)}</span>
                              <span className="text-bg-border">•</span>
                              <span className="truncate">{fixture.venue ?? 'Venue TBC'}</span>
                            </div>
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                              <span className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.25em]" style={{ backgroundColor: hexToRgba(branding.primary, 0.15), color: branding.accent }}>
                                {isHome ? 'Home' : 'Away'}
                              </span>
                              {opponent === 'TBD' ? (
                                <span className="text-sm font-semibold text-text-muted">TBD</span>
                              ) : (
                                <TeamLink teamName={opponent} logoSize={34} nameClassName="text-sm font-semibold text-text-primary" />
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {isResult && teamScore !== null && opponentScore !== null ? (
                              <div className="rounded-2xl bg-bg-muted/70 px-4 py-2 text-center">
                                <p className="text-xs font-bold uppercase tracking-[0.24em] text-text-muted">Score</p>
                                <p className="mt-1 text-2xl font-black text-text-primary">
                                  {teamScore} - {opponentScore}
                                </p>
                              </div>
                            ) : (
                              <span className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
                                {fixture.status === 'live' ? 'Live' : 'Scheduled'}
                              </span>
                            )}

                            <Link href={`/fixtures/${fixture.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-secondary transition-colors hover:text-white">
                              Match page
                              <ChevronRight size={15} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <div className="mb-5 flex items-center gap-2">
                <Shield size={18} className="text-brand-primary" />
                <h2 className="text-xl font-bold text-text-primary">Staff</h2>
              </div>
              <div className="space-y-4">
                <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.26em] text-text-muted">Coach</p>
                  <p className="mt-2 font-semibold text-text-primary">{coach}</p>
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.26em] text-text-muted">Team admin</p>
                  <p className="mt-2 font-semibold text-text-primary">{teamAdmin}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="mb-5 flex items-center gap-2">
                <Trophy size={18} className="text-brand-primary" />
                <h2 className="text-xl font-bold text-text-primary">Record</h2>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'W', value: won },
                  { label: 'D', value: drawn },
                  { label: 'L', value: lost },
                  { label: 'GD', value: goalsFor - goalsAgainst },
                ].map(item => (
                  <div key={item.label} className="rounded-[1.1rem] border border-white/10 bg-white/[0.02] p-4 text-center">
                    <p className="text-2xl font-black text-text-primary">{item.value}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.22em] text-text-muted">{item.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-text-secondary">
                <Target size={15} />
                {goalsFor} scored, {goalsAgainst} conceded
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-bold text-text-primary">Browse Other Schools</h2>
              <div className="mt-4 space-y-2">
                {SCHOOL_TEAM_ORDER.filter(name => name !== team.name).map(name => (
                  <Link
                    key={name}
                    href={getTeamHref(name)}
                    className="flex items-center justify-between rounded-[1.1rem] border border-white/10 bg-white/[0.02] px-4 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-white/[0.05]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <TeamLogo teamName={name} size={36} />
                      <span className="truncate">{name}</span>
                    </div>
                    <ChevronRight size={15} className="shrink-0 text-text-muted" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
