import type { Metadata } from 'next'
import Image from 'next/image'
import { buildMetadata } from '@/lib/seo'
import { JsonLd, breadcrumbSchema, faqSchema, webPageSchema } from '@/lib/jsonld'
import { Container, Section, SectionHeading } from '@/components/primitives/Layout'
import { Surface } from '@/components/primitives/Surface'
import { Button } from '@/components/primitives/Button'
import { Faq } from '@/components/blocks/Faq'
import { PageHero } from '@/components/blocks/PageHero'
import { ServiceOrderTabs, type ServiceOrder } from '@/components/blocks/ServiceOrderTabs'
import { CheckIcon } from '@/components/ui/icons'
import { visitFaqs } from '@/content/faqs'
import { site } from '@/lib/site'

export const dynamic = 'force-static'

export const metadata: Metadata = buildMetadata({
  title: 'What to Expect on a Visit',
  description:
    'A plain walkthrough of a Sunday at the Harrisonville Church of Christ: where to park, what worship includes, and why you are never put on the spot.',
  path: '/about/what-to-expect',
  ogTitle: 'Your First Visit, With No Surprises',
  ogDescription:
    'Parking, timing, what a service includes, and what will never happen to you as a guest. Everything you need to walk in at ease.',
  ogImage: '/assets/og/og-what-to-expect.jpg',
  ogImageAlt: 'Two members shake hands by the front door of the church building',
})

const breadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'What to Expect', path: '/about/what-to-expect' },
]

const steps = [
  {
    title: 'Arriving and parking',
    body: 'Parking is accessed from 2 Highway, at the corner of 2 Highway and Outlook Drive. Come a few minutes early if you can. Someone near the entrance will greet you when you arrive.',
  },
  {
    title: 'Finding a seat',
    body: 'Sit anywhere. There are no reserved sections and no expectation about where guests sit.',
  },
  {
    title: 'The worship itself',
    body: 'Sunday morning worship lasts about 75 to 90 minutes. It includes congregational singing, prayers, the Lord’s Supper, a sermon from the Bible, and a collection that is for members. As a guest, you simply observe.',
  },
  {
    title: 'After the service',
    body: 'When the assembly ends, members are glad to visit with one another. We encourage you to stay, visit with us, and ask any question on your mind.',
  },
]

/* Worship explanations written by the congregation's evangelist. */
const worshipActs = [
  {
    title: 'Prayer',
    body: 'Prayer is God’s appointed means of praising Him, giving thanks, interceding for others, and seeking His guidance (Philippians 4:6; Matthew 6:9–13; 1 Timothy 2:8).',
  },
  {
    title: 'Singing',
    body: 'We are instructed to “sing and make melody in your heart to the Lord” (Ephesians 5:19; Colossians 3:16). In our assemblies, the whole congregation joins together in vocal praise to God.',
  },
  {
    title: 'Teaching',
    body: 'Each service includes “the public reading of Scripture, exhortation, and teaching” (1 Timothy 4:13). This is done in an orderly manner (1 Corinthians 14:40), with the goal of instruction, encouragement, and spiritual growth.',
  },
  {
    title: 'Communion',
    body: 'Each Sunday morning the members of the congregation partake of the Lord’s Supper, following the pattern Christ gave on the night He was betrayed (1 Corinthians 11:23–26; Matthew 26:26–29). As a visitor, you are not obligated to participate.',
  },
  {
    title: 'Collection',
    body: 'The New Testament church is supported by the free-will offerings of its members. On the first day of every week, each member lays by in store as they have been prospered (1 Corinthians 16:1–2). This act of giving is for members of the congregation and is not a solicitation of visitors.',
  },
]

const serviceOrders: ServiceOrder[] = [
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
    actTitles: ['Prayer', 'Singing', 'Teaching', 'Communion', 'Collection'],
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
    actTitles: ['Prayer', 'Singing', 'Teaching'],
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
    actTitles: ['Prayer', 'Singing', 'Teaching'],
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
    actTitles: ['Prayer', 'Singing'],
  },
]

const wontHappen = [
  'You will not be asked to stand up or introduce yourself.',
  'You will not be singled out as a visitor in front of the room.',
  'You will not be expected to give.',
  'You will not be put on the spot.',
]

export default function WhatToExpectPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageSchema({ name: 'What to Expect', description: metadata.description as string, path: '/about/what-to-expect' }),
          breadcrumbSchema(breadcrumbs),
          faqSchema(visitFaqs),
        ]}
      />

      <PageHero
        eyebrow="Planning your visit"
        title="What a first visit actually looks like"
        lead="The fear of the unknown keeps a lot of good people standing at the door. Here is exactly what happens on a Sunday, so you can walk in already knowing what to expect."
        photo={{
          src: '/assets/photos/singing-in-the-pews.jpg',
          alt: 'An older and a younger member of the congregation lean over an open book together across the pews',
        }}
      />

      {/* Reassurance */}
      <Section tone="light">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <div>
              <h2 className="text-2xl">What will never happen to you here</h2>
              <p className="mt-2 text-muted">
                For many people, the real worry is being embarrassed. We take that seriously, so here is our promise.
              </p>
              <ul className="mt-5 flex flex-col gap-3">
                {wontHappen.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-success text-on-status">
                      <CheckIcon className="h-4 w-4" />
                    </span>
                    <span className="text-ink">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Surface tone="panel" className="flex flex-col gap-3">
              <h2 className="text-2xl">When to come</h2>
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
          <SectionHeading eyebrow="Step by step" title="Walking through a Sunday morning" />
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <figure className="lg:sticky lg:top-24">
              <Image
                src="/assets/photos/welcome-handshake.jpg"
                alt="A member welcomes a visitor with a handshake just inside the front door of the building"
                width={1000}
                height={1500}
                loading="lazy"
                sizes="(max-width: 1024px) 100vw, 38vw"
                className="photo-grade h-auto w-full rounded-xl"
              />
              <figcaption className="mt-2 text-sm text-muted">
                A welcome at the door is as formal as it gets.
              </figcaption>
            </figure>
            <ol className="flex flex-col gap-4">
              {steps.map((step, i) => (
                <li key={step.title} className="sticky" style={{ top: `calc(6rem + ${i * 0.75}rem)` }}>
                  <Surface tone="card" className="flex flex-col gap-2">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-strong">
                      Step {i + 1} of {steps.length}
                    </p>
                    <h3 className="text-xl">{step.title}</h3>
                    <p className="text-ink">{step.body}</p>
                  </Surface>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      {/* Worship, explained — order of service and the meaning of each part,
          selected by service time (modeled on the Valley Parkway build). All
          three panels are in the served HTML; tabs only toggle visibility. */}
      <Section tone="light">
        <Container>
          <SectionHeading
            eyebrow="A walk through worship"
            title="What happens during a worship service?"
            lead="Our worship is a time to glorify God and encourage one another. Select a service time to see the order it follows and what each part of worship means."
          />
          <ServiceOrderTabs
            orders={serviceOrders}
            acts={worshipActs}
            actsIntro="We encourage you to worship with us. If any part is unfamiliar, there is no pressure to participate."
          />
          <p className="mt-6 max-w-prose text-muted">
            We invite you to join with us and experience the joy of worshiping our Creator in spirit and truth (John
            4:24).
          </p>
        </Container>
      </Section>

      {/* FAQ */}
      <Section tone="surface">
        <Container prose>
          <SectionHeading align="center" eyebrow="Before you visit" title="Frequently Asked Questions" />
          <Faq items={visitFaqs} />
        </Container>
      </Section>

      <Section tone="deep">
        <Container className="flex flex-col items-center gap-5 text-center">
          <h2 className="text-3xl text-on-deep">Now that you know what to expect</h2>
          <p className="max-w-xl text-lg text-on-deep-muted">
            There is nothing left to be nervous about. We would love to save you a seat this Sunday.
          </p>
          <Button href="/contact#contact-form" variant="primary" size="lg">
            Let us know you are coming
          </Button>
        </Container>
      </Section>
    </>
  )
}
