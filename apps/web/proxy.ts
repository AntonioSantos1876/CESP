import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSafeRedirectPath, matchesRoutePrefix } from '@/lib/auth-routing'

const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/callback', '/auth/update-password']
const PROTECTED_ROUTES = ['/profile']
const ADMIN_ROUTES = ['/admin']
const AUTHOR_ROUTES = ['/news/create']
const ADMIN_ROLES = ['super_admin', 'team_admin']
const AUTHOR_ROLES = ['super_admin', 'team_admin', 'photographer']

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie)
  })
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const search = request.nextUrl.search
  const code = request.nextUrl.searchParams.get('code')

  const isAuthRoute = AUTH_ROUTES.some(route => matchesRoutePrefix(pathname, route))
  const isProtectedRoute = PROTECTED_ROUTES.some(route => matchesRoutePrefix(pathname, route))
  const isAdminRoute = ADMIN_ROUTES.some(route => matchesRoutePrefix(pathname, route))
  const isAuthorRoute = AUTHOR_ROUTES.some(route => matchesRoutePrefix(pathname, route))

  if (!code && !isAuthRoute && !isProtectedRoute && !isAdminRoute && !isAuthorRoute) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  if (code) {
    await supabase.auth.exchangeCodeForSession(code)

    const cleanUrl = request.nextUrl.clone()
    cleanUrl.searchParams.delete('code')
    cleanUrl.searchParams.delete('type')
    cleanUrl.searchParams.delete('redirect_to')
    cleanUrl.searchParams.delete('redirectTo')

    const redirectResponse = NextResponse.redirect(cleanUrl)
    copyCookies(supabaseResponse, redirectResponse)
    return redirectResponse
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    if (isProtectedRoute || isAdminRoute || isAuthorRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('redirectTo', getSafeRedirectPath(`${pathname}${search}`))
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  if (
    isAuthRoute &&
    !pathname.startsWith('/auth/callback') &&
    !pathname.startsWith('/auth/update-password')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (isAdminRoute || isAuthorRoute) {
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role ?? null

    if (isAdminRoute && !ADMIN_ROLES.includes(role)) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      url.search = ''
      return NextResponse.redirect(url)
    }

    if (isAuthorRoute && !AUTHOR_ROLES.includes(role)) {
      const url = request.nextUrl.clone()
      url.pathname = '/news'
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'],
}
