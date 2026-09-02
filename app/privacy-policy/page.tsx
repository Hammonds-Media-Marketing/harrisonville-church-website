import { Fragment } from 'react'
import type { Metadata } from 'next'
import { copyMetadata, pageCopy } from '@/lib/page-copy'
import { JsonLd, breadcrumbSchema, webPageSchema } from '@/lib/jsonld'
import { Container, Section } from '@/components/primitives/Layout'

const PATH = '/privacy-policy'

export async function generateMetadata(): Promise<Metadata> {
  return copyMetadata(PATH)
}

const breadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'Privacy Policy', path: PATH },
]

/** Each section is a heading followed by its paragraphs, in reading order. */
const SECTIONS = [
  { title: 'body.collect.title', paragraphs: ['body.collect.p1', 'body.collect.p2'] },
  { title: 'body.use.title', paragraphs: ['body.use.p1'] },
  { title: 'body.processors.title', paragraphs: ['body.processors.p1'] },
  { title: 'body.retention.title', paragraphs: ['body.retention.p1'] },
  { title: 'body.choices.title', paragraphs: ['body.choices.p1'] },
  { title: 'body.contact.title', paragraphs: ['body.contact.p1'] },
]

export default async function PrivacyPolicyPage() {
  const copy = await pageCopy(PATH)

  return (
    <>
      <JsonLd
        data={[
          webPageSchema({ name: 'Privacy Policy', description: copy.s('seo.description'), path: PATH }),
          breadcrumbSchema(breadcrumbs),
        ]}
      />
      <Section tone="surface">
        <Container prose>
          <h1 className="mt-5 text-4xl">{copy.t('header.title')}</h1>
          <p className="text-muted">{copy.t('header.updated')}</p>
        </Container>
      </Section>

      <Section tone="light">
        <Container prose>
          <p>{copy.t('body.intro')}</p>
          {SECTIONS.map((section) => (
            <Fragment key={section.title}>
              <h2 className="text-2xl">{copy.t(section.title)}</h2>
              {section.paragraphs.map((key) => (
                <p key={key}>{copy.t(key)}</p>
              ))}
            </Fragment>
          ))}
        </Container>
      </Section>
    </>
  )
}
