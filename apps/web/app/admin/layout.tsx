'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, CalendarDays, Users, Newspaper,
  HandHeart, ShieldCheck, ChevronRight, LogOut, Menu, X,
} from 'lucide-react'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/matches', label: 'Matches', icon: CalendarDays },
  { href: '/admin/volunteers', label: 'Volunteers', icon: HandHeart },
  { href: '/admin/news', label: 'News', icon: Newspaper },
  { href: '/admin/users', label: 'Users', icon: Users },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth/login'); return }

      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single()

      if (!profile || !['super_admin', 'team_admin'].includes(profile.role)) {
        router.replace('/')
        return
      }
      setUserName(profile.full_name || user.email || 'Admin')
      setLoading(false)
    }
    check()
  }, [router])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  function isActive(item: typeof NAV[0]) {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const sidebar = (
    <aside className="w-64 bg-[#111111] border-r border-[#1e1e1e] flex flex-col h-full">
      <div className="px-6 py-5 border-b border-[#1e1e1e]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-primary/15 border border-brand-primary/25 flex items-center justify-center">
            <ShieldCheck size={16} className="text-brand-primary" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-primary uppercase tracking-widest">Admin</p>
            <p className="text-[10px] text-text-muted">CESP Control Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(item => {
          const Icon = item.icon
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                active
                  ? 'bg-brand-primary/10 text-brand-secondary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-muted'
              }`}
            >
              <Icon size={16} className={active ? 'text-brand-primary' : 'text-text-muted group-hover:text-text-secondary'} />
              {item.label}
              {active && <ChevronRight size={12} className="ml-auto text-brand-primary/60" />}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-[#1e1e1e]">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs text-text-muted truncate">{userName}</p>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm text-text-muted hover:text-text-primary hover:bg-bg-muted transition-all duration-150"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-bg-base flex">
      {/* Desktop sidebar — starts below the sticky nav (h-16 = 64px) */}
      <div className="hidden lg:flex lg:flex-col lg:fixed lg:top-16 lg:bottom-0 lg:w-64 z-30">
        {sidebar}
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-bg-base/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-16 bottom-0 w-64 z-50">{sidebar}</div>
        </div>
      )}

      {/* Main content */}
      <div className="lg:ml-64 flex-1 flex flex-col">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-[#1e1e1e] bg-[#111111]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-muted transition-colors"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <span className="text-sm font-semibold text-text-primary">Admin Panel</span>
        </div>

        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
