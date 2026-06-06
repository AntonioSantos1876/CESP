'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HandHeart, CheckCircle, Mail, Phone, User, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Role = 'steward' | 'social_media' | 'photography' | 'admin' | 'coaching'
type Day = 'Saturday' | 'Sunday' | 'Weekday evenings' | 'Any'

const ROLES: { value: Role; label: string; desc: string }[] = [
  { value: 'steward', label: 'Match Steward', desc: 'Help run match days, manage crowds and ticketing' },
  { value: 'social_media', label: 'Social Media', desc: 'Create and post content during and after matches' },
  { value: 'photography', label: 'Photography', desc: 'Photograph matches and community events' },
  { value: 'admin', label: 'Admin Support', desc: 'Help with scheduling, communications, and paperwork' },
  { value: 'coaching', label: 'Youth Coaching', desc: 'Support youth development sessions in Clarendon' },
]

const DAYS: Day[] = ['Saturday', 'Sunday', 'Weekday evenings', 'Any']

type FormState = {
  name: string
  email: string
  phone: string
  role: Role | ''
  days: Day[]
  message: string
}

export default function VolunteerPage() {
  const [form, setForm] = useState<FormState>({
    name: '', email: '', phone: '', role: '', days: [], message: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  function toggleDay(day: Day) {
    setForm(f => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.role) {
      setError('Please fill in your name, email, and preferred role.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: dbError } = await (supabase as any).from('volunteer_applications').insert({
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        role: form.role,
        availability: form.days,
        message: form.message || null,
      })
      if (dbError) throw dbError
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again or email us directly.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-bg-base flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="w-20 h-20 rounded-full bg-brand-primary/15 border border-brand-primary/25 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle size={40} className="text-brand-secondary" />
          </motion.div>
          <h1 className="text-3xl font-bold text-text-primary mb-3">Application received</h1>
          <p className="text-text-secondary mb-6">
            Thank you for volunteering with Clarendon Elite. We will be in touch at {form.email} within a few days.
          </p>
          <button
            onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', role: '', days: [], message: '' }) }}
            className="btn-ghost text-brand-secondary"
          >
            Submit another application
          </button>
        </motion.div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-bg-base">
      <div className="container-cesp py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-2">
            <HandHeart size={24} className="text-brand-primary" />
            <h1 className="text-4xl font-bold text-text-primary">Volunteer</h1>
          </div>
          <p className="text-text-secondary mb-10">
            Help us run the Clarendon Elite Cup. We rely on volunteers for match days, communications, and community events.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal details */}
            <div className="card space-y-4">
              <h2 className="font-bold text-text-primary text-sm uppercase tracking-widest text-text-muted mb-2">Your details</h2>

              <div>
                <label className="text-sm text-text-muted mb-1.5 block">Full name *</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                    className="input pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-text-muted mb-1.5 block">Email address *</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="input pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-text-muted mb-1.5 block">Phone (optional)</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+1 876 ..."
                    className="input pl-9"
                  />
                </div>
              </div>
            </div>

            {/* Role selection */}
            <div className="card">
              <h2 className="font-bold text-text-primary text-sm uppercase tracking-widest text-text-muted mb-4">Preferred role *</h2>
              <div className="space-y-2">
                {ROLES.map(role => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, role: role.value }))}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                      form.role === role.value
                        ? 'border-brand-primary bg-brand-primary/10'
                        : 'border-bg-border bg-bg-muted hover:border-brand-primary/30'
                    }`}
                  >
                    <p className={`font-semibold text-sm ${form.role === role.value ? 'text-brand-secondary' : 'text-text-primary'}`}>
                      {role.label}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">{role.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="card">
              <h2 className="font-bold text-text-primary text-sm uppercase tracking-widest text-text-muted mb-4">Availability</h2>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                      form.days.includes(day)
                        ? 'bg-brand-primary/15 border-brand-primary/40 text-brand-secondary'
                        : 'bg-bg-muted border-bg-border text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="card">
              <label className="text-sm text-text-muted mb-1.5 block">Anything else you want us to know?</label>
              <div className="relative">
                <MessageSquare size={14} className="absolute left-3 top-3 text-text-muted" />
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Skills, experience, questions..."
                  className="input pl-9 resize-none"
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-status-error"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full py-3.5 text-base justify-center"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <HandHeart size={18} />
                  Submit application
                </span>
              )}
            </motion.button>

            <p className="text-xs text-text-muted text-center">
              By submitting you agree to be contacted by the CESP team. We never share your details.
            </p>
          </form>
        </motion.div>
      </div>
    </main>
  )
}
