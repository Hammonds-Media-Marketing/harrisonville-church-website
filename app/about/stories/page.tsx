import type { Metadata } from 'next'
import { copyMetadata, pageCopy } from '@/lib/page-copy'
import { JsonLd, breadcrumbSchema, webPageSchema } from '@/lib/jsonld'
import { Container, Section, SectionHeading } from '@/components/primitives/Layout'
import { Button } from '@/components/primitives/Button'
import { SampleNotice } from '@/components/blocks/SampleNotice'
import { StoryCard } from '@/components/blocks/cards'
import { memberStories } from '@/content/stories'

const PATH = '/about/stories'

export async function generateMetadata(): Promise<Metadata> {
  // Hidden from navigation and search until real, consented stories are supplied.
  return copyMetadata(PATH, { noindex: true })
}

const breadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Member Stories', path: PATH },
]

export default async function StoriesPage() {
  const copy = await pageCopy(PATH)

  return (
    <>
      <JsonLd
        data={[
          webPageSchema({ name: 'Member Stories', description: copy.s('seo.description'), path: PATH }),
          breadcrumbSchema(breadcrumbs),
        ]}
      />

      <Section tone="surface">
        <Container>
          <SectionHeading
            as="h1"
            eyebrow={copy.t('intro.eyebrow')}
            title={copy.t('intro.title')}
            lead={copy.t('intro.lead')}
          />
        </Container>
      </Section>

      <Section tone="light">
        <Container>
          {copy.blank('intro.notice') ? null : <SampleNotice label={copy.t('intro.notice')} />}
          <div className="grid gap-5 md:grid-cols-3">
            {memberStories.map((story) => (
              <StoryCard key={story.slug} story={story} />
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
