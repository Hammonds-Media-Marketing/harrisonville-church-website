import { NextResponse } from 'next/server'
import { eventOccurrences, getEvent } from '@/lib/events'
import { SITE_URL, site } from '@/lib/site'

export const revalidate = 3600

/**
 * iCalendar download for an event — the "other calendars" path next to the
 * Google Calendar link (Apple Calendar, Outlook, and everything else that
 * opens .ics files). Recurring events include each upcoming date as its own
 * entry, matching what the event page shows.
 */

function icsStamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, '')
}

function icsEscape(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await getEvent(slug)
  if (!event) return new NextResponse('Not found', { status: 404 })

  const occurrences = eventOccurrences(event)
  const dates = occurrences.length ? occurrences : [{ startDate: event.startDate, endDate: event.endDate }]
  const address = `${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postalCode}`
  const location = event.locationName || `${site.name}, ${address}`
  const now = icsStamp(new Date().toISOString())

  const vevents = dates
    .map((o) => {
      const end = o.endDate ?? new Date(new Date(o.startDate).getTime() + 60 * 60 * 1000).toISOString()
      return [
        'BEGIN:VEVENT',
        `UID:${event.slug}-${icsStamp(o.startDate)}@harrisonvillecoc`,
        `DTSTAMP:${now}`,
        `DTSTART:${icsStamp(o.startDate)}`,
        `DTEND:${icsStamp(end)}`,
        `SUMMARY:${icsEscape(event.title)}`,
        `DESCRIPTION:${icsEscape(event.summary)}`,
        `LOCATION:${icsEscape(location)}`,
        `URL:${SITE_URL}/events/${event.slug}`,
        'END:VEVENT',
      ].join('\r\n')
    })
    .join('\r\n')

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${site.name}//Events//EN`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    vevents,
    'END:VCALENDAR',
  ].join('\r\n')

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${event.slug}.ics"`,
    },
  })
}
