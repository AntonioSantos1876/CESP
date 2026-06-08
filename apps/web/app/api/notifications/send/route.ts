import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminMessaging } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!['super_admin', 'team_admin'].includes(profile?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { title, body, url, user_id } = await req.json()
  if (!title || !body) {
    return NextResponse.json({ error: 'title and body required' }, { status: 400 })
  }

  let query = (supabase as any).from('user_fcm_tokens').select('token')
  if (user_id) query = query.eq('user_id', user_id)
  const { data: rows } = await query

  const tokens: string[] = (rows ?? []).map((r: { token: string }) => r.token)
  if (tokens.length === 0) return NextResponse.json({ ok: true, sent: 0 })

  const messaging = getAdminMessaging()
  const result = await messaging.sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: url ? { url } : undefined,
    webpush: {
      notification: { icon: '/brand/cesp-logo.jpg', badge: '/brand/cesp-logo.jpg' },
      fcmOptions: url ? { link: url } : undefined,
    },
  })

  return NextResponse.json({ ok: true, sent: result.successCount, failed: result.failureCount })
}
