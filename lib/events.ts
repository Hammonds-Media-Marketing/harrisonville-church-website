import { cache } from 'react'
import { getSupabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import type { ChurchEvent } from '@/content/types'
import { events as seedEvents } from '@/content/events'
import { recurrenceLabel, ruleFromStored, upcomingOccurrences, type Occurrence } from '@/lib/recurrence'
import {
  parseAddress,
  parseFaqs,
  parseInfoSections,
  parseSessions,
  parseSpeakers,
  sessionSpan,
} from '@/lib/event-details'

/**
 * Events data-access layer. Reads come from Supabase (Row Level Security
 * limits the public key to published events); when Supabase is not configured,
 * or a query fails, the same shapes are served from the local seed content so
 * the site never breaks. Rows are snake_case, app types camelCase — mapping
 * happens here, mirroring lib/blog.ts.
 *
 * Recurring events are stored once with a recurrence rule and expanded here:
 * the calendar always shows the NEXT upcoming date of each event, and the
 * detail page lists the run of upcoming dates. Multi-day events instead carry
 * an explicit list of sessions; their start/end span the whole run, and they
 * never also repeat.
 */

type EventRow = Database['public']['Tables']['events']['Row']

function mapEvent(row: EventRow): ChurchEvent {
  const sessions = parseSessions(row.sessions)
  const span = sessionSpan(sessions)
  const rule = span ? null : ruleFromStored(row.recurring)
  const address = parseAddress({
    street: row.location_street,
    city: row.location_city,
    region: row.location_region,
    postalCode: row.location_postal_code,
  })
  const speakers = parseSpeakers(row.speakers)
  const faqs = parseFaqs(row.faqs)
  const infoSections = parseInfoSections(row.info_sections)
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    description: row.description,
    startDate: span?.startDate ?? row.start_date,
    endDate: span ? span.endDate : row.end_date ?? undefined,
    locationName: row.location_name ?? undefined,
    ...(address ? { address } : {}),
    ...(sessions.length > 1 ? { sessions } : {}),
    ...(speakers.length ? { speakers } : {}),
    ...(faqs.length ? { faqs } : {}),
    ...(infoSections.length ? { infoSections } : {}),
    category: row.category as ChurchEvent['category'],
    recurring: rule ? recurrenceLabel(rule, row.start_date) : span ? undefined : row.recurring ?? undefined,
    recurrenceRule: rule ?? undefined,
    image: row.image ?? undefined,
    imageAlt: row.image_alt ?? undefined,
    sample: row.sample,
  }
}

/** Seed events run through the same recurrence recognition as live rows. */
function mapSeed(e: ChurchEvent): ChurchEvent {
  const span = sessionSpan(e.sessions ?? [])
  const rule = span ? null : ruleFromStored(e.recurring)
  return {
    ...e,
    ...(span ? { startDate: span.startDate, endDate: span.endDate } : {}),
    recurring: rule ? recurrenceLabel(rule, e.startDate) : e.recurring,
    recurrenceRule: rule ?? undefined,
  }
}

/** All published events with their original first dates. Cached per render pass. */
const fetchEvents = cache(async (): Promise<ChurchEvent[]> => {
  const supabase = getSupabase()
  if (!supabase) return seedEvents.map(mapSeed)

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('published', true)
    .order('start_date', { ascending: true })

  if (error || !data) {
    console.warn('[events] read failed, falling back to seed content:', error?.message)
    return seedEvents.map(mapSeed)
  }
  return data.map(mapEvent)
})

/**
 * Published events for the calendar, soonest first. Each event appears once,
 * dated at its next upcoming occurrence; one-time events that have already
 * ended drop off.
 */
export async function upcomingEvents(): Promise<ChurchEvent[]> {
  const events = await fetchEvents()
  const now = new Date()
  return events
    .flatMap((e) => {
      const [next] = upcomingOccurrences(e, { from: now, max: 1 })
      return next ? [{ ...e, startDate: next.startDate, endDate: next.endDate }] : []
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
}

/** One event by slug, with its original first date (for admin and detail use). */
export async function getEvent(slug: string): Promise<ChurchEvent | undefined> {
  return (await fetchEvents()).find((e) => e.slug === slug)
}

/** The run of upcoming dates for an event: its remaining sessions for a
 *  multi-day event, the next repeats for a recurring one, or its single date. */
export function eventOccurrences(event: ChurchEvent, max = 6): Occurrence[] {
  if (event.sessions?.length) {
    const now = Date.now()
    return event.sessions.filter((s) => new Date(s.endDate ?? s.startDate).getTime() >= now)
  }
  return upcomingOccurrences(
    { startDate: event.startDate, endDate: event.endDate, recurring: event.recurrenceRule },
    { max }
  )
}
