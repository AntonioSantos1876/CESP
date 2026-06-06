'use client'

import { Suspense } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Heart, Trophy, ArrowRight } from 'lucide-react'
import Link from 'next/link'

function DonateSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  return (
    <main className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center mx-auto mb-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.18, type: 'spring', stiffness: 320, damping: 24 }}
          >
            <CheckCircle size={40} className="text-green-400" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4 mb-8"
        >
          <h1 className="text-3xl font-bold text-text-primary">Thank you!</h1>
          <p className="text-text-secondary leading-relaxed">
            Your donation has been received. 100% of it goes back into growing football in Clarendon.
          </p>

          {sessionId && (
            <p className="text-xs text-text-muted font-mono bg-bg-muted px-3 py-1.5 rounded-lg inline-block">
              Ref: {sessionId.slice(-8).toUpperCase()}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.4 }}
          className="card mb-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-brand-primary/15 flex items-center justify-center shrink-0">
              <Heart size={18} className="text-brand-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-text-primary text-sm">Your impact</p>
              <p className="text-xs text-text-muted">Every pound helps us run the league</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-text-secondary text-left">
            <li className="flex items-start gap-2">
              <span className="text-brand-secondary mt-0.5 shrink-0">+</span>
              Pitch maintenance and match equipment
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-secondary mt-0.5 shrink-0">+</span>
              Youth coaching and development programs
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-secondary mt-0.5 shrink-0">+</span>
              Community events and league operations
            </li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.4 }}
          className="flex flex-col gap-3"
        >
          <Link href="/" className="btn-primary justify-center gap-2">
            <Trophy size={16} />
            Back to home
          </Link>
          <Link href="/donate" className="btn-ghost justify-center gap-2 text-brand-secondary">
            <Heart size={16} />
            Donate again
          </Link>
          <Link href="/fixtures" className="text-sm text-text-muted hover:text-text-primary transition-colors flex items-center justify-center gap-1">
            See upcoming matches <ArrowRight size={13} />
          </Link>
        </motion.div>
      </div>
    </main>
  )
}

export default function DonateSuccessPage() {
  return (
    <Suspense>
      <DonateSuccessContent />
    </Suspense>
  )
}
