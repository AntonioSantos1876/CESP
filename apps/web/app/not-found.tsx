'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CespLogo } from '@/components/CespLogo'
import Link from 'next/link'
import { Home, Calendar } from 'lucide-react'

const REDIRECT_DELAY = 10

export default function NotFound() {
  const router = useRouter()
  const [seconds, setSeconds] = useState(REDIRECT_DELAY)

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          router.push('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [router])

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

        <p className="text-sm font-semibold text-brand-secondary uppercase tracking-widest mb-3">404</p>
        <h1 className="text-4xl font-bold text-text-primary mb-3">Page not found</h1>
        <p className="text-text-secondary max-w-sm mb-10">
          The page you are looking for does not exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mb-10">
          <Link href="/" className="btn-primary px-6 py-2.5 inline-flex items-center gap-2">
            <Home size={16} />
            Back to home
          </Link>
          <Link href="/fixtures" className="btn-secondary px-6 py-2.5 inline-flex items-center gap-2">
            <Calendar size={16} />
            View fixtures
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
                className="text-brand-primary"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (progress / 100) * circumference}
                style={{ transition: 'stroke-dashoffset 0.9s linear' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-text-primary tabular-nums">
              {seconds}
            </span>
          </div>
          <p className="text-xs text-text-muted">Redirecting to home in {seconds}s</p>
        </div>
      </motion.div>
    </main>
  )
}
