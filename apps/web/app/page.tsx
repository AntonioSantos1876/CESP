import Link from 'next/link'
import { Trophy, Zap, Users, Camera, Heart, ShoppingBag, ChevronRight } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Live Scores',
    description: 'Real-time match updates with live chat and goal alerts.',
  },
  {
    icon: Trophy,
    title: 'Fixtures & Results',
    description: 'Full schedule, standings, and match statistics.',
  },
  {
    icon: Users,
    title: 'Teams & Players',
    description: 'Profiles, stats, and formations for every team.',
  },
  {
    icon: Camera,
    title: 'News & Gallery',
    description: 'Match reports, photos, and stories from our journalists.',
  },
  {
    icon: Heart,
    title: 'Support the Cause',
    description: 'Donate to help grow football in Clarendon.',
  },
  {
    icon: ShoppingBag,
    title: 'Merch Store',
    description: 'Official Clarendon Elite Cup merchandise.',
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-bg-base">
      {/* Nav */}
      <nav className="sticky top-0 z-50 glass border-b border-bg-border">
        <div className="container-cesp flex items-center justify-between h-16">
          <span className="font-bold text-xl text-gradient">Clarendon Elite Cup</span>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="btn-ghost text-sm px-4 py-2 rounded-xl">
              Sign in
            </Link>
            <Link href="/auth/register" className="btn-primary text-sm px-4 py-2 rounded-xl">
              Join free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="section">
        <div className="container-cesp text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-secondary text-sm font-medium">
            <span className="live-dot" />
            Season 2024/25 Underway
          </div>
          <h1 className="text-display-md md:text-display-lg font-bold text-text-primary text-balance">
            The Home of{' '}
            <span className="text-gradient">Clarendon Elite</span>{' '}
            Football
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto text-balance">
            Live scores, match reports, player stats, and more — all in one place.
            Support the charity league that&apos;s bringing football to Clarendon.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/fixtures" className="btn-primary px-8 py-3 text-base">
              View Fixtures
            </Link>
            <Link href="/news" className="btn-secondary px-8 py-3 text-base">
              Latest News <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="section border-t border-bg-border">
        <div className="container-cesp">
          <h2 className="text-heading-xl font-bold text-center mb-12">Everything in one platform</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="card-hover group">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/15 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-brand-primary" />
                </div>
                <h3 className="font-semibold text-text-primary mb-2">{title}</h3>
                <p className="text-sm text-text-secondary">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-bg-border py-10">
        <div className="container-cesp flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-semibold text-gradient">Clarendon Elite Cup</span>
          <p className="text-sm text-text-muted">
            &copy; {new Date().getFullYear()} Clarendon Elite Sports Program. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  )
}
