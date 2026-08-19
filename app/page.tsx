import type { Metadata } from 'next'
import Image from 'next/image'
import { buildMetadata } from '@/lib/seo'
import { JsonLd, webPageSchema } from '@/lib/jsonld'
import { PRIMARY_CTA, site } from '@/lib/site'
import { Container, Eyebrow, Section, SectionHeading } from '@/components/primitives/Layout'
import { Button } from '@/components/primitives/Button'
import { Surface } from '@/components/primitives/Surface'
import { Wave } from '@/components/decor/Wave'
import { SampleNotice } from '@/components/blocks/SampleNotice'
import { LighthouseScene } from '@/components/hero/LighthouseScene'
import { SermonCard, CardLink } from '@/components/blocks/cards'
import { BookIcon, CheckIcon, ClockIcon, MapPinIcon } from '@/components/ui/icons'
import { recentSermons } from '@/content/sermons'

export const dynamic = 'force-static'

export const metadata: Metadata = buildMetadata({
  title: 'Harrisonville Church of Christ | Bible-Based Worship',
  rawTitle: true,
  description:
    'Harrisonville Church of Christ welcomes Cass County to simple, Scripture-based worship and open Bible study. Visit with no pressure. No creed but the Bible.',
  path: '/',
  ogTitle: 'A Welcoming Church Home on Outlook Drive',
  ogDescription:
    'Come as you are, sit, and observe. Worship rooted in the New Testament, with plain answers to honest questions about faith.',
  ogImage: '/assets/og/og-home.jpg',
  ogImageAlt: 'The Harrisonville Church of Christ congregation gathered at the front of the auditorium',
})

const reassurances = [
  {
    title: 'Worship stays simple',
    body: 'Singing, prayer, the Lord’s Supper, and a sermon from the Bible, in the pattern the New Testament describes.',
  },
  {
    title: 'You are never put on the spot',
    body: 'Visitors are guests. No one will ask you to stand, speak, raise a hand, or give. Come and simply observe.',
  },
  {
    title: 'Every belief is open to the Book',
    body: 'Ask anything. We will open the New Testament and show you the reasoning, rather than hand you an opinion.',
  },
]

export default function HomePage() {
  const sermons = recentSermons().slice(0, 3)

  return (
    <>
      <JsonLd data={[webPageSchema({ name: site.name, description: site.description, path: '/' })]} />

      {/* ---------------------------------------------------------------- Hero */}
      <section
        aria-labelledby="hero-heading"
        className="relative overflow-hidden text-ink"
        style={{ background: 'var(--gradient-hero-sky)' }}
      >
        <div className="mx-auto grid max-w-container items-center gap-6 px-5 pb-9 pt-8 md:pb-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col gap-5">
            <Eyebrow marks={false}>Harrisonville Church of Christ &middot; On Outlook Drive</Eyebrow>
            <h1 id="hero-heading" className="text-4xl md:text-5xl">
              A steady light for people seeking something real.
            </h1>
            <p className="max-w-xl text-lg text-muted">
              We are New Testament Christians in Harrisonville, gathered around simple worship and an open Bible. If
              you are tired of noise and unsure who to trust, you are welcome here. Come, sit, and see for yourself.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button href={PRIMARY_CTA.href} size="lg">
                {PRIMARY_CTA.label}
              </Button>
              <Button href="/resources/bible-study" variant="secondary" size="lg">
                Start a Free Bible Study
              </Button>
            </div>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-ink">
              <span className="inline-flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-primary-strong" />
                Sundays 10:00 AM &amp; 2:00 PM, Wednesdays 7:00 PM
              </span>
            </p>
          </div>

          {/* Interactive lighthouse — the beam follows the cursor on desktop
              and swings with scroll position on touch screens. */}
          <div className="relative mx-auto aspect-square w-full max-w-md lg:max-w-none">
            <LighthouseScene />
          </div>
        </div>
        <Wave fill="var(--color-bg)" />
      </section>

      {/* ------------------------------------------------------------ Welcome */}
      <Section tone="light" ariaLabelledby="welcome-heading">
        <Container>
          <SectionHeading
            id="welcome-heading"
            eyebrow="You are welcome here"
            title="Walking into a new church should not feel like a risk"
            lead="Many people who visit have questions they were never allowed to ask. Here, every question is welcome, and every visitor is treated as a guest."
          />
          <figure className="mb-7 overflow-hidden rounded-xl">
            <Image
              src="/assets/photos/congregation-outlook-drive.jpg"
              alt="The Harrisonville Church of Christ congregation, several generations together at the front of the auditorium beneath the wooden cross"
              width={1600}
              height={900}
              loading="lazy"
              sizes="(max-width: 1160px) 100vw, 1100px"
              className="h-auto w-full object-cover"
            />
            <figcaption className="mt-2 text-sm text-muted">
              The congregation, gathered in the auditorium on Outlook Drive.
            </figcaption>
          </figure>
          <div className="grid gap-5 md:grid-cols-3">
            {reassurances.map((r) => (
              <Surface key={r.title} tone="card" className="flex flex-col gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-surface text-primary-strong">
                  <CheckIcon className="h-6 w-6" />
                </span>
                <h3 className="text-xl">{r.title}</h3>
                <p className="text-ink">{r.body}</p>
              </Surface>
            ))}
          </div>
          <p className="mt-6">
            <CardLink href="/about/what-to-expect">See exactly what a first visit looks like</CardLink>
          </p>
        </Container>
      </Section>

      {/* ------------------------------------------------- Service times band */}
      <Section tone="deep" ariaLabelledby="visit-heading">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="flex flex-col gap-4">
              <SectionHeading
                id="visit-heading"
                onDeep
                eyebrow="Plan your visit"
                title="When and where we gather"
                lead="There is parking at the building. Come a few minutes early, and a member near the door will help you find your way."
              />
              <Button href={PRIMARY_CTA.href} variant="primary" className="w-fit">
                {PRIMARY_CTA.label}
              </Button>
            </div>
            <Surface tone="deep" className="flex flex-col gap-4">
              <ul className="flex flex-col gap-3">
                {site.services.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-4 border-b border-on-deep-muted/20 pb-3 last:border-0 last:pb-0">
                    <span className="font-display text-xl text-on-deep">{s.label}</span>
                    <span className="font-semibold text-secondary">
                      {s.day}, {s.timeDisplay}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="flex items-start gap-2 text-on-deep-muted">
                <MapPinIcon className="mt-0.5 h-5 w-5 text-secondary" />
                <span>
                  {site.address.street}, {site.address.city}, {site.address.region} {site.address.postalCode}
                </span>
              </p>
            </Surface>
          </div>
        </Container>
      </Section>

      {/* ----------------------------------------------------------- Beliefs */}
      <Section tone="surface" ariaLabelledby="beliefs-heading">
        <Container>
          <SectionHeading
            id="beliefs-heading"
            align="center"
            eyebrow="Simply Christians"
            title="A church family with open hearts and open doors"
            lead="We are a Christ-centered church family in Harrisonville, Missouri. If you have been thinking, praying, searching, or hoping for a place to belong, there is a home awaiting you here in God's family."
          />
          <div className="mx-auto flex max-w-2xl flex-col gap-4 text-center text-lg text-ink">
            <p>
              Every person, whatever their background or walk of life, has been created in the image of God and
              possesses an everlasting soul. It is our desire to share the joy of living a life in service to the
              Lord Jesus Christ with anyone who is willing.
            </p>
            <p>
              Our spiritual family has open hearts and open hands. You are always welcome to visit during any of our
              public worship services. Come on in and see for yourself.
            </p>
          </div>
          <p className="mt-6 text-center">
            <CardLink href="/about">Learn who we are</CardLink>
          </p>
        </Container>
      </Section>

      {/* ------------------------------------------------- Bible study course */}
      <Section tone="light" ariaLabelledby="course-heading">
        <Container>
          <Surface tone="panel" className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-strong text-on-primary">
                <BookIcon className="h-6 w-6" />
              </span>
              <div>
                <h2 id="course-heading" className="text-2xl">Study the Gospel at your own pace</h2>
                <p className="mt-1 max-w-2xl text-ink">
                  A free, self-paced course that walks through the New Testament from the beginning. No cost, no
                  obligation, and no need to attend anything to start.
                </p>
              </div>
            </div>
            <Button href="/resources/bible-study" className="shrink-0">
              Begin the course
            </Button>
          </Surface>
        </Container>
      </Section>

      {/* ----------------------------------------------------------- Sermons */}
      <Section tone="surface" ariaLabelledby="sermons-heading">
        <Container>
          <div className="mb-6 flex items-end justify-between gap-4">
            <SectionHeading id="sermons-heading" eyebrow="Watch and listen" title="Recent lessons" />
            <CardLink href="/resources/sermons">All sermons</CardLink>
          </div>
          <SampleNotice label="These sermons are placeholders." />
          <div className="grid gap-5 md:grid-cols-3">
            {sermons.map((s) => (
              <SermonCard key={s.slug} sermon={s} />
            ))}
          </div>
        </Container>
      </Section>

      {/* ----------------------------------------------------------- Final CTA */}
      <Section tone="deep">
        <Container className="flex flex-col items-center gap-5 text-center">
          <h2 className="text-3xl text-on-deep">There is a seat for you this Sunday</h2>
          <p className="max-w-xl text-lg text-on-deep-muted">
            Bring your questions and your doubts. You will find a congregation that takes the Bible seriously and
            takes you seriously too.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button href={PRIMARY_CTA.href} variant="primary" size="lg">
              {PRIMARY_CTA.label}
            </Button>
            <Button href="/contact" variant="ghost" size="lg" className="border-on-deep-muted/50 text-on-deep hover:bg-surface-deep-2">
              Contact us
            </Button>
          </div>
        </Container>
      </Section>
    </>
  )
}
