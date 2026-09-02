import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { buildMetadata } from '@/lib/seo'
import { JsonLd, breadcrumbSchema, faqSchema, webPageSchema } from '@/lib/jsonld'
import { getPage, getPublishedPages } from '@/lib/pages'
import { PageHero } from '@/components/blocks/PageHero'
import { PageRenderer, faqItemsFromSections, heroWaveFill } from '@/components/pages/PageRenderer'
import { SampleBadge } from '@/components/primitives/Badge'

/**
 * Editor-built pages. Every route the hand-built pages do not claim resolves
 * here against the pages table: published pages render through PageRenderer,
 * everything else is a 404. ISR keeps the pages static-fast; publishing from
 * the admin revalidates the exact path so edits appear immediately.
 */

export const revalidate = 3600

export async function generateStaticParams() {
  const pages = await getPublishedPages()
  return pages.map((p) => ({ slug: p.slug.split('/') }))
}

type Params = { params: Promise<{ slug: string[] }> }

const pathOf = (slug: string[]) => slug.join('/')

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const page = await getPage(pathOf(slug))
  if (!page) return {}
  return buildMetadata({
    title: page.metaTitle,
    description: page.metaDescription,
    path: `/${page.slug}`,
    ogTitle: page.ogTitle,
    ogDescription: page.ogDescription,
    ogImage: page.ogImage,
    ogImageAlt: page.ogImageAlt,
  })
}

export default async function EditorBuiltPage({ params }: Params) {
  const { slug } = await params
  const page = await getPage(pathOf(slug))
  if (!page) notFound()

  const faqItems = faqItemsFromSections(page.sections)
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: page.title, path: `/${page.slug}` },
  ]

  return (
    <>
      <JsonLd
        data={[
          webPageSchema({ name: page.metaTitle, description: page.metaDescription, path: `/${page.slug}` }),
          breadcrumbSchema(crumbs),
          ...(faqItems.length ? [faqSchema(faqItems)] : []),
        ]}
      />

      <PageHero eyebrow={page.heroEyebrow} title={page.title} lead={page.heroLead} waveFill={heroWaveFill(page.sections)}>
        {page.sample ? <SampleBadge className="w-fit" /> : null}
      </PageHero>

      <PageRenderer sections={page.sections} />
    </>
  )
}
