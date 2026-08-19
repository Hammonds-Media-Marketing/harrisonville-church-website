import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { buildMetadata } from '@/lib/seo'
import { JsonLd, articleSchema, breadcrumbSchema } from '@/lib/jsonld'
import { SITE_URL } from '@/lib/site'
import { Container, Section } from '@/components/primitives/Layout'
import { Badge } from '@/components/primitives/Badge'
import { SampleNotice } from '@/components/blocks/SampleNotice'
import { PostCard } from '@/components/blocks/cards'
import { ArticleBody, tocFromBody } from '@/components/blog/ArticleBody'
import { TableOfContents } from '@/components/blog/TableOfContents'
import { ScrollProgress } from '@/components/blog/ScrollProgress'
import { ShareButtons } from '@/components/blog/ShareButtons'
import { AuthorBlock } from '@/components/blog/AuthorBlock'
import { EyeIcon, ClockIcon } from '@/components/ui/icons'
import { formatDate, formatViews } from '@/lib/format'
import { getAllAuthors, getAllPosts, getAuthor, getPost, relatedPosts } from '@/lib/blog'

export const revalidate = 3600

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Article Not Found' }
  const author = await getAuthor(post.authorSlug)
  return buildMetadata({
    title: post.title,
    // Article titles stand on their own; omit the brand suffix to keep the meta
    // title within length and let the headline lead in search results.
    rawTitle: true,
    description: post.metaDescription,
    path: `/blog/${post.slug}`,
    ogTitle: post.ogTitle,
    ogDescription: post.ogDescription,
    ogImage: post.featureImage,
    ogImageAlt: post.featureImageAlt,
    article: {
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified,
      authors: [author?.name || ''],
      tags: post.tags,
    },
    // Hidden from navigation and search while the blog is hidden.
    noindex: true,
  })
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()
  const [author, related, authors] = await Promise.all([
    getAuthor(post.authorSlug),
    relatedPosts(post),
    getAllAuthors(),
  ])
  const authorBySlug = new Map(authors.map((a) => [a.slug, a]))
  const toc = tocFromBody(post.body)
  const url = `${SITE_URL}/blog/${post.slug}`
  const revised = Boolean(post.dateModified && post.dateModified !== post.datePublished)

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: post.title, path: `/blog/${post.slug}` },
  ]

  return (
    <>
      <ScrollProgress />
      <JsonLd
        data={[
          articleSchema({
            title: post.title,
            description: post.metaDescription,
            path: `/blog/${post.slug}`,
            image: post.featureImage,
            datePublished: post.datePublished,
            dateModified: post.dateModified,
            authorName: author?.name || 'Harrisonville Church of Christ',
            authorSlug: post.authorSlug,
          }),
          breadcrumbSchema(breadcrumbs),
        ]}
      />

      <Section tone="surface" className="pb-6">
        <Container>
          <div className="mt-5 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="primary">{post.category}</Badge>
              <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                <ClockIcon className="h-4 w-4" />
                {post.readMinutes} min read
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-strong">
                <EyeIcon className="h-4 w-4" />
                {formatViews(post.views)} reads
              </span>
            </div>
            <h1 className="max-w-3xl text-4xl">{post.title}</h1>
            <p className="max-w-2xl text-lg text-muted">{post.excerpt}</p>
            <p className="text-sm text-muted">
              {revised ? (
                <>Updated {formatDate(post.dateModified as string)}</>
              ) : (
                <>Published {formatDate(post.datePublished)}</>
              )}
            </p>
          </div>
        </Container>
      </Section>

      {/* Feature image */}
      <Container className="-mt-2">
        <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-surface">
          <Image
            src={post.featureImage}
            alt={post.featureImageAlt}
            fill
            priority
            sizes="(max-width: 1200px) 100vw, 1200px"
            className="object-cover"
          />
        </div>
      </Container>

      <Section tone="light">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
            {/* Sticky rail: TOC then share */}
            <aside className="order-2 lg:order-1">
              <div className="flex flex-col gap-6 lg:sticky lg:top-32">
                <TableOfContents items={toc} />
                <ShareButtons url={url} title={post.title} />
              </div>
            </aside>

            {/* Article */}
            <article className="order-1 max-w-prose lg:order-2">
              {post.sample ? <SampleNotice label="This article is a sample draft." /> : null}
              <AuthorBlock author={author!} variant="compact" />
              <div className="mt-8">
                <ArticleBody body={post.body} />
              </div>

              {/* Tags */}
              <div className="mt-8 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-muted">Tags:</span>
                {post.tags.map((t) => (
                  <Badge key={t} tone="neutral">
                    {t}
                  </Badge>
                ))}
              </div>

              {/* Author block bottom. The comment section is removed at the
                  congregation's direction: the blog is publish-only. */}
              <div className="mt-8">
                <AuthorBlock author={author!} variant="full" />
              </div>
            </article>
          </div>
        </Container>
      </Section>

      {/* Related — only when related articles exist */}
      {related.length ? (
        <Section tone="surface">
          <Container>
            <h2 className="mb-6 text-2xl">Keep reading</h2>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <PostCard key={r.slug} post={r} author={authorBySlug.get(r.authorSlug)} />
              ))}
            </div>
            <p className="mt-6">
              <Link href="/blog" className="font-semibold text-link hover:text-link-hover">
                Back to all articles
              </Link>
            </p>
          </Container>
        </Section>
      ) : null}
    </>
  )
}
