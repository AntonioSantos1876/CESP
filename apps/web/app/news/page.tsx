'use client'

import { motion } from 'framer-motion'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const articles = [
  {
    id: 1,
    title: 'Manchester United Clarendon go top after convincing win',
    excerpt: 'A dominant 4-0 victory over Rock River Rangers sends MUC to the summit of the table with five matches played and just one defeat.',
    category: 'Match Report',
    date: '2026-06-20',
    readTime: '3 min',
    featured: true,
  },
  {
    id: 2,
    title: 'Frankfield Boys looking to end losing streak',
    excerpt: 'Manager Noel Wright speaks ahead of the club\'s next fixture, outlining plans to turn form around after four straight defeats.',
    category: 'Interview',
    date: '2026-06-19',
    readTime: '4 min',
    featured: false,
  },
  {
    id: 3,
    title: 'Clarendon Elite Cup announces expanded 2027 format',
    excerpt: 'Organisers confirm the next edition will feature eight teams and introduce a knockout cup competition running alongside the league.',
    category: 'News',
    date: '2026-06-17',
    readTime: '2 min',
    featured: false,
  },
  {
    id: 4,
    title: 'Porus United striker scores hat-trick in six minutes',
    excerpt: 'Aston Campbell made history at the Porus Oval last Saturday, netting three goals in the fastest time recorded in the tournament.',
    category: 'Match Report',
    date: '2026-06-14',
    readTime: '3 min',
    featured: false,
  },
  {
    id: 5,
    title: 'Community spotlight: How the Cup is changing lives in Clarendon',
    excerpt: 'We visited the parishes to see how the tournament has created opportunities for young players and brought communities together.',
    category: 'Feature',
    date: '2026-06-10',
    readTime: '6 min',
    featured: false,
  },
  {
    id: 6,
    title: 'Season preview: Six teams, one trophy',
    excerpt: 'Our writers break down each squad, predict the title winner, and name the players to watch in the 2026 Clarendon Elite Cup.',
    category: 'Analysis',
    date: '2026-06-01',
    readTime: '8 min',
    featured: false,
  },
]

const categoryColour: Record<string, string> = {
  'Match Report': 'bg-status-info/15 text-status-info',
  'Interview': 'bg-brand-primary/15 text-brand-secondary',
  'News': 'bg-status-success/15 text-status-success',
  'Feature': 'bg-status-warning/15 text-status-warning',
  'Analysis': 'bg-status-error/15 text-status-error',
}

export default function NewsPage() {
  const [featured, ...rest] = articles

  return (
    <main className="min-h-screen bg-bg-base">
      <div className="container-cesp py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <h1 className="text-4xl font-bold text-text-primary mb-2">News</h1>
          <p className="text-text-secondary">Match reports, interviews, and stories from Clarendon</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="card-hover mb-8 group"
        >
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-2/3">
              <span className={`badge mb-3 ${categoryColour[featured.category] ?? 'badge-brand'}`}>
                {featured.category}
              </span>
              <h2 className="text-2xl font-bold text-text-primary mb-3 group-hover:text-brand-secondary transition-colors">
                {featured.title}
              </h2>
              <p className="text-text-secondary mb-4">{featured.excerpt}</p>
              <div className="flex items-center gap-4 text-xs text-text-muted">
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  {new Date(featured.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={12} />
                  {featured.readTime} read
                </span>
              </div>
            </div>
            <div className="md:w-1/3 flex items-end justify-end">
              <Link href={`/news/${featured.id}`} className="btn-primary inline-flex items-center gap-2">
                Read article <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rest.map((article, i) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -3 }}
              className="card-hover group h-full flex flex-col"
            >
              <span className={`badge mb-3 self-start ${categoryColour[article.category] ?? 'badge-brand'}`}>
                {article.category}
              </span>
              <h3 className="font-bold text-text-primary mb-2 leading-snug flex-1 group-hover:text-brand-secondary transition-colors">
                {article.title}
              </h3>
              <p className="text-sm text-text-secondary mb-4 line-clamp-2">{article.excerpt}</p>
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  {new Date(article.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={12} />
                  {article.readTime} read
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  )
}
