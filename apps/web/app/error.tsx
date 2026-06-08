'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CespLogo } from '@/components/CespLogo'
import { createClient } from '@/lib/supabase/client'
import { RefreshCw, Home, LogIn } from 'lucide-react'
import Link from 'next/link'

const REDIRECT_DELAY = 15

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter()
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
          router.push(destination === 'login' ? '/auth/login' : '/')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [destination, router])

  const progress = ((REDIRECT_DELAY - seconds) / REDIRECT_DELAY) * 100
  const circumference = 2 * Math.PI * 26

  return (
    <main className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center"
      >
        <div className="mb-6">
          <CespLogo size={64} priority className="mx-auto" />
        </div>

        <p className="text-sm font-semibold text-red-400 uppercase tracking-widest mb-3">Error</p>
        <h1 className="text-4xl font-bold text-text-primary mb-3">Something went wrong</h1>
        <p className="text-text-secondary max-w-sm mb-10">
          An unexpected error occurred. You can try again or return to the home page.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mb-10">
          <button
            onClick={reset}
            className="btn-primary px-6 py-2.5 inline-flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Try again
          </button>
          <Link
            href={destination === 'login' ? '/auth/login' : '/'}
            className="btn-secondary px-6 py-2.5 inline-flex items-center gap-2"
          >
            {destination === 'login' ? <LogIn size={16} /> : <Home size={16} />}
            {destination === 'login' ? 'Go to login' : 'Back to home'}
          </Link>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="relative w-16 h-16">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
              <circle
                cx="30" cy="30" r="26"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                className="text-bg-muted"
              />
              <motion.circle
                cx="30" cy="30" r="26"
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
  )
}
