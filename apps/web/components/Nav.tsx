'use client'

import { CespLogo } from '@/components/CespLogo'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useCart } from '@/components/cart-provider'
import { createClient } from '@/lib/supabase/client'
import {
  Home, Calendar, Users, Newspaper, Heart,
  ShoppingBag, Radio, User, LogOut, Menu, X, ChevronDown, Bell, ShoppingCart,
  HandHeart, Star, Camera, ShieldCheck,
} from 'lucide-react'

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/fixtures', label: 'Fixtures', icon: Calendar },
  { href: '/teams', label: 'Teams', icon: Users },
  { href: '/news', label: 'News', icon: Newspaper },
  { href: '/live', label: 'Live', icon: Radio },
  { href: '/gallery', label: 'Gallery', icon: Camera },
  { href: '/donate', label: 'Donate', icon: Heart },
  { href: '/volunteer', label: 'Volunteer', icon: HandHeart },
  { href: '/sponsors', label: 'Sponsors', icon: Star },
  { href: '/shop', label: 'Shop', icon: ShoppingBag },
]

interface NavProps {
  user?: { email?: string; full_name?: string; role?: string } | null
}

type NavUser = { email?: string; full_name?: string; role?: string } | null

export function Nav({ user }: NavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { itemCount } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [bellOpen, setBellOpen] = useState(false)
  const [notifications, setNotifications] = useState<{ id: string; title: string; body: string; is_read: boolean; sent_at: string }[]>([])
  const [currentUser, setCurrentUser] = useState<NavUser>(user ?? null)

  useEffect(() => {
    setCurrentUser(user ?? null)
  }, [user])

  useEffect(() => {
    const supabase = createClient()

    async function syncUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        setCurrentUser(null)
        return
      }

      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('full_name, role')
        .eq('id', authUser.id)
        .maybeSingle()

      setCurrentUser({
        email: authUser.email,
        full_name: profile?.full_name ?? undefined,
        role: profile?.role ?? undefined,
      })
    }

    syncUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      syncUser()
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        router.refresh()
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router])

  useEffect(() => {
    if (!currentUser) {
      setNotifications([])
      setUnreadCount(0)
      return
    }
    const supabase = createClient()
    async function fetchNotifs() {
      const { data } = await (supabase as any)
        .from('notifications')
        .select('id, title, body, is_read, sent_at')
        .order('sent_at', { ascending: false })
        .limit(10)
      if (data) {
        setNotifications(prev => {
          const prevIds = new Set(prev.map((n: { id: string }) => n.id))
          const newUnread = data.filter((n: { id: string; is_read: boolean }) => !n.is_read && !prevIds.has(n.id))
          if (newUnread.length > 0 && typeof window !== 'undefined' && Notification.permission === 'granted') {
            newUnread.forEach((n: { title: string; body: string }) => {
              new Notification(n.title, { body: n.body, icon: '/brand/cesp-logo.jpg', badge: '/brand/cesp-logo.jpg' })
            })
          }
          return data
        })
        setUnreadCount(data.filter((n: { is_read: boolean }) => !n.is_read).length)
      }
    }
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000)
    return () => clearInterval(interval)
  }, [currentUser])

  async function markAllRead() {
    const supabase = createClient()
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return
    await (supabase as any).from('notifications').update({ is_read: true }).in('id', unreadIds)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setCurrentUser(null)
    router.replace('/auth/login')
    router.refresh()
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-bg-border bg-bg-base/95 backdrop-blur-xl">
      <div className="container-cesp flex items-center justify-between h-16 gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <CespLogo size={34} priority />
          <span className="font-bold text-gradient hidden sm:inline">Clarendon Elite Sports Program</span>
          <span className="font-bold text-gradient sm:hidden">CESP</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden xl:flex items-center gap-0.5">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                isActive(href)
                  ? 'bg-brand-primary/15 text-brand-secondary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              {label}
              {label === 'Live' && (
                <span className="live-dot ml-0.5" />
              )}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Link
            href="/cart"
            aria-label="Cart"
            className="relative rounded-xl p-2 text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            <ShoppingCart size={18} />
            {itemCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-primary px-1 text-[10px] font-bold leading-none text-white">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>

          {/* Notification bell */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => { setBellOpen(v => !v); if (!bellOpen) markAllRead() }}
                aria-label="Notifications"
                className="relative p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand-primary text-white text-[10px] font-bold flex items-center justify-center leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {bellOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setBellOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-80 bg-bg-card border border-bg-border rounded-xl shadow-card z-20 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-bg-border">
                      <p className="text-sm font-semibold text-text-primary">Notifications</p>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-text-muted text-center">No notifications.</p>
                    ) : (
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.map(n => (
                          <div key={n.id} className={`px-4 py-3 border-b border-bg-border last:border-0 ${!n.is_read ? 'bg-brand-primary/5' : ''}`}>
                            <p className="text-sm font-medium text-text-primary">{n.title}</p>
                            <p className="text-xs text-text-muted mt-0.5">{n.body}</p>
                            <p className="text-[10px] text-text-muted mt-1">{new Date(n.sent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(v => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-muted hover:bg-bg-hover border border-bg-border transition-colors text-sm"
              >
                <div className="w-6 h-6 rounded-full bg-brand-primary/20 flex items-center justify-center">
                  <User size={12} className="text-brand-primary" />
                </div>
                <span className="hidden sm:inline text-text-primary font-medium max-w-[100px] truncate">
                  {currentUser.full_name ?? currentUser.email?.split('@')[0]}
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
                    {['super_admin', 'team_admin', 'coach'].includes(currentUser.role ?? '') && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-4 py-3 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors border-t border-bg-border"
                        onClick={() => setProfileOpen(false)}
                      >
                        <ShieldCheck size={14} />
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
            className="xl:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="xl:hidden border-t border-bg-border bg-bg-base">
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
            {!currentUser && (
              <div className="flex flex-col gap-2 mt-2">
                <Link
                  href="/auth/register"
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary text-sm px-4 py-3 rounded-xl text-center"
                >
                  Sign up free
                </Link>
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="btn-ghost text-sm px-4 py-3 rounded-xl text-center"
                >
                  Sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
