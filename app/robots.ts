import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/**
 * Robots policy. The same content is served to every agent; only training-data
 * collection is restricted. Retrieval/indexing bots are explicitly allowed so
 * the site stays in Search and AI-Search retrieval; documented training
 * scrapers are disallowed. Lists mirror the single source of truth in
 * .claude/references/bot-policy.md (validated by robots-policy-lint.mjs).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // /members is the private, session-gated members area — kept out of
      // crawl for every agent (its pages are also noindex).
      { userAgent: '*', allow: '/', disallow: '/members' },

      // Allow — retrieval and indexing bots.
      { userAgent: 'Googlebot', allow: '/', disallow: '/members' },
      { userAgent: 'Bingbot', allow: '/', disallow: '/members' },
      { userAgent: 'Slurp', allow: '/', disallow: '/members' },
      { userAgent: 'DuckDuckBot', allow: '/', disallow: '/members' },
      { userAgent: 'OAI-SearchBot', allow: '/', disallow: '/members' },
      { userAgent: 'PerplexityBot', allow: '/', disallow: '/members' },
      { userAgent: 'ClaudeBot', allow: '/', disallow: '/members' },
      { userAgent: 'meta-externalagent', allow: '/', disallow: '/members' },

      // Disallow — training scrapers.
      { userAgent: 'GPTBot', disallow: '/' },
      { userAgent: 'CCBot', disallow: '/' },
      { userAgent: 'Google-Extended', disallow: '/' },
      { userAgent: 'Diffbot', disallow: '/' },
      { userAgent: 'Bytespider', disallow: '/' },
      { userAgent: 'FacebookBot', disallow: '/' },
      { userAgent: 'omgili', disallow: '/' },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
