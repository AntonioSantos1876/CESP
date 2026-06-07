import { CespLogo } from '@/components/CespLogo'
import Link from 'next/link'
import { Home, Calendar } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-6">
        <CespLogo size={64} priority className="mx-auto" />
      </div>

      <p className="text-sm font-semibold text-brand-secondary uppercase tracking-widest mb-3">404</p>
      <h1 className="text-4xl font-bold text-text-primary mb-3">Page not found</h1>
      <p className="text-text-secondary max-w-sm mb-10">
        The page you are looking for does not exist or has been moved.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link href="/" className="btn-primary px-6 py-2.5 inline-flex items-center gap-2">
          <Home size={16} />
          Back to home
        </Link>
        <Link href="/fixtures" className="btn-secondary px-6 py-2.5 inline-flex items-center gap-2">
          <Calendar size={16} />
          View fixtures
        </Link>
      </div>
    </main>
  )
}
