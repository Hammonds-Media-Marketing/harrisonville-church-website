import { cache } from 'react'
import { getSupabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import type { Sermon } from '@/content/types'
import { sermons as seedSermons } from '@/content/sermons'

/**
 * Sermons data-access layer. Published sermons come from Supabase through the
 * public key; local seed content is the fallback when the database is not
 * configured or a read fails, mirroring lib/blog.ts.
 */

type SermonRow = Database['public']['Tables']['sermons']['Row']

function mapSermon(row: SermonRow): Sermon {
  return {
    slug: row.slug,
    title: row.title,
    speaker: row.speaker,
    date: row.date,
    scripture: row.scripture,
    series: row.series ?? undefined,
    summary: row.summary,
    videoUrl: row.video_url,
    durationMinutes: row.duration_minutes,
    thumbnail: row.thumbnail,
    thumbnailAlt: row.thumbnail_alt,
    sample: row.sample,
  }
}

const seedByDate = () => [...seedSermons].sort((a, b) => b.date.localeCompare(a.date))

/** All published sermons, newest first. Cached per render pass. */
const fetchSermons = cache(async (): Promise<Sermon[]> => {
  const supabase = getSupabase()
  if (!supabase) return seedByDate()

  const { data, error } = await supabase
    .from('sermons')
    .select('*')
    .eq('published', true)
    .order('date', { ascending: false })

  if (error || !data) {
    console.warn('[sermons] read failed, falling back to seed content:', error?.message)
    return seedByDate()
  }
  return data.map(mapSermon)
})

export function recentSermons(): Promise<Sermon[]> {
  return fetchSermons()
}

export async function getSermon(slug: string): Promise<Sermon | undefined> {
  return (await fetchSermons()).find((s) => s.slug === slug)
}

export async function sermonSeries(): Promise<string[]> {
  const all = await fetchSermons()
  return Array.from(new Set(all.map((s) => s.series).filter(Boolean))) as string[]
}
