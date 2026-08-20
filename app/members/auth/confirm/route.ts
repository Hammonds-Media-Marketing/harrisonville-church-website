import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { getSupabaseServer } from '@/lib/supabase-server'

/**
 * Auth confirmation endpoint. Supabase email links (signup confirmation,
 * password recovery, email change) land here with either a `token_hash` +
 * `type` pair or a PKCE `code`; both are exchanged for a session cookie and
 * the visitor continues into the members area.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/members'

  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next.startsWith('/') ? next : '/members'
  redirectTo.search = ''

  const supabase = await getSupabaseServer()
  if (!supabase) {
    redirectTo.pathname = '/members/login'
    return NextResponse.redirect(redirectTo)
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(redirectTo)
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(redirectTo)
  }

  redirectTo.pathname = '/members/login'
  redirectTo.searchParams.set('error', 'confirm')
  return NextResponse.redirect(redirectTo)
}
