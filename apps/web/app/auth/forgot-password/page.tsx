'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Trophy, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/update-password`,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-gradient font-bold text-2xl">
            <Trophy size={28} className="text-brand-primary" />
            Clarendon Elite Cup
          </Link>
          <p className="text-text-secondary text-sm mt-2">Reset your password</p>
        </div>

        <div className="card space-y-6">
          {sent ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 rounded-full bg-success/15 flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-text-primary mb-1">Email sent</h3>
                <p className="text-sm text-text-secondary">
                  Check <span className="text-text-primary">{email}</span> for a reset link.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <p className="text-sm text-text-secondary">
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>

              {error && (
                <div className="px-4 py-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium text-text-secondary">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="input"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>

        <div className="text-center mt-6">
          <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-secondary transition-colors">
            <ArrowLeft size={14} />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
