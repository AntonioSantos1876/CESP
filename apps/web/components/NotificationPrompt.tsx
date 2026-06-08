'use client'

import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'

const STORAGE_KEY = 'cesp_notif_prompted'

export function NotificationPrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) return
    if (Notification.permission !== 'default') return
    if (localStorage.getItem(STORAGE_KEY)) return

    const timer = setTimeout(() => setVisible(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  async function allow() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
    await Notification.requestPermission()
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-4 shadow-xl shadow-black/40">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-primary/15 border border-brand-primary/25 flex items-center justify-center shrink-0 mt-0.5">
            <Bell size={16} className="text-brand-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary">Stay in the loop</p>
            <p className="text-xs text-text-muted mt-0.5">Enable notifications to get live scores, news, and updates from CESP.</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={allow}
                className="flex-1 px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary/90 transition-colors"
              >
                Allow
              </button>
              <button
                onClick={dismiss}
                className="flex-1 px-3 py-1.5 rounded-lg bg-bg-muted text-text-secondary text-xs font-medium hover:bg-bg-hover transition-colors border border-bg-border"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="p-1 text-text-muted hover:text-text-primary transition-colors shrink-0"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
