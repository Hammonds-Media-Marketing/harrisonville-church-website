import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { JsonLd, breadcrumbSchema, eventSchema, webPageSchema } from '@/lib/jsonld'
import { Container, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Button } from '@/components/primitives/Button'
import { SampleNotice } from '@/components/blocks/SampleNotice'
import { EventCard } from '@/components/blocks/cards'
import { upcomingEvents } from '@/lib/events'

export const revalidate = 3600

export const metadata: Metadata = buildMetadata({
  title: 'Events & Gatherings',
  description:
    'Upcoming gatherings at the Harrisonville Church of Christ: gospel meetings, fellowship meals, and community outreach across Cass County.',
  path: '/events',
  ogTitle: 'What Is Happening at the Church',
  ogDescription: 'Gospel meetings, shared meals, and community outreach. Visitors are welcome at every gathering.',
  ogImage: '/assets/og/og-events.jpg',
  ogImageAlt: 'The Harrisonville Church of Christ congregation gathered at the front of the auditorium',
})

const breadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'Events', path: '/events' },
]

export default async function EventsPage() {
  const events = await upcomingEvents()

  return (
    <>
      <JsonLd
        data={[
          webPageSchema({ name: 'Events', description: metadata.description as string, path: '/events' }),
          breadcrumbSchema(breadcrumbs),
          ...events.map((e) =>
            eventSchema({
              name: e.title,
              description: e.summary,
              slug: e.slug,
              startDate: e.startDate,
              endDate: e.endDate,
              locationName: e.locationName,
              image: e.image,
            })
          ),
        ]}
      />

      <PageHero
        eyebrow="Calendar"
        title="Upcoming events and gatherings"
        lead="Beyond Sunday and Wednesday worship, the congregation gathers for study, fellowship, and service in the community. Guests are welcome at all of it, with no expectation to take part."
      />

      <Section tone="light">
        <Container>
          <SampleNotice label="The events below are placeholders." />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <EventCard key={e.slug} event={e} />
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="deep">
        <Container className="flex flex-col items-center gap-5 text-center">
          <h2 className="text-3xl text-on-deep">Want a reminder before the next gathering?</h2>
          <p className="max-w-xl text-lg text-on-deep-muted">
            Reach out and we will let you know what is coming up, or follow along on Facebook.
          </p>
          <Button href="/contact#contact-form" variant="primary" size="lg">
            Get in touch
          </Button>
        </Container>
      </Section>
    </>
  )
}
