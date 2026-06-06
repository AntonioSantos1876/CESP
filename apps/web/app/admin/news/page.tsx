'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Newspaper, Plus, Send, Archive, Trash2, RefreshCw,
  X, Save, FileText, Globe, Clock,
} from 'lucide-react'

type ArticleStatus = 'draft' | 'published' | 'archived'
type ArticleCategory = 'match_report' | 'news' | 'interview' | 'feature' | 'announcement'

type Article = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  category: ArticleCategory
  status: ArticleStatus
  published_at: string | null
  created_at: string
}

type DraftForm = {
  title: string
  excerpt: string
  content: string
  category: ArticleCategory
  status: ArticleStatus
}

const STATUS_COLOUR: Record<ArticleStatus, string> = {
  draft: 'bg-amber-500/15 text-amber-400',
  published: 'bg-green-500/15 text-green-400',
  archived: 'bg-bg-muted text-text-muted',
}

const CATEGORIES: ArticleCategory[] = ['news', 'match_report', 'interview', 'feature', 'announcement']

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

export default function AdminNewsPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<DraftForm>({
    title: '',
    excerpt: '',
    content: '',
    category: 'news',
    status: 'draft',
  })
  const [formError, setFormError] = useState('')
  const [formSaving, setFormSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState<ArticleStatus | 'all'>('all')

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await (supabase as any)
      .from('articles')
      .select('id, title, slug, excerpt, category, status, published_at, created_at')
      .order('created_at', { ascending: false })
    if (data) setArticles(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = filterStatus === 'all' ? articles : articles.filter(a => a.status === filterStatus)

  async function updateStatus(id: string, status: ArticleStatus) {
    setSaving(id)
    const supabase = createClient()
    await (supabase as any).from('articles').update({ status }).eq('id', id)
    setSaving(null)
    load()
  }

  async function deleteArticle(id: string) {
    if (!confirm('Delete this article? This cannot be undone.')) return
    setSaving(id)
    const supabase = createClient()
    await (supabase as any).from('articles').delete().eq('id', id)
    setSaving(null)
    load()
  }

  async function submitForm() {
    if (!form.title.trim()) { setFormError('Title is required.'); return }
    if (!form.content.trim()) { setFormError('Content is required.'); return }
    setFormError('')
    setFormSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setFormError('Not authenticated.'); setFormSaving(false); return }

    const slug = slugify(form.title) + '-' + Date.now()
    await (supabase as any).from('articles').insert({
      title: form.title,
      slug,
      excerpt: form.excerpt || null,
      content: form.content,
      category: form.category,
      status: form.status,
      author_id: user.id,
    })

    setFormSaving(false)
    setShowForm(false)
    setForm({ title: '', excerpt: '', content: '', category: 'news', status: 'draft' })
    load()
  }

  const counts = {
    all: articles.length,
    draft: articles.filter(a => a.status === 'draft').length,
    published: articles.filter(a => a.status === 'published').length,
    archived: articles.filter(a => a.status === 'archived').length,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">News & Content</h1>
          <p className="text-text-muted text-sm mt-1">Manage articles, match reports, and announcements.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-muted text-text-secondary hover:text-text-primary hover:bg-bg-hover border border-bg-border transition-colors text-sm"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-colors"
          >
            <Plus size={14} />
            New article
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'draft', 'published', 'archived'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              filterStatus === s
                ? 'bg-brand-primary/10 text-brand-secondary border border-brand-primary/20'
                : 'bg-bg-muted text-text-secondary hover:text-text-primary border border-bg-border'
            }`}
          >
            {s === 'all' ? <FileText size={12} /> : s === 'published' ? <Globe size={12} /> : s === 'draft' ? <Clock size={12} /> : <Archive size={12} />}
            {s}
            <span className="text-xs opacity-70">{counts[s]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl py-16 text-center text-text-muted text-sm">
          No {filterStatus === 'all' ? '' : filterStatus} articles yet.
        </div>
      ) : (
        <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
          {filtered.map((article, i) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
              className={`flex items-center gap-4 px-5 py-4 ${i < filtered.length - 1 ? 'border-b border-[#1a1a1a]' : ''}`}
            >
              <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
                <Newspaper size={14} className="text-brand-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-primary text-sm truncate">{article.title}</p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-text-muted">
                  <span className="capitalize">{article.category.replace('_', ' ')}</span>
                  <span>{new Date(article.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              <span className={`text-xs font-medium px-2.5 py-1 rounded-lg capitalize ${STATUS_COLOUR[article.status]}`}>
                {article.status}
              </span>

              <div className="flex items-center gap-1.5 shrink-0">
                {article.status === 'draft' && (
                  <button
                    onClick={() => updateStatus(article.id, 'published')}
                    disabled={saving === article.id}
                    title="Publish"
                    className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                  >
                    <Send size={13} />
                  </button>
                )}
                {article.status === 'published' && (
                  <button
                    onClick={() => updateStatus(article.id, 'draft')}
                    disabled={saving === article.id}
                    title="Unpublish"
                    className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                  >
                    <Clock size={13} />
                  </button>
                )}
                {article.status !== 'archived' && (
                  <button
                    onClick={() => updateStatus(article.id, 'archived')}
                    disabled={saving === article.id}
                    title="Archive"
                    className="p-2 rounded-lg bg-bg-muted text-text-muted hover:text-text-secondary hover:bg-bg-hover border border-bg-border transition-colors disabled:opacity-50"
                  >
                    <Archive size={13} />
                  </button>
                )}
                <button
                  onClick={() => deleteArticle(article.id)}
                  disabled={saving === article.id}
                  title="Delete"
                  className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* New article modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-bg-base/80 backdrop-blur-sm" onClick={() => setShowForm(false)} />
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-2xl bg-[#111111] border border-[#1e1e1e] rounded-2xl shadow-card overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e1e]">
                <h2 className="font-bold text-text-primary">New article</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-muted transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="text-xs text-text-muted mb-1.5 block">Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="Article title"
                    className="input w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-text-muted mb-1.5 block">Category</label>
                    <select
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value as ArticleCategory })}
                      className="input w-full"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1.5 block">Status</label>
                    <select
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value as ArticleStatus })}
                      className="input w-full"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Publish now</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-text-muted mb-1.5 block">Excerpt (optional)</label>
                  <input
                    type="text"
                    value={form.excerpt}
                    onChange={e => setForm({ ...form, excerpt: e.target.value })}
                    placeholder="Short summary shown in listings"
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="text-xs text-text-muted mb-1.5 block">Content *</label>
                  <textarea
                    value={form.content}
                    onChange={e => setForm({ ...form, content: e.target.value })}
                    rows={10}
                    placeholder="Write the article content..."
                    className="input w-full resize-none"
                  />
                </div>

                {formError && (
                  <p className="text-sm text-red-400">{formError}</p>
                )}
              </div>

              <div className="px-6 py-4 border-t border-[#1e1e1e] flex justify-end gap-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-bg-muted border border-bg-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitForm}
                  disabled={formSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
                >
                  {formSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  {form.status === 'published' ? 'Publish' : 'Save draft'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
