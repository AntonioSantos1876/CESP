'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Heart, CheckCircle, Shield, Users, Trophy } from 'lucide-react'

const tiers = [
  { amount: 5, label: 'Supporter', description: 'Help cover match day costs' },
  { amount: 15, label: 'Fan', description: 'Fund player kit for one player' },
  { amount: 30, label: 'Patron', description: 'Sponsor a full match day' },
  { amount: 50, label: 'Champion', description: 'Keep the league running for a week' },
]

const impacts = [
  { icon: Users, title: '200+ players', description: 'Given competitive football at no cost' },
  { icon: Trophy, title: '84+ matches', description: 'Played in the 2026 season' },
  { icon: Heart, title: '100% charity', description: 'All surplus goes back into the community' },
]

export default function DonatePage() {
  const [selected, setSelected] = useState(15)
  const [custom, setCustom] = useState('')
  const [loading, setLoading] = useState(false)

  const finalAmount = custom ? Number(custom) : selected

  async function handleDonate() {
    if (!finalAmount || finalAmount < 1) return
    setLoading(true)
    try {
      const res = await fetch('/api/checkout/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: finalAmount }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-bg-base">
      <div className="container-cesp py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl mx-auto text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-secondary text-sm font-medium mb-6">
            <Heart size={14} />
            100% charity
          </div>
          <h1 className="text-4xl font-bold text-text-primary mb-4">Support Clarendon Football</h1>
          <p className="text-text-secondary text-lg">
            Every donation goes directly into running the league, funding kit, and giving players in Clarendon access to competitive football.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-lg font-bold text-text-primary mb-4">Choose an amount</h2>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {tiers.map(tier => (
                <button
                  key={tier.amount}
                  onClick={() => { setSelected(tier.amount); setCustom('') }}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 ${
                    selected === tier.amount && !custom
                      ? 'border-brand-primary bg-brand-primary/10'
                      : 'border-bg-border bg-bg-card hover:border-brand-primary/40'
                  }`}
                >
                  <div className={`text-xl font-bold mb-0.5 ${selected === tier.amount && !custom ? 'text-brand-secondary' : 'text-text-primary'}`}>
                    £{tier.amount}
                  </div>
                  <div className="text-xs font-semibold text-text-primary mb-1">{tier.label}</div>
                  <div className="text-xs text-text-muted">{tier.description}</div>
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="text-sm text-text-muted mb-2 block">Custom amount (£)</label>
              <input
                type="number"
                min={1}
                value={custom}
                onChange={e => { setCustom(e.target.value); setSelected(0) }}
                placeholder="Enter amount"
                className="input"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDonate}
              disabled={loading || !finalAmount || finalAmount < 1}
              className="btn-primary w-full py-4 text-base justify-center"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Redirecting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Heart size={18} />
                  Donate £{finalAmount || '—'} now
                </span>
              )}
            </motion.button>

            <div className="flex items-center gap-2 justify-center mt-3 text-xs text-text-muted">
              <Shield size={12} />
              Secure payment via Stripe. No card details stored.
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5"
          >
            <h2 className="text-lg font-bold text-text-primary">Your impact</h2>

            {impacts.map(({ icon: Icon, title, description }) => (
              <div key={title} className="card flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/15 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-brand-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">{title}</h3>
                  <p className="text-sm text-text-secondary">{description}</p>
                </div>
              </div>
            ))}

            <div className="card border-brand-primary/20 bg-brand-primary/5">
              <div className="flex items-start gap-3">
                <CheckCircle size={18} className="text-status-success mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-text-primary mb-1">Registered charity</p>
                  <p className="text-xs text-text-secondary">
                    Clarendon Elite Sports Program is a registered non-profit. Donations support youth development and community football in Clarendon Parish, Jamaica.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  )
}
