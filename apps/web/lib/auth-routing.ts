const DEFAULT_REDIRECT_PATH = '/'
const DEFAULT_APP_URL = 'https://clarendon-elite-sports-program.vercel.app'

export function getSafeRedirectPath(
  redirectTo: string | null | undefined,
  fallback: string = DEFAULT_REDIRECT_PATH
) {
  if (!redirectTo) return fallback

  try {
    const normalized = redirectTo.trim()
    if (!normalized.startsWith('/') || normalized.startsWith('//')) {
      return fallback
    }

    const url = new URL(normalized, 'https://clarendonelite.local')
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallback
  }
}

export function matchesRoutePrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export function getAuthOrigin() {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin
  }

  return process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_URL
}
