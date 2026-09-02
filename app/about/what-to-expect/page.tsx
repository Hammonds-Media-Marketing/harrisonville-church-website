import type { Metadata } from 'next'
import { copyMetadata, pageCopy } from '@/lib/page-copy'
import { JsonLd, breadcrumbSchema, faqSchema, webPageSchema } from '@/lib/jsonld'
import { Container, Section, SectionHeading } from '@/components/primitives/Layout'
import { Surface } from '@/components/primitives/Surface'
import { Button } from '@/components/primitives/Button'
import { Faq } from '@/components/blocks/Faq'
import { PageHero } from '@/components/blocks/PageHero'
import { ParkingAerial } from '@/components/blocks/ParkingAerial'
import { ServiceOrderTabs, type ServiceOrder } from '@/components/blocks/ServiceOrderTabs'
import { CheckIcon } from '@/components/ui/icons'
import { site } from '@/lib/site'

const PATH = '/about/what-to-expect'

export async function generateMetadata(): Promise<Metadata> {
  return copyMetadata(PATH)
}

const breadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'What to Expect', path: PATH },
]

/**
 * The shape of a Sunday: which acts of worship each service includes, and the
 * running order of each one. This is structure rather than copy — the words
 * describing each act live in the page's copy spec, and both sides look them
 * up by the same key, so renaming an act in the editor keeps the tabs correct.
 */
const ACT_KEYS = ['prayer', 'singing', 'teaching', 'communion', 'collection'] as const

const SERVICE_ORDERS: (Omit<ServiceOrder, 'actTitles'> & { acts: (typeof ACT_KEYS)[number][] })[] = [
  {
    id: 'sunday-morning',
    tabLabel: 'Sunday Morning',
    time: '10:00 AM',
    phases: [
      { label: 'Welcome & opening', items: ['Announcements', 'Opening prayer'] },
      { label: 'Congregational singing', items: ['Song service', 'Prayer', 'Song'] },
      { label: 'Communion & collection', items: ['Communion', 'Collection'] },
      { label: 'Teaching & invitation', items: ['Lesson', 'Invitation'] },
      { label: 'Closing', items: ['Closing announcements', 'Closing song', 'Dismissal prayer'] },
    ],
    acts: ['prayer', 'singing', 'teaching', 'communion', 'collection'],
  },
  {
    id: 'sunday-afternoon',
    tabLabel: 'Sunday Afternoon',
    time: '2:00 PM',
    phases: [
      { label: 'Welcome & opening', items: ['Announcements', 'Opening prayer'] },
      { label: 'Congregational singing', items: ['Song service', 'Prayer', 'Song'] },
      { label: 'Teaching & invitation', items: ['Lesson', 'Invitation'] },
      { label: 'Closing', items: ['Closing announcements', 'Closing prayer'] },
    ],
    acts: ['prayer', 'singing', 'teaching'],
  },
  {
    id: 'wednesday-evening',
    tabLabel: 'Wednesday Evening',
    time: '7:00 PM',
    note: 'On the third Wednesday of each month, the evening service is devoted to singing and prayer instead.',
    phases: [
      { label: 'Welcome & opening', items: ['Announcements', 'Opening prayer'] },
      { label: 'Congregational singing', items: ['Song service', 'Prayer', 'Song'] },
      { label: 'Teaching & invitation', items: ['Lesson', 'Invitation'] },
      { label: 'Closing', items: ['Closing announcements', 'Closing prayer'] },
    ],
    acts: ['prayer', 'singing', 'teaching'],
  },
  {
    id: 'third-wednesday',
    tabLabel: 'Third Wednesday',
    time: '7:00 PM',
    note: 'On the third Wednesday of each month, the evening service is devoted to singing and prayer.',
    phases: [
      { label: 'Welcome & opening', items: ['Announcements', 'Opening prayer'] },
      { label: 'Singing & prayer', items: ['Songs and prayers, alternating through the evening'] },
      { label: 'Closing', items: ['Closing announcements', 'Closing song', 'Dismissal prayer'] },
    ],
    acts: ['prayer', 'singing'],
  },
]

const PROMISES = [1, 2, 3, 4] as const
const STEPS = [1, 2, 3, 4] as const
const FAQ_ITEMS = [1, 2, 3, 4] as const

export default async function WhatToExpectPage() {
  const copy = await pageCopy(PATH)

  const actTitle = (key: string) => copy.s(`worship.act.${key}.title`)
  const worshipActs = ACT_KEYS.map((key) => ({
    title: actTitle(key),
    body: copy.s(`worship.act.${key}.body`),
    copyKeys: { title: `worship.act.${key}.title`, body: `worship.act.${key}.body` },
  }))
  const serviceOrders: ServiceOrder[] = SERVICE_ORDERS.map(({ acts, ...order }) => ({
    ...order,
    actTitles: acts.map(actTitle),
  }))
  const faqs = FAQ_ITEMS.map((n) => ({
    question: copy.s(`faq.${n}.question`),
    answer: copy.s(`faq.${n}.answer`),
    copyKeys: { question: `faq.${n}.question`, answer: `faq.${n}.answer` },
  }))

  return (
    <>
      <JsonLd
        data={[
          webPageSchema({ name: 'What to Expect', description: copy.s('seo.description'), path: PATH }),
          breadcrumbSchema(breadcrumbs),
          faqSchema(faqs),
        ]}
      />

      <PageHero
        eyebrow={copy.t('hero.eyebrow')}
        title={copy.t('hero.title')}
        lead={copy.t('hero.lead')}
        photo={{ src: copy.s('hero.photo'), alt: copy.s('hero.photoAlt') }}
      />

      {/* Reassurance */}
      <Section tone="light">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <div>
              <h2 className="text-2xl">{copy.t('promise.title')}</h2>
              <p className="mt-2 text-muted">{copy.t('promise.lead')}</p>
              <ul className="mt-5 flex flex-col gap-3">
                {PROMISES.map((n) => (
                  <li key={n} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-success text-on-status">
                      <CheckIcon className="h-4 w-4" />
                    </span>
                    <span className="text-ink">{copy.t(`promise.${n}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Surface tone="panel" className="flex flex-col gap-3">
              <h2 className="text-2xl">{copy.t('times.title')}</h2>
              <ul className="flex flex-col gap-3">
                {site.services.map((s) => (
                  <li key={s.id} className="flex items-baseline justify-between gap-4 border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <span className="font-display text-xl text-heading">{s.label}</span>
                    <span className="whitespace-nowrap font-semibold text-primary-strong">{s.timeDisplay}</span>
                  </li>
                ))}
              </ul>
              <p className="text-muted">
                {site.address.street}, {site.address.city}, {site.address.region} {site.address.postalCode}
              </p>
            </Surface>
          </div>
        </Container>
      </Section>

      {/* Step-by-step — cards pin below the header and stack as you scroll,
          each new step sliding over the last with the earlier card edges
          peeking out above. Pure CSS sticky; no scripting needed. */}
      <Section tone="surface">
        <Container>
          <SectionHeading eyebrow={copy.t('steps.eyebrow')} title={copy.t('steps.title')} />
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <figure className="lg:sticky lg:top-24">
              <ParkingAerial />
              <figcaption className="mt-2 text-sm text-muted">{copy.t('steps.caption')}</figcaption>
            </figure>
            <ol className="flex flex-col gap-4">
              {STEPS.map((n, i) => (
                <li key={n} className="sticky" style={{ top: `calc(6rem + ${i * 0.75}rem)` }}>
                  <Surface tone="card" className="flex flex-col gap-2">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-strong">
                      Step {n} of {STEPS.length}
                    </p>
                    <h3 className="text-xl">{copy.t(`steps.${n}.title`)}</h3>
                    <p className="text-ink">{copy.t(`steps.${n}.body`)}</p>
                  </Surface>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      {/* Worship, explained — order of service and the meaning of each part,
          selected by service time. All panels are in the served HTML; tabs
          only toggle visibility. */}
      <Section tone="light">
        <Container>
          <SectionHeading
            eyebrow={copy.t('worship.eyebrow')}
            title={copy.t('worship.title')}
            lead={copy.t('worship.lead')}
          />
          <ServiceOrderTabs orders={serviceOrders} acts={worshipActs} actsIntro={copy.t('worship.actsIntro')} />
          <p className="mt-6 max-w-prose text-muted">{copy.t('worship.closing')}</p>
        </Container>
      </Section>

      {/* FAQ */}
      <Section tone="surface">
        <Container prose>
          <SectionHeading align="center" eyebrow={copy.t('faq.eyebrow')} title={copy.t('faq.title')} />
          <Faq items={faqs} />
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
