import { createClient } from '@/lib/supabase/server'
import { Calendar, ArrowRight, Pencil } from 'lucide-react'
import Link from 'next/link'

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

const AUTHOR_ROLES = ['super_admin', 'team_admin', 'photographer']

export default async function NewsPage() {
  const supabase = await createClient()

  const [{ data: articles }, { data: { user } }] = await Promise.all([
    (supabase as any)
      .from('articles')
      .select('id, title, slug, excerpt, category, published_at, source_name, cover_image_url')
      .eq('status', 'published')
      .order('published_at', { ascending: false }),
    supabase.auth.getUser(),
  ])

  let canWrite = false
  if (user) {
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    canWrite = profile && AUTHOR_ROLES.includes(profile.role)
  }

  const list = articles ?? []
  const [featured, ...rest] = list

  return (
    <main className="min-h-screen bg-bg-base">
      <div className="container-cesp py-12">
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2">News</h1>
            <p className="text-text-secondary">Match reports, interviews, and stories from Clarendon</p>
          </div>
          {canWrite && (
            <Link
              href="/news/create"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-colors shrink-0"
            >
              <Pencil size={14} />
              Write article
            </Link>
          )}
        </div>

        {list.length === 0 ? (
          <div className="bg-bg-card border border-bg-border rounded-2xl py-20 text-center text-text-muted text-sm">
            No articles published yet. Check back soon.
          </div>
        ) : (
          <>
            {featured && (
              <Link href={`/news/${featured.slug}`} className="block card-hover mb-8 group">
                <div className="flex flex-col md:flex-row gap-6">
                  {featured.cover_image_url && (
                    <div className="md:w-1/3 rounded-xl overflow-hidden bg-bg-muted shrink-0">
                      <img
                        src={featured.cover_image_url}
                        alt={featured.title}
                        className="w-full h-48 md:h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <span className={`badge mb-3 inline-block ${CATEGORY_COLOUR[featured.category] ?? 'badge-brand'}`}>
                      {CATEGORY_LABEL[featured.category] ?? featured.category}
                    </span>
                    <h2 className="text-2xl font-bold text-text-primary mb-3 group-hover:text-brand-secondary transition-colors">
                      {featured.title}
                    </h2>
                    {featured.excerpt && (
                      <p className="text-text-secondary mb-4">{featured.excerpt}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        {new Date(featured.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      {featured.source_name && (
                        <span className="text-text-muted">via {featured.source_name}</span>
                      )}
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-brand-secondary text-sm font-medium">
                      Read article <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {rest.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {rest.map((article: any) => (
                  <Link
                    key={article.id}
                    href={`/news/${article.slug}`}
                    className="card-hover group h-full flex flex-col"
                  >
                    {article.cover_image_url && (
                      <div className="rounded-xl overflow-hidden mb-4 bg-bg-muted">
                        <img
                          src={article.cover_image_url}
                          alt={article.title}
                          className="w-full h-36 object-cover"
                        />
                      </div>
                    )}
                    <span className={`badge mb-3 self-start ${CATEGORY_COLOUR[article.category] ?? 'badge-brand'}`}>
                      {CATEGORY_LABEL[article.category] ?? article.category}
                    </span>
                    <h3 className="font-bold text-text-primary mb-2 leading-snug flex-1 group-hover:text-brand-secondary transition-colors">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-sm text-text-secondary mb-4 line-clamp-2">{article.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-text-muted mt-auto">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        {new Date(article.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      {article.source_name && (
                        <span>via {article.source_name}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
