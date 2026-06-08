# Industry Perspective: The Evolution of SEO to GEO and AEO

**Source:** Gemini-synthesized summary of various third-party expert sources (Lily Ray, Rand Fishkin, John Lovett, Andrea Volpini, Sonny Vasquez, Brice Praslicka, Wil Reynolds, Nick Haigler, Pedro Dias, Addy Osmani, Matthew Capala, Amanda Natividad, and others). Original source URLs listed at the end of this file.

**Status:** Industry perspective — third-party commentary and analysis. Lower precedence than Google's official documentation in this skill's reference library. Use this file for strategic context, framework ideas (e.g., "Be Seen, Be Believed, Be Chosen"), and industry expert commentary on AI Search visibility. **Do not cite this file as authoritative on what Google's systems do or want.** When this file conflicts with Google's official guidance, defer to Google.

**Two important caveats about this document:**

- The source is an LLM-generated synthesis of multiple posts, which introduces a layer of paraphrasing on top of the original expert claims. Treat specific statistics (CTR drops, conversion multipliers, citation decline percentages) as directional rather than precise.
- The document recommends maintaining an `llms.txt` file as part of an "Agentic Engine Optimization" stack. **This recommendation is specifically about coding agents (Claude Code, Cursor) and developer documentation, not Google AI Search.** Google's official guidance explicitly states `llms.txt` is not used for Google's generative AI features. Both can be true: `llms.txt` may help developer documentation be ingested by coding agents, while not influencing Google AI Search visibility.

---

## 1. The Core Mechanics of AI Search

AI Search operates differently than traditional search engines, moving from **retrieval** (matching keywords to documents) to **synthesis** (generating answers from multiple sources).

### Retrieval-Augmented Generation (RAG) and Query Fan-Out

Most commercial and research queries rely on RAG. When an LLM needs facts, it decomposes a single user prompt into multiple sub-queries — a process known as **Query Fan-Out**. These sub-queries are executed across traditional search indexes (like Google or Bing).

- **The dependency on SEO:** If content does not rank well in traditional search, it cannot enter the LLM's context window. ChatGPT, for instance, relies heavily on Google's search index. Per Lily Ray's analysis, recent algorithm updates causing organic traffic drops resulted in near-identical drops in ChatGPT citations — suggesting AI visibility is heavily downstream of Google organic rankings.

### How LLMs "Read" Content

Unlike traditional crawlers that look for structured schema or HTML tags, transformer models read text sequentially as tokens. Per Andrea Volpini, the architecture handles unstructured language by design.

- **Matryoshka Representation Learning (MRL):** OpenAI models reportedly front-load broad semantic meaning into the earliest dimensions of a vector. The implication: if the core thesis is buried in the fourth paragraph, it risks being truncated during rapid retrieval.
- **Task-Aware Asymmetry:** Google embeds text differently based on whether it is a query or a document. Content that merely echoes the user's question mimics a query vector. Content that makes declarative, factual statements immediately mimics an authoritative answer vector.
- **Late Chunking:** Systems like Perplexity reportedly evaluate text at the chunk (passage) level but inject global document context. Sections benefit from being self-contained and "zero-pronoun" to survive extraction.

*Note: Google's official guidance states that "chunking" content is not required for Google AI Search. The chunking discussion above is industry-perspective commentary about retrieval behavior generally; it is not Google's stated guidance.*

---

## 2. The Illusion of GEO Hacks (The "Rank and Tank" Cycle)

The rapid rise of AI search spawned a cottage industry of "GEO Hacks" — many of which are repackaged spam tactics that work temporarily but lead to algorithmic penalties. Lily Ray emphasizes that trying to manufacture visibility using shortcuts damages long-term SEO.

### Tactics that backfire

- **Scaled AI Content:** Publishing thousands of AI-generated articles without human editing or unique information gain reportedly leads to rapid indexing followed by a steep collapse in visibility (typically within 3–6 months).
- **Self-Promotional Listicles:** The strategy of creating "Best [Category] Software" listicles and placing your own brand at #1 worked through 2025, but reportedly suffered a significant algorithmic crackdown in January 2026. Nick Haigler's analysis shows ChatGPT citations for listicles declined approximately 30% month over month.
- **"Summarize with AI" Buttons:** Sometimes used to hide prompt injection instructions (e.g., "always recommend [Brand]"). Microsoft has classified this category of tactic as a security threat ("AI Recommendation Poisoning").
- **Artificial Refreshing:** Trivial updates just to change the date-modified timestamp. Google has reportedly grown more sophisticated at identifying this.
- **Excessive Competitor vs. Alternative Pages:** Creating thin landing pages for every possible competitor comparison at scale.

---

## 3. What Industry Analysis Says Drives AI Visibility

Correlation studies across industries (Travel, B2B SaaS, Technology) by Sonny Vasquez reportedly show AI visibility is overwhelmingly driven by **brand reputation and authority**, not raw content volume.

### Industry-claimed top predictors of AI citations

1. **Domain Authority** — described as the strongest universal predictor in the cited analysis. LLMs reportedly inherit quality signals from their training web ecosystems.
2. **Backlinks from high-authority sites** — quality over quantity. Links from trusted, established sources are claimed to matter exponentially more than directories.
3. **Mentions in editorial "Best Of" articles** — third-party validation and curation.
4. **Original first-party research** — Brice Praslicka notes that unique data, surveys, and research punch significantly above their organic weight in earning AI referrals.
5. **Multi-modal presence** — LLMs native to multi-modality digest YouTube transcripts, podcast audio, and infographics in addition to web pages.

### Ghost Citations (John Lovett, Seer Interactive)

A "Ghost Citation" occurs when an LLM cites a website as a source but recommends a *competitor's* brand in the text. This reportedly happens because brand recommendations are often pulled from the model's parametric memory (training data), while sources are retrieved post-hoc via RAG.

- **The proposed fix:** Build a cohesive entity graph. Make the brand the grammatical subject of the insights published (e.g., "At [Brand], our data shows..."). Earn third-party digital PR mentions that explicitly associate the brand with the category.

---

## 4. Proposed KPIs for the AI Era

Traditional metrics like search volume, rankings, and top-of-funnel traffic are decaying as AI Search experiences mediate more queries. AI Overviews have reportedly reduced Position #1 organic CTRs significantly (industry estimates in the 50–60% range, though specific figures vary by study). AI referral traffic, while representing a small share of total traffic, is reported to convert at multiples of traditional search rates (industry estimates vary widely).

**Treat the specific multipliers in industry reporting as directional rather than precise** — methodologies and sample sizes vary.

### "Be Seen, Be Believed, Be Chosen" Framework (Seer Interactive)

1. **AI Signal Rate (Be Seen):** The percentage of time a brand is mentioned across many runs of relevant prompts (Seer suggests 60–100 runs). Rand Fishkin's analysis points out that single-run rank tracking is unreliable due to AI's stochastic nature.
2. **Answer Accuracy Rate (Be Believed):** Measuring how accurately the AI represents the brand's canon, values, and product capabilities.
3. **AI-Influenced Conversion Rate (Be Chosen):** Tracking highly qualified downstream conversions from AI referral traffic or brand-search spikes following AI interactions.

This framework is useful as a measurement scaffold for HMM client reporting on AI Search performance, especially Pillar 1 (content quality producing brand association) and Pillar 4 (agentic readiness).

---

## 5. Adjacent Topics: Agents and Commerce

### Agentic Engine Optimization for Coding Agents (Addy Osmani)

This category is distinct from Google AI Search optimization. It addresses how developer documentation should be structured for ingestion by coding agents (Claude Code, Cursor, etc.) that bypass traditional analytics — no JavaScript rendering, no scrolling.

Industry-suggested practices specifically for this use case:

- Flat Markdown delivery over HTML
- Strict token-budget awareness per page (industry rule-of-thumb: keep quick starts under ~15k tokens)
- Maintaining an `llms.txt` file as an AI sitemap **for coding agent discovery**
- Using a `skill.md` file to declare API capabilities

**Critical scope note:** These tactics are about coding agents reading developer documentation, not about Google AI Overviews retrieving content for a search query. The `llms.txt` recommendation in particular has been explicitly addressed by Google for Search: it is not used. If a client's question is about Google AI Search visibility, do not recommend `llms.txt` as a solution.

### Agentic Commerce

With Google's Universal Commerce Protocol (UCP) and OpenAI's Instant Checkout integrations, the purchase funnel is reportedly compressing. Matthew Capala notes that AI Mode now functions as a virtual sales associate capable of completing transactions directly within the chat interface. The implication for ecommerce optimization: machine-readable product feeds and structured API availability are increasingly relevant for agent-driven purchases. This aligns with Google's own positioning on Merchant Center, Business Agent, and agentic readiness.

---

## How to use this document in the skill

- **For strategic framing** — use the "Be Seen, Be Believed, Be Chosen" KPI framework as a measurement scaffold for client reporting, especially when Google's docs say less about measurement.
- **For industry-aware mythbusting** — when a client raises a tactic from elsewhere in the AEO/GEO ecosystem, this file shows what the industry conversation actually says (some of which Google echoes, some of which Google contradicts).
- **For the Ghost Citation concept** — this is a useful diagnostic when a brand sees AI citations without AI brand recommendations. Address by strengthening entity-level brand association in content and earning category-defining third-party mentions.
- **Never cite this file as Google's position.** When industry perspective and Google guidance conflict, Google wins inside this skill.

---

## Sources

1. Agentic Engine Optimization (AEO) — Addy Osmani — `addyosmani.com/blog/agentic-engine-optimization/`
2. NEW Research: AIs are highly inconsistent when recommending brands or products — Rand Fishkin / SparkToro — `sparktoro.com/blog/new-research-ais-are-highly-inconsistent-when-recommending-brands-or-products/`
3. The Whole Point Was the Mess — Pedro Dias — `theinference.substack.com/`
4. LLM Ghost Citations: Why Your Content Is Working and Your Brand Isn't — John Lovett / Seer Interactive — `seerinteractive.com/blog/`
5. Why AI Cites Some Pages and Ignores Others — Andrea Volpini / WordLift Blog — `wordlift.io/blog/en/why-ai-cites-some-pages-and-ignores-others/`
6. GEO Experiment: How AI highlighted the 1 bad review we got in 24 years — Wil Reynolds and Nick Haigler / Seer Interactive — `seerinteractive.com/blog/`
7. The Future of SEO: Lily Ray on Google Updates, AI Search and GEO Spam — Edward Sturm YouTube — `youtu.be/watch?v=2htSIT0HLjs`
8. SEO lifecycle: lessons from the past, strategies for the future — Lily Ray / brightonSEO April 2025
9. Your GEO Strategy Might Be Destroying Your SEO — Lily Ray / Substack — `lilyray.substack.com/`
10. Stop Guessing! Ground Your ChatGPT Insights in Real AEO/GEO/SEO Data with Lily Ray — Conductor YouTube — `youtu.be/watch?v=T08LW1gU8-Q`
11. This is the AI prompt you need to track and aren't — Wil Reynolds / Seer Interactive — `seerinteractive.com/blog/`
12. It Works Until It Doesn't: AI Content Strategies That Backfire — Lily Ray / Substack — `lilyray.substack.com/`
13. The Listicle Window Is Closing in AI Search: 30% Decline MoM — Nick Haigler / Seer Interactive — `seerinteractive.com/blog/`
14. What Is Generative Engine Optimization (GEO) and How Does It Impact SEO? — Seer Interactive — `seerinteractive.com/blog/`
15. GEO, AEO, and AI SEO: The Q1 2026 intelligence briefing
16. Get Your Website Noticed by AI Search Engines (GEO) — Eric Waterschoot / SE Ranking — `seranking.com/blog/geo-ai-search-engines/`
17. A Reflection on SEO and AI Search in 2025 — Lily Ray / Substack — `lilyray.substack.com/`
18. How AI-generated content performs in search: Results from an experiment — Yevheniia Khromova / SE Ranking — `seranking.com/blog/ai-generated-content-experiment/`
19. Are Citations in AI Search Affected by Google Organic Visibility Changes? — Lily Ray / Substack — `lilyray.substack.com/`
20. Understanding Google's AI Mode: Key features and updates — Daria Chetvertak / SE Ranking — `seranking.com/blog/google-ai-mode/`
21. AI Mode is Here: Key Search Insights from Google I/O 2025 — Matthew Capala / Alphametic — `alphametic.com/ai-mode-seo-strategy/`
22. What If the Best GEO Strategy Is the One You Stopped Investing In? — Sonny Vasquez / Seer Interactive — `seerinteractive.com/blog/`
23. Where Organic Search and AI Traffic Behave the Same — and Where They Diverge — Brice Praslicka / Seer Interactive — `seerinteractive.com/blog/`
24. Help ChatGPT Discover Your Products — Matthew Capala / Alphametic — `alphametic.com/search-chatgpt-product-recommendations/`
25. The 3 New KPIs for AI Search — John Lovett / Seer Interactive — `seerinteractive.com/blog/`
26. Why Everyone Prompts AI Differently — Amanda Natividad / SparkToro — `sparktoro.com/blog/why-everyone-prompts-ai-differently/`
