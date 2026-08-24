import type { Metadata } from 'next'
import Image from 'next/image'
import { buildMetadata } from '@/lib/seo'
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

export const metadata: Metadata = buildMetadata({
  title: 'Sermons & Video Library',
  description:
    'Watch and listen to recent sermons from the Harrisonville Church of Christ. Plain lessons from the New Testament on salvation, worship, and Christian living.',
  path: '/resources/sermons',
  ogTitle: 'Recent Lessons From the Harrisonville Church of Christ',
  ogDescription: 'A growing library of sermons and videos, each grounded in a passage you can read for yourself.',
})

const breadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'Resources', path: '/resources' },
  { name: 'Sermons & Videos', path: '/resources/sermons' },
]

export default async function SermonsPage() {
  const sermons = await recentSermons()
  const featured = sermons[0]
  const rest = sermons.slice(1)

  return (
    <>
      <JsonLd
        data={[
          webPageSchema({ name: 'Sermons & Videos', description: metadata.description as string, path: '/resources/sermons' }),
          breadcrumbSchema(breadcrumbs),
        ]}
      />

      <PageHero
        eyebrow="Watch and listen"
        title="Sermon and video library"
        lead="Every lesson is built on a passage of Scripture, so you can open your Bible and follow along or study further on your own."
      />

      <Section tone="light">
        <Container>
          <SampleNotice label="These recordings are placeholders; real video will be connected later." />

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
                <Badge tone="gold" className="w-fit">Latest lesson</Badge>
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
            <p className="text-muted">Prefer to study a topic with someone directly?</p>
            <Button href="/contact#request-bible-study">Request a Bible study</Button>
          </div>
        </Container>
      </Section>
    </>
  )
}
