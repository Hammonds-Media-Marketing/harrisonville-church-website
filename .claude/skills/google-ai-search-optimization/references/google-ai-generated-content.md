# Google Search's Guidance on Using Generative AI Content

**Source:** Google Search Central — `developers.google.com/search/blog/2023/02/google-search-and-ai-content` and related guidance

**Status:** Canonical reference for how Google evaluates AI-generated or AI-assisted content. Use this file whenever a user asks whether AI content is "safe" for SEO or AI Search, when auditing a site that uses AI in production, or when the answer turns on the distinction between quality intent and authorship.

---

## Overview

Generative AI can be particularly useful when researching a topic and adding structure to original content. Using generative AI to produce many pages without adding value for users may violate Google's spam policy on scaled content abuse.

If using generative AI content on a website, the work must meet the standards of the **Search Essentials** and the **spam policies**. Authorship by AI is not, on its own, disqualifying — quality and intent are.

The Search Quality Rater Guidelines provide useful framing on how Google's raters evaluate AI and low-effort content:

- **Section 4.6.5** — Scaled content abuse
- **Section 4.6.6** — Main content created with little to no effort, originality, or added value

These guidelines are not a ranking guide. Raters do not directly influence ranking. The criteria nonetheless reveal what Google considers low-quality.

## Focus on accuracy, quality, and relevance

When creating web content — especially automatically generated content — focus on accuracy, quality, and relevance. This standard applies to metadata as much as body content, including:

- `<title>` elements
- Meta description elements
- Structured data
- Alt text for images

For structured data, ensure compliance with general guidelines, the policies for specific search features, and validate the markup to be eligible for rich results. Cross-reference the `website-schema-builder` skill for execution.

## Give users context

Share information about how content was created. This is the "How" leg of the "Who, How, Why" framework from Google's people-first content guide (`references/google-people-first-content.md`).

If content is automatically generated, consider:

- Adding background on how automation was used, in a way that makes sense for the audience
- Including image metadata when AI-generated images are used
- Disclosing AI involvement where readers might reasonably ask "How was this created?"

These disclosures build trust. They do not, on their own, immunize low-quality AI content from being filtered.

## Ecommerce: Merchant Center policies for AI-generated content

Google Merchant Center has its own policies for AI-generated content:

- **AI-generated images** must contain metadata using the IPTC `DigitalSourceType` value `TrainedAlgorithmicMedia` (`cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia`)
- **AI-generated product data** such as title and description attributes must be specified separately and labeled as AI-generated

This applies to Merchant Center feeds and downstream surfaces — Shopping, ecommerce results, and AI Search ecommerce experiences that pull from Merchant Center.

## The bottom line

Google has stated the position in plain language: AI content is acceptable if it meets the Search Essentials and spam policies. AI content is filtered if it is low-effort, low-value, or produced at scale to manipulate rankings.

The relevant question is never "Was this written by AI?" — it is "Does this content have unique value, demonstrate experience, and serve the reader?"

---

## Why this matters for AI Search

Three direct connections back to the AI Search optimization workflow:

- **The mythbuster needs this file.** When users ask whether AI-generated content is penalized — a common misconception (see `references/myths.md`, Myth 7) — point them here. Google's position is that authorship is not the issue; quality and intent are.
- **The "How" disclosure is part of Pillar 1.** The audit rubric expects content quality to include people-first content with first-hand experience. When AI is part of production, disclosure of "How" is one of the trust signals Google explicitly calls out. Pillar 1 audits on AI-assisted sites should check for appropriate disclosure.
- **Ecommerce has specific obligations.** When auditing an ecommerce site that uses AI for images or product copy, Pillar 3 (Local & Ecommerce Details) needs to check for IPTC `DigitalSourceType: TrainedAlgorithmicMedia` metadata on AI images and separate labeling for AI-generated product data fields in Merchant Center.

When an audit surfaces AI-related fixes, hand off execution to the appropriate sibling skill: `eeat-content-writer` for content quality remediation, `website-schema-builder` for structured data and metadata.
