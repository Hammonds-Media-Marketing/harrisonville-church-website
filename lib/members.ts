import { getSupabaseServer } from '@/lib/supabase-server'

/**
 * Members-area data access. Every query runs through the signed-in user's
 * cookie session, so Row Level Security decides what comes back: approved
 * members read announcements and the privacy-filtered directory; everyone
 * else gets empty results.
 */

export type Announcement = {
  id: string
  title: string
  body: string
  category: string | null
  pinned: boolean
  publishDate: string
  expiresOn: string | null
}

export type DirectoryEntry = {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  address: string | null
  photo: string | null
  about: string | null
}

/** Active announcements for the members dashboard: pinned first, newest next. */
export async function getAnnouncements(): Promise<Announcement[]> {
  const supabase = await getSupabaseServer()
  if (!supabase) return []

  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('announcements')
    .select('id, title, body, category, pinned, publish_date, expires_on')
    .eq('published', true)
    .lte('publish_date', today)
    .or(`expires_on.is.null,expires_on.gte.${today}`)
    .order('pinned', { ascending: false })
    .order('publish_date', { ascending: false })

  if (error || !data) {
    if (error) console.warn('[members] announcements read failed:', error.message)
    return []
  }
  return data.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    category: a.category,
    pinned: a.pinned,
    publishDate: a.publish_date,
    expiresOn: a.expires_on,
  }))
}

/** Member directory, already filtered by each member's privacy toggles. */
export async function getDirectory(): Promise<DirectoryEntry[]> {
  const supabase = await getSupabaseServer()
  if (!supabase) return []

  const { data, error } = await supabase.rpc('directory_profiles')
  if (error || !data) {
    if (error) console.warn('[members] directory read failed:', error.message)
    return []
  }
  return data.map((p) => ({
    id: p.id,
    fullName: p.full_name,
    email: p.email,
    phone: p.phone,
    address: p.address,
    photo: p.photo,
    about: p.about,
  }))
}
