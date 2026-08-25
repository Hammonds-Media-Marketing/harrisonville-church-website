import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { buildMetadata } from '@/lib/seo'
import { JsonLd, breadcrumbSchema, eventSchema } from '@/lib/jsonld'
import { Container, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Badge } from '@/components/primitives/Badge'
import { Button } from '@/components/primitives/Button'
import { SampleNotice } from '@/components/blocks/SampleNotice'
import { CalendarIcon, ClockIcon, ExternalLinkIcon, MapPinIcon } from '@/components/ui/icons'
import { formatDateRange } from '@/lib/format'
import { eventOccurrences, getEvent, upcomingEvents } from '@/lib/events'
import { site } from '@/lib/site'

export const revalidate = 3600

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const event = await getEvent(slug)
  if (!event) return { title: 'Event not found' }
  return buildMetadata({
    title: event.title,
    description: event.summary,
    path: `/events/${event.slug}`,
    ogTitle: `${event.title} — ${site.address.city}, ${site.address.region}`,
    ogDescription: `${event.category} gathering at the ${site.name}. Visitors are always welcome.`,
    ...(event.image ? { ogImage: event.image, ogImageAlt: event.imageAlt } : {}),
  })
}

/** Google Calendar template link for one occurrence. */
function googleCalendarUrl(e: { title: string; description: string; location: string }, start: string, end?: string) {
  const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, '')
  const endIso = end ?? new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString()
  const query = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${stamp(start)}/${stamp(endIso)}`,
    details: e.description,
    location: e.location,
  })
  return `https://calendar.google.com/calendar/render?${query.toString()}`
}

export default async function EventDetailPage({ params }: Params) {
  const { slug } = await params
  const event = await getEvent(slug)
  if (!event) notFound()

  const occurrences = eventOccurrences(event)
  const next = occurrences[0] ?? { startDate: event.startDate, endDate: event.endDate }
  const address = `${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postalCode}`
  const locationName = event.locationName || site.name
  const atBuilding = !event.locationName
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    atBuilding ? `${site.name}, ${address}` : locationName
  )}`

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Events', path: '/events' },
    { name: event.title, path: `/events/${event.slug}` },
  ]

  const paragraphs = event.description.split(/\n{2,}/).filter(Boolean)

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(breadcrumbs),
          eventSchema({
            name: event.title,
            description: event.summary,
            slug: event.slug,
            startDate: next.startDate,
            endDate: next.endDate,
            locationName: event.locationName,
            image: event.image,
          }),
        ]}
      />

      <PageHero eyebrow={event.category} title={event.title} lead={event.summary} />

      <Section tone="light">
        <Container>
          {event.sample ? <SampleNotice label="This event is a placeholder." /> : null}
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="flex flex-col gap-6">
              {event.image ? (
                <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-surface">
                  <Image
                    src={event.image}
                    alt={event.imageAlt ?? ''}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    className="object-cover"
                  />
                </div>
              ) : null}

              <div className="flex flex-col gap-4">
                <h2 className="text-2xl">What to expect at this gathering</h2>
                {paragraphs.map((p, i) => (
                  <p key={i} className="text-ink">
                    {p}
                  </p>
                ))}
              </div>
            </div>

            <aside className="flex flex-col gap-5" aria-label="Event details">
              <Surface tone="card" className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <CalendarIcon className="mt-1 h-5 w-5 shrink-0 text-primary-strong" />
                  <div>
                    <h2 className="font-body text-base font-semibold text-heading">Date and time</h2>
                    <p className="text-ink">{formatDateRange(next.startDate, next.endDate)}</p>
                    {event.recurring ? <p className="text-sm text-muted">{event.recurring}</p> : null}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPinIcon className="mt-1 h-5 w-5 shrink-0 text-primary-strong" />
                  <div>
                    <h2 className="font-body text-base font-semibold text-heading">Location</h2>
                    <p className="text-ink">{locationName}</p>
                    {atBuilding ? <p className="text-sm text-muted">{address}</p> : null}
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-link hover:text-link-hover"
                    >
                      Get directions
                      <ExternalLinkIcon className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-border/60 pt-4">
                  <Button
                    href={googleCalendarUrl(
                      { title: event.title, description: event.summary, location: atBuilding ? address : locationName },
                      next.startDate,
                      next.endDate
                    )}
                    variant="secondary"
                    size="sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Add to Google Calendar
                  </Button>
                  <Button href={`/events/${event.slug}/calendar`} variant="ghost" size="sm">
                    Download for other calendars
                  </Button>
                </div>
              </Surface>

              {occurrences.length > 1 ? (
                <Surface tone="panel" className="flex flex-col gap-3">
                  <h2 className="flex items-center gap-2 font-body text-base font-semibold text-heading">
                    <ClockIcon className="h-5 w-5 text-primary-strong" />
                    Upcoming dates
                  </h2>
                  <ul className="flex flex-col gap-2">
                    {occurrences.map((o) => (
                      <li key={o.startDate} className="border-b border-border/40 pb-2 text-sm text-ink last:border-b-0 last:pb-0">
                        {formatDateRange(o.startDate, o.endDate)}
                      </li>
                    ))}
                  </ul>
                </Surface>
              ) : null}
            </aside>
          </div>
        </Container>
      </Section>

      <Section tone="deep">
        <Container className="flex flex-col items-center gap-5 text-center">
          <h2 className="text-3xl text-on-deep">First time visiting?</h2>
          <p className="max-w-xl text-lg text-on-deep-muted">
            There is no cost, no registration, and no pressure to participate. Come as you are — we will save you a
            seat.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button href="/about/what-to-expect" variant="primary" size="lg">
              What to expect
            </Button>
            <Button href="/contact#contact-form" variant="ghostOnDeep" size="lg">
              Ask a question
            </Button>
          </div>
        </Container>
      </Section>
    </>
  )
}

/** Prerender the currently published events; new ones render on demand. */
export async function generateStaticParams() {
  const events = await upcomingEvents()
  return events.map((e) => ({ slug: e.slug }))
}
