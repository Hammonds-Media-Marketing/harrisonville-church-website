import type { Metadata } from 'next'
import { copyMetadata, pageCopy } from '@/lib/page-copy'
import { JsonLd, breadcrumbSchema, webPageSchema } from '@/lib/jsonld'
import { Container, Section } from '@/components/primitives/Layout'
import { LeaderCard } from '@/components/blocks/cards'
import { PageHero } from '@/components/blocks/PageHero'
import { leaders } from '@/content/leadership'

const PATH = '/about/leadership'

export async function generateMetadata(): Promise<Metadata> {
  return copyMetadata(PATH)
}

const breadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Leadership', path: PATH },
]

export default async function LeadershipPage() {
  const copy = await pageCopy(PATH)

  return (
    <>
      <JsonLd
        data={[
          webPageSchema({ name: 'Leadership', description: copy.s('seo.description'), path: PATH }),
          breadcrumbSchema(breadcrumbs),
        ]}
      />

      <PageHero
        eyebrow={copy.t('hero.eyebrow')}
        title={copy.t('hero.title')}
        lead={copy.t('hero.lead')}
        portraits={leaders.map((l) => ({ src: l.photo, alt: l.photoAlt }))}
      />

      <Section tone="light">
        <Container>
          <div className="grid gap-5 md:grid-cols-3">
            {leaders.map((leader) => (
              <LeaderCard key={leader.slug} leader={leader} />
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="surface">
        <Container prose>
          <h2 className="text-2xl">{copy.t('structure.title')}</h2>
          <p>{copy.t('structure.body')}</p>
        </Container>
      </Section>
    </>
  )
}
