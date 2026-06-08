'use client'

import { useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en" className="dark">
      <body className="bg-[#0A0A0A] text-white font-sans antialiased flex min-h-screen items-center justify-center px-4 text-center">
        <div>
          <p className="text-sm font-semibold text-red-400 uppercase tracking-widest mb-3">Critical Error</p>
          <h1 className="text-3xl font-bold mb-3">Application error</h1>
          <p className="text-[#aaa] max-w-sm mb-8">
            A critical error occurred. Please refresh the page to try again.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-xl bg-[#E85D04] text-white px-6 py-2.5 text-sm font-semibold hover:bg-[#E85D04]/90 transition-colors"
            >
              <RefreshCw size={16} />
              Try again
            </button>
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-[#333] bg-[#1a1a1a] text-[#ccc] px-6 py-2.5 text-sm font-semibold hover:bg-[#222] transition-colors"
            >
              Go to home
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
