import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'
import { upcomingEvents } from '@/lib/events'

/**
 * Sitemap generated from routes — never hardcoded. Blog, author,
 * member-stories, and sermon-library routes are intentionally omitted while
 * those sections are hidden at the congregation's direction; restore them here
 * when the pages are made visible again. changefreq and priority are set per
 * route type per the full-website mode doc.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const url = (path: string) => `${SITE_URL}${path === '/' ? '' : path}`

  return [
    { url: url('/'), lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: url('/about'), lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: url('/about/what-to-expect'), lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: url('/about/leadership'), lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: url('/events'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    ...(await upcomingEvents()).map((e) => ({
      url: url(`/events/${e.slug}`),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    { url: url('/resources/bible-study'), lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: url('/contact'), lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: url('/style-guide'), lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: url('/privacy-policy'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: url('/cookie-policy'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
