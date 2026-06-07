import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const STATIC_TEAM_COUNT = 8
const STATIC_MATCHES_TO_PLAY = 8

export async function GET() {
  try {
    const supabase = await createClient()

    const [{ count: teams, error: teamsError }, { count: scheduled, error: scheduledError }, { count: live, error: liveError }, { count: completed, error: completedError }] = await Promise.all([
      supabase.from('teams').select('id', { count: 'exact', head: true }),
      supabase.from('fixtures').select('id', { count: 'exact', head: true }).eq('status', 'scheduled'),
      supabase.from('fixtures').select('id', { count: 'exact', head: true }).eq('status', 'live'),
      supabase.from('fixtures').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    ])

    if (teamsError) throw teamsError
    if (scheduledError) throw scheduledError
    if (liveError) throw liveError
    if (completedError) throw completedError

    return NextResponse.json(
      {
        teams: STATIC_TEAM_COUNT,
        matchesToPlay: STATIC_MATCHES_TO_PLAY,
        scheduledFixtures: scheduled ?? 0,
        liveFixtures: live ?? 0,
        completedFixtures: completed ?? 0,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch {
    return NextResponse.json(
      {
        teams: STATIC_TEAM_COUNT,
        matchesToPlay: STATIC_MATCHES_TO_PLAY,
        scheduledFixtures: 0,
        liveFixtures: 0,
        completedFixtures: 0,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
