import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { JsonLd, breadcrumbSchema, webPageSchema } from '@/lib/jsonld'
import { Container, Section, SectionHeading } from '@/components/primitives/Layout'
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs'
import { LeaderCard } from '@/components/blocks/cards'
import { leaders } from '@/content/leadership'

export const dynamic = 'force-static'

export const metadata: Metadata = buildMetadata({
  title: 'Leadership',
  description:
    'Meet the elders, evangelist, and deacons who teach, shepherd, and serve the Harrisonville Church of Christ according to the qualifications Scripture describes.',
  path: '/about/leadership',
  ogTitle: 'The Men Who Serve and Shepherd the Congregation',
  ogDescription:
    'Each congregation governs itself under its own elders. Meet the people who carry that responsibility here.',
  ogImage: '/assets/og/og-leadership.jpg',
  ogImageAlt: 'Portraits of Issac Moreno, Jim Bradford, and Larry Bradford of the Harrisonville Church of Christ',
})

const breadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Leadership', path: '/about/leadership' },
]

export default function LeadershipPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageSchema({ name: 'Leadership', description: metadata.description as string, path: '/about/leadership' }),
          breadcrumbSchema(breadcrumbs),
        ]}
      />

      <Section tone="surface">
        <Container>
          <Breadcrumbs crumbs={breadcrumbs} />
          <SectionHeading
            as="h1"
            eyebrow="The people who serve"
            title="Leadership at the Harrisonville Church of Christ"
            lead="A Church of Christ is overseen by its own elders, taught by an evangelist, and served by deacons. There is no outside hierarchy. These are the members who carry that work here."
          />
        </Container>
      </Section>

      <Section tone="light">
        <Container>
          <p role="note" className="mb-6 text-sm text-muted">
            Individual roles and full biographies are being finalized with the congregation and will be added here.
          </p>
          <div className="grid gap-5 md:grid-cols-3">
            {leaders.map((leader) => (
              <LeaderCard key={leader.slug} leader={leader} />
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="surface">
        <Container prose>
          <h2 className="text-2xl">How is a Church of Christ organized?</h2>
          <p>
            Each congregation is independent and self-governing. Qualified men called elders, also described in
            Scripture as shepherds or overseers, watch over the spiritual welfare of the group. Deacons attend to
            practical needs, from benevolence to the care of the building. An evangelist, sometimes called the
            preacher, teaches publicly and studies with people one on one. This is the simple structure the New
            Testament describes, with no office above the local congregation.
          </p>
        </Container>
      </Section>
    </>
  )
}
