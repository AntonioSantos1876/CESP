const DEFAULT_REDIRECT_PATH = '/'

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
