import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { buildMetadata } from '@/lib/seo'
import { JsonLd, breadcrumbSchema, faqSchema } from '@/lib/jsonld'
import { eventSchemas } from '@/lib/event-schema'
import { Container, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Button } from '@/components/primitives/Button'
import { SampleNotice } from '@/components/blocks/SampleNotice'
import { Faq } from '@/components/blocks/Faq'
import { EventShare } from '@/components/events/EventShare'
import { CalendarIcon, ClockIcon, ExternalLinkIcon, MapPinIcon, UserIcon } from '@/components/ui/icons'
import { formatDateRange } from '@/lib/format'
import { eventOccurrences, getEvent, upcomingEvents } from '@/lib/events'
import { directionsUrl, eventPlace, mapEmbedUrl } from '@/lib/event-details'
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

/** "Friday, April 23, 2027" in church time. */
function sessionDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Chicago',
  })
}

/** "7:00 PM – 8:30 PM" (or just the start time) in church time. */
function sessionTime(start: string, end?: string) {
  const t = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' })
  return end ? `${t(start)} – ${t(end)}` : t(start)
}

export default async function EventDetailPage({ params }: Params) {
  const { slug } = await params
  const event = await getEvent(slug)
  if (!event) notFound()

  const occurrences = eventOccurrences(event)
  const next = occurrences[0] ?? { startDate: event.startDate, endDate: event.endDate }
  const place = eventPlace(event)
  const sessions = event.sessions ?? []
  const multiDay = sessions.length > 1
  const now = Date.now()
  const when = multiDay ? formatDateRange(event.startDate, event.endDate) : formatDateRange(next.startDate, next.endDate)

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Events', path: '/events' },
    { name: event.title, path: `/events/${event.slug}` },
  ]

  const paragraphs = (text: string) => text.split(/\n{2,}/).filter(Boolean)
  const calendarDetails = { title: event.title, description: event.summary, location: `${place.name}, ${place.line}` }

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(breadcrumbs),
          ...eventSchemas(event, event.recurrenceRule ? occurrences : undefined),
          ...(event.faqs?.length ? [faqSchema(event.faqs)] : []),
        ]}
      />

      <PageHero eyebrow={event.category} title={event.title} lead={event.summary} />

      <Section tone="light">
        <Container>
          {event.sample ? <SampleNotice label="This event is a placeholder." /> : null}
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="flex flex-col gap-10">
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
                {paragraphs(event.description).map((p, i) => (
                  <p key={i} className="text-ink">
                    {p}
                  </p>
                ))}
              </div>

              {multiDay ? (
                <section aria-labelledby="schedule-heading" className="flex flex-col gap-4">
                  <h2 id="schedule-heading" className="text-2xl">
                    Schedule
                  </h2>
                  <ol className="flex flex-col divide-y divide-border/60 rounded-lg border border-border/60 bg-bg">
                    {sessions.map((d) => {
                      const ended = new Date(d.endDate ?? d.startDate).getTime() < now
                      return (
                        <li key={d.startDate} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-4">
                          <span className={`flex items-center gap-3 ${ended ? 'text-muted' : 'text-ink'}`}>
                            <CalendarIcon className="h-5 w-5 shrink-0 text-primary-strong" />
                            <span>
                              <span className="font-semibold">{sessionDay(d.startDate)}</span>
                              <span className="block text-sm sm:inline sm:before:content-['_·_']">{sessionTime(d.startDate, d.endDate)}</span>
                            </span>
                          </span>
                          {ended ? (
                            <span className="text-sm text-muted">Ended</span>
                          ) : (
                            <a
                              href={googleCalendarUrl(calendarDetails, d.startDate, d.endDate)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm font-semibold text-link hover:text-link-hover"
                            >
                              Add to Google Calendar
                              <span className="sr-only"> ({sessionDay(d.startDate)}, opens in a new tab)</span>
                              <ExternalLinkIcon className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </li>
                      )
                    })}
                  </ol>
                </section>
              ) : null}

              {event.speakers?.length ? (
                <section aria-labelledby="speakers-heading" className="flex flex-col gap-4">
                  <h2 id="speakers-heading" className="text-2xl">
                    {event.speakers.length > 1 ? 'Speakers' : 'Speaker'}
                  </h2>
                  <ul className="grid gap-5 sm:grid-cols-2">
                    {event.speakers.map((p) => (
                      <li key={p.name}>
                        <Surface tone="card" className="flex h-full flex-col gap-4">
                          <div className="flex items-center gap-4">
                            {p.image ? (
                              <span className="relative block h-20 w-20 shrink-0 overflow-hidden rounded-full bg-surface">
                                <Image src={p.image} alt={p.imageAlt ?? p.name} fill sizes="80px" className="object-cover" />
                              </span>
                            ) : (
                              <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-surface text-primary-strong">
                                <UserIcon className="h-8 w-8" />
                              </span>
                            )}
                            <div>
                              <h3 className="text-xl">{p.name}</h3>
                              {p.role ? <p className="text-sm text-muted">{p.role}</p> : null}
                            </div>
                          </div>
                          {p.bio ? paragraphs(p.bio).map((b, i) => <p key={i} className="text-ink">{b}</p>) : null}
                        </Surface>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {event.infoSections?.map((section, i) => (
                <section key={i} aria-labelledby={`info-${i}-heading`} className="flex flex-col gap-4">
                  <h2 id={`info-${i}-heading`} className="text-2xl">
                    {section.heading}
                  </h2>
                  {paragraphs(section.body).map((p, j) => (
                    <p key={j} className="whitespace-pre-line text-ink">
                      {p}
                    </p>
                  ))}
                </section>
              ))}

              {event.faqs?.length ? (
                <section aria-labelledby="faq-heading" className="flex flex-col gap-4">
                  <h2 id="faq-heading" className="text-2xl">
                    Frequently asked questions
                  </h2>
                  <Faq items={event.faqs} />
                </section>
              ) : null}
            </div>

            <aside className="flex flex-col gap-5" aria-label="Event details">
              <Surface tone="card" className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <CalendarIcon className="mt-1 h-5 w-5 shrink-0 text-primary-strong" />
                  <div>
                    <h2 className="font-body text-base font-semibold text-heading">Date and time</h2>
                    <p className="text-ink">{when}</p>
                    {multiDay ? (
                      <p className="text-sm text-muted">
                        {sessions.length} dates. <a href="#schedule-heading" className="font-semibold text-link hover:text-link-hover">See the schedule</a>
                      </p>
                    ) : null}
                    {event.recurring ? <p className="text-sm text-muted">{event.recurring}</p> : null}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPinIcon className="mt-1 h-5 w-5 shrink-0 text-primary-strong" />
                  <div>
                    <h2 className="font-body text-base font-semibold text-heading">Location</h2>
                    <p className="text-ink">{place.name}</p>
                    <p className="text-sm text-muted">{place.line}</p>
                    <a
                      href={directionsUrl(place)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-link hover:text-link-hover"
                    >
                      Get directions
                      <span className="sr-only"> (opens in a new tab)</span>
                      <ExternalLinkIcon className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-border/60 pt-4">
                  <Button
                    href={googleCalendarUrl(calendarDetails, next.startDate, next.endDate)}
                    variant="secondary"
                    size="sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {multiDay ? 'Add next date to Google Calendar' : 'Add to Google Calendar'}
                  </Button>
                  <Button href={`/events/${event.slug}/calendar`} variant="ghost" size="sm">
                    {multiDay ? 'Download all dates for other calendars' : 'Download for other calendars'}
                  </Button>
                </div>

                <div className="border-t border-border/60 pt-4">
                  <EventShare title={event.title} summary={event.summary} slug={event.slug} when={when} />
                </div>
              </Surface>

              {!multiDay && occurrences.length > 1 ? (
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

      <Section tone="surface" ariaLabelledby="map-heading">
        <Container className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 id="map-heading" className="text-2xl">
              Getting there
            </h2>
            <p className="text-ink">
              {place.name} · {place.line}
            </p>
          </div>
          <div className="overflow-hidden rounded-xl border border-border/60 bg-bg">
            <iframe
              src={mapEmbedUrl(place)}
              title={`Map of ${place.name}, ${place.line}`}
              className="block h-80 w-full border-0 md:h-96"
              loading="lazy"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
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
