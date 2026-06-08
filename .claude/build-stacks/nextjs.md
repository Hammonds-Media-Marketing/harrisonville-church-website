# Build Stack — Next.js + TypeScript

Loaded by the Build Mode Router in `CLAUDE.md` when the deployment stack is
Next.js. Owns the engineering mechanism for the universal standards. Applies on
top of `CLAUDE.md` and the chosen mode doc.

---

## Code Stack

- **Framework:** Next.js (latest stable version), App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS

---

## Development Rules — Non-Negotiable

- Use `next.config.js`, not `next.config.ts` — TypeScript config requires a Next.js version that may not be in use; `next.config.js` works across all versions
- When using `next/font/google`, do NOT add a `@import url()` for the same font in CSS — `next/font` handles font loading internally via webpack; the two conflict and will cause issues
- Do NOT add manual `<link rel="preconnect">` tags for Google Fonts when using `next/font` — it injects its own preconnect hints automatically
- Always include `autoprefixer` in `package.json` devDependencies whenever `postcss.config.js` references it
- Create a `/components` library folder in the repository with all components built during the project
- Apply motion design and animation when it genuinely benefits user experience — not decoratively for its own sake

---

## React Server Component Rules — Non-Negotiable

The App Router makes every component a React Server Component (RSC) by default. This is the correct behavior for SEO and performance. Do not override it without a specific reason.

- **Default every component to Server Component.** If a component does not require browser APIs, user interaction, `useState`, `useEffect`, or event handlers, it must remain a Server Component — no exceptions.
- **Place `'use client'` only at the leaf level** — the smallest possible interactive unit. A button, a modal trigger, a form input, a dropdown toggle.
- **Never place `'use client'` on layouts, page wrappers, navigation components, or any parent that wraps primarily static content.** Doing so silently converts the entire subtree to client rendering, eliminating all RSC benefits and shipping unnecessary JavaScript to the browser.
- When a layout or page needs one interactive child, pass the interactive element as a `children` prop from a parent Server Component into a Client Component wrapper — this preserves the server boundary for everything else.
- Components that fetch data, access environment variables, query a database, or read from a CMS must always be Server Components. Never fetch data inside a Client Component when a Server Component can own that data.

---

## Rendering Strategy Per Route Type

Apply the rendering mode below to each route type. Do not apply a single rendering strategy to the entire site.

| Route Type | Rendering Mode | Next.js Config |
|---|---|---|
| Home, About, Services, Privacy, Cookie Policy | Static (SSG) | `export const dynamic = 'force-static'` |
| Blog collection, blog article pages | ISR | `export const revalidate = 3600` (or per CMS webhook) |
| Contact page, forms | SSR or Edge | `export const dynamic = 'force-dynamic'` |
| Style Guide | Static | `export const dynamic = 'force-static'` |
| 404 page | Static | Default Next.js behavior |

Align ISR `revalidate` timing with the actual CMS publish frequency — do not set an arbitrary interval.

---

## Streaming and Suspense Rules

- Wrap every async data-fetching Server Component in a `<Suspense>` boundary with a meaningful `fallback` — never leave the page blocking on a single slow fetch.
- Add `loading.tsx` at route segment level for route-level streaming fallbacks.
- Use `react.cache()` to deduplicate data fetches for non-HTTP data sources (database clients, SDK calls) within the same render pass.
- Stream the page shell first. Content below the fold or secondary to the primary user intent should be deferred behind Suspense, not blocking the initial response.
- Do not use `useEffect` to fetch data. Data fetching belongs in Server Components using `async/await` directly in the component body.

---

## Metadata Mechanism

- **Use `generateMetadata`** (App Router) for all per-page metadata — title, description, canonical, OG, and Twitter Card tags must all be present in the server-rendered HTML on the first request, not injected by JavaScript.
- OG title/description must be unique from the meta title/description (universal rule).
- Inject all JSON-LD server-side in the `<head>` via a server component — never via client-side JavaScript.

---

## Robots Policy — `app/robots.ts`

Generate `app/robots.ts` with explicit bot differentiation. The default of allowing all crawlers treats training scrapers the same as retrieval agents — this is not acceptable.

- Apply the canonical allow/deny lists from the single source of truth: `.claude/references/bot-policy.md`. Do not restate the bot names here — `robots-policy-lint.mjs` validates the generated `app/robots.ts` against that file, so the policy lives in exactly one place.
- Use one `userAgent` rule per allowed retrieval bot (allow `/`) and one per disallowed training scraper (disallow `/`).
- Point the `Sitemap` directive to the generated `/sitemap.xml` URL.

This is not cloaking — the same content is served to all agents; only training data collection is restricted.

---

## Sitemap — `app/sitemap.ts`

Generate `app/sitemap.ts` dynamically from routes and CMS data — never hardcoded. For full-website builds, follow the Sitemap Content Rules in `build-modes/full-website.md` (route coverage, `lastModified`, `changefreq`, `priority`).

---

## Build Audit Gate (Next.js wiring)

The audit suite already lives in the template at `.claude/scripts/audit/` and
the contrast gate at `.claude/skills/web-accessibility/assets/` — nothing to copy
in. Wire it to the build:

- Copy the contrast manifest `.claude/skills/web-accessibility/assets/contrast.config.example.json` → `accessibility/contrast.config.json` and fill in every real pairing and state. Point `cssFiles` at the build's CSS (e.g. `app/globals.css`).
- Add a `prebuild` script to `package.json`: `"prebuild": "node .claude/scripts/audit/verify-build.mjs"` so a failing **hard** gate blocks `next build`.
- The `.github/workflows/verify-build.yml` workflow already runs the same orchestrator on every push/PR as a required check — hard gates block the PR, soft gates report.

---

## IndexNow

Follow `.claude/references/indexnow.md` (single source of truth) — Next.js
mechanism: ping from the ISR revalidation / CMS publish handler.

---

## Stack-Specific Hard Limitations — Never Do These

- Do not add manual Google Fonts `<link>` or `@import` tags when `next/font` is in use
- Do not use `next.config.ts` — use `next.config.js`
- Do not place `'use client'` at the top of a layout, page, or parent wrapper component — this silently downgrades the entire subtree to client rendering and eliminates the SEO and performance benefits of React Server Components
- Do not fetch data inside Client Components using `useEffect` — data fetching belongs in Server Components

---

## Forms

Use the `form-building` skill's Next.js `.tsx` templates (`templates/ContactForm.tsx.template`, `templates/AttributionTracker.tsx.template`) and follow that skill's App Router wiring.
