'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Send } from 'lucide-react'
import Link from 'next/link'

type ArticleCategory = 'match_report' | 'news' | 'interview' | 'feature' | 'announcement'

const AUTHOR_ROLES = ['super_admin', 'team_admin', 'photographer']
const CATEGORIES: { value: ArticleCategory; label: string }[] = [
  { value: 'news', label: 'News' },
  { value: 'match_report', label: 'Match Report' },
  { value: 'interview', label: 'Interview' },
  { value: 'feature', label: 'Feature' },
  { value: 'announcement', label: 'Announcement' },
]

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

export default function CreateArticlePage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<ArticleCategory>('news')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [coverUrl, setCoverUrl] = useState('')

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth/login'); return }

      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || !AUTHOR_ROLES.includes(profile.role)) {
        router.replace('/news')
        return
      }
      setUserId(user.id)
      setChecking(false)
    }
    check()
  }, [router])

  async function submit(status: 'draft' | 'published') {
    if (!title.trim()) { setError('Title is required.'); return }
    if (!content.trim()) { setError('Content is required.'); return }
    if (!userId) return
    setError('')
    setSaving(true)

    const supabase = createClient()
    const slug = slugify(title) + '-' + Date.now()
    const { data, error: insertError } = await (supabase as any).from('articles').insert({
      title: title.trim(),
      slug,
      excerpt: excerpt.trim() || null,
      content: content.trim(),
      category,
      status,
      author_id: userId,
      cover_image_url: coverUrl.trim() || null,
      published_at: status === 'published' ? new Date().toISOString() : null,
    }).select('slug').single()

    setSaving(false)
    if (insertError) { setError(insertError.message); return }

    if (status === 'published' && data?.slug) {
      router.push(`/news/${data.slug}`)
    } else {
      router.push('/news')
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-bg-base">
      <div className="container-cesp py-12 max-w-2xl">
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          Back to News
        </Link>

        <h1 className="text-3xl font-bold text-text-primary mb-8">Write an article</h1>

        <div className="space-y-5">
          <div>
            <label className="text-sm text-text-muted mb-1.5 block">Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Article title"
              className="input w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-text-muted mb-1.5 block">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ArticleCategory)}
                className="input w-full"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-text-muted mb-1.5 block">Cover image URL</label>
              <input
                type="url"
                value={coverUrl}
                onChange={e => setCoverUrl(e.target.value)}
                placeholder="https://..."
                className="input w-full"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-text-muted mb-1.5 block">Excerpt</label>
            <input
              type="text"
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              placeholder="Short summary shown in listings"
              className="input w-full"
            />
          </div>

          <div>
            <label className="text-sm text-text-muted mb-1.5 block">Content *</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={14}
              placeholder="Write your article here. Separate paragraphs with a blank line."
              className="input w-full resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => submit('draft')}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bg-muted text-text-primary text-sm font-medium hover:bg-bg-hover border border-bg-border transition-colors disabled:opacity-50"
            >
              <Save size={14} />
              Save as draft
            </button>
            <button
              onClick={() => submit('published')}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={14} />
              )}
              Publish now
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
