---
name: google-ai-search-optimization
description: Audit websites and pages against Google's official guidance for generative AI Search features (AI Overviews, AI Mode) and recommend prioritized fixes. Use this skill whenever the user asks about optimizing for AI Overviews, AI Mode, generative AI search, "AEO" (answer engine optimization), "GEO" (generative engine optimization), appearing in AI answers, Google AI Search visibility, or "ranking in ChatGPT/Claude/Perplexity"-style requests where Google Search is the actual target. Also trigger when the user shares a URL, page, or content draft and asks whether it will perform in AI Overviews, why it's not appearing in AI answers, how to optimize for query fan-out or RAG retrieval, or asks Claude to fact-check / mythbust AEO-GEO advice they have heard. Always use this skill — do not rely on general SEO knowledge alone for these tasks, because the AEO/GEO space contains widespread misinformation that Google has explicitly debunked.
---

# Google AI Search Optimization

A skill for auditing pages and sites against Google's official guidance for generative AI features on Search — and recommending prioritized fixes — grounded strictly in what Google has published.

## Source of truth

This skill's reference library is organized in three tiers, in order of precedence. When tiers conflict, the higher tier wins.

### Tier 1 — Canonical operational guidance (Google's official documentation)

- `references/google-ai-search-guide.md` — Google's "Optimizing your website for generative AI features on Google Search." Primary source for everything specific to AI Overviews, AI Mode, RAG, query fan-out, and the AEO/GEO mythbusting.
- `references/google-search-essentials.md` — Google Search Essentials (technical requirements, spam policies, key best practices). Foundational reference for what "eligible for Search" means, which is the precondition for AI Search eligibility.
- `references/google-people-first-content.md` — Google's "Creating helpful, reliable, people-first content." Authoritative reference for the content quality standard the AI Search guide names as the most important factor. Includes the full self-assessment question lists, E-E-A-T framing, and the "Who, How, Why" framework.
- `references/google-image-seo.md` — Google's image SEO best practices. Authoritative reference for image indexability, preferred-image metadata, alt text, filenames, and structured data on images. Relevant to both Pillar 1 (visual support) and Pillar 2 (technical indexability of images).
- `references/google-ai-generated-content.md` — Google's guidance on using generative AI content on a website. Authoritative reference for how AI-assisted content is evaluated, the "How" disclosure expectation, and Merchant Center's specific AI policies including the IPTC `DigitalSourceType` requirement for AI images.

### Tier 2 — Supplementary context (Google, historical and explanatory)

- `references/bert-search-understanding.md` — Paraphrased summary of Google's 2019 BERT announcement. Useful as published evidence for the intent-over-keywords principle, direct refutation of fan-out query targeting, and as the named milestone in the trajectory that produced AI Overviews.

### Tier 3 — Industry perspective (third-party commentary, lower trust)

- `references/industry-perspective-geo-aeo.md` — Gemini-synthesized summary of multiple industry experts (Lily Ray, Rand Fishkin, John Lovett, Andrea Volpini, Sonny Vasquez, others). Useful for strategic framing, KPI frameworks ("Be Seen, Be Believed, Be Chosen"), the Ghost Citation concept, and understanding what the broader AEO/GEO conversation says. **Not authoritative on Google's positions.** When Tier 3 conflicts with Tier 1, Tier 1 wins.

### Precedence rules

- If a question can be answered from Tier 1, answer from Tier 1 and do not introduce Tier 3 framing unless asked.
- If a question is about measurement, KPIs, or industry frameworks not covered in Tier 1, Tier 3 is a legitimate source — but flag that it is industry perspective, not Google guidance.
- If Tier 3 makes a claim that contradicts Tier 1 (e.g., the `llms.txt` recommendation for coding agents), state both positions and explain the scope difference. Do not collapse them.
- Never present industry expert claims as Google's stated position.

## When to use this skill

Trigger this skill whenever the user is working on visibility in Google's generative AI Search experiences. Common phrasings include:

- "Help me show up in AI Overviews"
- "Why isn't my site in AI Mode results?"
- "Optimize this page for AEO / GEO"
- "Audit my site for generative AI search"
- "How do I rank in AI answers?"
- "Is `llms.txt` worth adding?"
- "Should I chunk my content for AI?"
- "Does schema help with AI Overviews?"

If the user is asking about non-Google AI surfaces specifically (ChatGPT, Claude, Perplexity, Grok), use Google's guidance as the foundation but flag that Google's positions are about Google Search and may differ from how third-party AI tools retrieve content. Note that for HMM client work, Google AI Overviews and AI Mode are typically the highest-volume surfaces and should be prioritized.

## Core principles (from Google)

These are the non-negotiables. Every recommendation should ladder back to one of them:

- **AI Search is still Search.** Google's generative AI features are rooted in core Search ranking and quality systems. Foundational SEO best practices remain the primary lever for visibility in AI Overviews and AI Mode.
- **Retrieval-augmented generation (RAG) does the work.** Google retrieves indexed pages and grounds AI responses in them. To be eligible to appear, a page must be indexed and eligible to show a snippet in Google Search.
- **Query fan-out expands the surface area.** Google's models generate related concurrent queries to gather more context. Pages that cover a topic with genuine depth and breadth — not keyword stuffing — are more likely to be retrieved.
- **Non-commodity, first-hand content wins.** Generic, regurgitated content competes against everything else on the internet. Unique perspective, lived experience, and original insight stand out.
- **Most "AEO/GEO hacks" are noise for Google.** Google has explicitly stated that several popular tactics — `llms.txt` files, content chunking, AI-specific rewrites, inauthentic mentions, schema overfocus — are not how Google's AI features work.

## Workflow

The skill operates in two phases. The user said both phases are wanted by default — audit first, recommend second.

### Phase 1: Audit

Audit the provided page, site, or content against the four pillars from Google's guide. Use `references/audit-rubric.md` as the checklist. For each pillar, note:

- **Status** — Strong, Partial, or Gap
- **Evidence** — What you observed (or could not observe, if the URL or content was not provided)
- **Risk** — What Google says about this area and what's at stake

The four pillars:

1. **Content quality** — Unique POV, first-hand experience, non-commodity, helpful and people-first, well-organized, supported with images/video where useful
2. **Technical structure** — Indexable and crawlable, meets Search technical requirements, sound JavaScript SEO if applicable, good page experience, minimal duplicate content
3. **Local & ecommerce details** — Google Business Profile complete and active, Merchant Center feeds where relevant, business details established
4. **Agentic readiness (emerging)** — Reasonable semantic HTML, accessibility tree intact, content visible in DOM, not blocked from agent crawlers

### Phase 2: Recommend

Translate audit findings into prioritized recommendations. Default ordering:

- **Foundational fixes first** — Anything blocking indexation, crawlability, or basic eligibility. Nothing else matters if these are broken.
- **Content quality next** — Unique POV, depth, first-hand experience, and helpfulness drive long-term visibility more than any other lever.
- **Technical refinements** — Page experience, JS SEO, duplicate content, semantic HTML.
- **Surface-specific layers** — GBP, Merchant Center, agentic readiness as relevant to the business model.

For each recommendation, include:

- **What to do** — Specific, actionable
- **Why** — Tie back to a named principle from Google's guide
- **Effort** — Low, Medium, or High
- **Cross-reference** — Point to a sibling skill if one applies (see below)

## Output format

The skill decides format based on what the user is asking for. Defaults:

- **Full site audit or page audit** → Structured report with Pillar → Status → Findings → Recommendations
- **Single question or quick check** → Conversational answer grounded in Google's guidance, with the relevant principle named
- **Mythbusting / fact-check** → State the claim, state Google's position with a direct reference to the guide, state what to do instead
- **Content review against AI Search criteria** → Inline annotations with a summary of the top three improvements

When in doubt, ask the user which format they prefer before producing a long deliverable. Apply Garrett's writing preferences: bullet points by default, plain-language pairing for technical terms, no contractions for HMM formal brand copy.

## Mythbusting reference

Google explicitly debunks these in the official guide. When a user raises any of them, redirect using `references/myths.md` as backup:

- **`llms.txt` files** — Not used by Google for AI Search ranking. Google indexes them like any other file; they get no special treatment.
- **Content chunking** — Not required. Google's systems understand nuance across full pages.
- **Rewriting content for AI** — Not required. Google handles synonyms and semantic meaning.
- **Inauthentic mentions** — Counterproductive. Core ranking and spam systems filter low-quality signals.
- **Structured data overfocus** — Not required for AI Search visibility, though still useful for rich results.

Important nuance: these myths are debunked **for Google specifically**. If the user is targeting non-Google AI surfaces, some of these tactics may have different relevance. Be explicit about scope.

## Cross-references to sibling skills

This skill focuses on the strategic and structural side of Google AI Search optimization. For execution, hand off to:

- **`eeat-content-writer`** — When recommendations require writing or rewriting content to E-E-A-T standards. The content quality pillar in this skill aligns directly with E-E-A-T.
- **`website-schema-builder`** — When schema markup is part of a recommendation. Note Google's position: schema is not required for AI Search but still useful for rich results.
- **`gbp-optimization`** — When recommendations involve Google Business Profile content, posting cadence, or local visibility.
- **`web-accessibility`** — When agentic readiness recommendations touch the accessibility tree, semantic HTML, or assistive technology compatibility.

When a sibling skill applies, name it explicitly in the recommendation so the user knows what to load next.

## Operating notes

- **Never invent Google positions.** Every claim about what Google says should be traceable to a Tier 1 or Tier 2 source. If the user asks a question the guides do not address, say so — do not extrapolate.
- **Respect the tier hierarchy.** When citing the industry perspective file (Tier 3), name the source as industry perspective rather than as Google's position. When Tier 3 conflicts with Tier 1, state both positions and explain the scope difference rather than collapsing them.
- **Treat industry statistics as directional.** When citing CTR drops, conversion multipliers, or citation decline percentages from the industry perspective file, hedge appropriately — methodologies vary and numbers shift over time.
- **Be cautious with non-Google AI surfaces.** When the user asks about ChatGPT, Claude, Perplexity, or Grok specifically, note that Google's guidance does not directly apply and flag the scope mismatch. The industry perspective file has more to say about these surfaces than Google's guides do.
- **Stay current.** Google's guidance evolves. If the user references a Google update newer than the source file in `references/`, ask for the source and update the reference rather than guessing.
- **HMM context.** Garrett positions HMM around AEO/GEO as a specialty. This skill is not in conflict with that positioning — it sharpens it by grounding HMM's advice in what Google actually says rather than the speculative tactics common in the AEO/GEO space, while still respecting the value of expert industry analysis as supporting context.


---
 
© 2026 Hammonds Media & Marketing (HMM). Proprietary and confidential.  
This document may not be reproduced, shared, or used outside of  
HMM-authorized projects without prior written consent.  
Contact: [hello@hmm.agency](mailto:hello@hmm.agency)
