import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { JsonLd, breadcrumbSchema, courseSchema, webPageSchema } from '@/lib/jsonld'
import { Container, Section, SectionHeading } from '@/components/primitives/Layout'
import { Surface } from '@/components/primitives/Surface'
import { Button } from '@/components/primitives/Button'
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs'
import { bibleCourse, bibleLessons } from '@/content/bible-study'

export const dynamic = 'force-static'

export const metadata: Metadata = buildMetadata({
  title: 'Free Bible Study Course',
  description:
    'A free, self-paced Bible study from the Harrisonville Church of Christ. Six lessons walk through the Gospel from the beginning. No cost and no obligation.',
  path: '/resources/bible-study',
  ogTitle: 'The Gospel, From the Beginning: A Free Study',
  ogDescription: 'Six self-paced lessons through the New Testament. Study on your own, or ask someone to study with you.',
})

const breadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'Resources', path: '/resources' },
  { name: 'Bible Study Course', path: '/resources/bible-study' },
]

export default function BibleStudyPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageSchema({ name: 'Bible Study Course', description: metadata.description as string, path: '/resources/bible-study' }),
          breadcrumbSchema(breadcrumbs),
          courseSchema({
            name: bibleCourse.title,
            description: bibleCourse.description,
            path: '/resources/bible-study',
            lessons: bibleCourse.lessonCount,
          }),
        ]}
      />

      <Section tone="surface">
        <Container>
          <Breadcrumbs crumbs={breadcrumbs} />
          <SectionHeading
            as="h1"
            eyebrow="Free, self-paced study"
            title={bibleCourse.title}
            lead={bibleCourse.description}
          />
          <div className="flex flex-wrap gap-3">
            <Button href="/contact#request-bible-study" size="lg">
              Study with someone
            </Button>
            <Button href="#lessons" variant="ghost" size="lg">
              See the lessons
            </Button>
          </div>
        </Container>
      </Section>

      <Section tone="light" id="lessons">
        <Container>
          <SectionHeading eyebrow={`${bibleCourse.lessonCount} lessons`} title="What the course covers" />
          <ol className="flex flex-col gap-4">
            {bibleLessons.map((lesson) => (
              <li key={lesson.slug}>
                <Surface tone="card" className="flex flex-col gap-3 md:flex-row md:items-start md:gap-5">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-strong font-display text-xl text-on-primary">
                    {lesson.number}
                  </span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h2 className="text-xl">{lesson.title}</h2>
                      <span className="text-sm font-semibold text-primary-strong">{lesson.scripture}</span>
                    </div>
                    <p className="mt-1 text-ink">{lesson.summary}</p>
                    <ul className="mt-3 flex flex-col gap-1 text-muted">
                      {lesson.objectives.map((o) => (
                        <li key={o} className="flex items-start gap-2">
                          <span aria-hidden="true" className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-secondary-active" />
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Surface>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section tone="deep">
        <Container className="flex flex-col items-center gap-5 text-center">
          <h2 className="text-3xl text-on-deep">Would you rather not study alone?</h2>
          <p className="max-w-xl text-lg text-on-deep-muted">
            Request a study and a member will walk through the lessons with you, in person or over video, at whatever
            pace suits you.
          </p>
          <Button href="/contact#request-bible-study" variant="secondary" size="lg">
            Request a Bible study
          </Button>
        </Container>
      </Section>
    </>
  )
}
