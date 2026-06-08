# Audit Rubric

Use this rubric during Phase 1 (Audit). For each item, mark **Strong**, **Partial**, or **Gap** and capture supporting evidence. Every item ties back to a specific position in Google's official guide.

If the user has provided only a URL, audit what is publicly observable. If they have provided HTML, content drafts, or technical detail, audit against those. Be explicit when an item cannot be evaluated because the input does not contain the evidence needed — do not guess.

---

## Pillar 1: Content Quality

The single most important pillar according to Google. Long-term visibility in AI Overviews and AI Mode rests here more than anywhere else. The authoritative reference for what "helpful, reliable, people-first" actually means is `references/google-people-first-content.md`; consult it for the full self-assessment question lists, E-E-A-T framing, and the "Who, How, Why" framework. For YMYL topics (health, finance, safety, civic welfare), treat this pillar as a higher bar.

- **Unique point of view present** — The content offers a perspective, opinion, or framing that is not available across other sources covering the same topic.
- **First-hand experience demonstrated** — The author shows lived experience, original testing, primary research, or direct observation. Reviews, case studies, behind-the-scenes content, and original data all qualify.
- **Non-commodity content** — The page goes beyond common knowledge. It is not the kind of post any AI tool could draft in 30 seconds. It says something a generic summary cannot.
- **People-first orientation** — The content reads as written for human visitors first, not optimized for search engines or AI systems first.
- **Helpfulness and reliability** — Claims are supported, sources are credible where relevant, and a knowledgeable reader would trust what is being said.
- **Clear structure** — Paragraphs, sections, and headings make the content easy to scan and navigate.
- **Visual support where useful** — High-quality images and video are present where they add value. Consult `references/google-image-seo.md` for the full image SEO standard (indexability, preferred-image metadata, alt text, filenames, structured data).
- **No scaled or thin content patterns** — The site is not generating large volumes of low-value pages targeting every keyword variation or fan-out query.
- **Generative AI assistance, if used, meets Search Essentials standards** — AI-assisted content is not low-effort regurgitation.

**Failure modes to flag:**

- Commodity listicles with no expert insight
- Content that reads like an AI draft with no human voice or experience layered in
- Thin pages targeting variations of the same topic to capture fan-out queries
- Walls of text with no structure
- Missing or low-quality images on topics where visual context matters

---

## Pillar 2: Technical Structure

Pages must be indexable and eligible for snippets to appear in AI Overviews or AI Mode at all. Treat this pillar as the floor — failures here block everything else. The authoritative reference for what counts as "eligible for Search" is `references/google-search-essentials.md`; consult it whenever a technical question goes beyond what is listed below.

- **Indexed in Google Search** — Page appears in `site:` results. Search Console shows it as indexed.
- **Eligible for snippets** — No `nosnippet`, `max-snippet:0`, or robots directives that block snippet rendering.
- **Crawlable** — `robots.txt` does not block important URLs. Internal linking allows discovery.
- **Sound canonicalization** — Canonical tags point to the correct URL. No conflicting signals.
- **JavaScript rendering acceptable** — If the site uses a JS framework, content is server-rendered, pre-rendered, or rendered in a way Google can process. Important content is not locked behind client-side rendering of blocked resources.
- **Page experience adequate** — Core Web Vitals are reasonable. Mobile rendering works. Latency is not punishing.
- **Main content distinguishable** — A user (or system) can tell what the primary content of the page is versus navigation, ads, and other elements.
- **Duplicate content minimized** — Near-duplicate pages are consolidated, redirected, or canonicalized.
- **Crawl budget healthy** — For large or frequently updated sites, crawl budget is not being wasted on URLs that do not matter.
- **Search Console verified** — Site is set up in Search Console to diagnose issues.

**Failure modes to flag:**

- Pages blocked by `robots.txt` or `noindex` that the user wants in AI answers
- JS frameworks rendering content client-side with no fallback
- `nosnippet` or `max-snippet:0` directives on pages that should appear
- Heavy duplicate content across product, location, or template pages
- No Search Console verification

---

## Pillar 3: Local & Ecommerce Details

Only applies when the business sells products or serves a local audience. Skip cleanly if not relevant.

**For local businesses:**

- **Google Business Profile claimed and verified**
- **GBP categories, hours, services, and attributes complete and accurate**
- **GBP photos current and high-quality**
- **GBP posts active** — If the user is a GBP client of HMM, cross-reference the `gbp-optimization` skill for posting cadence and content
- **Reviews managed** — Active solicitation and response practice
- **NAP consistency** — Name, address, phone consistent across the website and major directories

**For ecommerce:**

- **Merchant Center account active and feeds healthy**
- **Product data accurate and complete** — Titles, descriptions, prices, availability, images
- **Product schema implemented correctly** — Note Google's position: schema is not required for AI Search but supports rich results
- **Returns, shipping, and policy information accessible**
- **Business Agent considered** — Where appropriate to the brand and category
- **AI-generated content complies with Merchant Center policies** — If AI is used to produce product images, IPTC `DigitalSourceType: TrainedAlgorithmicMedia` metadata is present. If AI is used for product titles or descriptions, those fields are specified separately and labeled. See `references/google-ai-generated-content.md` for the full standard.

**Failure modes to flag:**

- Unclaimed or stale GBP for a local business asking about AI visibility
- Missing or stale Merchant Center feeds for an ecommerce site
- Product pages with thin, duplicated, or supplier-default descriptions

---

## Pillar 4: Agentic Readiness (Emerging)

This pillar is forward-looking. Google calls it out as worth attention for businesses where AI agents may transact, gather data, or compare options on a user's behalf.

- **Semantic HTML used appropriately** — Headings, landmarks, lists, and form labels render in the DOM
- **Accessibility tree intact** — Screen readers and agents can parse the page. Cross-reference the `web-accessibility` skill for WCAG and ADA work.
- **Important content visible in the DOM** — Not exclusively rendered via canvas, image-only text, or JS-injected late
- **Forms and interactive elements labeled** — Inputs have associated labels and accessible names
- **No anti-agent blocks on agent-friendly pages** — If the business wants agents to interact, ensure agents are not blocked at the firewall, WAF, or CDN level
- **Visual hierarchy matches DOM hierarchy** — A screenshot interpretation matches the underlying structure
- **Universal Commerce Protocol (UCP) and similar standards monitored** — Awareness, not necessarily implementation

**Failure modes to flag:**

- Heavy reliance on visual cues with no semantic structure underneath
- Forms without labels or accessible names
- Important product data injected so late in the render cycle that an agent could miss it
- Aggressive bot blocking on pages where the business wants agents to operate

---

## Audit output format

Default audit deliverable structure:

- **Executive summary** — Two to four sentences. Overall health and top priority.
- **Pillar 1: Content Quality** — Status, findings (bulleted), recommendations preview
- **Pillar 2: Technical Structure** — Status, findings, recommendations preview
- **Pillar 3: Local & Ecommerce Details** — Status, findings, recommendations preview (or "Not applicable" with one-line justification)
- **Pillar 4: Agentic Readiness** — Status, findings, recommendations preview
- **Top three priorities** — The three things to fix first, in order, with effort estimate

If the user asks for a quick check rather than a full audit, collapse to a single bulleted summary covering only the pillars where there are findings to report.
