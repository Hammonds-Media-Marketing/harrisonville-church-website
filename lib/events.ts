import { cache } from 'react'
import { getSupabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import type { ChurchEvent } from '@/content/types'
import { events as seedEvents } from '@/content/events'

/**
 * Events data-access layer. Reads come from Supabase (Row Level Security
 * limits the public key to published events); when Supabase is not configured,
 * or a query fails, the same shapes are served from the local seed content so
 * the site never breaks. Rows are snake_case, app types camelCase — mapping
 * happens here, mirroring lib/blog.ts.
 */

type EventRow = Database['public']['Tables']['events']['Row']

function mapEvent(row: EventRow): ChurchEvent {
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date ?? undefined,
    locationName: row.location_name ?? undefined,
    category: row.category as ChurchEvent['category'],
    recurring: row.recurring ?? undefined,
    sample: row.sample,
  }
}

const seedByStart = () => [...seedEvents].sort((a, b) => a.startDate.localeCompare(b.startDate))

/** All published events, soonest first. Cached per render pass. */
const fetchEvents = cache(async (): Promise<ChurchEvent[]> => {
  const supabase = getSupabase()
  if (!supabase) return seedByStart()

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('published', true)
    .order('start_date', { ascending: true })

  if (error || !data) {
    console.warn('[events] read failed, falling back to seed content:', error?.message)
    return seedByStart()
  }
  return data.map(mapEvent)
})

export function upcomingEvents(): Promise<ChurchEvent[]> {
  return fetchEvents()
}

export async function getEvent(slug: string): Promise<ChurchEvent | undefined> {
  return (await fetchEvents()).find((e) => e.slug === slug)
}
