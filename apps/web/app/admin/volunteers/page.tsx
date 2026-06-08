'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { HandHeart, CheckCircle, XCircle, Clock, RefreshCw, ChevronDown, UserCheck } from 'lucide-react'

type VolunteerStatus = 'pending' | 'approved' | 'rejected'

type Volunteer = {
  id: string
  user_id: string
  status: VolunteerStatus
  skills: string[]
  availability: string | null
  notes: string | null
  created_at: string
  profile: { full_name: string | null; email: string } | null
}

type DirectVolunteer = {
  id: string
  full_name: string | null
  email: string
}

const TABS: { key: VolunteerStatus; label: string; icon: typeof Clock }[] = [
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'approved', label: 'Approved', icon: CheckCircle },
  { key: 'rejected', label: 'Rejected', icon: XCircle },
]

export default function AdminVolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [directVolunteers, setDirectVolunteers] = useState<DirectVolunteer[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<VolunteerStatus>('pending')
  const [saving, setSaving] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const [{ data: vols }, { data: profiles }] = await Promise.all([
      (supabase as any)
        .from('volunteers')
        .select('id, user_id, status, skills, availability, notes, created_at, profile:profiles!volunteers_user_id_fkey(full_name, email)')
        .order('created_at', { ascending: false }),
      (supabase as any)
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'volunteer'),
    ])

    if (vols) setVolunteers(vols)

    if (profiles && vols) {
      const appliedIds = new Set((vols as Volunteer[]).map(v => v.user_id))
      setDirectVolunteers((profiles as DirectVolunteer[]).filter(p => !appliedIds.has(p.id)))
    }

    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = volunteers.filter(v => v.status === tab)

  async function updateStatus(vol: Volunteer, status: VolunteerStatus) {
    setSaving(vol.id)
    const supabase = createClient()
    await (supabase as any).from('volunteers').update({ status }).eq('id', vol.id)
    if (status === 'approved') {
      await (supabase as any).from('profiles').update({ role: 'volunteer' }).eq('id', vol.user_id)
    } else if (status === 'rejected') {
      await (supabase as any).from('profiles').update({ role: 'fan' }).eq('id', vol.user_id)
    }
    setSaving(null)
    load()
  }

  const counts = {
    pending: volunteers.filter(v => v.status === 'pending').length,
    approved: volunteers.filter(v => v.status === 'approved').length,
    rejected: volunteers.filter(v => v.status === 'rejected').length,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Volunteers</h1>
          <p className="text-text-muted text-sm mt-1">Review and manage volunteer applications.</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-muted text-text-secondary hover:text-text-primary hover:bg-bg-hover border border-bg-border transition-colors text-sm"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-brand-primary/10 text-brand-secondary border border-brand-primary/20'
                : 'bg-bg-muted text-text-secondary hover:text-text-primary border border-bg-border'
            }`}
          >
            <Icon size={14} />
            {label}
            {counts[key] > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === key ? 'bg-brand-primary/20 text-brand-primary' : 'bg-bg-hover text-text-muted'}`}>
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {filtered.length === 0 ? (
            <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl py-16 text-center text-text-muted text-sm">
              No {tab} applications.
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((vol, i) => {
                const name = vol.profile?.full_name || vol.profile?.email || 'Unknown'
                const isExpanded = expanded === vol.id
                const isSaving = saving === vol.id
                return (
                  <motion.div
                    key={vol.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="bg-[#111111] border border-[#1e1e1e] rounded-2xl overflow-hidden"
                  >
                    <div className="flex items-center gap-4 px-5 py-4">
                      <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
                        <HandHeart size={16} className="text-brand-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-text-primary text-sm">{name}</p>
                        <p className="text-xs text-text-muted mt-0.5">
                          Applied {new Date(vol.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {tab === 'pending' && (
                          <>
                            <button
                              onClick={() => updateStatus(vol, 'approved')}
                              disabled={isSaving}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              <CheckCircle size={12} />
                              Approve
                            </button>
                            <button
                              onClick={() => updateStatus(vol, 'rejected')}
                              disabled={isSaving}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              <XCircle size={12} />
                              Reject
                            </button>
                          </>
                        )}
                        {tab === 'approved' && (
                          <button
                            onClick={() => updateStatus(vol, 'rejected')}
                            disabled={isSaving}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            <XCircle size={12} />
                            Revoke
                          </button>
                        )}
                        {tab === 'rejected' && (
                          <button
                            onClick={() => updateStatus(vol, 'approved')}
                            disabled={isSaving}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            <CheckCircle size={12} />
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => setExpanded(isExpanded ? null : vol.id)}
                          className="p-2 rounded-lg bg-bg-muted text-text-muted hover:text-text-primary hover:bg-bg-hover border border-bg-border transition-colors"
                        >
                          <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-[#1a1a1a] px-5 py-4 space-y-3">
                        {vol.skills.length > 0 && (
                          <div>
                            <p className="text-xs text-text-muted mb-1.5">Skills</p>
                            <div className="flex flex-wrap gap-2">
                              {vol.skills.map(s => (
                                <span key={s} className="badge bg-brand-primary/10 text-brand-secondary">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {vol.availability && (
                          <div>
                            <p className="text-xs text-text-muted mb-1">Availability</p>
                            <p className="text-sm text-text-secondary">{vol.availability}</p>
                          </div>
                        )}
                        {vol.notes && (
                          <div>
                            <p className="text-xs text-text-muted mb-1">Notes</p>
                            <p className="text-sm text-text-secondary">{vol.notes}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-text-muted mb-1">Email</p>
                          <p className="text-sm text-text-secondary">{vol.profile?.email ?? 'N/A'}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Direct volunteers: profiles with volunteer role but no application */}
          {directVolunteers.length > 0 && (
            <div className="mt-10">
              <div className="flex items-center gap-2 mb-4">
                <UserCheck size={15} className="text-brand-secondary" />
                <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest">Direct volunteers</h2>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-bg-hover text-text-muted">{directVolunteers.length}</span>
              </div>
              <p className="text-xs text-text-muted mb-4">These users have the volunteer role but no formal application on record.</p>
              <div className="space-y-3">
                {directVolunteers.map((dv, i) => (
                  <motion.div
                    key={dv.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="bg-[#111111] border border-[#1e1e1e] rounded-2xl"
                  >
                    <div className="flex items-center gap-4 px-5 py-4">
                      <div className="w-9 h-9 rounded-xl bg-brand-secondary/10 flex items-center justify-center shrink-0">
                        <UserCheck size={16} className="text-brand-secondary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-text-primary text-sm">{dv.full_name || dv.email}</p>
                        <p className="text-xs text-text-muted mt-0.5">{dv.email}</p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-brand-secondary/10 text-brand-secondary font-medium">
                        Volunteer
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
