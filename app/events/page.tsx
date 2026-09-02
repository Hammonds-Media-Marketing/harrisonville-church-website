import type { Metadata } from 'next'
import { copyMetadata, pageCopy } from '@/lib/page-copy'
import { JsonLd, breadcrumbSchema, eventSchema, webPageSchema } from '@/lib/jsonld'
import { Container, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Button } from '@/components/primitives/Button'
import { SampleNotice } from '@/components/blocks/SampleNotice'
import { EventCard } from '@/components/blocks/cards'
import { upcomingEvents } from '@/lib/events'

export const revalidate = 3600

const PATH = '/events'

export async function generateMetadata(): Promise<Metadata> {
  return copyMetadata(PATH)
}

const breadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'Events', path: PATH },
]

export default async function EventsPage() {
  const [events, copy] = await Promise.all([upcomingEvents(), pageCopy(PATH)])

  return (
    <>
      <JsonLd
        data={[
          webPageSchema({ name: 'Events', description: copy.s('seo.description'), path: PATH }),
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

      <PageHero eyebrow={copy.t('hero.eyebrow')} title={copy.t('hero.title')} lead={copy.t('hero.lead')} />

      <Section tone="light">
        <Container>
          {copy.blank('list.notice') ? null : <SampleNotice label={copy.t('list.notice')} />}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <EventCard key={e.slug} event={e} />
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="deep">
        <Container className="flex flex-col items-center gap-5 text-center">
          <h2 className="text-3xl text-on-deep">{copy.t('cta.title')}</h2>
          <p className="max-w-xl text-lg text-on-deep-muted">{copy.t('cta.body')}</p>
          <Button href={copy.s('cta.href')} variant="primary" size="lg">
            {copy.t('cta.label')}
          </Button>
        </Container>
      </Section>
    </>
  )
}
