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
      { userAgent: '*', allow: '/' },

      // Allow — retrieval and indexing bots.
      { userAgent: 'Googlebot', allow: '/' },
      { userAgent: 'Bingbot', allow: '/' },
      { userAgent: 'Slurp', allow: '/' },
      { userAgent: 'DuckDuckBot', allow: '/' },
      { userAgent: 'OAI-SearchBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'meta-externalagent', allow: '/' },

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
