import type { Metadata } from 'next'
import { copyMetadata, pageCopy } from '@/lib/page-copy'
import { JsonLd, breadcrumbSchema, webPageSchema } from '@/lib/jsonld'
import { Container, Eyebrow, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { CardLink } from '@/components/blocks/cards'
import { BookIcon } from '@/components/ui/icons'

const PATH = '/resources'

export async function generateMetadata(): Promise<Metadata> {
  // The hub is unlinked while the sermon library is hidden; the Bible study
  // course is reached directly from the primary navigation instead.
  return copyMetadata(PATH, { noindex: true })
}

const breadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'Resources', path: PATH },
]

export default async function ResourcesPage() {
  const copy = await pageCopy(PATH)

  return (
    <>
      <JsonLd
        data={[
          webPageSchema({ name: 'Resources', description: copy.s('seo.description'), path: PATH }),
          breadcrumbSchema(breadcrumbs),
        ]}
      />
      <PageHero eyebrow={copy.t('hero.eyebrow')} title={copy.t('hero.title')} lead={copy.t('hero.lead')} />
      <Section tone="light">
        <Container>
          <div className="grid gap-5 md:grid-cols-2">
            <Surface tone="card" interactive className="flex flex-col gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-primary-strong text-on-primary">
                <BookIcon className="h-6 w-6" />
              </span>
              <Eyebrow>{copy.t('card.eyebrow')}</Eyebrow>
              <h2 className="text-xl">{copy.t('card.title')}</h2>
              <p className="flex-1 text-ink">{copy.t('card.body')}</p>
              <CardLink href={copy.s('card.linkHref')}>{copy.t('card.linkLabel')}</CardLink>
            </Surface>
          </div>
        </Container>
      </Section>
    </>
  )
}
