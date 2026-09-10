# Robots Bot Policy — Single Source of Truth

This file is the **one** canonical definition of the crawler allow/deny policy
for every HMM build. The stack docs (`build-stacks/nextjs.md`,
`build-stacks/static-html.md`) link here instead of restating the lists, and
`.claude/scripts/audit/robots-policy-lint.mjs` parses the JSON block below as the
authority it checks a generated `robots.ts` / `robots.txt` against. Edit the bot
lists in one place — here — and both stacks and the linter stay in sync.

The principle: **the same content is served to every agent; only training-data
collection is restricted.** Allowing a retrieval/indexing agent while disallowing
a training scraper is not cloaking — it is a crawl-purpose distinction, not a
content distinction.

## Allow — retrieval and indexing bots

These agents fetch pages to answer user queries or to build a search index.
Blocking them removes the site from search and from AI-Search retrieval, so they
must remain allowed at every layer (robots, CDN, middleware, per-route rules).

- **Googlebot** — Google Search indexing
- **Bingbot** — Bing Search indexing
- **Slurp** — Yahoo Search indexing
- **DuckDuckBot** — DuckDuckGo indexing
- **OAI-SearchBot** — OpenAI's retrieval agent used in ChatGPT search
- **PerplexityBot** — Perplexity retrieval
- **ClaudeBot** — Anthropic retrieval
- **meta-externalagent** — Meta retrieval agent

## Disallow — training scrapers

These agents collect datasets to train models rather than to answer a live query.
Disallowing them keeps site content out of training corpora without affecting
search or AI-Search retrieval.

- **GPTBot** — OpenAI training
- **CCBot** — Common Crawl
- **Google-Extended** — Gemini training data
- **Diffbot** — dataset collection
- **Bytespider** — ByteDance dataset collection
- **FacebookBot** — Meta dataset collection
- **omgili** — dataset collection

Plus any agent whose documented purpose is dataset collection rather than
retrieval.

## Machine-readable policy

`robots-policy-lint.mjs` reads the JSON below. Keep it identical to the prose
lists above.

```json
{
  "allow": [
    "Googlebot",
    "Bingbot",
    "Slurp",
    "DuckDuckBot",
    "OAI-SearchBot",
    "PerplexityBot",
    "ClaudeBot",
    "meta-externalagent"
  ],
  "disallow": [
    "GPTBot",
    "CCBot",
    "Google-Extended",
    "Diffbot",
    "Bytespider",
    "FacebookBot",
    "omgili"
  ]
}
```
