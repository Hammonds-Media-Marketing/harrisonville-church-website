import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Members-area middleware. Refreshes the Supabase session cookie on every
 * /members request and redirects signed-out visitors to the login page.
 * Authorization (approved member, editor, admin) is enforced by Row Level
 * Security and re-checked in the page layouts; this only handles the session.
 */

const PUBLIC_MEMBER_PATHS = new Set(['/members/login', '/members/auth/confirm', '/members/forgot-password'])

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  // Without Supabase configured the members pages render their setup notice.
  if (!url || !key) return response

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  if (!user && !PUBLIC_MEMBER_PATHS.has(path)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/members/login'
    loginUrl.search = ''
    loginUrl.searchParams.set('next', path)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/members/:path*', '/members'],
}
