'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Home, LogIn } from 'lucide-react'
import { CespLogo } from '@/components/CespLogo'
import { createClient } from '@/lib/supabase/client'

const REDIRECT_DELAY = 15

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [seconds, setSeconds] = useState(REDIRECT_DELAY)
  const [destination, setDestination] = useState<'home' | 'login'>('home')

  useEffect(() => {
    console.error(error)
  }, [error])

  useEffect(() => {
    let active = true

    async function resolveDestination() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (active) {
        setDestination(user ? 'home' : 'login')
      }
    }

    resolveDestination()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          window.location.assign(destination === 'login' ? '/auth/login' : '/')
          return 0
        }

        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [destination])

  const progress = ((REDIRECT_DELAY - seconds) / REDIRECT_DELAY) * 100
  const circumference = 2 * Math.PI * 26

  return (
    <html lang="en" className="dark">
      <body className="bg-bg-base text-text-primary font-sans antialiased">
        <main className="min-h-screen flex items-center justify-center px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center"
          >
            <div className="mb-6">
              <CespLogo size={64} priority className="mx-auto" />
            </div>

            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-red-400">Critical Error</p>
            <h1 className="mb-3 text-4xl font-bold text-text-primary">Application error</h1>
            <p className="mb-10 max-w-sm text-text-secondary">
              A critical error occurred. Try again now, or wait while we take you back to a safe page.
            </p>

            <div className="mb-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={reset}
                className="btn-primary inline-flex items-center gap-2 px-6 py-2.5"
              >
                <RefreshCw size={16} />
                Try again
              </button>
              <a
                href={destination === 'login' ? '/auth/login' : '/'}
                className="btn-secondary inline-flex items-center gap-2 px-6 py-2.5"
              >
                {destination === 'login' ? <LogIn size={16} /> : <Home size={16} />}
                {destination === 'login' ? 'Go to login' : 'Back to home'}
              </a>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="relative h-16 w-16">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 60 60">
                  <circle
                    cx="30"
                    cy="30"
                    r="26"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    className="text-bg-muted"
                  />
                  <motion.circle
                    cx="30"
                    cy="30"
                    r="26"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    className="text-red-400"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (progress / 100) * circumference}
                    style={{ transition: 'stroke-dashoffset 0.9s linear' }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-text-primary tabular-nums">
                  {seconds}
                </span>
              </div>
              <p className="text-xs text-text-muted">
                Redirecting to {destination === 'login' ? 'login' : 'home'} in {seconds}s
              </p>
            </div>
          </motion.div>
        </main>
      </body>
    </html>
  )
}
