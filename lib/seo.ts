import type { Metadata } from 'next'
import { SITE_URL, site } from './site'

// JPG, never SVG: iMessage, Facebook, and Twitter link previews do not
// render SVG og:image sources.
const DEFAULT_OG_IMAGE = {
  url: `${SITE_URL}/assets/og/og-default.jpg`,
  width: 1200,
  height: 630,
  alt: 'Aerial view of the Harrisonville Church of Christ building and parking lot on Outlook Drive',
}

type SeoInput = {
  /** Meta <title> (the helper appends the brand suffix unless `rawTitle`). */
  title: string
  /** Meta description (50–160 chars). */
  description: string
  /** Path relative to the site root, e.g. "/about". Drives the canonical URL. */
  path: string
  /** OG title — MUST differ from the meta title (universal rule). */
  ogTitle: string
  /** OG description — MUST differ from the meta description (universal rule). */
  ogDescription: string
  /** Per-page OG image path under /public, or a full URL. */
  ogImage?: string
  ogImageAlt?: string
  /** Set true to skip the brand suffix on the meta title. */
  rawTitle?: boolean
  /** Article-type OG metadata. */
  article?: { publishedTime?: string; modifiedTime?: string; authors?: string[]; tags?: string[] }
  /** Override robots for non-indexable pages. */
  noindex?: boolean
}

export function buildMetadata(input: SeoInput): Metadata {
  const canonical = `${SITE_URL}${input.path === '/' ? '' : input.path}`
  const title = input.rawTitle ? input.title : `${input.title} | ${site.name}`
  const ogImage = input.ogImage
    ? {
        url: input.ogImage.startsWith('http') ? input.ogImage : `${SITE_URL}${input.ogImage}`,
        width: 1200,
        height: 630,
        alt: input.ogImageAlt || input.ogTitle,
      }
    : DEFAULT_OG_IMAGE

  return {
    // Absolute title so the root layout's title.template does not append the
    // brand name a second time (buildMetadata already controls the suffix).
    title: { absolute: title },
    description: input.description,
    alternates: { canonical },
    robots: input.noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
    openGraph: {
      type: input.article ? 'article' : 'website',
      url: canonical,
      siteName: site.name,
      title: input.ogTitle,
      description: input.ogDescription,
      locale: 'en_US',
      images: [ogImage],
      ...(input.article
        ? {
            publishedTime: input.article.publishedTime,
            modifiedTime: input.article.modifiedTime,
            authors: input.article.authors,
            tags: input.article.tags,
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: input.ogTitle,
      description: input.ogDescription,
      images: [ogImage.url],
    },
  }
}
