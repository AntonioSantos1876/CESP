'use client'

import { Suspense, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Calendar, Clock, MapPin, ChevronRight, Radio,
  Trophy,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { TeamLink } from '@/components/TeamLink'
import { createClient } from '@/lib/supabase/client'
import { DEMO_SCHOOL_FIXTURES, getTeamBranding, getTeamHref, getTeamLogoPath, hexToRgba } from '@/lib/school-teams'

type Tab = 'bracket' | 'upcoming' | 'live' | 'results'
type FixtureStatus = 'upcoming' | 'live' | 'result'
type DbFixtureStatus = 'scheduled' | 'live' | 'completed' | 'postponed' | 'cancelled'
type BracketRound = 'quarterfinal' | 'semifinal' | 'final' | 'third'

type DbFixture = {
  id: string
  match_date: string
  venue: string | null
  round: string | null
  status: DbFixtureStatus
  home_team: { name: string; short_name: string } | null
  away_team: { name: string; short_name: string } | null
  match_scores: { home_score: number; away_score: number }[] | { home_score: number; away_score: number } | null
}

type Fixture = {
  id: string
  home: string
  away: string
  dateKey: string
  time: string
  venue: string
  homeScore: number | null
  awayScore: number | null
  status: FixtureStatus
  round: string | null
  matchDate: string
}

type BracketSlot = {
  name: string
  abbr: string
  eliminated: boolean
  primary: string
  secondary: string
  logoPath: string | null
} | null

type BMatch = {
  id: string
  home: BracketSlot
  away: BracketSlot
  homeScore: number | null
  awayScore: number | null
  date: string
  time: string
  venue: string
  note?: string
}

const BRACKET_CARD_WIDTH = 272
const BRACKET_CARD_HEIGHT = 126
const BRACKET_CONNECTOR_WIDTH = 44
const BRACKET_TOP_PADDING = 18
const BRACKET_QUARTER_GAP = 42
const BRACKET_RIGHT_PADDING = 56
const BRACKET_FINAL_COLUMN_GAP = 72

const quarterTop = Array.from({ length: 4 }, (_, index) => BRACKET_TOP_PADDING + index * (BRACKET_CARD_HEIGHT + BRACKET_QUARTER_GAP))
const quarterCenters = quarterTop.map(top => top + BRACKET_CARD_HEIGHT / 2)
const semiCenters = [(quarterCenters[0] + quarterCenters[1]) / 2, (quarterCenters[2] + quarterCenters[3]) / 2]
const semiTop = semiCenters.map(center => center - BRACKET_CARD_HEIGHT / 2)
const finalCenter = (semiCenters[0] + semiCenters[1]) / 2
const finalTop = finalCenter - BRACKET_CARD_HEIGHT / 2
const thirdTop = finalTop + BRACKET_CARD_HEIGHT + BRACKET_FINAL_COLUMN_GAP
const bracketHeight = Math.max(quarterTop[3] + BRACKET_CARD_HEIGHT + BRACKET_TOP_PADDING, thirdTop + BRACKET_CARD_HEIGHT + BRACKET_TOP_PADDING)

const xQuarter = 0
const xConnectorOne = BRACKET_CARD_WIDTH
const xSemi = BRACKET_CARD_WIDTH + BRACKET_CONNECTOR_WIDTH
const xConnectorTwo = BRACKET_CARD_WIDTH + BRACKET_CONNECTOR_WIDTH + BRACKET_CARD_WIDTH
const xFinal = BRACKET_CARD_WIDTH + BRACKET_CONNECTOR_WIDTH + BRACKET_CARD_WIDTH + BRACKET_CONNECTOR_WIDTH
const bracketTotalWidth = xFinal + BRACKET_CARD_WIDTH + BRACKET_RIGHT_PADDING

const connectorStroke = 'rgba(255,255,255,0.14)'
const DEFAULT_SEMI_FINAL_DATE = '2026-08-01T00:00:00'
const DEFAULT_FINAL_DATE = '2026-08-02T00:00:00'

const TABS: { key: Tab; label: string }[] = [
  { key: 'bracket', label: 'Bracket' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'live', label: 'Live' },
  { key: 'results', label: 'Results' },
]

const ROUND_STYLES: Record<BracketRound, { label: string; accent: string }> = {
  quarterfinal: { label: 'Quarter-finals', accent: 'text-brand-secondary' },
  semifinal: { label: 'Semi-finals', accent: 'text-brand-secondary' },
  final: { label: 'Final', accent: 'text-amber-400' },
  third: { label: '3rd Place', accent: 'text-text-muted' },
}

function getKnockoutMatchCount(teamCount: number) {
  if (teamCount < 2) return 0
  return teamCount >= 4 ? teamCount : teamCount - 1
}

function getOpeningRoundMatchCount(teamCount: number) {
  if (teamCount < 2) return 0
  return Math.ceil(teamCount / 2)
}

function getDateKey(matchDate: string) {
  const date = new Date(matchDate)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatMatchDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatRoundDate(matchDate: string | null) {
  if (!matchDate) return 'Date TBC'
  return new Date(matchDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatMatchTime(matchDate: string) {
  return new Date(matchDate).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function mapStatus(status: DbFixtureStatus): FixtureStatus {
  if (status === 'live') return 'live'
  if (status === 'completed') return 'result'
  return 'upcoming'
}

function normalizeRound(round: string | null): BracketRound | null {
  if (!round) return null
  const value = round.toLowerCase()

  if (value.includes('quarter')) return 'quarterfinal'
  if (value.includes('semi')) return 'semifinal'
  if (value.includes('3rd') || value.includes('third')) return 'third'
  if (value.trim() === 'final' || value.includes('grand final')) return 'final'
  return null
}

function makeSlot(name: string, shortName?: string | null, eliminated = false): BracketSlot {
  const branding = getTeamBranding(name)
  const logoPath = getTeamLogoPath(name)
  const trimmedShortName = shortName?.trim()
  if (trimmedShortName) {
    return {
      name,
      abbr: trimmedShortName.slice(0, 3).toUpperCase(),
      eliminated,
      primary: branding.primary,
      secondary: branding.secondary,
      logoPath,
    }
  }

  const words = name.split(' ').filter(Boolean)
  const abbr =
    words.length >= 2
      ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase()
  return {
    name,
    abbr,
    eliminated,
    primary: branding.primary,
    secondary: branding.secondary,
    logoPath,
  }
}

function getScore(matchScores: DbFixture['match_scores']) {
  if (!matchScores) return { home: null, away: null }
  const score = Array.isArray(matchScores) ? matchScores[0] : matchScores
  if (!score) return { home: null, away: null }
  return { home: score.home_score, away: score.away_score }
}

function toUiFixture(fixture: DbFixture): Fixture {
  const score = getScore(fixture.match_scores)
  return {
    id: fixture.id,
    home: fixture.home_team?.name ?? 'TBD',
    away: fixture.away_team?.name ?? 'TBD',
    dateKey: getDateKey(fixture.match_date),
    time: formatMatchTime(fixture.match_date),
    venue: fixture.venue ?? 'Venue TBC',
    homeScore: score.home,
    awayScore: score.away,
    status: mapStatus(fixture.status),
    round: fixture.round,
    matchDate: fixture.match_date,
  }
}

function getDemoMatchDate(date: string, time: string) {
  return `${date}T${time}:00`
}

function toFallbackDbFixture(
  fixture: typeof DEMO_SCHOOL_FIXTURES[number]
): DbFixture {
  return {
    id: String(fixture.id),
    match_date: getDemoMatchDate(fixture.date, fixture.time),
    venue: fixture.venue,
    round: fixture.round,
    status: fixture.status === 'live' ? 'live' : fixture.status === 'result' ? 'completed' : 'scheduled',
    home_team: {
      name: fixture.home,
      short_name: getTeamBranding(fixture.home).shortName,
    },
    away_team: {
      name: fixture.away,
      short_name: getTeamBranding(fixture.away).shortName,
    },
    match_scores:
      fixture.homeScore !== null && fixture.awayScore !== null
        ? [{ home_score: fixture.homeScore, away_score: fixture.awayScore }]
        : [],
  }
}

function toBracketMatch(fixture: DbFixture | null, fallbackId: string, note?: string): BMatch {
  if (!fixture) {
    return {
      id: fallbackId,
      home: null,
      away: null,
      homeScore: null,
      awayScore: null,
      date: '',
      time: '',
      venue: 'Venue TBC',
      note,
    }
  }

  const score = getScore(fixture.match_scores)

  return {
    id: fixture.id,
    home: fixture.home_team ? makeSlot(fixture.home_team.name, fixture.home_team.short_name) : null,
    away: fixture.away_team ? makeSlot(fixture.away_team.name, fixture.away_team.short_name) : null,
    homeScore: score.home,
    awayScore: score.away,
    date: fixture.match_date,
    time: formatMatchTime(fixture.match_date),
    venue: fixture.venue ?? 'Venue TBC',
    note,
  }
}

function buildBracket(fixtures: DbFixture[]) {
  const sorted = [...fixtures].sort((a, b) => a.match_date.localeCompare(b.match_date))
  const grouped: Record<BracketRound, DbFixture[]> = {
    quarterfinal: [],
    semifinal: [],
    final: [],
    third: [],
  }

  sorted.forEach(fixture => {
    const round = normalizeRound(fixture.round)
    if (round) grouped[round].push(fixture)
  })

  if (!grouped.quarterfinal.length && !grouped.semifinal.length && !grouped.final.length) {
    const activeFixtures = sorted.filter(fixture => fixture.status !== 'cancelled')
    grouped.quarterfinal = activeFixtures.slice(0, 4)
    grouped.semifinal = activeFixtures.slice(4, 6)
    grouped.final = activeFixtures.slice(6, 7)
    grouped.third = activeFixtures.slice(7, 8)
  }

  return {
    quarterfinals: Array.from({ length: 4 }, (_, index) =>
      toBracketMatch(grouped.quarterfinal[index] ?? null, `qf-${index + 1}`, `${index % 2 === 0 ? 'Quarter-final pairing' : 'Knockout tie'}`)
    ),
    semifinals: Array.from({ length: 2 }, (_, index) =>
      toBracketMatch(grouped.semifinal[index] ?? null, `sf-${index + 1}`, `Winner QF${index * 2 + 1} vs Winner QF${index * 2 + 2}`)
    ),
    final: toBracketMatch(grouped.final[0] ?? null, 'final', 'Winner SF1 vs Winner SF2'),
    third: toBracketMatch(grouped.third[0] ?? null, 'third', 'Loser SF1 vs Loser SF2'),
  }
}

function getRoundHeaderDate(matches: BMatch[]) {
  const datedMatch = matches.find(match => match.date)
  return formatRoundDate(datedMatch?.date ?? null)
}

function BSlotRow({ slot, score, border }: { slot: BracketSlot; score: number | null; border: boolean }) {
  const badgeStyle = slot
    ? {
        background: `linear-gradient(145deg, ${hexToRgba(slot.primary, slot.eliminated ? 0.18 : 0.92)} 0%, ${hexToRgba(slot.primary, slot.eliminated ? 0.1 : 0.72)} 100%)`,
        borderColor: hexToRgba(slot.primary, slot.eliminated ? 0.25 : 0.95),
        color: slot.secondary,
      }
    : undefined

  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${border ? 'border-t border-[#262626]' : ''}`}>
      {slot ? (
        <Link href={getTeamHref(slot.name)} className="flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-100">
          {slot.logoPath ? (
            <div className={`relative h-9 w-9 shrink-0 ${slot.eliminated ? 'opacity-35' : ''}`}>
              <Image
                src={slot.logoPath}
                alt={`${slot.name} crest`}
                fill
                sizes="36px"
                className="object-contain"
              />
            </div>
          ) : (
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-[11px] font-black uppercase tracking-wide"
              style={badgeStyle}
            >
              {slot.abbr}
            </div>
          )}
          <span
            className={`min-w-0 flex-1 truncate text-sm font-semibold leading-snug md:text-[15px] ${
              slot.eliminated ? 'line-through opacity-35 text-text-muted' : 'text-text-primary'
            }`}
          >
            {slot.name}
          </span>
        </Link>
      ) : (
        <>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#333333] bg-[#1A1A1A] text-[11px] font-black uppercase tracking-wide text-text-muted">
            ?
          </div>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold italic leading-snug text-text-muted md:text-[15px]">
            TBD
          </span>
        </>
      )}
      {score !== null && (
        <span className={`w-8 shrink-0 text-right text-lg font-black tabular-nums ${slot?.eliminated ? 'text-text-muted opacity-35' : 'text-white'}`}>
          {score}
        </span>
      )}
    </div>
  )
}

function BCard({ match }: { match: BMatch }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#232323] bg-[#111111] shadow-card" style={{ width: BRACKET_CARD_WIDTH, height: BRACKET_CARD_HEIGHT }}>
      <BSlotRow slot={match.home} score={match.homeScore} border={false} />
      <BSlotRow slot={match.away} score={match.awayScore} border={true} />
    </div>
  )
}

function BracketView({ fixtures }: { fixtures: DbFixture[] }) {
  const bracket = buildBracket(fixtures)
  const hasBracketContent = fixtures.length > 0

  return (
    <div className="rounded-[28px] border border-bg-border bg-[#0E0E0E] p-4 md:p-6">
      {!hasBracketContent && (
        <div className="card text-center py-16 text-text-muted">
          No tournament fixtures have been loaded yet.
        </div>
      )}

      {hasBracketContent && (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            {[
              { label: 'Quarter-finals', date: getRoundHeaderDate(bracket.quarterfinals), accent: 'text-brand-secondary' },
              {
                label: 'Semi-finals',
                date: formatRoundDate(bracket.semifinals.find(match => match.date)?.date ?? DEFAULT_SEMI_FINAL_DATE),
                accent: 'text-brand-secondary',
              },
              {
                label: 'Final + 3rd',
                date: formatRoundDate(bracket.final.date || bracket.third.date || DEFAULT_FINAL_DATE),
                accent: 'text-amber-400',
              },
            ].map(round => (
              <div key={round.label} className="rounded-2xl border border-bg-border bg-bg-card/70 px-4 py-3 text-center">
                <p className={`text-xs font-bold uppercase tracking-[0.24em] ${round.accent}`}>{round.label}</p>
                <p className="mt-2 text-sm text-text-secondary">{round.date}</p>
              </div>
            ))}
          </div>

          <div className="w-full overflow-x-auto pb-4">
            <div className="relative mx-auto min-w-max" style={{ width: bracketTotalWidth, height: bracketHeight }}>
              {bracket.quarterfinals.map((match, index) => (
                <div key={match.id} className="absolute" style={{ left: xQuarter, top: quarterTop[index] }}>
                  <BCard match={match} />
                  <p className="ml-2 mt-2 text-xs text-text-muted">
                    {match.date ? `${match.time} · ${match.venue}` : 'Fixture details to be confirmed'}
                  </p>
                </div>
              ))}

              <svg
                className="absolute pointer-events-none"
                style={{ left: xConnectorOne, top: 0, width: BRACKET_CONNECTOR_WIDTH, height: bracketHeight }}
                viewBox={`0 0 ${BRACKET_CONNECTOR_WIDTH} ${bracketHeight}`}
                preserveAspectRatio="none"
              >
                <line x1="0" y1={quarterCenters[0]} x2={BRACKET_CONNECTOR_WIDTH / 2} y2={quarterCenters[0]} stroke={connectorStroke} strokeWidth="1.4" />
                <line x1="0" y1={quarterCenters[1]} x2={BRACKET_CONNECTOR_WIDTH / 2} y2={quarterCenters[1]} stroke={connectorStroke} strokeWidth="1.4" />
                <line x1={BRACKET_CONNECTOR_WIDTH / 2} y1={quarterCenters[0]} x2={BRACKET_CONNECTOR_WIDTH / 2} y2={quarterCenters[1]} stroke={connectorStroke} strokeWidth="1.4" />
                <line x1={BRACKET_CONNECTOR_WIDTH / 2} y1={semiCenters[0]} x2={BRACKET_CONNECTOR_WIDTH} y2={semiCenters[0]} stroke={connectorStroke} strokeWidth="1.4" />
                <line x1="0" y1={quarterCenters[2]} x2={BRACKET_CONNECTOR_WIDTH / 2} y2={quarterCenters[2]} stroke={connectorStroke} strokeWidth="1.4" />
                <line x1="0" y1={quarterCenters[3]} x2={BRACKET_CONNECTOR_WIDTH / 2} y2={quarterCenters[3]} stroke={connectorStroke} strokeWidth="1.4" />
                <line x1={BRACKET_CONNECTOR_WIDTH / 2} y1={quarterCenters[2]} x2={BRACKET_CONNECTOR_WIDTH / 2} y2={quarterCenters[3]} stroke={connectorStroke} strokeWidth="1.4" />
                <line x1={BRACKET_CONNECTOR_WIDTH / 2} y1={semiCenters[1]} x2={BRACKET_CONNECTOR_WIDTH} y2={semiCenters[1]} stroke={connectorStroke} strokeWidth="1.4" />
              </svg>

              {bracket.semifinals.map((match, index) => (
                <div key={match.id} className="absolute" style={{ left: xSemi, top: semiTop[index] }}>
                  <BCard match={match} />
                  <p className="ml-2 mt-2 text-xs text-text-muted">
                    {match.date ? `${match.time} · ${match.venue}` : match.note}
                  </p>
                </div>
              ))}

              <svg
                className="absolute pointer-events-none"
                style={{ left: xConnectorTwo, top: 0, width: BRACKET_CONNECTOR_WIDTH, height: bracketHeight }}
                viewBox={`0 0 ${BRACKET_CONNECTOR_WIDTH} ${bracketHeight}`}
                preserveAspectRatio="none"
              >
                <line x1="0" y1={semiCenters[0]} x2={BRACKET_CONNECTOR_WIDTH / 2} y2={semiCenters[0]} stroke={connectorStroke} strokeWidth="1.4" />
                <line x1="0" y1={semiCenters[1]} x2={BRACKET_CONNECTOR_WIDTH / 2} y2={semiCenters[1]} stroke={connectorStroke} strokeWidth="1.4" />
                <line x1={BRACKET_CONNECTOR_WIDTH / 2} y1={semiCenters[0]} x2={BRACKET_CONNECTOR_WIDTH / 2} y2={semiCenters[1]} stroke={connectorStroke} strokeWidth="1.4" />
                <line x1={BRACKET_CONNECTOR_WIDTH / 2} y1={finalCenter} x2={BRACKET_CONNECTOR_WIDTH} y2={finalCenter} stroke={connectorStroke} strokeWidth="1.8" />
                <line x1={BRACKET_CONNECTOR_WIDTH / 2} y1={thirdTop + BRACKET_CARD_HEIGHT / 2} x2={BRACKET_CONNECTOR_WIDTH} y2={thirdTop + BRACKET_CARD_HEIGHT / 2} stroke={connectorStroke} strokeWidth="1.4" strokeDasharray="5,5" />
              </svg>

              <div className="absolute" style={{ left: xFinal, top: finalTop }}>
                <div className="mb-2 flex items-center gap-2">
                  <Trophy size={14} className="text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-[0.22em] text-amber-400">Final</span>
                </div>
                <BCard match={bracket.final} />
                <p className="ml-2 mt-2 text-xs text-text-muted">
                  {bracket.final.date ? `${bracket.final.time} · ${bracket.final.venue}` : bracket.final.note}
                </p>
              </div>

              <div className="absolute" style={{ left: xFinal, top: thirdTop }}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.22em] text-text-muted">3rd Place</span>
                </div>
                <BCard match={bracket.third} />
                <p className="ml-2 mt-2 text-xs text-text-muted">
                  {bracket.third.date ? `${bracket.third.time} · ${bracket.third.venue}` : bracket.third.note}
                </p>
              </div>
            </div>
          </div>

        </>
      )}
    </div>
  )
}

function FixtureCard({ fixture, index }: { fixture: Fixture; index: number }) {
  const isResult = fixture.status === 'result'
  const isLive = fixture.status === 'live'

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: index * 0.055, ease: [0.22, 1, 0.36, 1] }}
      className="card-hover group p-5 md:p-6"
    >
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-muted">
        <span className="inline-flex items-center gap-2">
          <Clock size={14} />
          {fixture.time}
        </span>
        <span className="inline-flex min-w-0 items-center gap-2">
          <MapPin size={14} className="shrink-0" />
          <span className="truncate">{fixture.venue}</span>
        </span>
        {fixture.round && (
          <span className="rounded-full border border-brand-primary/20 bg-brand-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-secondary">
            {fixture.round}
          </span>
        )}
        {isLive && (
          <span className="ml-auto inline-flex items-center gap-1.5 font-semibold text-brand-secondary">
            <span className="live-dot" />
            LIVE
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 md:text-right">
          <TeamLink
            teamName={fixture.home}
            logoSize={42}
            reverse
            className="w-full justify-start md:justify-end"
            nameClassName="text-lg font-semibold leading-tight text-text-primary md:text-xl"
          />
        </div>

        <div className="flex shrink-0 items-center justify-center gap-2">
          {isResult || isLive ? (
            <div className={`flex items-center gap-2 rounded-2xl px-3 py-2 ${isLive ? 'ring-1 ring-brand-primary/40 bg-brand-primary/5' : 'bg-bg-muted/60'}`}>
              <span className="w-8 text-right text-2xl font-bold text-text-primary md:w-10 md:text-3xl">{fixture.homeScore}</span>
              <span className="text-base font-medium text-text-muted">-</span>
              <span className="w-8 text-2xl font-bold text-text-primary md:w-10 md:text-3xl">{fixture.awayScore}</span>
            </div>
          ) : (
            <span className="rounded-2xl border border-brand-primary/20 bg-brand-primary/10 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-brand-secondary">
              VS
            </span>
          )}
        </div>

        <div className="flex-1 text-left">
          <TeamLink
            teamName={fixture.away}
            logoSize={42}
            className="w-full justify-start"
            nameClassName="text-lg font-semibold leading-tight text-text-primary md:text-xl"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Link href={`/fixtures/${fixture.id}`} className="flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-brand-secondary">
          Match details <ChevronRight size={14} />
        </Link>
      </div>
    </motion.div>
  )
}

function FixturesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab')
  const tab: Tab = TABS.some(item => item.key === activeTab) ? (activeTab as Tab) : 'bracket'

  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [dbFixtures, setDbFixtures] = useState<DbFixture[]>([])
  const [teamCount, setTeamCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    async function load() {
      const [{ data: fixturesData }, { count: teamsCount }] = await Promise.all([
        (supabase as any)
          .from('fixtures')
          .select(`
            id, match_date, venue, round, status,
            home_team:teams!fixtures_home_team_id_fkey(name, short_name),
            away_team:teams!fixtures_away_team_id_fkey(name, short_name),
            match_scores(home_score, away_score)
          `)
          .order('match_date', { ascending: true }),
        (supabase as any).from('teams').select('id', { count: 'exact', head: true }),
      ])

      if (!active) return

      const typedFixtures = (fixturesData ?? []) as DbFixture[]
      const sourceFixtures = typedFixtures.length > 0
        ? typedFixtures
        : DEMO_SCHOOL_FIXTURES.map(toFallbackDbFixture)

      setDbFixtures(sourceFixtures)
      setFixtures(sourceFixtures.map(toUiFixture))
      setTeamCount((teamsCount ?? 0) > 0 ? (teamsCount ?? 0) : 8)
      setLoading(false)
    }

    load()

    const channel = supabase
      .channel('fixtures_page_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fixtures' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_scores' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, load)
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [])

  function setTab(nextTab: Tab) {
    router.push(`/fixtures?tab=${nextTab}`, { scroll: false })
  }

  const liveCount = fixtures.filter(fixture => fixture.status === 'live').length

  const filtered = fixtures.filter(fixture => {
    if (tab === 'upcoming') return fixture.status === 'upcoming'
    if (tab === 'live') return fixture.status === 'live'
    if (tab === 'results') return fixture.status === 'result'
    return false
  })

  const sorted = [...filtered].sort((a, b) =>
    tab === 'results' ? b.matchDate.localeCompare(a.matchDate) : a.matchDate.localeCompare(b.matchDate)
  )

  const grouped = sorted.reduce<Record<string, Fixture[]>>((acc, fixture) => {
    if (!acc[fixture.dateKey]) acc[fixture.dateKey] = []
    acc[fixture.dateKey].push(fixture)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort((a, b) =>
    tab === 'results' ? b.localeCompare(a) : a.localeCompare(b)
  )

  const firstRoundMatches = getOpeningRoundMatchCount(teamCount)
  const tournamentMatches = getKnockoutMatchCount(teamCount)

  return (
    <main className="min-h-screen bg-bg-base">
      <div className="w-full px-4 py-12 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-10 max-w-7xl"
        >
          <h1 className="mb-3 text-4xl font-bold text-text-primary md:text-5xl">Fixtures &amp; Results</h1>
          <p className="max-w-2xl text-base leading-7 text-text-secondary md:text-lg">
            Follow the knockout bracket, upcoming kick-offs, live matches, and final results for the Clarendon Elite Cup.
          </p>
        </motion.div>

        <div className="mx-auto max-w-[120rem]">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            {TABS.map(({ key, label }) => {
              const isActive = tab === key
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`relative rounded-2xl px-5 py-3 text-sm font-semibold transition-all duration-200 md:text-base ${
                    isActive
                      ? 'bg-brand-primary text-white shadow-glow'
                      : 'border border-bg-border bg-bg-muted text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {label}
                  {key === 'live' && liveCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary text-[11px] font-bold text-white ring-4 ring-bg-base">
                      {liveCount}
                    </span>
                  )}
                </button>
              )
            })}

            <div className="ml-auto hidden rounded-full border border-bg-border bg-bg-card/70 px-4 py-2 text-sm text-text-muted xl:inline-flex">
              {teamCount} teams · {firstRoundMatches} quarter-finals · {tournamentMatches} total knockout matches
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {loading && (
                <div className="card py-16 text-center text-text-muted">
                  Loading fixtures...
                </div>
              )}

              {!loading && tab === 'bracket' && <BracketView fixtures={dbFixtures} />}

              {!loading && tab === 'live' && filtered.length > 0 && (
                <div className="mb-5 flex items-center gap-2 text-sm font-medium text-brand-secondary md:text-base">
                  <Radio size={16} />
                  <span>{filtered.length} match{filtered.length !== 1 ? 'es' : ''} in progress</span>
                </div>
              )}

              {!loading && tab !== 'bracket' && (
                sortedDates.length === 0 ? (
                  <div className="card py-16 text-center text-text-muted">
                    {tab === 'live' ? 'No matches are currently live.' : 'No fixtures in this category yet.'}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {sortedDates.map(date => (
                      <div key={date}>
                        <div className="mb-4 flex items-center gap-3">
                          <Calendar size={16} className="shrink-0 text-brand-secondary" />
                          <span className="text-sm font-semibold uppercase tracking-wide text-brand-secondary">
                            {formatMatchDate(date)}
                          </span>
                          <div className="h-px flex-1 bg-bg-border" />
                        </div>
                        <div className="space-y-4">
                          {grouped[date].map((fixture, index) => (
                            <FixtureCard key={fixture.id} fixture={fixture} index={index} />
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
