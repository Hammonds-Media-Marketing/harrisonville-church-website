import type { Metadata } from 'next'
import Link from 'next/link'
import { copyMetadata, pageCopy } from '@/lib/page-copy'
import { JsonLd, breadcrumbSchema, webPageSchema } from '@/lib/jsonld'
import { Container, Section, SectionHeading } from '@/components/primitives/Layout'
import { SampleNotice } from '@/components/blocks/SampleNotice'
import { PostCard } from '@/components/blocks/cards'
import { getAllAuthors, getBlogCategories, recentPosts } from '@/lib/blog'

export const revalidate = 3600

const PATH = '/blog'

export async function generateMetadata(): Promise<Metadata> {
  // Hidden from navigation and search at the congregation's direction.
  return copyMetadata(PATH, { noindex: true })
}

const breadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'Blog', path: PATH },
]

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams
  const [all, categories, authors, copy] = await Promise.all([
    recentPosts(),
    getBlogCategories(),
    getAllAuthors(),
    pageCopy(PATH),
  ])
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
          webPageSchema({ name: 'Blog', description: copy.s('seo.description'), path: PATH }),
          breadcrumbSchema(breadcrumbs),
        ]}
      />

      <Section tone="surface">
        <Container>
          <SectionHeading
            as="h1"
            eyebrow={copy.t('intro.eyebrow')}
            title={copy.t('intro.title')}
            lead={copy.t('intro.lead')}
          />
        </Container>
      </Section>

      <Section tone="light">
        <Container>
          {/* Category filter */}
          <nav aria-label="Filter by category" className="mb-6 flex flex-wrap gap-2">
            {chip(copy.s('list.allLabel'), PATH, !active)}
            {categories.map((c) => chip(c, `${PATH}?category=${encodeURIComponent(c)}`, active === c))}
          </nav>

          {copy.blank('list.notice') ? null : <SampleNotice label={copy.t('list.notice')} />}

          {posts.length ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <PostCard key={p.slug} post={p} author={authorBySlug.get(p.authorSlug)} />
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-border/60 bg-surface p-6 text-muted">{copy.t('list.empty')}</p>
          )}
        </Container>
      </Section>
    </>
  )
}
