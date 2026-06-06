'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Trophy, RefreshCw, Home } from 'lucide-react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-6">
        <Trophy size={40} className="text-brand-primary mx-auto" />
      </div>

      <p className="text-sm font-semibold text-red-400 uppercase tracking-widest mb-3">Error</p>
      <h1 className="text-4xl font-bold text-text-primary mb-3">Something went wrong</h1>
      <p className="text-text-secondary max-w-sm mb-10">
        An unexpected error occurred. Please try again or return to the home page.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={reset}
          className="btn-primary px-6 py-2.5 inline-flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Try again
        </button>
        <Link href="/" className="btn-secondary px-6 py-2.5 inline-flex items-center gap-2">
          <Home size={16} />
          Back to home
        </Link>
      </div>
    </main>
  )
}
