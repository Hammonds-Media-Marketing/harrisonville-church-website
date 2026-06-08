# Google Search Essentials

**Source:** Google Search Central — `developers.google.com/search/docs/essentials`

**Status:** Foundational reference. Google's AI Search guide treats Search Essentials as the prerequisite for AI Search eligibility — a page must be indexed and eligible for snippets in Google Search to appear in AI Overviews or AI Mode. Use this file as the authoritative source for what "eligible for Search" actually means.

---

## Overview

The Google Search Essentials make up the core parts of what makes web-based content (web pages, images, videos, or other publicly available material that Google finds on the web) eligible to appear and perform well on Google Search:

- **Technical requirements** — What Google needs from a web page to show it in Google Search
- **Spam policies** — The behaviors and tactics that can lead to lower ranking or being completely omitted from Google Search results
- **Key best practices** — The main things that can help improve how a site appears in Google Search results

It does not cost any money to appear in Google Search results, no matter what anyone says otherwise.

Meeting all of these requirements and best practices does not guarantee that Google will crawl, index, or serve content. Indexing and serving are never guaranteed.

## Technical requirements

The technical requirements cover the bare minimum Google Search needs from a web page to show it in search results. There are actually very few technical requirements; most sites pass them without realizing it. Reference: `developers.google.com/search/docs/essentials/technical`.

## Spam policies

The spam policies detail the behaviors and tactics that can lead to a page or an entire site being ranked lower or completely omitted from Google Search. Sites that focus on providing the best content and experience for people and uphold the spirit of Google's principles are more likely to do well in Google Search results. Reference: `developers.google.com/search/docs/essentials/spam-policies`.

## Key best practices

While there are many things to do to improve a site's SEO, a few core practices have the most impact on ranking and appearance in Google Search:

- **Create helpful, reliable, people-first content.**
- **Use words people would use to find the content.** Place those words in prominent locations such as the title, main heading, alt text, and link text.
- **Make links crawlable** so Google can find other pages on the site via the links on a page.
- **Tell people about the site.** Be active in communities where like-minded people might want to know about the products or services being offered.
- **Follow content-type-specific best practices.** Images, videos, structured data, and JavaScript all have their own guidance.
- **Enhance appearance on Google Search** by enabling features that make sense for the site.
- **Control what appears in Search.** Use the appropriate method to keep content out of search results if it should not be found, or to opt out entirely.

---

## Why this matters for AI Search

Three direct connections back to the AI Search optimization workflow:

- **Eligibility floor.** AI Overviews and AI Mode can only retrieve and ground responses in pages that are indexed and eligible for snippets. If Search Essentials are not met, the AI Search question is moot.
- **Spam policies are enforced at both layers.** Core ranking systems filter spam, and AI Search features depend on core ranking systems. A site that violates spam policy will be filtered from AI Search through the same mechanism it is filtered from regular Search.
- **Key best practices are the foundation of content quality.** Helpful, reliable, people-first content is the same standard Google's AI Search guide names as the most important factor for long-term AI visibility.

When auditing a site against the four pillars in `audit-rubric.md`, treat Search Essentials compliance as a precondition for Pillar 2 (Technical Structure) and as the baseline expectation underlying Pillar 1 (Content Quality).
