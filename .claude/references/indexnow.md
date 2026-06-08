# IndexNow — Single Source of Truth

This file is the **one** canonical definition of the IndexNow requirement. The
stack docs link here for the mechanism; do not restate the intent in each stack
doc.

## Intent (universal)

Ping IndexNow on every content publish or revalidation so new and updated URLs
are pushed to Bing immediately instead of waiting for passive crawl scheduling.
Bing shares IndexNow submissions with other participating engines, so a single
ping accelerates discovery across multiple search surfaces. This is a discovery
accelerator, not a ranking signal — it does not replace a correct sitemap or a
correct robots policy.

## Mechanism per stack

- **Next.js** — Ping from the revalidation path: in the ISR revalidation webhook
  handler (or the CMS publish handler), POST the changed URLs to the IndexNow
  endpoint after a successful publish/revalidate. Keep the IndexNow key in an
  environment variable and host the key verification file as a static route.

- **Static HTML** — On publish, submit the changed URLs to IndexNow with a
  simple HTTPS GET/POST carrying the site's IndexNow key. No server is required;
  the ping can be a one-off `curl` in the publish step. Host the key file at
  `site/<key>.txt`.

## Key handling

- The IndexNow key is a public verification token (it is hosted at a public URL),
  but treat it as build configuration: do not hard-code it inline in committed
  source — read it from configuration/environment so it can rotate.
- Submit only canonical, indexable URLs — never URLs disallowed by the bot
  policy in `bot-policy.md`, and never non-canonical variants.
