'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type Stats = { goals: number; assists: number }

type Props = {
  playerId: string
  playerName: string
  photoUrl?: string | null
  jerseyNumber?: number | null
  position?: string | null
  teamColor?: string
  children: React.ReactNode
}

export function PlayerHoverCard({
  playerId,
  playerName,
  photoUrl,
  jerseyNumber,
  position,
  teamColor = '#1a3c5e',
  children,
}: Props) {
  const [open, setOpen] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [cardPos, setCardPos] = useState({ x: 0, y: 0 })
  const fetchedRef = useRef(false)

  async function fetchStats() {
    if (fetchedRef.current) return
    fetchedRef.current = true
    const supabase = createClient()
    const [{ count: goals }, { count: assists }] = await Promise.all([
      (supabase as any)
        .from('match_stats')
        .select('id', { count: 'exact', head: true })
        .eq('player_id', playerId)
        .eq('event_type', 'goal'),
      (supabase as any)
        .from('match_stats')
        .select('id', { count: 'exact', head: true })
        .eq('assist_player_id', playerId),
    ])
    setStats({ goals: goals ?? 0, assists: assists ?? 0 })
  }

  function handleMouseEnter(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.min(
      Math.max(rect.left + rect.width / 2 - 104, 8),
      (typeof window !== 'undefined' ? window.innerWidth : 800) - 220
    )
    setCardPos({ x, y: rect.bottom + 8 })
    setOpen(true)
    fetchStats()
  }

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      {open && (
        <div
          className="fixed z-[9999] w-52 rounded-2xl border border-white/10 bg-[#111] shadow-2xl pointer-events-none"
          style={{ left: cardPos.x, top: cardPos.y }}
        >
          <div className="flex items-center gap-3 p-3">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={playerName}
                className="w-10 h-10 rounded-full object-cover shrink-0 border-2"
                style={{ borderColor: teamColor }}
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                style={{
                  backgroundColor: teamColor + '30',
                  border: `1.5px solid ${teamColor}60`,
                  color: teamColor,
                }}
              >
                {jerseyNumber ?? '#'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-text-primary truncate leading-snug">{playerName}</p>
              <p className="text-[11px] text-text-muted leading-snug">
                {jerseyNumber != null ? `#${jerseyNumber}` : ''}
                {jerseyNumber != null && position ? ' · ' : ''}
                {position ?? ''}
              </p>
            </div>
          </div>
          <div className="border-t border-white/[0.06] px-4 py-2.5 flex gap-6">
            <div>
              <p className="text-xl font-black text-text-primary leading-none">{stats?.goals ?? '—'}</p>
              <p className="text-[10px] text-text-muted mt-0.5 uppercase tracking-wider">Goals</p>
            </div>
            <div>
              <p className="text-xl font-black text-text-primary leading-none">{stats?.assists ?? '—'}</p>
              <p className="text-[10px] text-text-muted mt-0.5 uppercase tracking-wider">Assists</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
