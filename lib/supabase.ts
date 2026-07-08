import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

/**
 * Supabase access for the blog. Reads run through the public anon/publishable
 * key and are protected by Row Level Security: only published posts, all
 * authors and categories, and approved comments are exposed; comment inserts
 * always land unapproved for moderation.
 *
 * The client is created lazily and cached. When the Supabase environment is not
 * configured, `getSupabase()` returns null so callers fall back to local seed
 * content (see lib/blog.ts) instead of crashing the build.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

let cached: SupabaseClient<Database> | null = null

export function getSupabase(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured) return null
  if (!cached) {
    cached = createClient<Database>(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return cached
}
