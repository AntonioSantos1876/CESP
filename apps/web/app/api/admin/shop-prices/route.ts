import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('shop_prices')
    .select('kind, price')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const prices: Record<string, number> = {}
  for (const row of data ?? []) {
    prices[row.kind] = Number(row.price)
  }

  return NextResponse.json(prices)
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const allowed = ['jersey', 'cap', 'bottle', 'armband']
  const updates: { kind: string; price: number }[] = []

  for (const kind of allowed) {
    if (kind in body) {
      const price = Number(body[kind])
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json({ error: `Invalid price for ${kind}` }, { status: 400 })
      }
      updates.push({ kind, price })
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
  }

  for (const update of updates) {
    await (supabase as any)
      .from('shop_prices')
      .upsert(update, { onConflict: 'kind' })
  }

  return NextResponse.json({ ok: true })
}
