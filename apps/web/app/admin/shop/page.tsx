'use client'

import { useEffect, useState } from 'react'
import { ShoppingBag, Save, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'

type Prices = {
  jersey: number
  cap: number
  bottle: number
  armband: number
}

const LABELS: Record<keyof Prices, string> = {
  jersey: 'Home Jersey',
  cap: 'Supporter Cap',
  bottle: 'Water Bottle',
  armband: 'Captain Armband',
}

export default function AdminShopPage() {
  const [prices, setPrices] = useState<Prices>({ jersey: 0, cap: 0, bottle: 0, armband: 0 })
  const [draft, setDraft] = useState<Prices>({ jersey: 0, cap: 0, bottle: 0, armband: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/shop-prices')
      .then(r => r.json())
      .then((data: Record<string, number>) => {
        const p: Prices = {
          jersey: data.jersey ?? 45,
          cap: data.cap ?? 18,
          bottle: data.bottle ?? 14,
          armband: data.armband ?? 9,
        }
        setPrices(p)
        setDraft(p)
      })
      .catch(() => setError('Failed to load prices'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/admin/shop-prices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to save')
      }
      setPrices(draft)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save prices')
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = (Object.keys(draft) as (keyof Prices)[]).some(k => draft[k] !== prices[k])

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="container-cesp py-12 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-3 mb-8">
            <ShoppingBag size={22} className="text-brand-primary" />
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Shop Prices</h1>
              <p className="text-sm text-text-muted mt-0.5">Set the USD price for each merch category. Changes apply to all schools.</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw size={20} className="animate-spin text-text-muted" />
            </div>
          ) : (
            <div className="card space-y-5">
              {(Object.keys(LABELS) as (keyof Prices)[]).map(kind => (
                <div key={kind} className="flex items-center gap-4">
                  <label className="flex-1 text-sm font-medium text-text-primary">
                    {LABELS[kind]}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted text-sm">$</span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={draft[kind]}
                      onChange={e => setDraft(prev => ({ ...prev, [kind]: Number(e.target.value) }))}
                      className="input w-28 text-right"
                    />
                  </div>
                </div>
              ))}

              {error && (
                <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </p>
              )}

              {saved && (
                <p className="rounded-xl border border-green-400/20 bg-green-500/10 px-4 py-3 text-sm text-green-200">
                  Prices updated successfully.
                </p>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  className="btn-primary flex items-center gap-2"
                >
                  {saving ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {saving ? 'Saving...' : 'Save prices'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
