# AEO/GEO Mythbusting

A quick reference for handling popular AEO/GEO claims that Google has explicitly addressed. For each myth, use the structure:

1. **The claim** — What people say
2. **Google's position** — What Google actually published
3. **What to do instead** — Where to redirect effort

When citing Google's position in a response to the user, attribute it to "Google's official guide on optimizing for generative AI features on Search" rather than to this skill.

---

## Myth 1: You need an `llms.txt` file

- **The claim:** Adding an `llms.txt` file at the root of a site helps it appear in AI Overviews, AI Mode, and other AI search experiences.
- **Google's position:** Not required and not used for AI Search ranking. Google may crawl and index `llms.txt` like any other file, but it gets no special treatment in generative AI features. The same goes for other "special" AI markup files.
- **What to do instead:** Ensure standard indexability — `robots.txt` allows the right URLs, important pages are not blocked, and the content itself is strong. That is what makes a page eligible for AI Search.
- **Scope nuance:** Some industry voices (see `references/industry-perspective-geo-aeo.md`) recommend `llms.txt` in the context of **coding agents** ingesting developer documentation (Claude Code, Cursor, etc.). That is a different use case from Google AI Search. Both can be true: `llms.txt` may help developer documentation discovery for coding agents, while not influencing Google AI Search visibility. If the user's question is about Google AI Search, the answer is still no.

---

## Myth 2: You need to "chunk" content for AI

- **The claim:** Breaking content into short, atomic sections (Q&A format, single-claim paragraphs) helps AI extract and surface it.
- **Google's position:** Not required. Google's systems understand the nuance of multiple topics on a page and surface the relevant piece. There is no ideal page length.
- **What to do instead:** Structure content for human readers. Use headings, paragraphs, and sections that match how a real person would navigate the topic. If the content is naturally Q&A-shaped, format it that way. If it is naturally a long-form essay, write it that way.

---

## Myth 3: You need to rewrite content for AI

- **The claim:** AI systems require specific phrasing, long-tail keyword density, or pre-answered fan-out queries baked into the page.
- **Google's position:** Not required. AI systems understand synonyms and semantic meaning. No need to capture every variation of how someone might search.
- **What to do instead:** Write the best version of the content for a real human reader. Cover the topic with depth and clarity. Google's systems handle the variation.

---

## Myth 4: You should seed mentions of your brand across the web

- **The claim:** Inauthentic "mentions" across blogs, forums, and review sites help AI features pick up the brand.
- **Google's position:** Counterproductive. Core ranking and spam systems filter these signals. Generative AI features depend on both.
- **What to do instead:** Earn authentic mentions through PR, original research, useful tools, customer experience, and content that other people genuinely want to reference. Authentic third-party validation is durable; manufactured mentions are noise at best and a spam policy violation at worst.

---

## Myth 5: Schema is the key to AI Search visibility

- **The claim:** Adding aggressive schema.org markup — FAQ, HowTo, Article, Speakable, custom variants — is the way to win in AI Overviews.
- **Google's position:** Schema is not required for AI Search. Continue using it because it helps with rich results eligibility on standard Google Search, but it is not the AI lever people think it is.
- **What to do instead:** Add schema where it earns a rich result (Product, Article, LocalBusiness, Recipe, Review, etc.). Cross-reference the `website-schema-builder` skill for execution. Do not add speculative or unsupported schema types in the hope they unlock AI visibility — they do not.

---

## Myth 6: Targeting fan-out queries with dedicated pages will boost AI visibility

- **The claim:** Creating a separate page for every possible variation of a query — including the related queries Google's models might generate via fan-out — improves the odds of appearing.
- **Google's position:** Doing this primarily to manipulate AI responses or rankings violates Google's scaled content abuse spam policy. A high quantity of pages does not make a website higher quality or more relevant.
- **What to do instead:** Cover the topic in genuine depth on a smaller number of strong pages. Google's systems are capable of understanding page relevance even without exact query matches — this capability has been published and named since the 2019 BERT release (see `references/bert-search-understanding.md`). Today's query fan-out is the descendant of that intent-understanding work. Quality of coverage outperforms quantity of pages.

---

## Myth 7: AI-generated content is penalized

- **The claim:** Any content produced with AI assistance will be filtered out of AI Search results.
- **Google's position:** AI-assisted content is acceptable as long as it meets the Search Essentials and spam policies. The judgment is on quality and intent, not authorship. Full details in `references/google-ai-generated-content.md`.
- **What to do instead:** Use AI tools to assist, but ensure the final content has genuine value, first-hand experience, and unique perspective. Low-effort AI output that exists only to capture search traffic is what gets filtered — not AI assistance per se. For ecommerce sites using AI to generate product images or copy, note Merchant Center's specific obligations: IPTC `DigitalSourceType: TrainedAlgorithmicMedia` on images, and separate labeling of AI-generated product data fields.

---

## Handling new myths

When a user asks about an AEO/GEO tactic not covered above:

- Check `references/google-ai-search-guide.md` for a direct statement
- If Google's guide does not address the tactic, say so explicitly — do not extrapolate
- Recommend the user prioritize the four pillars in the audit rubric instead, since those are explicitly endorsed by Google
- Flag the tactic for future research so the user can add Google guidance to `references/` if and when Google publishes a position

Never fabricate a Google position. If the guide is silent, say it is silent.
