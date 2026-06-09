'use client'

import { CespLogo } from '@/components/CespLogo'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getAuthOrigin } from '@/lib/auth-routing'
import { Eye, EyeOff } from 'lucide-react'

type RequestedRole = 'fan' | 'supporter' | 'volunteer' | 'photographer' | 'coach' | 'livestream_operator' | 'team_admin'
type TeamRequestType = 'none' | 'existing' | 'new'

type TeamOption = {
  id: string
  name: string
  short_name: string
}

const ROLE_OPTIONS: { value: RequestedRole; label: string; desc: string }[] = [
  { value: 'fan', label: 'Fan', desc: 'General access with no special review needed.' },
  { value: 'supporter', label: 'Supporter', desc: 'Choose a team to follow right away.' },
  { value: 'volunteer', label: 'Volunteer', desc: 'Apply to help with league operations.' },
  { value: 'photographer', label: 'Photographer', desc: 'Request media access for coverage.' },
  { value: 'coach', label: 'Coach', desc: 'Manage one team and its squad once approved.' },
  { value: 'livestream_operator', label: 'Livestream Operator', desc: 'Request live-production access.' },
  { value: 'team_admin', label: 'Team Admin', desc: 'Help manage one team once approved.' },
]

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [teams, setTeams] = useState<TeamOption[]>([])
  const [desiredRole, setDesiredRole] = useState<RequestedRole>('fan')
  const [teamRequestType, setTeamRequestType] = useState<TeamRequestType>('none')
  const [existingTeamId, setExistingTeamId] = useState('')
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamShortName, setNewTeamShortName] = useState('')

  useEffect(() => {
    async function loadTeams() {
      const supabase = createClient()
      const { data } = await (supabase as any)
        .from('teams')
        .select('id, name, short_name')
        .order('name', { ascending: true })

      setTeams(data ?? [])
    }

    loadTeams()
  }, [])

  useEffect(() => {
    if (desiredRole === 'fan') {
      setTeamRequestType('none')
      setExistingTeamId('')
      return
    }

    if (desiredRole === 'supporter') {
      setTeamRequestType('existing')
      return
    }

    if (desiredRole === 'coach' || desiredRole === 'team_admin') {
      if (teamRequestType === 'none') setTeamRequestType('existing')
      return
    }

    if (teamRequestType === 'new') {
      setTeamRequestType('none')
      setNewTeamName('')
      setNewTeamShortName('')
    }
  }, [desiredRole, teamRequestType])

  function validateForm() {
    if (password.length < 8) {
      return 'Password must be at least 8 characters.'
    }

    if (desiredRole === 'supporter' && !existingTeamId) {
      return 'Please choose the team you want to support.'
    }

    if ((desiredRole === 'coach' || desiredRole === 'team_admin') && teamRequestType === 'none') {
      return 'Please choose an existing team or create a new one.'
    }

    if (teamRequestType === 'existing' && !existingTeamId) {
      return 'Please choose a team.'
    }

    if (teamRequestType === 'new') {
      if (!newTeamName.trim()) return 'Please enter a team name.'
      if (!newTeamShortName.trim()) return 'Please enter a short team name.'
    }

    return ''
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const origin = getAuthOrigin()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          requested_role: desiredRole,
          requested_team_type: teamRequestType,
          requested_team_id: teamRequestType === 'existing' ? existingTeamId : '',
          requested_team_name: teamRequestType === 'new' ? newTeamName.trim() : '',
          requested_team_short_name: teamRequestType === 'new' ? newTeamShortName.trim() : '',
        },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    fetch('/api/auth/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name: fullName }),
    }).catch(() => {})

    setSuccess(true)
    setLoading(false)
  }

  async function handleGoogleLogin() {
    const supabase = createClient()
    const origin = getAuthOrigin()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${origin}/auth/callback` },
    })
  }

  if (success) {
    const reviewNeeded = !['fan', 'supporter'].includes(desiredRole)

    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-heading-lg font-bold text-text-primary">Check your email</h1>
          <p className="text-text-secondary">
            We sent a confirmation link to <span className="text-text-primary font-medium">{email}</span>.
            Click it to activate your account.
          </p>
          <p className="text-sm text-text-muted">
            {reviewNeeded
              ? 'Your requested role will stay pending review after signup. You will keep fan access until an admin approves it.'
              : 'Your account will open with standard fan access after confirmation.'}
          </p>
          <Link href="/auth/login" className="btn-secondary inline-flex mt-4">
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-gradient font-bold text-2xl">
            <CespLogo size={38} priority />
            Clarendon Elite Sports Program
          </Link>
          <p className="text-text-secondary text-sm mt-2">Create your free account and tell us how you want to be involved.</p>
        </div>

        <div className="card space-y-6">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-bg-border bg-bg-muted hover:bg-bg-hover transition-colors text-text-primary font-medium text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-xs text-text-muted -mt-2">
            Google signup creates the account first. You can request a team or upgraded role afterward from your profile.
          </p>

          <div className="divider" />

          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
                {error}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-text-secondary">Full name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  placeholder="Michael Crawford"
                  className="input"
                />
              </div>

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
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-text-secondary">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-text-secondary">How do you want to join?</label>
                <p className="text-xs text-text-muted mt-1">
                  Everyone signs up with fan access first. Non-fan roles go to the admin review queue automatically.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {ROLE_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDesiredRole(option.value)}
                    className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                      desiredRole === option.value
                        ? 'border-brand-primary bg-brand-primary/10'
                        : 'border-bg-border bg-bg-muted hover:border-brand-primary/30'
                    }`}
                  >
                    <p className="text-sm font-semibold text-text-primary">{option.label}</p>
                    <p className="mt-1 text-xs leading-5 text-text-muted">{option.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {desiredRole !== 'fan' && (
              <div className="space-y-4 rounded-2xl border border-bg-border bg-bg-muted/40 p-4">
                <div>
                  <p className="text-sm font-medium text-text-secondary">Team selection</p>
                  <p className="text-xs text-text-muted mt-1">
                    Supporters can pick a team now. Coaches and team admins can either join an existing team or request a new one.
                  </p>
                </div>

                {(desiredRole === 'coach' || desiredRole === 'team_admin' || desiredRole === 'supporter') && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setTeamRequestType('existing')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                        teamRequestType === 'existing'
                          ? 'bg-brand-primary text-white border-brand-primary'
                          : 'bg-bg-card border-bg-border text-text-secondary'
                      }`}
                    >
                      Choose existing team
                    </button>
                    {(desiredRole === 'coach' || desiredRole === 'team_admin') && (
                      <button
                        type="button"
                        onClick={() => setTeamRequestType('new')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                          teamRequestType === 'new'
                            ? 'bg-brand-primary text-white border-brand-primary'
                            : 'bg-bg-card border-bg-border text-text-secondary'
                        }`}
                      >
                        Request a new team
                      </button>
                    )}
                    {desiredRole !== 'supporter' && (
                      <button
                        type="button"
                        onClick={() => setTeamRequestType('none')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                          teamRequestType === 'none'
                            ? 'bg-brand-primary text-white border-brand-primary'
                            : 'bg-bg-card border-bg-border text-text-secondary'
                        }`}
                      >
                        No team yet
                      </button>
                    )}
                  </div>
                )}

                {teamRequestType === 'existing' && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-text-secondary">Existing team</label>
                    <select
                      value={existingTeamId}
                      onChange={e => setExistingTeamId(e.target.value)}
                      className="input"
                    >
                      <option value="">Select a team</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>
                          {team.name} ({team.short_name})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {teamRequestType === 'new' && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-text-secondary">New team name</label>
                      <input
                        type="text"
                        value={newTeamName}
                        onChange={e => setNewTeamName(e.target.value)}
                        placeholder="Clarendon Rangers"
                        className="input"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-text-secondary">Short name</label>
                      <input
                        type="text"
                        value={newTeamShortName}
                        onChange={e => setNewTeamShortName(e.target.value.toUpperCase())}
                        placeholder="CR"
                        className="input"
                        maxLength={12}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>

            <p className="text-xs text-text-muted text-center">
              By joining you agree to our terms of service and privacy policy.
            </p>
          </form>
        </div>

        <p className="text-center text-sm text-text-muted mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-brand-secondary hover:text-brand-primary transition-colors font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
