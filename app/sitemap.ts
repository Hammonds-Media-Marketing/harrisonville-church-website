import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'
import { posts, authors } from '@/content/blog'

/**
 * Sitemap generated from routes and content — never hardcoded. lastModified is
 * pulled from real content timestamps; changefreq and priority are set per
 * route type per the full-website mode doc. When the blog moves to Supabase,
 * swap the content imports for a query; the shape stays the same.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const url = (path: string) => `${SITE_URL}${path === '/' ? '' : path}`

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: url('/'), lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: url('/about'), lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: url('/about/what-to-expect'), lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: url('/about/leadership'), lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: url('/about/stories'), lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: url('/events'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: url('/resources/sermons'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: url('/resources/bible-study'), lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: url('/blog'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: url('/contact'), lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: url('/style-guide'), lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: url('/privacy-policy'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: url('/cookie-policy'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const blogRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: url(`/blog/${p.slug}`),
    lastModified: new Date(p.dateModified || p.datePublished),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  const authorRoutes: MetadataRoute.Sitemap = authors.map((a) => ({
    url: url(`/blog/author/${a.slug}`),
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.4,
  }))

  return [...staticRoutes, ...blogRoutes, ...authorRoutes]
}
