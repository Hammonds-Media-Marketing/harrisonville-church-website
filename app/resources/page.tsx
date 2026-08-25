import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { JsonLd, breadcrumbSchema, webPageSchema } from '@/lib/jsonld'
import { Container, Eyebrow, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { CardLink } from '@/components/blocks/cards'
import { BookIcon } from '@/components/ui/icons'

export const dynamic = 'force-static'

export const metadata: Metadata = buildMetadata({
  title: 'Resources for Studying the Bible',
  description:
    'Free resources from the Harrisonville Church of Christ: a self-paced Bible study course drawn straight from Scripture.',
  path: '/resources',
  ogTitle: 'Study the Bible at Your Own Pace',
  ogDescription: 'A free, self-paced Bible study course that answers honest questions from the New Testament.',
  // The hub is unlinked while the sermon library is hidden; the Bible study
  // course is reached directly from the primary navigation instead.
  noindex: true,
})

const breadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'Resources', path: '/resources' },
]

const resources = [
  { icon: BookIcon, title: 'Bible Study Course', body: 'A free, self-paced study of the Gospel from the beginning. No cost, no obligation.', href: '/resources/bible-study', cta: 'Begin the course' },
]

export default function ResourcesPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageSchema({ name: 'Resources', description: metadata.description as string, path: '/resources' }),
          breadcrumbSchema(breadcrumbs),
        ]}
      />
      <PageHero
        eyebrow="Free resources"
        title="Study the Bible on your own terms"
        lead="Everything here is free, and none of it requires you to attend or join anything. Start wherever your questions are."
      />
      <Section tone="light">
        <Container>
          <div className="grid gap-5 md:grid-cols-2">
            {resources.map((r) => (
              <Surface key={r.title} tone="card" interactive className="flex flex-col gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-primary-strong text-on-primary">
                  <r.icon className="h-6 w-6" />
                </span>
                <Eyebrow>Resource</Eyebrow>
                <h2 className="text-xl">{r.title}</h2>
                <p className="flex-1 text-ink">{r.body}</p>
                <CardLink href={r.href}>{r.cta}</CardLink>
              </Surface>
            ))}
          </div>
        </Container>
      </Section>
    </>
  )
}
