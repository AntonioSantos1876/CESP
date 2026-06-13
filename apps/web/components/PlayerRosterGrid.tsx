'use client'

import { PlayerHoverCard } from './PlayerHoverCard'
import { hexToRgba } from '@/lib/school-teams'

type PlayerItem = {
  id: string
  full_name: string
  position: string | null
  jersey_number: number | null
  leadershipLabel: string | null
}

type Branding = {
  primary: string
  secondary: string
}

export function PlayerRosterGrid({
  players,
  branding,
}: {
  players: PlayerItem[]
  branding: Branding
}) {
  if (players.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        Player registration will appear here once the coach or team admin adds the squad.
      </p>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {players.map(player => (
        <PlayerHoverCard
          key={player.id}
          playerId={player.id}
          playerName={player.full_name}
          jerseyNumber={player.jersey_number}
          position={player.position}
          teamColor={branding.primary}
        >
          <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.02] px-4 py-3 cursor-default">
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
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold text-text-primary">{player.full_name}</p>
                  {player.leadershipLabel && (
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                      {player.leadershipLabel}
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted">
                  {player.position ?? 'Position pending'}
                </p>
              </div>
            </div>
          </div>
        </PlayerHoverCard>
      ))}
    </div>
  )
}
