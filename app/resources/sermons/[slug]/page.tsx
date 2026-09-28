import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { buildMetadata } from '@/lib/seo'
import { JsonLd, breadcrumbSchema } from '@/lib/jsonld'
import { Container, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Badge } from '@/components/primitives/Badge'
import { Button } from '@/components/primitives/Button'
import { SampleNotice } from '@/components/blocks/SampleNotice'
import { ClockIcon } from '@/components/ui/icons'
import { formatDate } from '@/lib/format'
import { videoEmbedUrl } from '@/lib/page-elements'
import { getSermon, recentSermons } from '@/lib/sermons'
import { LAUNCHED } from '@/lib/site'

export const revalidate = 3600

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const sermon = await getSermon(slug)
  if (!sermon) return { title: 'Sermon not found' }
  return buildMetadata({
    title: sermon.title,
    description: sermon.summary,
    path: `/resources/sermons/${sermon.slug}`,
    ogTitle: `${sermon.title} | ${sermon.scripture}`,
    ogDescription: `A lesson from ${sermon.speaker} at the Harrisonville Church of Christ.`,
    // Hidden from navigation and search until sermons launch (lib/site.ts).
    noindex: !LAUNCHED.sermons,
  })
}

/** Only optimize images the image loader is configured for. */
const canOptimize = (src: string) => src.startsWith('/') || /\.supabase\.co\//.test(src)

/**
 * One sermon: the video when there is one, otherwise the audio recording,
 * with the scripture, speaker, and summary beside it. A lesson with both
 * plays the video and offers the audio underneath for listening on the go.
 */
export default async function SermonPage({ params }: Params) {
  const { slug } = await params
  const sermon = await getSermon(slug)
  if (!sermon) notFound()

  const embed = sermon.videoUrl ? videoEmbedUrl(sermon.videoUrl) : null
  const audio = sermon.audioUrl

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Resources', path: '/resources' },
    { name: 'Sermons', path: '/resources/sermons' },
    { name: sermon.title, path: `/resources/sermons/${sermon.slug}` },
  ]

  return (
    <>
      <JsonLd data={[breadcrumbSchema(breadcrumbs)]} />

      <PageHero eyebrow={sermon.series ?? 'Sermon'} title={sermon.title} lead={sermon.scripture} />

      <Section tone="light">
        <Container className="max-w-4xl">
          {sermon.sample ? <SampleNotice label="This sermon is a placeholder." /> : null}

          <div className="flex flex-col gap-6">
            {embed ? (
              <div className="relative aspect-video overflow-hidden rounded-lg bg-surface-deep shadow-md">
                <iframe
                  src={embed}
                  title={`Video: ${sermon.title}`}
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  className="absolute inset-0 h-full w-full"
                />
              </div>
            ) : (
              <div className="relative aspect-video overflow-hidden rounded-lg bg-surface-deep">
                <Image
                  src={sermon.thumbnail}
                  alt={sermon.thumbnailAlt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 896px"
                  unoptimized={!canOptimize(sermon.thumbnail)}
                  className="object-cover opacity-80"
                />
              </div>
            )}

            {audio ? (
              <Surface tone="panel" className="flex flex-col gap-3">
                <h2 className="font-body text-base font-semibold text-heading">
                  {embed ? 'Listen to the audio' : 'Listen to this lesson'}
                </h2>
                <audio controls preload="metadata" src={audio} className="w-full">
                  <a href={audio}>Download the recording</a>
                </audio>
                <p className="m-0 text-sm text-muted">
                  <a href={audio} download className="font-semibold text-link hover:text-link-hover">
                    Download the MP3
                  </a>{' '}
                  to listen offline.
                </p>
              </Surface>
            ) : null}

            {!embed && !audio ? (
              <p className="rounded-lg border border-border/60 bg-surface p-5 text-muted">
                The recording for this lesson has not been posted yet.
              </p>
            ) : null}

            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                {sermon.series ? <Badge tone="gold">{sermon.series}</Badge> : null}
                <span>{sermon.speaker}</span>
                <span aria-hidden="true">&middot;</span>
                <span>{formatDate(sermon.date)}</span>
                <span aria-hidden="true">&middot;</span>
                <span className="inline-flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  {sermon.durationMinutes} min
                </span>
              </div>
              <p className="text-lg text-ink">{sermon.summary}</p>
            </div>

            <div>
              <Button href="/resources/sermons" variant="ghost">
                All sermons
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}

/** Prerender the published sermons; new ones render on demand. */
export async function generateStaticParams() {
  const sermons = await recentSermons()
  return sermons.map((s) => ({ slug: s.slug }))
}
