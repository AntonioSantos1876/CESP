'use client'

import { motion } from 'framer-motion'
import { Users, Trophy, Target, TrendingUp } from 'lucide-react'

const teams = [
  {
    id: 1,
    name: 'Manchester United Clarendon',
    shortName: 'MUC',
    color: '#E85D04',
    manager: 'Devon Reid',
    played: 5, won: 4, drawn: 0, lost: 1,
    goalsFor: 12, goalsAgainst: 3,
    topScorer: 'Marcus Thompson (5)',
  },
  {
    id: 2,
    name: 'Chapelton FC',
    shortName: 'CFC',
    color: '#3B82F6',
    manager: 'Winston Clarke',
    played: 5, won: 3, drawn: 1, lost: 1,
    goalsFor: 9, goalsAgainst: 5,
    topScorer: 'Delroy Brown (4)',
  },
  {
    id: 3,
    name: 'Porus United',
    shortName: 'PU',
    color: '#10B981',
    manager: 'Carlton James',
    played: 5, won: 3, drawn: 1, lost: 1,
    goalsFor: 8, goalsAgainst: 6,
    topScorer: 'Aston Campbell (3)',
  },
  {
    id: 4,
    name: 'Rock River Rangers',
    shortName: 'RRR',
    color: '#8B5CF6',
    manager: 'Errol Smith',
    played: 5, won: 1, drawn: 2, lost: 2,
    goalsFor: 6, goalsAgainst: 9,
    topScorer: 'Devon Francis (3)',
  },
  {
    id: 5,
    name: 'Spaldings All Stars',
    shortName: 'SAS',
    color: '#F59E0B',
    manager: 'Garfield Morgan',
    played: 5, won: 1, drawn: 1, lost: 3,
    goalsFor: 5, goalsAgainst: 10,
    topScorer: 'Junior Bailey (2)',
  },
  {
    id: 6,
    name: 'Frankfield Boys',
    shortName: 'FB',
    color: '#EC4899',
    manager: 'Noel Wright',
    played: 4, won: 0, drawn: 0, lost: 4,
    goalsFor: 2, goalsAgainst: 9,
    topScorer: 'Levi Grant (1)',
  },
]

export default function TeamsPage() {
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
          <p className="text-text-secondary">All six clubs competing in the 2026 Clarendon Elite Cup</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {teams.map((team, i) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              className="card-hover overflow-hidden"
            >
              <div
                className="h-1.5 w-full rounded-t-lg -mt-5 -mx-5 mb-4"
                style={{ backgroundColor: team.color, width: 'calc(100% + 2.5rem)' }}
              />

              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ backgroundColor: team.color + '22', border: `2px solid ${team.color}44` }}
                >
                  <span style={{ color: team.color }}>{team.shortName}</span>
                </div>
                <div>
                  <h2 className="font-bold text-text-primary leading-tight">{team.name}</h2>
                  <p className="text-xs text-text-muted">Mgr: {team.manager}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { label: 'P', value: team.played },
                  { label: 'W', value: team.won },
                  { label: 'D', value: team.drawn },
                  { label: 'L', value: team.lost },
                ].map(stat => (
                  <div key={stat.label} className="bg-bg-muted rounded-xl p-2 text-center">
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
                    {team.won * 3 + team.drawn} pts
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-12 card bg-brand-primary/5 border-brand-primary/20 text-center"
        >
          <Users size={28} className="text-brand-primary mx-auto mb-3" />
          <h3 className="font-bold text-text-primary mb-1">Register your team</h3>
          <p className="text-sm text-text-secondary mb-4">
            Entries for the 2027 season open later this year. Get your club involved.
          </p>
          <a href="mailto:info@clarendonelite.com" className="btn-primary">
            Get in touch
          </a>
        </motion.div>
      </div>
    </main>
  )
}
