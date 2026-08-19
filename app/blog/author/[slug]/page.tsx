import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { buildMetadata } from '@/lib/seo'
import { JsonLd, breadcrumbSchema, personSchema } from '@/lib/jsonld'
import { Container, Section } from '@/components/primitives/Layout'
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs'
import { SampleNotice } from '@/components/blocks/SampleNotice'
import { PostCard } from '@/components/blocks/cards'
import { LinkedInIcon } from '@/components/ui/icons'
import { getAllAuthors, getAuthor, postsByAuthor } from '@/lib/blog'

export const dynamic = 'force-static'

export async function generateStaticParams() {
  const authors = await getAllAuthors()
  return authors.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const author = await getAuthor(slug)
  if (!author) return { title: 'Author Not Found' }
  return buildMetadata({
    title: author.name,
    description: `${author.name} writes for the Harrisonville Church of Christ. ${author.bio}`.slice(0, 158),
    path: `/blog/author/${author.slug}`,
    ogTitle: `Articles and Bio: ${author.name}`,
    ogDescription: author.bio,
    ogImage: author.photo,
    ogImageAlt: author.photoAlt,
    // Hidden from navigation and search while the blog is hidden.
    noindex: true,
  })
}

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const author = await getAuthor(slug)
  if (!author) notFound()
  const posts = await postsByAuthor(author.slug)

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: author.name, path: `/blog/author/${author.slug}` },
  ]

  return (
    <>
      <JsonLd
        data={[
          personSchema({
            name: author.name,
            slug: author.slug,
            role: author.role,
            bio: author.bio,
            image: author.photo,
            sameAs: author.linkedin ? [author.linkedin] : undefined,
          }),
          breadcrumbSchema(breadcrumbs),
        ]}
      />

      <Section tone="surface">
        <Container>
          <Breadcrumbs crumbs={breadcrumbs} />
          <div className="mt-5 flex flex-col items-start gap-5 sm:flex-row sm:gap-6">
            <Image
              src={author.photo}
              alt={author.photoAlt}
              width={120}
              height={120}
              priority
              className="h-28 w-28 rounded-full object-cover"
            />
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl">{author.name}</h1>
              <p className="font-semibold uppercase tracking-wide text-primary-strong">{author.role}</p>
              <p className="max-w-2xl text-lg text-muted">{author.longBio}</p>
              {author.linkedin ? (
                <a
                  href={author.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-primary-strong px-4 py-2 text-on-primary hover:bg-primary-hover"
                >
                  <LinkedInIcon className="h-5 w-5" />
                  Connect on LinkedIn
                </a>
              ) : null}
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="light">
        <Container>
          <h2 className="mb-6 text-2xl">Articles by {author.name}</h2>
          {author.sample ? <SampleNotice label="This author profile is a placeholder." /> : null}
          {posts.length ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <PostCard key={p.slug} post={p} author={author} />
              ))}
            </div>
          ) : (
            <p className="text-muted">No articles yet.</p>
          )}
        </Container>
      </Section>
    </>
  )
}
