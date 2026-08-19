import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { JsonLd, breadcrumbSchema, webPageSchema } from '@/lib/jsonld'
import { Container, Section, SectionHeading } from '@/components/primitives/Layout'
import { Button } from '@/components/primitives/Button'
import { SampleNotice } from '@/components/blocks/SampleNotice'
import { StoryCard } from '@/components/blocks/cards'
import { memberStories } from '@/content/stories'

export const dynamic = 'force-static'

export const metadata: Metadata = buildMetadata({
  title: 'Member Stories',
  description:
    'Real members of the Harrisonville Church of Christ describe how they found a church home, asked hard questions, and came to faith without pressure.',
  path: '/about/stories',
  ogTitle: 'How People Found a Church Home Here',
  ogDescription:
    'Honest accounts from members about first visits, hard questions, and finding a place to belong.',
  // Hidden from navigation and search until real, consented stories are supplied.
  noindex: true,
})

const breadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Member Stories', path: '/about/stories' },
]

export default function StoriesPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageSchema({ name: 'Member Stories', description: metadata.description as string, path: '/about/stories' }),
          breadcrumbSchema(breadcrumbs),
        ]}
      />

      <Section tone="surface">
        <Container>
          <SectionHeading
            as="h1"
            eyebrow="In their own words"
            title="Member stories"
            lead="Sometimes the most helpful thing is to hear from someone who was once standing exactly where you are. These are accounts from members about how they came to be part of this congregation."
          />
        </Container>
      </Section>

      <Section tone="light">
        <Container>
          <SampleNotice label="The stories below are placeholders pending real, consented accounts." />
          <div className="grid gap-5 md:grid-cols-3">
            {memberStories.map((story) => (
              <StoryCard key={story.slug} story={story} />
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="deep">
        <Container className="flex flex-col items-center gap-5 text-center">
          <h2 className="text-3xl text-on-deep">Your story could start with one visit</h2>
          <p className="max-w-xl text-lg text-on-deep-muted">
            Every member here was once a first-time visitor with questions. There is room for yours.
          </p>
          <Button href="/about/what-to-expect" variant="primary" size="lg">
            Plan your visit
          </Button>
        </Container>
      </Section>
    </>
  )
}
