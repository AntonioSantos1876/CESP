'use client'

import Link from 'next/link'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { useEffect, useRef } from 'react'
import {
  Trophy, Zap, Users, Camera, Heart, ShoppingBag, ChevronRight,
  Calendar, Radio, ArrowDown
} from 'lucide-react'
import { SponsorShowcase } from '@/components/SponsorShowcase'

const HOME_STATS = {
  teams: 8,
  matchesToPlay: 8,
} as const

const features = [
  { icon: Zap, title: 'Live Scores', description: 'Real-time match updates with live chat and goal alerts.', href: '/live' },
  { icon: Trophy, title: 'Fixtures & Results', description: 'Full schedule, standings, and match statistics.', href: '/fixtures' },
  { icon: Users, title: 'Teams & Players', description: 'Profiles, stats, and formations for every team.', href: '/teams' },
  { icon: Camera, title: 'News & Gallery', description: 'Match reports, photos, and stories from our journalists.', href: '/news' },
  { icon: Heart, title: 'Support the Cause', description: 'Donate to help grow football in Clarendon.', href: '/donate' },
  { icon: ShoppingBag, title: 'Merch Store', description: 'Official Clarendon Elite Cup merchandise.', href: '/shop' },
]

const TOURNAMENT_FORMAT = [
  {
    round: 'Quarter-finals',
    summary: '4 matches',
    note: 'Eight schools open the knockout bracket on 31 July 2026.',
    accent: 'text-brand-secondary',
  },
  {
    round: 'Semi-finals',
    summary: '2 matches',
    note: 'The winners return on 1 August 2026 for the semis.',
    accent: 'text-brand-secondary',
  },
  {
    round: 'Final',
    summary: '1 match',
    note: 'The championship match is played on 2 August 2026.',
    accent: 'text-amber-400',
  },
  {
    round: '3rd Place',
    summary: '1 match',
    note: 'The semi-final losers playoff is also on 2 August 2026.',
    accent: 'text-text-muted',
  },
] as const

function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '0px' })
  const started = useRef(false)

  useEffect(() => {
    if (!isInView || started.current) return
    started.current = true
    const duration = 1800
    const startTime = performance.now()
    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      if (ref.current) ref.current.textContent = Math.floor(eased * target).toString()
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [isInView, target])

  return (
    <span className="text-3xl font-bold text-gradient">
      <span ref={ref}>0</span>{suffix}
    </span>
  )
}

function FadeInWhenVisible({
  children,
  delay = 0,
  direction = 'up',
}: {
  children: React.ReactNode
  delay?: number
  direction?: 'up' | 'left' | 'right' | 'none'
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 40 : 0,
      x: direction === 'left' ? -40 : direction === 'right' ? 40 : 0,
    },
    visible: { opacity: 1, y: 0, x: 0 },
  }

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export default function HomePage() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  const stats: { num: number; suffix: string; label: string }[] = [
    { num: HOME_STATS.teams, suffix: '', label: 'Teams' },
    { num: HOME_STATS.matchesToPlay, suffix: '', label: 'Matches To Play' },
    { num: 2, suffix: 'K+', label: 'Fans' },
    { num: 100, suffix: '%', label: 'Charity' },
  ]

  return (
    <main className="min-h-screen bg-bg-base overflow-x-hidden">
      {/* Hero */}
      <section ref={heroRef} className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-brand-primary/5 blur-3xl"
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-brand-secondary/5 blur-3xl"
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
        </div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="container-cesp text-center space-y-8 relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-secondary text-sm font-medium"
          >
            <span className="live-dot" />
            2026 Season Underway
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-display-md md:text-display-lg font-bold text-text-primary text-balance"
          >
            The Home of{' '}
            <span className="text-gradient">Clarendon Elite</span>{' '}
            Football
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg text-text-secondary max-w-2xl mx-auto text-balance"
          >
            Live scores, match reports, player stats, and more. All in one place.
            Support the charity league that&apos;s bringing football to Clarendon.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link href="/fixtures" className="btn-primary px-8 py-3 text-base inline-flex items-center gap-2">
                <Calendar size={16} />
                View Fixtures
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link href="/news" className="btn-secondary px-8 py-3 text-base inline-flex items-center gap-2">
                Latest News <ChevronRight size={16} />
              </Link>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="pt-8 flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="text-text-muted"
            >
              <ArrowDown size={20} />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-bg-border bg-bg-card/40">
        <div className="container-cesp py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(({ num, suffix, label }, i) => (
            <FadeInWhenVisible key={label} delay={i * 0.1}>
              <div className="text-center">
                <div className="mb-1">
                  <CountUp target={num} suffix={suffix} />
                </div>
                <div className="text-sm text-text-muted">{label}</div>
              </div>
            </FadeInWhenVisible>
          ))}
        </div>
      </section>

      <section className="section border-b border-bg-border">
        <div className="container-cesp">
          <FadeInWhenVisible>
            <div className="mx-auto max-w-5xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-brand-secondary">Tournament Format</p>
              <h2 className="mt-4 text-heading-xl font-bold text-text-primary">Straight knockout football across one tournament weekend</h2>
              <p className="mx-auto mt-4 max-w-3xl text-text-secondary">
                The competition starts with eight schools, moves into semi-finals on 1 August 2026, and finishes with the final plus 3rd-place playoff on 2 August 2026.
              </p>
            </div>
          </FadeInWhenVisible>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {TOURNAMENT_FORMAT.map((round, index) => (
              <FadeInWhenVisible key={round.round} delay={index * 0.08}>
                <div className="card h-full rounded-[1.75rem] p-6">
                  <p className={`text-xs font-bold uppercase tracking-[0.28em] ${round.accent}`}>{round.round}</p>
                  <p className="mt-4 text-2xl font-black text-text-primary">{round.summary}</p>
                  <p className="mt-3 text-sm leading-7 text-text-secondary">{round.note}</p>
                </div>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="section">
        <div className="container-cesp">
          <FadeInWhenVisible>
            <h2 className="text-heading-xl font-bold text-center mb-4">Everything in one platform</h2>
            <p className="text-text-secondary text-center mb-12 max-w-xl mx-auto">
              Built for fans, teams, and supporters of Clarendon football.
            </p>
          </FadeInWhenVisible>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, description, href }, i) => (
              <FadeInWhenVisible key={title} delay={i * 0.08}>
                <motion.div whileHover={{ y: -4, scale: 1.01 }} transition={{ duration: 0.2 }} className="h-full">
                  <Link
                    href={href}
                    className="card-hover group flex h-full flex-col focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                      className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/15"
                    >
                      <Icon size={20} className="text-brand-primary" />
                    </motion.div>
                    <h3 className="mb-2 font-semibold text-text-primary">{title}</h3>
                    <p className="text-sm text-text-secondary">{description}</p>
                  </Link>
                </motion.div>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="section border-t border-bg-border">
        <div className="container-cesp text-center">
          <FadeInWhenVisible>
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-secondary text-sm font-medium">
                <Radio size={12} />
                Live now
              </div>
              <h2 className="text-heading-xl font-bold text-text-primary text-balance">
                Ready to follow the action?
              </h2>
              <p className="text-text-secondary text-balance">
                Create a free account to get match alerts, follow your team, and support the cause.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Link href="/auth/register" className="btn-primary px-8 py-3 text-base">
                    Join free, takes 30 seconds
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Link href="/donate" className="btn-ghost px-8 py-3 text-base inline-flex items-center gap-2 text-brand-secondary">
                    <Heart size={16} />
                    Donate
                  </Link>
                </motion.div>
              </div>
            </div>
          </FadeInWhenVisible>
        </div>
      </section>

      <section className="section pt-0">
        <div className="container-cesp">
          <FadeInWhenVisible>
            <SponsorShowcase
              compact
              showLink
              heading="Main Sponsors"
              eyebrow="Our Sponsors"
              description="The Clarendon Elite Cup is proudly backed by our main sponsors. Their support helps bring the tournament to life across the full weekend."
            />
          </FadeInWhenVisible>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-bg-border py-10">
        <div className="container-cesp flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-brand-primary" />
            <span className="font-semibold text-gradient">Clarendon Elite Cup</span>
          </div>
          <p className="text-sm text-text-muted">
            &copy; {new Date().getFullYear()} Clarendon Elite Sports Program. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  )
}
