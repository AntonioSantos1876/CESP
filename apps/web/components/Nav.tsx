'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Trophy, Home, Calendar, Users, Newspaper, Heart,
  ShoppingBag, Radio, User, LogOut, Menu, X, ChevronDown
} from 'lucide-react'

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/fixtures', label: 'Fixtures', icon: Calendar },
  { href: '/teams', label: 'Teams', icon: Users },
  { href: '/news', label: 'News', icon: Newspaper },
  { href: '/live', label: 'Live', icon: Radio },
  { href: '/donate', label: 'Donate', icon: Heart },
  { href: '/shop', label: 'Shop', icon: ShoppingBag },
]

interface NavProps {
  user?: { email?: string; full_name?: string; role?: string } | null
}

export function Nav({ user }: NavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <nav className="sticky top-0 z-50 glass border-b border-bg-border">
      <div className="container-cesp flex items-center justify-between h-16 gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Trophy size={22} className="text-brand-primary" />
          <span className="font-bold text-gradient hidden sm:inline">Clarendon Elite Cup</span>
          <span className="font-bold text-gradient sm:hidden">CEC</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(href)
                  ? 'bg-brand-primary/15 text-brand-secondary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              <Icon size={14} />
              {label}
              {label === 'Live' && (
                <span className="live-dot ml-0.5" />
              )}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(v => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-muted hover:bg-bg-hover border border-bg-border transition-colors text-sm"
              >
                <div className="w-6 h-6 rounded-full bg-brand-primary/20 flex items-center justify-center">
                  <User size={12} className="text-brand-primary" />
                </div>
                <span className="hidden sm:inline text-text-primary font-medium max-w-[100px] truncate">
                  {user.full_name ?? user.email?.split('@')[0]}
                </span>
                <ChevronDown size={12} className="text-text-muted" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-bg-card border border-bg-border rounded-xl shadow-card z-20 overflow-hidden">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-3 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <User size={14} />
                      Profile
                    </Link>
                    {(user.role === 'super_admin' || user.role === 'team_admin') && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-4 py-3 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors border-t border-bg-border"
                        onClick={() => setProfileOpen(false)}
                      >
                        <Trophy size={14} />
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-error hover:bg-error/5 transition-colors border-t border-bg-border"
                    >
                      <LogOut size={14} />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login" className="btn-ghost text-sm px-3 py-1.5 rounded-xl hidden sm:inline-flex">
                Sign in
              </Link>
              <Link href="/auth/register" className="btn-primary text-sm px-3 py-1.5 rounded-xl">
                Join free
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="lg:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-bg-border bg-bg-base">
          <div className="container-cesp py-4 flex flex-col gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive(href)
                    ? 'bg-brand-primary/15 text-brand-secondary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                }`}
              >
                <Icon size={16} />
                {label}
                {label === 'Live' && <span className="live-dot ml-auto" />}
              </Link>
            ))}
            {!user && (
              <Link
                href="/auth/login"
                onClick={() => setMobileOpen(false)}
                className="btn-secondary text-sm px-4 py-3 rounded-xl mt-2 text-center"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
