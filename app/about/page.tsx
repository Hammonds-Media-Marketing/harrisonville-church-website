import type { Metadata } from 'next'
import Image from 'next/image'
import { copyMetadata, pageCopy } from '@/lib/page-copy'
import { JsonLd, breadcrumbSchema, webPageSchema } from '@/lib/jsonld'
import { Container, Eyebrow, Section, SectionHeading } from '@/components/primitives/Layout'
import { Surface } from '@/components/primitives/Surface'
import { Button } from '@/components/primitives/Button'
import { CardLink } from '@/components/blocks/cards'
import { PageHero } from '@/components/blocks/PageHero'
import { PRIMARY_CTA } from '@/lib/site'

const PATH = '/about'

export async function generateMetadata(): Promise<Metadata> {
  return copyMetadata(PATH)
}

const breadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'About', path: PATH },
]

export default async function AboutPage() {
  const copy = await pageCopy(PATH)
  const pillars = [1, 2, 3] as const
  const panels = [1, 2] as const

  return (
    <>
      <JsonLd
        data={[
          webPageSchema({ name: 'Who We Are', description: copy.s('seo.description'), path: PATH }),
          breadcrumbSchema(breadcrumbs),
        ]}
      />

      <PageHero
        eyebrow={copy.t('hero.eyebrow')}
        title={copy.t('hero.title')}
        lead={copy.t('hero.lead')}
        photo={{ src: copy.s('hero.photo'), alt: copy.s('hero.photoAlt') }}
      />

      {/* Welcome — written by the congregation's evangelist */}
      <Section tone="light">
        <Container prose>
          <h2 className="text-2xl">{copy.t('welcome.title')}</h2>
          <p>{copy.t('welcome.p1')}</p>
          <p>{copy.t('welcome.p2')}</p>
          <p>{copy.t('welcome.p3')}</p>
          <figure className="my-6">
            <Image
              src={copy.s('welcome.photo')}
              alt={copy.s('welcome.photoAlt')}
              width={1000}
              height={1500}
              loading="lazy"
              sizes="(max-width: 768px) 100vw, 28rem"
              className="mx-auto h-auto w-full max-w-md rounded-xl"
              {...copy.mark('welcome.photo')}
            />
            <figcaption className="mt-2 text-center text-sm text-muted">{copy.t('welcome.caption')}</figcaption>
          </figure>
          <p>{copy.t('welcome.p4')}</p>

          <h2 className="mt-7 text-2xl">{copy.t('kind.title')}</h2>
          <p>{copy.t('kind.p1')}</p>
          <p>{copy.t('kind.p2')}</p>
        </Container>
      </Section>

      <Section tone="surface">
        <Container>
          <SectionHeading align="center" eyebrow={copy.t('pillars.eyebrow')} title={copy.t('pillars.title')} />
          <div className="grid gap-5 md:grid-cols-3">
            {pillars.map((n) => (
              <Surface key={n} tone="card" className="flex flex-col gap-3">
                <h3 className="text-xl">{copy.t(`pillars.${n}.q`)}</h3>
                <p className="text-ink">{copy.t(`pillars.${n}.a`)}</p>
              </Surface>
            ))}
          </div>
        </Container>
      </Section>

      {/* Internal links to the deeper pages */}
      <Section tone="light">
        <Container>
          <div className="grid gap-5 md:grid-cols-2">
            {panels.map((n) => (
              <Surface key={n} tone="panel" className="flex flex-col gap-2">
                <Eyebrow>{copy.t(`next.${n}.eyebrow`)}</Eyebrow>
                <h3 className="text-xl">{copy.t(`next.${n}.title`)}</h3>
                <p className="text-ink">{copy.t(`next.${n}.body`)}</p>
                <CardLink href={copy.s(`next.${n}.linkHref`)}>{copy.t(`next.${n}.linkLabel`)}</CardLink>
              </Surface>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="deep">
        <Container className="flex flex-col items-center gap-5 text-center">
          <h2 className="text-3xl text-on-deep">{copy.t('cta.title')}</h2>
          <p className="max-w-xl text-lg text-on-deep-muted">{copy.t('cta.body')}</p>
          <Button href={PRIMARY_CTA.href} variant="primary" size="lg">
            {PRIMARY_CTA.label}
          </Button>
        </Container>
      </Section>
    </>
  )
}
