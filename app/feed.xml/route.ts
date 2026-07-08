import { SITE_URL, site } from '@/lib/site'
import { getAllAuthors, recentPosts } from '@/lib/blog'

/** RSS 2.0 feed for the blog, generated from content and kept in sync with
 *  published articles. Served at /feed.xml. */
export const dynamic = 'force-static'

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const [posts, authors] = await Promise.all([recentPosts(), getAllAuthors()])
  const authorBySlug = new Map(authors.map((a) => [a.slug, a]))
  const updated = posts[0] ? new Date(posts[0].dateModified || posts[0].datePublished) : new Date()

  const items = posts
    .map((p) => {
      const author = authorBySlug.get(p.authorSlug)
      const link = `${SITE_URL}/blog/${p.slug}`
      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${escapeXml(p.excerpt)}</description>
      <category>${escapeXml(p.category)}</category>
      ${author ? `<dc:creator>${escapeXml(author.name)}</dc:creator>` : ''}
      <pubDate>${new Date(p.datePublished).toUTCString()}</pubDate>
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(site.name)} — Blog</title>
    <link>${SITE_URL}/blog</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Plain answers from Scripture, from the ${escapeXml(site.name)}.</description>
    <language>en-us</language>
    <lastBuildDate>${updated.toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
