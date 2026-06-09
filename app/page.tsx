import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo'
import { JsonLd, faqSchema, webPageSchema } from '@/lib/jsonld'
import { PRIMARY_CTA, site } from '@/lib/site'
import { Container, Eyebrow, Section, SectionHeading } from '@/components/primitives/Layout'
import { Button } from '@/components/primitives/Button'
import { Surface } from '@/components/primitives/Surface'
import { Badge } from '@/components/primitives/Badge'
import { Wave } from '@/components/decor/Wave'
import { Faq } from '@/components/blocks/Faq'
import { SampleNotice } from '@/components/blocks/SampleNotice'
import { LighthouseScene } from '@/components/hero/LighthouseScene'
import { PostCard, SermonCard, StoryCard, TestimonialCard, CardLink } from '@/components/blocks/cards'
import { BookIcon, CheckIcon, ClockIcon, MapPinIcon } from '@/components/ui/icons'
import { homeFaqs } from '@/content/faqs'
import { recentSermons } from '@/content/sermons'
import { recentPosts, getAuthor } from '@/content/blog'
import { memberStories } from '@/content/stories'
import { testimonials } from '@/content/testimonials'

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
})

const reassurances = [
  {
    title: 'Worship stays simple',
    body: 'Singing, prayer, the Lord’s Supper, and a sermon from the Bible. No production, no spectacle, nothing to perform.',
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
  const posts = recentPosts().slice(0, 3)
  const stories = memberStories.slice(0, 3)

  return (
    <>
      <JsonLd
        data={[
          webPageSchema({ name: site.name, description: site.description, path: '/' }),
          faqSchema(homeFaqs.map((f) => ({ question: f.question, answer: f.answer }))),
        ]}
      />

      {/* ---------------------------------------------------------------- Hero */}
      <section aria-labelledby="hero-heading" className="relative overflow-hidden bg-surface-deep text-on-deep">
        <div className="mx-auto grid max-w-container items-center gap-6 px-5 pb-9 pt-8 md:pb-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col gap-5">
            <Eyebrow onDeep>Harrisonville Church of Christ &middot; On Outlook Drive</Eyebrow>
            <h1 id="hero-heading" className="text-4xl text-on-deep md:text-5xl">
              A steady light for people seeking something real.
            </h1>
            <p className="max-w-xl text-lg text-on-deep-muted">
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
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-on-deep">
              <span className="inline-flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-secondary" />
                Sundays 10:00 AM &amp; 2:00 PM, Wednesdays 7:30 PM
              </span>
            </p>
          </div>

          {/* Interactive lighthouse — move your cursor to steer the beam. */}
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
            lead="Many people who visit have questions they were never allowed to ask, or a bad memory of being singled out. None of that happens here. We try to make the first step small."
          />
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
            eyebrow="No creed but the Bible"
            title="What holds this congregation together"
            lead="We let Scripture alone answer every question about God, salvation, and worship. That single commitment shapes everything we do."
          />
          <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-3">
            <Link href="/blog/how-do-i-know-which-church-is-right" className="group">
              <Surface tone="card" interactive className="h-full">
                <Badge tone="primary" className="mb-2">The Church</Badge>
                <h3 className="text-xl group-hover:text-link-hover">Restoring the first-century church</h3>
                <p className="mt-2 text-ink">We follow the pattern the New Testament shows, not later tradition.</p>
              </Surface>
            </Link>
            <Link href="/blog/why-no-instruments-in-worship" className="group">
              <Surface tone="card" interactive className="h-full">
                <Badge tone="primary" className="mb-2">Worship</Badge>
                <h3 className="text-xl group-hover:text-link-hover">Singing without instruments</h3>
                <p className="mt-2 text-ink">Voices alone, in the pattern the early church kept.</p>
              </Surface>
            </Link>
            <Link href="/blog/what-does-the-bible-say-about-baptism" className="group">
              <Surface tone="card" interactive className="h-full">
                <Badge tone="primary" className="mb-2">Salvation</Badge>
                <h3 className="text-xl group-hover:text-link-hover">Plain answers about baptism</h3>
                <p className="mt-2 text-ink">Read the passages in context and weigh them for yourself.</p>
              </Surface>
            </Link>
          </div>
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

      {/* -------------------------------------------------------------- Blog */}
      <Section tone="light" ariaLabelledby="blog-heading">
        <Container>
          <div className="mb-6 flex items-end justify-between gap-4">
            <SectionHeading id="blog-heading" eyebrow="From the blog" title="Plain answers from Scripture" />
            <CardLink href="/blog">Read the blog</CardLink>
          </div>
          <SampleNotice label="These articles are sample drafts." />
          <div className="grid gap-5 md:grid-cols-3">
            {posts.map((p) => (
              <PostCard key={p.slug} post={p} author={getAuthor(p.authorSlug)} />
            ))}
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------ Member stories */}
      <Section tone="surface" ariaLabelledby="stories-heading">
        <Container>
          <SectionHeading
            id="stories-heading"
            eyebrow="Member stories"
            title="How people found a church home here"
          />
          <SampleNotice label="These stories are placeholders pending real, consented accounts." />
          <div className="grid gap-5 md:grid-cols-3">
            {stories.map((s) => (
              <StoryCard key={s.slug} story={s} />
            ))}
          </div>
          <p className="mt-6">
            <CardLink href="/about/stories">Read more stories</CardLink>
          </p>
        </Container>
      </Section>

      {/* ------------------------------------------------------- Testimonials */}
      <Section tone="light" ariaLabelledby="reviews-heading">
        <Container>
          <SectionHeading
            id="reviews-heading"
            align="center"
            eyebrow="From the community"
            title="What neighbors say"
          />
          <SampleNotice label="Real Google reviews will replace these once supplied." />
          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <TestimonialCard key={t.id} t={t} />
            ))}
          </div>
        </Container>
      </Section>

      {/* --------------------------------------------------------------- FAQ */}
      <Section tone="surface" ariaLabelledby="faq-heading">
        <Container prose>
          <SectionHeading id="faq-heading" align="center" eyebrow="Questions" title="Questions people ask before visiting" />
          <Faq items={homeFaqs} />
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
