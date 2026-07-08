import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo'
import { JsonLd, breadcrumbSchema, webPageSchema } from '@/lib/jsonld'
import { Container, Section, SectionHeading } from '@/components/primitives/Layout'
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs'
import { SampleNotice } from '@/components/blocks/SampleNotice'
import { PostCard } from '@/components/blocks/cards'
import { getAllAuthors, getBlogCategories, recentPosts } from '@/lib/blog'

export const revalidate = 3600

export const metadata: Metadata = buildMetadata({
  title: 'Blog: Answers From Scripture',
  description:
    'Articles from the Harrisonville Church of Christ on salvation, worship, the church, and Christian living, each answered plainly from the New Testament.',
  path: '/blog',
  ogTitle: 'Honest Questions, Answered From the Bible',
  ogDescription: 'Short, Scripture-first articles that take real questions seriously, without denominational spin.',
})

const breadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'Blog', path: '/blog' },
]

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams
  const [all, categories, authors] = await Promise.all([recentPosts(), getBlogCategories(), getAllAuthors()])
  const active = category && categories.includes(category) ? category : null
  const posts = active ? all.filter((p) => p.category === active) : all
  const authorBySlug = new Map(authors.map((a) => [a.slug, a]))

  const chip = (label: string, href: string, isActive: boolean) => (
    <Link
      key={label}
      href={href}
      aria-current={isActive ? 'true' : undefined}
      className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
        isActive
          ? 'border-primary-strong bg-primary-strong text-on-primary'
          : 'border-border text-ink hover:bg-surface'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <>
      <JsonLd
        data={[
          webPageSchema({ name: 'Blog', description: metadata.description as string, path: '/blog' }),
          breadcrumbSchema(breadcrumbs),
        ]}
      />

      <Section tone="surface">
        <Container>
          <Breadcrumbs crumbs={breadcrumbs} />
          <SectionHeading
            as="h1"
            eyebrow="From the congregation"
            title="Plain answers from Scripture"
            lead="No spin and no jargon. Each article takes a real question and walks through what the New Testament actually says, so you can weigh it yourself."
          />
        </Container>
      </Section>

      <Section tone="light">
        <Container>
          {/* Category filter */}
          <nav aria-label="Filter by category" className="mb-6 flex flex-wrap gap-2">
            {chip('All', '/blog', !active)}
            {categories.map((c) => chip(c, `/blog?category=${encodeURIComponent(c)}`, active === c))}
          </nav>

          <SampleNotice label="These articles are sample drafts written to demonstrate the layout." />

          {posts.length ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <PostCard key={p.slug} post={p} author={authorBySlug.get(p.authorSlug)} />
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-border/60 bg-surface p-6 text-muted">
              No articles in this category yet. <Link href="/blog" className="text-link hover:text-link-hover">View all articles</Link>.
            </p>
          )}
        </Container>
      </Section>
    </>
  )
}
