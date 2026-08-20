'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

/**
 * Browser Supabase client for the members-area client components (sign in,
 * sign up, sign out). Sessions are stored in cookies so the server components
 * and middleware see the same auth state.
 */
let cached: SupabaseClient<Database> | null = null

export function getSupabaseBrowser(): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  if (!cached) cached = createBrowserClient<Database>(url, key)
  return cached
}
