import { localInputToIso } from '@/lib/format'
import { SITE_URL, site } from '@/lib/site'
import type {
  ChurchEvent,
  EventAddress,
  EventFaq,
  EventInfoSection,
  EventSession,
  EventSpeaker,
} from '@/content/types'

/**
 * The optional detail blocks on a public event: multi-day sessions, an
 * off-site address, speakers, FAQs, and extra information sections. They live
 * in jsonb columns, so everything read back is validated here rather than
 * trusted, and the admin form's repeated fields are zipped into the same
 * shapes. Pure functions only, so the tests can exercise them directly.
 */

type Obj = Record<string, unknown>

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const objects = (v: unknown): Obj[] =>
  Array.isArray(v) ? v.filter((x): x is Obj => !!x && typeof x === 'object' && !Array.isArray(x)) : []
const validIso = (v: string) => !!v && !Number.isNaN(new Date(v).getTime())

/** A media link an editor may attach: an https address or a site path. */
const safeMediaUrl = (value: string) => (/^(https:\/\/|\/(?!\/))/i.test(value) ? value : '')

// ---------------------------------------------------------------------------
// Reading stored jsonb
// ---------------------------------------------------------------------------

/** Sessions sorted soonest first; entries without a valid start are dropped,
 *  and an end at or before its start is ignored. */
export function parseSessions(value: unknown): EventSession[] {
  return objects(value)
    .flatMap((o) => {
      const start = str(o.start)
      if (!validIso(start)) return []
      const end = str(o.end)
      const endOk = validIso(end) && new Date(end).getTime() > new Date(start).getTime()
      return [{ startDate: new Date(start).toISOString(), ...(endOk ? { endDate: new Date(end).toISOString() } : {}) }]
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
}

export function parseSpeakers(value: unknown): EventSpeaker[] {
  return objects(value).flatMap((o) => {
    const name = str(o.name)
    if (!name) return []
    const image = safeMediaUrl(str(o.image))
    return [
      {
        name,
        ...(str(o.role) ? { role: str(o.role) } : {}),
        ...(str(o.bio) ? { bio: str(o.bio) } : {}),
        ...(image ? { image, imageAlt: str(o.image_alt) || name } : {}),
      },
    ]
  })
}

export function parseFaqs(value: unknown): EventFaq[] {
  return objects(value).flatMap((o) => {
    const question = str(o.question)
    const answer = str(o.answer)
    return question && answer ? [{ question, answer }] : []
  })
}

export function parseInfoSections(value: unknown): EventInfoSection[] {
  return objects(value).flatMap((o) => {
    const heading = str(o.heading)
    const body = str(o.body)
    return heading && body ? [{ heading, body }] : []
  })
}

/** An off-site address, only when at least the street and city are filled in. */
export function parseAddress(parts: {
  street?: string | null
  city?: string | null
  region?: string | null
  postalCode?: string | null
}): EventAddress | undefined {
  const street = str(parts.street)
  const city = str(parts.city)
  if (!street || !city) return undefined
  return { street, city, region: str(parts.region), postalCode: str(parts.postalCode) }
}

/** The whole event's span from its sessions: first start to the last end
 *  (or last start when the final session has no end). */
export function sessionSpan(sessions: EventSession[]): { startDate: string; endDate?: string } | null {
  if (!sessions.length) return null
  const first = sessions[0]
  const last = sessions[sessions.length - 1]
  const endDate = last.endDate ?? (sessions.length > 1 ? last.startDate : undefined)
  return { startDate: first.startDate, ...(endDate ? { endDate } : {}) }
}

// ---------------------------------------------------------------------------
// Reading the admin form (repeated fields share a name, one per row)
// ---------------------------------------------------------------------------

type FormLike = { getAll(name: string): unknown[] }

const column = (form: FormLike, name: string) => form.getAll(name).map((v) => (typeof v === 'string' ? v.trim() : ''))

/** Rows of repeated fields, zipped by position; rows with every field blank are dropped. */
function rows<K extends string>(form: FormLike, prefix: string, keys: readonly K[]): Array<Record<K, string>> {
  const cols = keys.map((k) => column(form, `${prefix}_${k}`))
  const count = Math.max(0, ...cols.map((c) => c.length))
  const out: Array<Record<K, string>> = []
  for (let i = 0; i < count; i++) {
    const row = Object.fromEntries(keys.map((k, j) => [k, cols[j][i] ?? ''])) as Record<K, string>
    if (keys.some((k) => row[k])) out.push(row)
  }
  return out
}

/** Stored jsonb for the four repeatable blocks, from the admin form. Session
 *  times arrive as datetime-local values in church time. */
export function detailsFromForm(form: FormLike) {
  const sessions = rows(form, 'session', ['start', 'end'] as const)
    .filter((r) => r.start)
    .map((r) => ({ start: localInputToIso(r.start), end: r.end ? localInputToIso(r.end) : null }))
  const speakers = rows(form, 'speaker', ['name', 'role', 'bio', 'image', 'image_alt'] as const)
    .filter((r) => r.name)
    .map((r) => ({ ...r, image: safeMediaUrl(r.image) }))
  const faqs = rows(form, 'faq', ['question', 'answer'] as const).filter((r) => r.question && r.answer)
  const info_sections = rows(form, 'info', ['heading', 'body'] as const).filter((r) => r.heading && r.body)
  return {
    // Validated through the same reader the site uses, then stored soonest first.
    sessions: parseSessions(sessions).map((s) => ({ start: s.startDate, end: s.endDate ?? null })),
    speakers,
    faqs,
    info_sections,
  }
}

// ---------------------------------------------------------------------------
// Location
// ---------------------------------------------------------------------------

export type EventPlace = {
  name: string
  address: EventAddress
  /** One-line address for display, maps, and calendar files. */
  line: string
  atBuilding: boolean
}

/** Where the event happens: its own address when one is set, otherwise the
 *  church building (a location name alone, like "Fellowship hall", is still
 *  shown as the place name at the building's address). */
export function eventPlace(event: Pick<ChurchEvent, 'locationName' | 'address'>): EventPlace {
  const address: EventAddress = event.address ?? {
    street: site.address.street,
    city: site.address.city,
    region: site.address.region,
    postalCode: site.address.postalCode,
  }
  const cityLine = [address.city, [address.region, address.postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  return {
    name: event.locationName || site.name,
    address,
    line: `${address.street}, ${cityLine}`,
    atBuilding: !event.address,
  }
}

/** Search query that finds the place on Google Maps. */
function mapsQuery(place: EventPlace) {
  return place.atBuilding && place.name === site.name ? `${site.name}, ${place.line}` : place.line
}

export function directionsUrl(place: EventPlace): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery(place))}`
}

/** Keyless Google Maps embed for the location. */
export function mapEmbedUrl(place: EventPlace): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(mapsQuery(place))}&z=15&output=embed`
}

// ---------------------------------------------------------------------------
// Sharing
// ---------------------------------------------------------------------------

export function eventUrl(slug: string): string {
  return `${SITE_URL}/events/${slug}`
}

/** Facebook, email, and text-message share links for an event. */
export function shareLinks(e: { title: string; summary: string; slug: string; when: string }) {
  const url = eventUrl(e.slug)
  const message = `${e.title} — ${e.when}. ${url}`
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    email: `mailto:?subject=${encodeURIComponent(e.title)}&body=${encodeURIComponent(
      `${e.summary}\n\nWhen: ${e.when}\n\nDetails: ${url}`
    )}`,
    // "sms:?&body=" opens a new message with the text filled in on both iOS and Android.
    sms: `sms:?&body=${encodeURIComponent(message)}`,
  }
}
