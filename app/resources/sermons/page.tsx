import type { Metadata } from 'next'
import Image from 'next/image'
import { copyMetadata, pageCopy } from '@/lib/page-copy'
import { JsonLd, breadcrumbSchema, webPageSchema } from '@/lib/jsonld'
import { Container, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Badge } from '@/components/primitives/Badge'
import { Button } from '@/components/primitives/Button'
import { SampleNotice } from '@/components/blocks/SampleNotice'
import { SermonCard } from '@/components/blocks/cards'
import { PlayIcon } from '@/components/ui/icons'
import { recentSermons } from '@/lib/sermons'

export const revalidate = 3600

const PATH = '/resources/sermons'

export async function generateMetadata(): Promise<Metadata> {
  // Hidden from navigation and search at the congregation's direction.
  return copyMetadata(PATH, { noindex: true })
}

const breadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'Resources', path: '/resources' },
  { name: 'Sermons & Videos', path: PATH },
]

export default async function SermonsPage() {
  const [sermons, copy] = await Promise.all([recentSermons(), pageCopy(PATH)])
  const featured = sermons[0]
  const rest = sermons.slice(1)

  return (
    <>
      <JsonLd
        data={[
          webPageSchema({ name: 'Sermons & Videos', description: copy.s('seo.description'), path: PATH }),
          breadcrumbSchema(breadcrumbs),
        ]}
      />

      <PageHero eyebrow={copy.t('hero.eyebrow')} title={copy.t('hero.title')} lead={copy.t('hero.lead')} />

      <Section tone="light">
        <Container>
          {copy.blank('library.notice') ? null : <SampleNotice label={copy.t('library.notice')} />}

          {/* Featured player */}
          {featured ? (
            <Surface tone="card" className="mb-8 grid gap-6 p-0 md:grid-cols-2">
              <div className="relative aspect-video overflow-hidden rounded-t-lg bg-surface-deep md:rounded-l-lg md:rounded-tr-none">
                <Image
                  src={featured.thumbnail}
                  alt={featured.thumbnailAlt}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover opacity-80"
                />
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-primary-strong text-on-primary">
                    <PlayIcon className="h-7 w-7" />
                  </span>
                </span>
              </div>
              <div className="flex flex-col gap-3 p-6">
                <Badge tone="gold" className="w-fit">{copy.t('library.featuredBadge')}</Badge>
                <h2 className="text-2xl">{featured.title}</h2>
                <p className="font-semibold text-primary-strong">{featured.scripture}</p>
                <p className="text-ink">{featured.summary}</p>
                <p className="text-sm text-muted">
                  {featured.speaker} &middot; {featured.durationMinutes} min
                </p>
              </div>
            </Surface>
          ) : null}

          <div className="grid gap-5 md:grid-cols-3">
            {rest.map((s) => (
              <SermonCard key={s.slug} sermon={s} />
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            <p className="text-muted">{copy.t('library.footerPrompt')}</p>
            <Button href={copy.s('library.footerHref')}>{copy.t('library.footerLabel')}</Button>
          </div>
        </Container>
      </Section>
    </>
  )
}
