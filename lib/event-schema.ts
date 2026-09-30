import { SITE_URL, site } from '@/lib/site'
import { eventPlace, eventUrl } from '@/lib/event-details'
import { formatDateRange } from '@/lib/format'
import type { ChurchEvent, EventSession } from '@/content/types'

type Json = Record<string, unknown>

/** The church organization node, defined by churchSchema() in lib/jsonld.tsx. */
const ORG_ID = `${SITE_URL}/#church`

const absoluteUrl = (path: string) => (path.startsWith('http') ? path : `${SITE_URL}${path}`)

/**
 * Event structured data (Google Event rich results). A one-time or multi-day
 * event is a single Event spanning its whole run, with each day of a
 * multi-day event as a subEvent. A repeating event is one Event per upcoming
 * date, since each date is its own gathering. Pass `dates` to set which dates
 * are marked up (the event page passes its upcoming run; listings pass
 * nothing, which marks up the event's next date only).
 */
export function eventSchemas(e: ChurchEvent, dates?: EventSession[]): Json[] {
  const url = eventUrl(e.slug)
  const place = eventPlace(e)
  const location = {
    '@type': 'Place',
    name: place.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: place.address.street,
      addressLocality: place.address.city,
      ...(place.address.region ? { addressRegion: place.address.region } : {}),
      ...(place.address.postalCode ? { postalCode: place.address.postalCode } : {}),
      addressCountry: 'US',
    },
    ...(place.atBuilding
      ? { geo: { '@type': 'GeoCoordinates', latitude: site.geo.latitude, longitude: site.geo.longitude } }
      : {}),
  }
  const base: Json = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: e.title,
    description: e.summary,
    url,
    image: [absoluteUrl(e.image ?? '/assets/og/og-default.jpg')],
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location,
    organizer: { '@type': 'Church', '@id': ORG_ID, name: site.name, url: `${SITE_URL}/` },
    ...(e.speakers?.length
      ? {
          performer: e.speakers.map((p) => ({
            '@type': 'Person',
            name: p.name,
            ...(p.role ? { jobTitle: p.role } : {}),
            ...(p.bio ? { description: p.bio } : {}),
            ...(p.image ? { image: absoluteUrl(p.image) } : {}),
          })),
        }
      : {}),
    // Every gathering is free and open to the public.
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: 0,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url,
    },
    inLanguage: 'en-US',
  }
  const when = (d: EventSession) => ({ startDate: d.startDate, ...(d.endDate ? { endDate: d.endDate } : {}) })

  if (e.recurrenceRule) {
    const runs = dates?.length ? dates : [{ startDate: e.startDate, endDate: e.endDate }]
    return runs.map((d) => ({ ...base, '@id': `${url}#event-${d.startDate.slice(0, 10)}`, ...when(d) }))
  }

  return [
    {
      ...base,
      '@id': `${url}#event`,
      ...when({ startDate: e.startDate, endDate: e.endDate }),
      ...(e.sessions && e.sessions.length > 1
        ? {
            subEvent: e.sessions.map((d) => ({
              '@type': 'Event',
              name: `${e.title}: ${formatDateRange(d.startDate, d.endDate)}`,
              ...when(d),
              eventStatus: 'https://schema.org/EventScheduled',
              eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
              location,
              url,
            })),
          }
        : {}),
    },
  ]
}
