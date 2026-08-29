import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { buildMetadata } from '@/lib/seo'
import { JsonLd, breadcrumbSchema, profilePageSchema } from '@/lib/jsonld'
import { Container, Section } from '@/components/primitives/Layout'
import { Button } from '@/components/primitives/Button'
import { PageHero } from '@/components/blocks/PageHero'
import { getLeader, leaders } from '@/content/leadership'
import { site } from '@/lib/site'

export const dynamic = 'force-static'

type Params = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return leaders.map((l) => ({ slug: l.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const leader = getLeader(slug)
  if (!leader) return { title: 'Profile not found' }
  return buildMetadata({
    title: `${leader.name}, ${leader.role}`,
    description: leader.shortBio,
    path: `/about/leadership/${leader.slug}`,
    ogTitle: `Meet ${leader.name} of the ${site.name}`,
    ogDescription: `The story of ${leader.name} and his service to the congregation in ${site.address.city}, ${site.address.regionName}.`,
    ogImage: `/assets/og/og-${leader.slug}.jpg`,
    ogImageAlt: leader.photoAlt,
  })
}

export default async function LeaderProfilePage({ params }: Params) {
  const { slug } = await params
  const leader = getLeader(slug)
  if (!leader) notFound()

  const firstName = leader.name.split(' ')[0]
  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Leadership', path: '/about/leadership' },
    { name: leader.name, path: `/about/leadership/${leader.slug}` },
  ]

  return (
    <>
      <JsonLd
        data={[
          profilePageSchema({
            name: leader.name,
            role: leader.role,
            description: leader.shortBio,
            path: `/about/leadership/${leader.slug}`,
            image: leader.photo,
          }),
          breadcrumbSchema(breadcrumbs),
        ]}
      />

      <PageHero
        eyebrow={leader.role}
        title={leader.name}
        lead={leader.shortBio}
        portraits={[{ src: leader.photo, alt: leader.photoAlt }]}
      />

      <Section tone="light">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
            <figure className="mx-auto w-full max-w-sm lg:sticky lg:top-24">
              <Image
                src={leader.photo}
                alt={leader.photoAlt}
                width={800}
                height={800}
                loading="lazy"
                sizes="(max-width: 1024px) 24rem, 30vw"
                className="photo-grade h-auto w-full rounded-xl"
              />
            </figure>
            <div className="max-w-prose">
              <h2 className="text-2xl">Who is {leader.name}?</h2>
              <div className="mt-4 flex flex-col gap-4 text-lg text-ink">
                {leader.bioParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="deep">
        <Container className="flex flex-col items-center gap-5 text-center">
          <h2 className="text-3xl text-on-deep">Meet {firstName} in person</h2>
          <p className="max-w-xl text-lg text-on-deep-muted">
            The best introduction is a Sunday morning. See what a first visit looks like, or send a message and a
            member will reply personally.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button href="/about/what-to-expect" variant="primary">
              Plan your visit
            </Button>
            <Button href="/contact#contact-form" variant="ghostOnDeep">
              Send a message
            </Button>
          </div>
        </Container>
      </Section>
    </>
  )
}
