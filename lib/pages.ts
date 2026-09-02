import { cache } from 'react'
import { getSupabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import { parsePageSections, type PageSection } from '@/lib/page-sections'

/**
 * Data-access layer for editor-built pages, mirroring lib/events.ts and
 * lib/blog.ts: public reads go through the anon key (Row Level Security
 * limits them to published rows), rows are snake_case and app types
 * camelCase, and a missing or failing database degrades to "no custom
 * pages" rather than an error. There is no local seed for pages — they only
 * exist once an editor creates them.
 */

type PageRow = Database['public']['Tables']['pages']['Row']

export type SitePage = {
  id: string
  slug: string
  title: string
  heroEyebrow: string
  heroLead?: string
  metaTitle: string
  metaDescription: string
  ogTitle: string
  ogDescription: string
  ogImage?: string
  ogImageAlt?: string
  sections: PageSection[]
  published: boolean
  sample: boolean
  updatedAt: string
}

export function mapPageRow(row: PageRow): SitePage {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    heroEyebrow: row.hero_eyebrow || 'Harrisonville Church of Christ',
    heroLead: row.hero_lead ?? undefined,
    metaTitle: row.meta_title || row.title,
    metaDescription: row.meta_description,
    ogTitle: row.og_title || row.title,
    ogDescription: row.og_description || row.meta_description,
    ogImage: row.og_image ?? undefined,
    ogImageAlt: row.og_image_alt ?? undefined,
    sections: parsePageSections(row.sections),
    published: row.published,
    sample: row.sample,
    updatedAt: row.updated_at,
  }
}

/** All published editor-built pages. Cached per render pass. */
export const getPublishedPages = cache(async (): Promise<SitePage[]> => {
  const supabase = getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase.from('pages').select('*').eq('published', true).order('slug')

  if (error || !data) {
    if (error) console.warn('[pages] read failed:', error.message)
    return []
  }
  return data.map(mapPageRow)
})

/** One published page by its slug path (no leading slash). */
export async function getPage(slug: string): Promise<SitePage | undefined> {
  return (await getPublishedPages()).find((p) => p.slug === slug)
}

/**
 * First path segments an editor-built page may not claim: every hand-built
 * route, route handler, and public asset directory. Keeping this list beside
 * the fetchers means the save action and the catch-all route agree on it.
 */
export const RESERVED_PAGE_SEGMENTS = new Set([
  'about',
  'events',
  'resources',
  'blog',
  'contact',
  'privacy-policy',
  'cookie-policy',
  'style-guide',
  'members',
  'api',
  'auth',
  'assets',
  'feed.xml',
  'sitemap.xml',
  'robots.txt',
  'favicon.ico',
  'not-found',
])

/**
 * Normalize an editor-entered slug into a clean path (lowercase, hyphenated
 * segments, no leading or trailing slash). Returns null when nothing usable
 * remains or the path would shadow a hand-built route.
 */
export function normalizePageSlug(raw: string): string | null {
  const segments = raw
    .toLowerCase()
    .split('/')
    .map((segment) =>
      segment
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    )
    .filter(Boolean)

  if (!segments.length || segments.length > 3) return null
  if (RESERVED_PAGE_SEGMENTS.has(segments[0])) return null
  return segments.join('/')
}
