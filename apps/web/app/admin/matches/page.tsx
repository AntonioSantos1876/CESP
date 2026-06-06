'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays, Play, Square, Edit3, Save, X,
  Video, CheckCircle, Clock, AlertCircle, RefreshCw,
} from 'lucide-react'

type FixtureStatus = 'scheduled' | 'live' | 'completed' | 'postponed'

type Fixture = {
  id: string
  home_team: { name: string } | null
  away_team: { name: string } | null
  match_date: string
  status: FixtureStatus
  round: string | null
  youtube_stream_id: string | null
  match_scores: { home_score: number; away_score: number } | null
}

type EditState = {
  id: string
  home_score: string
  away_score: string
  youtube: string
}

const STATUS_BADGE: Record<FixtureStatus, { label: string; colour: string }> = {
  scheduled: { label: 'Scheduled', colour: 'bg-blue-500/15 text-blue-400' },
  live: { label: 'Live', colour: 'bg-green-500/15 text-green-400' },
  completed: { label: 'Full Time', colour: 'bg-bg-muted text-text-muted' },
  postponed: { label: 'Postponed', colour: 'bg-amber-500/15 text-amber-400' },
}

export default function AdminMatchesPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [edit, setEdit] = useState<EditState | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await (supabase as any)
      .from('fixtures')
      .select(`
        id, match_date, status, round, youtube_stream_id,
        home_team:teams!fixtures_home_team_id_fkey(name),
        away_team:teams!fixtures_away_team_id_fkey(name),
        match_scores(home_score, away_score)
      `)
      .order('match_date', { ascending: false })
    if (data) setFixtures(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openEdit(f: Fixture) {
    setEditId(f.id)
    setEdit({
      id: f.id,
      home_score: String(f.match_scores?.home_score ?? 0),
      away_score: String(f.match_scores?.away_score ?? 0),
      youtube: f.youtube_stream_id ?? '',
    })
  }

  async function updateStatus(id: string, status: FixtureStatus) {
    setSaving(id)
    const supabase = createClient()
    await (supabase as any).from('fixtures').update({ status }).eq('id', id)
    setSaving(null)
    load()
  }

  async function saveEdit() {
    if (!edit) return
    setSaving(edit.id)
    const supabase = createClient()

    await (supabase as any).from('fixtures').update({
      youtube_stream_id: edit.youtube || null,
    }).eq('id', edit.id)

    const { data: existing } = await (supabase as any)
      .from('match_scores').select('id').eq('fixture_id', edit.id).maybeSingle()

    const scorePayload = {
      fixture_id: edit.id,
      home_score: Number(edit.home_score) || 0,
      away_score: Number(edit.away_score) || 0,
    }
    if (existing) {
      await (supabase as any).from('match_scores').update(scorePayload).eq('fixture_id', edit.id)
    } else {
      await (supabase as any).from('match_scores').insert(scorePayload)
    }

    setSaving(null)
    setEditId(null)
    setEdit(null)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Match Control</h1>
          <p className="text-text-muted text-sm mt-1">Start, end, and update match scores.</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-muted text-text-secondary hover:text-text-primary hover:bg-bg-hover border border-bg-border transition-colors text-sm"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : fixtures.length === 0 ? (
        <div className="text-center py-20 text-text-muted">No fixtures found.</div>
      ) : (
        <div className="space-y-3">
          {fixtures.map((f, i) => {
            const badge = STATUS_BADGE[f.status] ?? STATUS_BADGE.scheduled
            const isEditing = editId === f.id
            const isSaving = saving === f.id
            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="bg-[#111111] border border-[#1e1e1e] rounded-2xl overflow-hidden"
              >
                {/* Main row */}
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
                    <CalendarDays size={14} className="text-brand-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary text-sm">
                      {f.home_team?.name ?? 'TBD'} vs {f.away_team?.name ?? 'TBD'}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-text-muted">
                      <span>{f.round ?? 'Match'}</span>
                      <span>{f.match_date ? new Date(f.match_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}</span>
                      {f.match_scores && (
                        <span className="font-bold text-text-primary">{f.match_scores.home_score} - {f.match_scores.away_score}</span>
                      )}
                    </div>
                  </div>

                  <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${badge.colour}`}>
                    {f.status === 'live' && <span className="live-dot mr-1.5" />}
                    {badge.label}
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    {f.status === 'scheduled' && (
                      <button
                        onClick={() => updateStatus(f.id, 'live')}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        <Play size={12} />
                        Start
                      </button>
                    )}
                    {f.status === 'live' && (
                      <button
                        onClick={() => updateStatus(f.id, 'completed')}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        <Square size={12} />
                        End
                      </button>
                    )}
                    <button
                      onClick={() => isEditing ? (setEditId(null), setEdit(null)) : openEdit(f)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-muted text-text-secondary hover:text-text-primary hover:bg-bg-hover border border-bg-border text-xs font-medium transition-colors"
                    >
                      {isEditing ? <X size={12} /> : <Edit3 size={12} />}
                      {isEditing ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                </div>

                {/* Edit panel */}
                <AnimatePresence>
                  {isEditing && edit && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-[#1a1a1a] px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs text-text-muted mb-1.5 block">
                            {f.home_team?.name ?? 'Home'} score
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={edit.home_score}
                            onChange={e => setEdit({ ...edit, home_score: e.target.value })}
                            className="input w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-text-muted mb-1.5 block">
                            {f.away_team?.name ?? 'Away'} score
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={edit.away_score}
                            onChange={e => setEdit({ ...edit, away_score: e.target.value })}
                            className="input w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-text-muted mb-1.5 flex items-center gap-1.5">
                            <Video size={12} className="text-red-400" />
                            YouTube stream ID
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. dQw4w9WgXcQ"
                            value={edit.youtube}
                            onChange={e => setEdit({ ...edit, youtube: e.target.value })}
                            className="input w-full"
                          />
                        </div>
                        <div className="sm:col-span-3 flex justify-end">
                          <button
                            onClick={saveEdit}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
                          >
                            {isSaving ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Save size={14} />
                            )}
                            Save changes
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Status legend */}
      <div className="mt-8 flex flex-wrap gap-4">
        {Object.entries(STATUS_BADGE).map(([key, { label, colour }]) => (
          <div key={key} className="flex items-center gap-2 text-xs text-text-muted">
            <span className={`px-2 py-0.5 rounded ${colour}`}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
