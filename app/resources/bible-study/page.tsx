import type { Metadata } from 'next'
import Image from 'next/image'
import { copyMetadata, pageCopy } from '@/lib/page-copy'
import { JsonLd, breadcrumbSchema, courseSchema, webPageSchema } from '@/lib/jsonld'
import { Container, Section, SectionHeading } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Button } from '@/components/primitives/Button'
import { bibleCourse, bibleLessons } from '@/content/bible-study'
import { getLeader } from '@/content/leadership'

const PATH = '/resources/bible-study'

export async function generateMetadata(): Promise<Metadata> {
  return copyMetadata(PATH)
}

const breadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'Resources', path: '/resources' },
  { name: 'Bible Study Course', path: PATH },
]

export default async function BibleStudyPage() {
  const copy = await pageCopy(PATH)
  const evangelist = getLeader('isaac-moreno')
  // The online course lives on its own site; while that link is unset the
  // buttons fall back to the lesson list further down this page.
  const onlineHref = copy.s('hero.secondaryHref') || '#lessons'

  return (
    <>
      <JsonLd
        data={[
          webPageSchema({ name: 'Bible Study Course', description: copy.s('seo.description'), path: PATH }),
          breadcrumbSchema(breadcrumbs),
          courseSchema({
            name: bibleCourse.title,
            description: copy.s('hero.lead'),
            path: PATH,
            lessons: bibleCourse.lessonCount,
          }),
        ]}
      />

      <PageHero
        eyebrow={copy.t('hero.eyebrow')}
        title={copy.t('hero.title')}
        lead={copy.t('hero.lead')}
        waveFill="var(--color-surface)"
      >
        <div className="flex flex-wrap gap-3">
          <Button href={copy.s('hero.primaryHref')} size="lg">
            {copy.t('hero.primaryLabel')}
          </Button>
          <Button href={onlineHref} variant="ghost" size="lg">
            {copy.t('hero.secondaryLabel')}
          </Button>
        </div>
      </PageHero>

      {/* Two ways to take the course */}
      <Section tone="surface">
        <Container>
          <SectionHeading eyebrow={copy.t('ways.eyebrow')} title={copy.t('ways.title')} />
          <div className="grid gap-5 md:grid-cols-2">
            <Surface tone="card" className="flex flex-col gap-3">
              <h3 className="text-xl">{copy.t('ways.online.title')}</h3>
              <p className="text-ink">{copy.t('ways.online.body')}</p>
              <Button href={onlineHref} className="mt-auto w-fit">
                {copy.t('ways.online.label')}
              </Button>
            </Surface>
            <Surface tone="card" className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
              {evangelist ? (
                <Image
                  src={evangelist.photo}
                  alt={evangelist.photoAlt}
                  width={400}
                  height={400}
                  loading="lazy"
                  sizes="(max-width: 640px) 100vw, 10rem"
                  className="photo-grade h-40 w-40 shrink-0 rounded-xl object-cover object-top"
                />
              ) : null}
              <div className="flex flex-1 flex-col gap-3">
                <h3 className="text-xl">{copy.t('ways.person.title')}</h3>
                <p className="text-ink">{copy.t('ways.person.body')}</p>
                <Button href={copy.s('ways.person.href')} variant="secondary" className="mt-auto w-fit">
                  {copy.t('ways.person.label')}
                </Button>
              </div>
            </Surface>
          </div>
        </Container>
      </Section>

      <Section tone="light" id="lessons">
        <Container>
          <SectionHeading eyebrow={copy.t('lessons.eyebrow')} title={copy.t('lessons.title')} />
          <ol className="flex flex-col gap-4">
            {bibleLessons.map((lesson) => (
              <li key={lesson.slug}>
                <Surface tone="card" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                  <Image
                    src={lesson.photo}
                    alt={lesson.photoAlt}
                    width={221}
                    height={307}
                    loading="lazy"
                    sizes="(max-width: 640px) 40vw, 8rem"
                    className="w-28 shrink-0 self-start rounded-lg shadow-md sm:w-32"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-semibold uppercase tracking-wider text-primary-strong">
                      Lesson {lesson.number}
                    </span>
                    <h2 className="mt-1 text-xl">{lesson.title}</h2>
                    <p className="mt-1 text-ink">{lesson.summary}</p>
                  </div>
                </Surface>
              </li>
            ))}
          </ol>
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
