import type { Metadata } from 'next'
import Image from 'next/image'
import { buildMetadata } from '@/lib/seo'
import { JsonLd, breadcrumbSchema, faqSchema, webPageSchema } from '@/lib/jsonld'
import { Container, Section, SectionHeading } from '@/components/primitives/Layout'
import { Surface } from '@/components/primitives/Surface'
import { Button } from '@/components/primitives/Button'
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs'
import { Faq } from '@/components/blocks/Faq'
import { CheckIcon } from '@/components/ui/icons'
import { visitFaqs } from '@/content/faqs'
import { PRIMARY_CTA, site } from '@/lib/site'

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
    body: 'There is parking at the building on Outlook Drive. Come a few minutes early if you can. Someone near the entrance will greet you and can show you where to go, or you are welcome to find a seat on your own.',
  },
  {
    title: 'Finding a seat',
    body: 'Sit anywhere. There are no reserved sections and no expectation about where guests sit. Many visitors choose a seat toward the back for the first week, and that is completely fine.',
  },
  {
    title: 'The worship itself',
    body: 'Sunday morning worship lasts about an hour. It includes congregational singing without instruments, prayers, the Lord’s Supper, a sermon from the Bible, and a collection that is for members. As a guest, you simply observe.',
  },
  {
    title: 'After the service',
    body: 'When the assembly ends, members are glad to answer questions, but no one will corner you. You are free to slip out quietly or to stay and talk, whichever you prefer.',
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
    body: 'Each Sunday morning the members of the congregation partake of the Lord’s Supper, following the pattern Christ gave on the night He was betrayed (1 Corinthians 11:23–26; Matthew 26:26–29). The congregation shares one loaf and one cup, the bread and the fruit of the vine that Scripture ties to the one body of Christ (1 Corinthians 10:16–17), as a memorial that proclaims His death and expresses our unity. Scripture calls each participant to examine themselves and partake with reverence (1 Corinthians 11:27–29). As a guest, you are free to let the loaf and cup pass, with no notice taken.',
  },
  {
    title: 'Collection',
    body: 'The New Testament church is supported by the free-will offerings of its members. On the first day of every week, each member lays by in store as they have been prospered (1 Corinthians 16:1–2). These contributions support gospel preaching, care for needy saints, and the work of qualified servants such as elders and evangelists. This act of giving is for members of the congregation and is not a solicitation of visitors.',
  },
]

const serviceOrders = [
  {
    heading: 'Sunday 10:00 AM',
    items: [
      'Opening announcements and prayer',
      'Song service',
      'Prayer',
      'Song',
      'Communion',
      'Collection',
      'Lesson',
      'Invitation',
      'Closing announcements',
      'Closing song',
      'Dismissal prayer',
    ],
  },
  {
    heading: 'Sunday 2:00 PM and Wednesday 7:30 PM',
    items: [
      'Opening announcements and prayer',
      'Song service',
      'Prayer',
      'Song',
      'Lesson',
      'Invitation',
      'Closing announcements',
      'Closing prayer',
    ],
  },
]

const wontHappen = [
  'You will not be asked to stand up or introduce yourself.',
  'You will not be singled out as a visitor in front of the room.',
  'You will not be pressured to give money or sign anything.',
  'You will not face a public altar call or be put on the spot.',
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

      <Section tone="surface">
        <Container>
          <Breadcrumbs crumbs={breadcrumbs} />
          <SectionHeading
            as="h1"
            eyebrow="Planning your visit"
            title="What a first visit actually looks like"
            lead="The fear of the unknown keeps a lot of good people standing at the door. Here is exactly what happens on a Sunday, so you can walk in already knowing what to expect."
          />
          <div className="flex flex-wrap gap-3">
            <Button href={PRIMARY_CTA.href} size="lg">
              {PRIMARY_CTA.label}
            </Button>
            <Button href="/contact#contact-form" variant="ghost" size="lg">
              Ask a question first
            </Button>
          </div>
        </Container>
      </Section>

      {/* Reassurance */}
      <Section tone="light">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <div>
              <h2 className="text-2xl">What will never happen to you here</h2>
              <p className="mt-2 text-muted">
                For many people the real worry is being embarrassed. We take that seriously, so here is our promise.
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
                  <li key={s.id} className="flex items-center justify-between gap-4 border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <span className="font-display text-xl text-heading">{s.label}</span>
                    <span className="font-semibold text-primary-strong">
                      {s.day}, {s.timeDisplay}
                    </span>
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
                className="h-auto w-full rounded-xl"
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

      {/* Worship, explained — written by the congregation's evangelist */}
      <Section tone="light">
        <Container>
          <SectionHeading
            eyebrow="Worship, explained"
            title="What does each part of worship mean?"
            lead="Our worship services are a time for Christians to assemble together to glorify God and encourage one another (1 Corinthians 14:23), with the goal that all may learn and be strengthened in faith (1 Corinthians 14:26, 31). Here is what each part is, and the Scripture behind it."
          />
          <div className="grid gap-5 md:grid-cols-2">
            {worshipActs.map((act) => (
              <Surface key={act.title} tone="card" className="flex flex-col gap-2 md:last:col-span-2">
                <h3 className="text-xl">{act.title}</h3>
                <p className="text-ink">{act.body}</p>
              </Surface>
            ))}
          </div>
          <p className="mt-6 max-w-prose text-muted">
            We invite you to join with us and experience the joy of worshiping our Creator in spirit and truth (John
            4:24).
          </p>
        </Container>
      </Section>

      {/* Order of service */}
      <Section tone="surface">
        <Container>
          <SectionHeading
            eyebrow="A walk through worship"
            title="What order does the service follow?"
            lead="No two congregations run the clock identically, but our assemblies follow this simple order, so you can always tell where you are in the hour."
          />
          <div className="grid gap-5 md:grid-cols-2">
            {serviceOrders.map((order) => (
              <Surface key={order.heading} tone="panel" className="flex flex-col gap-3">
                <h3 className="text-xl">{order.heading}</h3>
                <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-ink marker:font-semibold marker:text-primary-strong">
                  {order.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </Surface>
            ))}
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section tone="light">
        <Container prose>
          <SectionHeading align="center" eyebrow="Common questions" title="Questions visitors ask most" />
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
