import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, ArrowLeft, ExternalLink } from 'lucide-react'

const CATEGORY_LABEL: Record<string, string> = {
  match_report: 'Match Report',
  news: 'News',
  interview: 'Interview',
  feature: 'Feature',
  announcement: 'Announcement',
}

const CATEGORY_COLOUR: Record<string, string> = {
  match_report: 'bg-status-info/15 text-status-info',
  news: 'bg-status-success/15 text-status-success',
  interview: 'bg-brand-primary/15 text-brand-secondary',
  feature: 'bg-status-warning/15 text-status-warning',
  announcement: 'bg-status-error/15 text-status-error',
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: article } = await (supabase as any)
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!article) notFound()

  return (
    <main className="min-h-screen bg-bg-base">
      <div className="container-cesp py-12 max-w-3xl">
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          Back to News
        </Link>

        {article.cover_image_url && (
          <div className="rounded-2xl overflow-hidden mb-8 bg-bg-muted">
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="w-full h-64 object-cover"
            />
          </div>
        )}

        <span className={`badge mb-4 inline-block ${CATEGORY_COLOUR[article.category] ?? 'badge-brand'}`}>
          {CATEGORY_LABEL[article.category] ?? article.category}
        </span>

        <h1 className="text-3xl font-bold text-text-primary mb-4 leading-tight">
          {article.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-text-muted mb-8 pb-8 border-b border-bg-border">
          <span className="flex items-center gap-1.5">
            <Calendar size={13} />
            {new Date(article.published_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
          {article.source_name && (
            <span className="text-text-muted">via {article.source_name}</span>
          )}
        </div>

        {article.excerpt && (
          <p className="text-lg text-text-secondary mb-8 font-medium leading-relaxed">
            {article.excerpt}
          </p>
        )}

        <div className="prose prose-invert max-w-none">
          {article.content.split('\n\n').map((paragraph: string, i: number) => (
            <p key={i} className="text-text-secondary leading-relaxed mb-5">
              {paragraph}
            </p>
          ))}
        </div>

        {article.source_url && /^https?:\/\//i.test(article.source_url) && (
          <div className="mt-10 pt-8 border-t border-bg-border">
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-brand-secondary hover:text-brand-primary transition-colors"
            >
              <ExternalLink size={13} />
              Read original article on {article.source_name ?? 'the source'}
            </a>
          </div>
        )}
      </div>
    </main>
  )
}
