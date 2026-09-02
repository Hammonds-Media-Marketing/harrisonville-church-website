import { Fragment } from 'react'
import type { Metadata } from 'next'
import { copyMetadata, pageCopy } from '@/lib/page-copy'
import { JsonLd, breadcrumbSchema, webPageSchema } from '@/lib/jsonld'
import { Container, Section } from '@/components/primitives/Layout'

const PATH = '/cookie-policy'

export async function generateMetadata(): Promise<Metadata> {
  return copyMetadata(PATH)
}

const breadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'Cookie Policy', path: PATH },
]

const STORAGE_KINDS = ['body.stores.1', 'body.stores.2', 'body.stores.3']

const SECTIONS = [
  { title: 'body.ads.title', paragraphs: ['body.ads.p1'] },
  { title: 'body.control.title', paragraphs: ['body.control.p1'] },
  { title: 'body.more.title', paragraphs: ['body.more.p1'] },
]

export default async function CookiePolicyPage() {
  const copy = await pageCopy(PATH)

  return (
    <>
      <JsonLd
        data={[
          webPageSchema({ name: 'Cookie Usage Policy', description: copy.s('seo.description'), path: PATH }),
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

          <h2 className="text-2xl">{copy.t('body.stores.title')}</h2>
          <p>{copy.t('body.stores.lead')}</p>
          <ul className="flex flex-col gap-3">
            {STORAGE_KINDS.map((key) => (
              <li key={key}>{copy.t(key)}</li>
            ))}
          </ul>

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
