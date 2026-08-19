import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo'
import { JsonLd, breadcrumbSchema, webPageSchema } from '@/lib/jsonld'
import { Container, Eyebrow, Section, SectionHeading } from '@/components/primitives/Layout'
import { Surface } from '@/components/primitives/Surface'
import { Button } from '@/components/primitives/Button'
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs'
import { CardLink } from '@/components/blocks/cards'
import { PRIMARY_CTA } from '@/lib/site'

export const dynamic = 'force-static'

export const metadata: Metadata = buildMetadata({
  title: 'Who We Are',
  description:
    'The Harrisonville Church of Christ follows the New Testament alone as its guide for worship and teaching. Learn what we believe and why, in plain language.',
  path: '/about',
  ogTitle: 'New Testament Christians in Harrisonville, Missouri',
  ogDescription:
    'No creed but the Bible. See how letting Scripture answer every question shapes the way this congregation worships and teaches.',
  ogImage: '/assets/og/og-about.jpg',
  ogImageAlt: 'Two members of the congregation follow along in an open book together in the pews',
})

const breadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
]

const pillars = [
  {
    q: 'Why do we say "no creed but the Bible"?',
    a: 'A creed is a written statement of belief that a church binds on its members. We do not bind any creed beyond Scripture itself. The reason is simple: a creed can be wrong, and it places a human document between a person and the Word of God. When every belief must be shown in the New Testament, you can check it for yourself.',
  },
  {
    q: 'What does restoring the first-century church mean?',
    a: 'Rather than build on centuries of added tradition, we look back to the church as the New Testament describes it and try to be that same kind of congregation: the same worship, the same plan of salvation, the same simple organization. It is less about being old-fashioned and more about going back to the source.',
  },
  {
    q: 'How do we decide what is right in worship?',
    a: 'We ask what the New Testament shows the first Christians doing, and we follow that pattern. Where Scripture is clear, we hold to it. Where it is silent, we are cautious about adding. That single habit explains most of what a visitor will notice on a Sunday morning.',
  },
]

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageSchema({ name: 'Who We Are', description: metadata.description as string, path: '/about' }),
          breadcrumbSchema(breadcrumbs),
        ]}
      />

      <Section tone="surface">
        <Container>
          <Breadcrumbs crumbs={breadcrumbs} />
          <SectionHeading
            as="h1"
            eyebrow="About the congregation"
            title="A church with one authority: the Bible"
            lead="We are a group of Christians in Harrisonville, Missouri, dedicated to worshiping God, honoring the Lord Jesus Christ, and growing together in the understanding of the Bible."
          />
        </Container>
      </Section>

      {/* Welcome — written by the congregation's evangelist */}
      <Section tone="light">
        <Container prose>
          <h2 className="text-2xl">A welcome from the congregation</h2>
          <p>
            We are the Harrisonville church of Christ, a community of Christians in Harrisonville, Missouri devoted to
            following true Christianity as revealed in the New Testament Scriptures. We believe that Jesus Christ is
            the only Savior and hope for the world, and it is our passion to share His Gospel locally and abroad.
          </p>
          <p>
            We are committed to speaking where the Bible speaks and being silent where the Bible is silent (1 Peter
            4:11). We are not ashamed of the Gospel of Christ, for it is the power of God unto salvation to everyone
            who believes (Romans 1:16). We believe God has revealed His will through the New Testament, and we seek to
            answer all questions regarding salvation, the church, and worship by that inspired Word. In all things, we
            give precedence to Holy Scripture as inspired and inerrant, above every preference, creed, and tradition
            of man, resting on our belief that God&rsquo;s Word contains &ldquo;all things that pertain to life and
            godliness&rdquo; (2 Peter 1:3).
          </p>
          <p>
            Coming from many different backgrounds and walks of life, we come together as God&rsquo;s spiritual
            family. We strive to serve God, encourage one another, and love our neighbors in an atmosphere of
            kindness, support, and spiritual growth.
          </p>
          <figure className="my-6">
            <Image
              src="/assets/photos/singing-in-the-pews.jpg"
              alt="An older and a younger member of the congregation lean over an open book together across the pews"
              width={1000}
              height={1500}
              loading="lazy"
              sizes="(max-width: 768px) 100vw, 28rem"
              className="mx-auto h-auto w-full max-w-md rounded-xl"
            />
            <figcaption className="mt-2 text-center text-sm text-muted">
              Studying and singing together across the pews.
            </figcaption>
          </figure>
          <p>
            The Harrisonville church of Christ is made up of people of all ages and life stages, united by faith in
            Jesus Christ and love for one another (Ephesians 4:11&ndash;15). <strong>But we are missing&mdash;you.</strong> We
            invite you to <Link href="/about/what-to-expect">join us for worship</Link>, or to{' '}
            <Link href="/contact">let us know how we can serve you</Link> in your spiritual journey.
          </p>

          <h2 className="mt-7 text-2xl">What kind of church is this?</h2>
          <p>
            A Church of Christ is a local congregation that aims to follow the New Testament pattern for the church
            without later additions. There is no headquarters, no denominational hierarchy, and no central office that
            sets policy. Each congregation governs itself under the oversight of its own elders, who are members chosen
            to shepherd the group according to the qualifications Scripture describes.
          </p>
          <p>
            That independence is intentional. It keeps the focus on the Bible rather than on the decisions of a distant
            board. When you ask us why we do something, the honest answer is always meant to be a passage, not a
            tradition.
          </p>
        </Container>
      </Section>

      <Section tone="surface">
        <Container>
          <SectionHeading
            align="center"
            eyebrow="What holds us together"
            title="Three convictions that shape everything"
          />
          <div className="grid gap-5 md:grid-cols-3">
            {pillars.map((p) => (
              <Surface key={p.q} tone="card" className="flex flex-col gap-3">
                <h3 className="text-xl">{p.q}</h3>
                <p className="text-ink">{p.a}</p>
              </Surface>
            ))}
          </div>
        </Container>
      </Section>

      {/* Internal links to the deeper pages */}
      <Section tone="light">
        <Container>
          <div className="grid gap-5 md:grid-cols-2">
            <Surface tone="panel" className="flex flex-col gap-2">
              <Eyebrow>For visitors</Eyebrow>
              <h3 className="text-xl">What to expect on a first visit</h3>
              <p className="text-ink">A walkthrough of a Sunday morning, so nothing catches you off guard.</p>
              <CardLink href="/about/what-to-expect">See what to expect</CardLink>
            </Surface>
            <Surface tone="panel" className="flex flex-col gap-2">
              <Eyebrow>The people</Eyebrow>
              <h3 className="text-xl">Meet the leadership</h3>
              <p className="text-ink">The men who teach, shepherd, and serve this congregation.</p>
              <CardLink href="/about/leadership">Meet the leaders</CardLink>
            </Surface>
          </div>
        </Container>
      </Section>

      <Section tone="deep">
        <Container className="flex flex-col items-center gap-5 text-center">
          <h2 className="text-3xl text-on-deep">Come see for yourself</h2>
          <p className="max-w-xl text-lg text-on-deep-muted">
            The best way to understand a congregation is to sit with it. You are welcome any Sunday, with no pressure
            and no spotlight.
          </p>
          <Button href={PRIMARY_CTA.href} variant="primary" size="lg">
            {PRIMARY_CTA.label}
          </Button>
        </Container>
      </Section>
    </>
  )
}
