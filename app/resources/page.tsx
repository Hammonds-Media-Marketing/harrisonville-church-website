import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { JsonLd, breadcrumbSchema, webPageSchema } from '@/lib/jsonld'
import { Container, Eyebrow, Section, SectionHeading } from '@/components/primitives/Layout'
import { Surface } from '@/components/primitives/Surface'
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs'
import { CardLink } from '@/components/blocks/cards'
import { BookIcon, PlayIcon, QuoteIcon } from '@/components/ui/icons'

export const dynamic = 'force-static'

export const metadata: Metadata = buildMetadata({
  title: 'Resources for Studying the Bible',
  description:
    'Free resources from the Harrisonville Church of Christ: a self-paced Bible study course, a sermon and video library, and a Scripture-first blog.',
  path: '/resources',
  ogTitle: 'Study the Bible at Your Own Pace',
  ogDescription: 'Sermons, a free Bible study course, and articles that answer honest questions from the New Testament.',
})

const breadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'Resources', path: '/resources' },
]

const resources = [
  { icon: PlayIcon, title: 'Sermons & Videos', body: 'Watch and listen to recent lessons drawn straight from Scripture.', href: '/resources/sermons', cta: 'Browse sermons' },
  { icon: BookIcon, title: 'Bible Study Course', body: 'A free, self-paced study of the Gospel from the beginning. No cost, no obligation.', href: '/resources/bible-study', cta: 'Begin the course' },
  { icon: QuoteIcon, title: 'Blog', body: 'Plain, Scripture-first answers to the questions people actually ask.', href: '/blog', cta: 'Read the blog' },
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
      <Section tone="surface">
        <Container>
          <Breadcrumbs crumbs={breadcrumbs} />
          <SectionHeading
            as="h1"
            eyebrow="Free resources"
            title="Study the Bible on your own terms"
            lead="Everything here is free, and none of it requires you to attend or join anything. Start wherever your questions are."
          />
        </Container>
      </Section>
      <Section tone="light">
        <Container>
          <div className="grid gap-5 md:grid-cols-3">
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
