'use client'

import { motion } from 'framer-motion'
import { Star, Award, Shield, ExternalLink, Mail } from 'lucide-react'
import Link from 'next/link'

type Tier = {
  name: string
  colour: string
  bg: string
  border: string
  icon: React.FC<{ size: number; className?: string; style?: React.CSSProperties }>
  perks: string[]
  sponsors: { name: string; tagline: string; url?: string }[]
}

const TIERS: Tier[] = [
  {
    name: 'Gold',
    colour: '#F59E0B',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: Star,
    perks: [
      'Logo on all match day banners and shirts',
      'Pitch-side advertising board',
      'Named match sponsorship for 3 fixtures',
      'Social media feature (monthly)',
      'VIP seats at all home matches',
    ],
    sponsors: [
      { name: 'Clarendon Hardware', tagline: 'Building Clarendon together', url: '#' },
    ],
  },
  {
    name: 'Silver',
    colour: '#94A3B8',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    icon: Award,
    perks: [
      'Logo on match day programmes',
      'Social media feature (quarterly)',
      'Named match sponsorship for 1 fixture',
      'Complimentary tickets to home matches',
    ],
    sponsors: [
      { name: 'Porus Pharmacy', tagline: 'Health for the community', url: '#' },
      { name: 'Kellits Bakery', tagline: 'Freshly baked every match day', url: '#' },
    ],
  },
  {
    name: 'Bronze',
    colour: '#CD7F32',
    bg: 'bg-orange-800/10',
    border: 'border-orange-800/30',
    icon: Shield,
    perks: [
      'Logo on the CESP website',
      'Social media mention at season start',
      'Two complimentary tickets per season',
    ],
    sponsors: [
      { name: 'Denbigh Motors', tagline: 'Your local car specialists', url: '#' },
      { name: 'May Pen Print', tagline: 'Print, design, deliver', url: '#' },
      { name: 'Frankfield Feeds', tagline: 'Agriculture and supplies', url: '#' },
    ],
  },
]

function TierCard({ tier, index }: { tier: Tier; index: number }) {
  const Icon = tier.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-2xl border ${tier.border} ${tier.bg} p-6 relative overflow-hidden`}
    >
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10" style={{ background: tier.colour, transform: 'translate(30%, -30%)' }} />

      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: tier.colour + '22' }}>
          <Icon size={20} style={{ color: tier.colour }} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-text-primary">{tier.name} Sponsor</h2>
          <p className="text-xs text-text-muted">{tier.sponsors.length} current {tier.sponsors.length === 1 ? 'partner' : 'partners'}</p>
        </div>
      </div>

      {/* Current sponsors */}
      {tier.sponsors.length > 0 && (
        <div className="space-y-3 mb-5">
          {tier.sponsors.map(sponsor => (
            <div key={sponsor.name} className="flex items-center gap-3 bg-bg-card/60 rounded-xl px-4 py-3">
              <div className="w-10 h-10 rounded-lg bg-bg-muted flex items-center justify-center shrink-0 text-xs font-bold text-text-muted">
                {sponsor.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-text-primary truncate">{sponsor.name}</p>
                <p className="text-xs text-text-muted truncate">{sponsor.tagline}</p>
              </div>
              {sponsor.url && (
                <a href={sponsor.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <ExternalLink size={14} className="text-text-muted hover:text-brand-secondary transition-colors" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="divider mb-4" />

      {/* Perks */}
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">What you get</h3>
      <ul className="space-y-2">
        {tier.perks.map(perk => (
          <li key={perk} className="flex items-start gap-2 text-sm text-text-secondary">
            <span className="mt-0.5 shrink-0" style={{ color: tier.colour }}>+</span>
            {perk}
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

export default function SponsorsPage() {
  return (
    <main className="min-h-screen bg-bg-base">
      <div className="container-cesp py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 text-center max-w-2xl mx-auto"
        >
          <h1 className="text-4xl font-bold text-text-primary mb-3">Our Sponsors</h1>
          <p className="text-text-secondary">
            The Clarendon Elite Cup is made possible by the generosity of our partners.
            All sponsorship income goes directly into running the league and supporting the community.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {TIERS.map((tier, i) => (
            <TierCard key={tier.name} tier={tier} index={i} />
          ))}
        </div>

        {/* Become a sponsor CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="card border-brand-primary/20 bg-brand-primary/5 max-w-2xl mx-auto text-center"
        >
          <div className="w-12 h-12 rounded-2xl bg-brand-primary/15 flex items-center justify-center mx-auto mb-4">
            <Star size={22} className="text-brand-primary" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Become a sponsor</h2>
          <p className="text-text-secondary text-sm mb-6 max-w-md mx-auto">
            Join our growing list of partners and help grow football in Clarendon. Packages start from as little as £250 per season.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="mailto:sponsors@clarendonelite.com" className="btn-primary inline-flex items-center gap-2">
              <Mail size={16} />
              Get in touch
            </a>
            <Link href="/donate" className="btn-ghost text-brand-secondary inline-flex items-center gap-2">
              Or make a donation
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
