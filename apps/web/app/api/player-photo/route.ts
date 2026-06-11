import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

const BUCKET = 'player-photos'
const ALLOWED_ROLES = ['super_admin', 'team_admin', 'coach', 'photographer']

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role, team_id')
    .eq('id', user.id)
    .single()

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const playerId = formData.get('player_id') as string | null

  if (!file || !playerId) {
    return NextResponse.json({ error: 'file and player_id are required' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File size must be under 5MB' }, { status: 400 })
  }

  const adminSupabase = await createAdminClient()

  // For coach/photographer, verify the player belongs to their team
  if (profile.role === 'coach' || profile.role === 'photographer') {
    const { data: playerRow } = await (adminSupabase as any)
      .from('players')
      .select('team_id')
      .eq('id', playerId)
      .single()

    if (!playerRow || playerRow.team_id !== profile.team_id) {
      return NextResponse.json({ error: 'You can only upload photos for your own team' }, { status: 403 })
    }
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const filePath = `${playerId}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await adminSupabase.storage
    .from(BUCKET)
    .upload(filePath, arrayBuffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 })
  }

  const { data: publicData } = adminSupabase.storage.from(BUCKET).getPublicUrl(filePath)
  const photoUrl = `${publicData.publicUrl}?t=${Date.now()}`

  const { error: updateError } = await (adminSupabase as any)
    .from('players')
    .update({ photo_url: publicData.publicUrl })
    .eq('id', playerId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  return NextResponse.json({ photo_url: photoUrl })
}
