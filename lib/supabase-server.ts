import { cache } from 'react'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { isSupabaseConfigured } from '@/lib/supabase'

/**
 * Cookie-aware Supabase client for the members area and admin. Unlike the
 * public singleton in lib/supabase.ts, this client carries the signed-in
 * user's session, so every query runs under that user's Row Level Security:
 * members see announcements and the directory, editors manage content, and
 * admins manage members. No service-role key is used anywhere.
 */

export type MemberProfile = Database['public']['Tables']['member_profiles']['Row']

export async function getSupabaseServer(): Promise<SupabaseClient<Database> | null> {
  if (!isSupabaseConfigured) return null
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // Server Components cannot write cookies; the middleware refreshes
          // the session cookie instead, so swallowing the write is safe.
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            /* read-only context */
          }
        },
      },
    }
  )
}

export type AuthContext = {
  user: User | null
  profile: MemberProfile | null
}

/** Signed-in user + their member profile, resolved once per render pass. */
export const getAuthContext = cache(async (): Promise<AuthContext> => {
  const supabase = await getSupabaseServer()
  if (!supabase) return { user: null, profile: null }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null }

  const { data: profile } = await supabase
    .from('member_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  return { user, profile: profile ?? null }
})

export function isEditorRole(profile: MemberProfile | null): boolean {
  return Boolean(profile?.approved && (profile.role === 'editor' || profile.role === 'admin'))
}

export function isAdminRole(profile: MemberProfile | null): boolean {
  return Boolean(profile?.approved && profile.role === 'admin')
}
