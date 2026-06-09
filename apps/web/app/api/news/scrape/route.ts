import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_ROLES = ['super_admin', 'team_admin', 'photographer']

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

function extractMeta(html: string, property: string): string {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, 'i'),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]) return m[1].trim()
  }
  return ''
}

function extractTitle(html: string): string {
  const og = extractMeta(html, 'og:title') || extractMeta(html, 'twitter:title')
  if (og) return og
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return m?.[1]?.trim() ?? ''
}

function extractDescription(html: string): string {
  return (
    extractMeta(html, 'og:description') ||
    extractMeta(html, 'twitter:description') ||
    extractMeta(html, 'description')
  )
}

const ALLOWED_SCRAPE_HOSTNAMES = [
  'jamaicaobserver.com',
  'jamaica-gleaner.com',
  'jamaica-star.com',
  'observer.com.jm',
  'gleaner.com',
  'thestar.com.jm',
]

function isAllowedScrapeUrl(urlString: string): boolean {
  try {
    const { hostname, protocol } = new URL(urlString)
    if (protocol !== 'https:' && protocol !== 'http:') return false
    const bare = hostname.replace(/^www\./, '')
    return ALLOWED_SCRAPE_HOSTNAMES.some(h => bare === h || bare.endsWith('.' + h))
  } catch {
    return false
  }
}

function extractSourceName(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    if (host.includes('observer')) return 'Jamaica Observer'
    if (host.includes('gleaner')) return 'Jamaica Gleaner'
    if (host.includes('star')) return 'Jamaica Star'
    return host
  } catch {
    return ''
  }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { url?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const { url } = body
  if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 })

  if (!isAllowedScrapeUrl(url)) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 422 })
  }

  let html: string
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CESPBot/1.0)' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return NextResponse.json({ error: `Fetch failed: ${res.status}` }, { status: 502 })
    html = await res.text()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Fetch error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  const title = extractTitle(html)
  const excerpt = extractDescription(html)
  const sourceName = extractSourceName(url)

  if (!title) return NextResponse.json({ error: 'Could not extract title from URL' }, { status: 422 })

  const slug = slugify(title) + '-' + Date.now()

  const { data: article, error: insertError } = await (supabase as any)
    .from('articles')
    .insert({
      title,
      slug,
      content: excerpt || title,
      excerpt: excerpt || null,
      category: 'news',
      status: 'draft',
      author_id: user.id,
      source_url: url,
      source_name: sourceName || null,
    })
    .select('id, slug, title')
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  return NextResponse.json({ article })
}
