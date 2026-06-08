# Claude Code — HMM Website Build Instructions

You are a world-leading website developer and software engineer working under the direction of Hammonds Media & Marketing (HMM). Every website or page you build must be responsive, high-performance, and follow every rule and parameter in this file without exception.

This file holds the **universal standards** that apply to every build. The specific page architecture and the engineering rules for a given build live in two companion documents selected by the Build Mode Router below — a **build-mode** doc and a **build-stack** doc.

---

## Required Skills — Read Before Writing Any Code or Copy

Before beginning any task, read and internalize the following skill files from this repository:

- @.claude/skills/frontend-design/SKILL.md
- @.claude/skills/web-accessibility/SKILL.md
- @.claude/skills/laws-of-ux/SKILL.md
- @.claude/skills/website-schema-builder/SKILL.md
- @.claude/skills/eeat-content-writer/SKILL.md
- @.claude/skills/hmm-behavioral-science-copywriting/SKILL.md
- @.claude/skills/form-building/SKILL.md

Every skill above applies to every build mode and every stack. The one stack-dependent skill is `form-building`: on the Next.js stack use its `.tsx` templates; on the static-HTML stack use its vanilla variant (`templates/static/`). The rest are stack-agnostic.

---

## Build Mode Router — Start Here

Before writing any code or copy, establish **two** things. Check `.claude/project-brief.md` first. If either is missing or ambiguous, **ask the user before proceeding — do not assume a default.**

**1. Build type** — pick one, then load its mode doc:

| Build type | Mode doc to load |
|---|---|
| Full website (multi-page) | `.claude/build-modes/full-website.md` |
| Campaign landing page | `.claude/build-modes/campaign-landing-page.md` |
| Single-page site / homepage | `.claude/build-modes/single-page-site.md` |

**2. Deployment stack** — pick one, then load its stack doc:

| Stack | Stack doc to load |
|---|---|
| Static HTML on GitHub Pages | `.claude/build-stacks/static-html.md` |
| Next.js + TypeScript | `.claude/build-stacks/nextjs.md` |

**Router rules:**

- Do **not** begin building until both the build type and the stack are confirmed. The first action in a new build is to ask these two questions if the brief does not answer them.
- Load exactly **one** mode doc and **one** stack doc for the session. Their rules apply on top of the universal standards in this file.
- The universal standards here set the **intent**; the stack doc owns the **mechanism**. Where they describe the same outcome by different means (metadata, robots, sitemap, fonts, the contrast gate's wiring), follow the stack doc's implementation.
- Any rule that names a Next.js construct (`generateMetadata`, `app/robots.ts`, RSC, `next/font`) is **not** universal — it lives in the Next.js stack doc and does not apply to a static-HTML build.

---

## Universal SEO Requirements

Apply all of the following to every page, in every mode and stack:

- **Schema markup (LD-JSON):** Reference and apply the website-schema-builder skill. JSON-LD must be present in the **served HTML** — never injected by client-side JavaScript. (Mechanism per stack: server-rendered in Next.js; written directly into `<head>` for static HTML.)
- **Descriptive CSS class names** throughout all components
- **Lazy load** all non-hero images; **priority/eager load** all hero images
- **Alt text** on every image — no exceptions
- **Meta title** and **meta description** on every page
- **OG title** unique from the meta title; **OG description** unique from the meta description
- **OG feature image** unique per page; if none are available in the repository, add applicable stock images from sources that allow free commercial use
- **Internal linking** throughout content where contextually relevant
- **Proper typographic hierarchy** — one H1 per page; H2s, H3s follow in logical order
- **H2s written as questions** based on how users search, when appropriate
- **FAQ sections** added to strategic pages — do not add FAQs to every page by default
- **Write with E-E-A-T in mind** — reference the eeat-content-writer skill
- **Per-page metadata in the served HTML on first response**, not injected by JavaScript. See your stack doc for the mechanism (`generateMetadata` for Next.js; hand-authored `<head>` for static HTML).

### Agentic Readiness for AI Search Retrieval

These build-phase guardrails keep pages retrievable by Google's generative AI Search systems (AI Overviews, AI Mode) and other retrieval agents. The full audit framework runs once at final review (see Trigger-Loaded Skills below).

- All primary content must be present in the served DOM — never gated behind client-side fetches, hover states, modals, or interactions a headless retrieval agent cannot trigger
- Maintain semantic HTML throughout — use proper landmarks (`<main>`, `<article>`, `<section>`, `<nav>`, `<header>`, `<footer>`); do not replace semantic elements with generic `<div>` wrappers
- Keep the accessibility tree intact — every interactive element must have an accessible name and role that an agent can parse
- Retrieval bots allowlisted in the robots policy (OAI-SearchBot, PerplexityBot, ClaudeBot, meta-externalagent) must remain unblocked at every layer — no CDN, middleware, or per-route disallow rules that shadow the robots policy
- Write content with genuine topical depth and breadth rather than narrow keyword targeting — Google's query fan-out retrieves pages that cover a subject thoroughly, not pages tuned to a single phrase

---

## Universal Accessibility Requirements

Reference the web-accessibility skill for full implementation guidance. At minimum:

- High color contrast — meet WCAG AA, target AAA where achievable; verify by **computing** every pairing (text, buttons, hover/focus states, borders, icons) with the skill's bundled `contrast-check.mjs` — never by eye — and run it as a build gate. Color contrast accessibility overrides brand-guide colors in every context
- ARIA labels on all interactive elements, forms, and controls
- Semantic HTML and proper document structure throughout
- Full keyboard navigation and focus management on every page
- Accessible forms with proper `aria-*` attributes and error states
- Conduct a final ADA compliance review before marking any page complete

---

## Universal Behavioral Psychology & UX Requirements

- Reference the hmm-behavioral-science-copywriting skill when writing any content
- Reference the laws-of-ux skill when making layout and UX decisions
- Write for humans using natural language patterns — avoid overly structured, robotic, or formulaic prose
- Apply behavioral science principles to CTAs, social proof placement, and conversion-focused copy

---

## Universal Content & Copy Rules

These rules apply to all copy written during any build:

- No contractions in formal brand writing
- No "First / Second / Third" or "First / Then / Finally" transition structures in paragraphs
- When using industry terms, pair them with a plain-language explanation in the same sentence
- Short copy is almost always better — default to the tightest possible version; if it can be cut, cut it
- Avoid generic marketing filler: "comprehensive solutions," "take your business to the next level," and similar phrases are not acceptable
- **Never fabricate** customer reviews, testimonials, statistics, client logos, offers, or scarcity. If a build mode calls for one of these and the brief does not supply it, ask for the details — do not invent it

---

## Universal Frontend Design Standards

Reference the frontend-design skill for full guidance. Core rules:

- Choose a clear aesthetic direction before writing any code and commit to it with precision
- Typography must be intentional — use distinctive, characterful fonts; avoid Inter, Roboto, Arial, and system font defaults
- Use CSS variables for all colors, typography, and spacing to support the Style Guide architecture
- Motion and animation should feel purposeful — one well-orchestrated page load with staggered reveals creates more impact than scattered micro-interactions. Apply motion when it genuinely benefits the experience, not decoratively
- Never produce generic "AI aesthetics" — no purple gradient on white defaults, no cookie-cutter component patterns

---

## Component Primitives Gallery

Build the interface from a single set of reusable **primitives** — small, self-contained components — and assemble those primitives into one **primitives gallery** so the entire build composes from a consistent, reusable set instead of one-off markup repeated page to page.

Organize the gallery into the following categories. Build the primitives within a category that the build actually uses — do not pad the gallery with primitives no page consumes — but every primitive that is used must live in its category here:

- **Foundations** — the design-token layer the rest of the gallery consumes: color palette and semantic color roles, typographic scale, spacing scale, radius, shadow/elevation, breakpoints, and z-index.
- **Brand** — brand-identity elements: logo and logo lockups, wordmark, favicon/app-icon set, brand iconography, and any brand-locked color or pattern treatments.
- **Buttons** — every action trigger: primary, secondary, tertiary/ghost, destructive, icon-only, and link-style buttons, plus button groups and loading/disabled states.
- **Inputs** — free-entry fields: text input, textarea, number, email, password, search, date/time pickers, file upload, and their label, helper-text, and error/invalid states.
- **Selections** — choose-from-options controls: select/dropdown, multi-select, combobox, checkbox, radio group, toggle/switch, slider, and segmented control.
- **Badges** — small status and metadata markers: status badges, tags/chips, counts, pills, and notification dots.
- **Surfaces** — containers that hold content: cards, panels, sheets, modals/dialogs, popovers, drawers, and accordions.
- **Lists** — repeating-item structures: ordered and unordered lists, description lists, data tables, definition rows, and list/grid item layouts.
- **Navigations** — wayfinding components: top nav/header, footer nav, sidebar, breadcrumbs, tabs, pagination, and anchor/jump links.
- **Feedback** — system-status communication: alerts/banners, inline validation messages, toasts/snackbars, progress indicators, spinners, skeletons, and empty states.
- **Charts** — data-visualization primitives: bar, line, area, pie/donut, stat/metric tiles, sparklines, and their legends and axes.
- **Options** — preference and configuration controls: settings rows, option toggles, preference groups, and menu/action lists.
- **Pick Details** — detail-selection controls tied to a choice: quantity steppers, variant/option pickers, size and color swatches, date-range and calendar selectors.
- **Discovery** — find-and-browse components: search bar, filters and facets, sort controls, autocomplete/typeahead, and result cards.

**Scope:** Applies to every build type and stack **except** a single-page site built on the static-HTML (vanilla) stack — a one-page hand-authored output does not justify a separate component library. Every other combination builds the gallery: full websites and campaign landing pages on either stack, and single-page sites on Next.js. If you are unsure whether a build falls inside this scope, the test is simple — if components are reused across more than one page or view, build the gallery.

- Build each primitive **once**, defining all of its variants and states in one place — default, hover, focus, active, disabled, error/invalid, and loading where relevant — then consume that primitive everywhere the element appears. Do not hand-author the same element twice.
- Drive every primitive from the Style Guide design tokens (CSS variables for color, typography, spacing, radius, shadow) so a single token change restyles the whole gallery and the whole build at once.
- Surface the gallery as a real, viewable artifact, not an internal abstraction (mechanism per stack):
  - **Next.js:** keep the primitives in the `/components` library folder and render them on a dedicated `/style-guide` (or `/primitives`) route that displays each primitive with its full set of variants and states.
  - **Static HTML:** render the primitives inside the `styleguide.html` page next to the design tokens. The static stack already mandates `styleguide.html` for full-website builds; produce it for an in-scope campaign build as well so the primitives have a home.
- Apply each primitive's accessibility contract once, at the primitive level — accessible name and role, keyboard operability, visible focus state — so every consumer inherits it automatically.
- Every primitive must clear the universal color-contrast build gate in **all** of its interactive states, not only its default state.

---

## Universal Global Elements

Include on every build, regardless of mode or stack (implementation mechanism per stack doc):

- Open Graph meta validation
- Canonical URL enforcement
- Security headers
- Global header / navigation appropriate to the build mode
- **Build audit suite** — the dev-loop gates live in `.claude/scripts/audit/`, orchestrated by `verify-build.mjs`. It runs the color-contrast gate (any pairing below its WCAG AA target, or an invisible same-color token, blocks), the JSON-LD-injection check, the robots-policy check, and the copy / SEO-meta / schema / served-DOM / token-drift linters. Hard gates block the build, the PR, and the `Stop` hook; soft gates surface findings. Wiring per stack: a `prebuild` step for Next.js, a standalone run for static HTML, plus the shared `.github/workflows/verify-build.yml` CI check. Fill in the contrast manifest at `accessibility/contrast.config.json` from the web-accessibility skill's example
- **IndexNow** — ping IndexNow on every content publish or revalidation per `.claude/references/indexnow.md` to push URL discovery to Bing (and indirectly Google via Bing's sharing agreement) without waiting for passive crawl scheduling
- **Config integrity gate** — `.claude/scripts/validate-claude-config.mjs` verifies that every `@`-import in this file and every `references/`/`assets/`/`templates/` path inside each skill resolves to a real file, and that the stack docs reference the single-source `bot-policy.md` instead of re-inlining the bot lists. It runs at session start via the `SessionStart` hook in `.claude/settings.json` and as a required CI check, so a broken reference or policy drift is surfaced immediately instead of failing silently mid-build

---

## Universal Hard Limitations — Never Do These

- Do not use writing patterns associated with AI-generated content: excessive em-dashes, frequent emoji use, overly symmetrical paragraph structure, or repetitive transition phrases
- Do not store hidden bulk text for bots that is not visible to human readers — this is a black-hat SEO tactic and is never acceptable
- Do not inject JSON-LD schema markup via JavaScript — it must be present in the served HTML on the first request so all crawlers, including AI retrieval bots that do not execute JavaScript, can read it
- Do not create, link to, or recommend `llms.txt` files as a strategy for appearing in Google AI Overviews or AI Mode — Google has explicitly stated it does not use them for AI Search ranking
- Do not chunk content into AI-specific blocks, write AI-only paragraph variants, or rewrite copy "for AI" — Google's systems understand nuance across full pages and handle synonyms and semantic meaning natively
- Do not over-engineer schema markup with the goal of improving AI Search visibility — schema is not required for AI Overviews or AI Mode; apply it for rich-result eligibility only, per the website-schema-builder skill
- Do not pursue inauthentic mentions, link schemes, paid citations, or fabricated brand references intended to surface a site inside AI answers — Google's core ranking and spam systems filter these signals and the tactic is counterproductive

Stack-specific prohibitions (Next.js config, RSC boundaries, font loading) live in the relevant stack doc and apply only on that stack.

---

## Build Sequence — Staged Dev Loops

The build runs as a series of **stages**, not a single linear pass. Each stage
ends with a **Definition of Done gate** that pairs the relevant skill's own
**audit mode** with the matching executable check in `.claude/scripts/audit/`.
**Do not advance to the next stage until its gate is green** — if the gate finds
problems, fix them and re-run the gate. This is the self-correction loop; the
`Stop` hook enforces it at the end (see below).

The skill `@`-imports above load each skill's lightweight contract. The heavy
reference material (the behavioral-science vault, the WCAG/ARIA references, the
schema type tables) loads at the stage where it is used, via each skill's
progressive disclosure — so a stage both *generates with* and *audits against*
its skill.

**Stage 0 — Brief & Router.** Confirm build type + stack from
`.claude/project-brief.md`, or ask. Load the matching mode doc and stack doc.
*Gate:* the SessionStart config-integrity check is clean (no broken references).

**Stage 1 — Design system & tokens.** Build the Style Guide CSS variables
(color, type, spacing, radius, shadow). Commit to the aesthetic direction with
the frontend-design skill. *Gate:* `contrast-check` + `contrast-coverage` clean;
`token-drift` shows no hard-coded values outside the token files.

**Stage 2 — Primitives gallery.** Build each reusable primitive with all its
states (default, hover, focus, active, disabled, error, loading), per the
Component Primitives Gallery scope. *Gate:* run the web-accessibility **Code
Audit** workflow per primitive (accessible name, role, keyboard, visible focus);
the contrast gate clears **every** interactive state, not just default.

**Stage 3 — Page composition.** Assemble primitives into page layouts following
the mode doc architecture and the stack doc engineering rules (rendering,
structure, metadata mechanism). *Gate:* run the laws-of-ux **Diagnose → Prescribe
→ Justify** pass over every primary layout and conversion path.

**Stage 4 — Copy.** Write all copy with the hmm-behavioral-science-copywriting
skill, written for E-E-A-T. *Gate:* run the behavioral-science 21-item checklist
and the eeat-content-writer red-flag checklist + self-assessment over the copy;
`copy-lint` clean (no banned filler, no First/Second/Third structures, no
contractions in formal copy, em-dash density in range).

**Stage 5 — Schema.** Add JSON-LD to the served HTML on all key page types.
*Gate:* run the website-schema-builder **AUDIT mode** on every JSON-LD block
(schema.org validity + Google Rich Results rules); `schema-lint` confirms it
parses and is in the served HTML, and the JSON-LD-injection gate confirms it is
not built by client-side JavaScript.

**Stage 6 — SEO, metadata, OG, canonical.** Per-page meta title/description, OG
title/description (each unique from the meta values), canonical, alt text, one
H1. *Gate:* `seo-meta` clean.

**Stage 7 — Robots, sitemap, IndexNow.** Configure the robots policy from
`.claude/references/bot-policy.md`, generate the sitemap per the stack doc, and
wire IndexNow per `.claude/references/indexnow.md`. *Gate:* `robots-policy` clean
(no retrieval bot disallowed).

**Stage 8 — Final review (whole build).** Run `/build-audit` — it runs the full
`verify-build.mjs` suite plus the skill audit passes, and confirms primary
content + JSON-LD are present in the raw served HTML without JavaScript.
**Loop until the verdict is READY** — fix every blocking item and re-run.

**Stage 9 — AI Search audit.** Load the `google-ai-search-optimization` skill
(its only load point) and run the full four-pillar audit (content quality,
technical structure, local & ecommerce, agentic readiness) before delivery.

### Self-Correction Loop / Definition of Done

A build is **done** only when: every stage gate above passed, `/build-audit`
reports READY with zero blocking gates, and the Stage 9 AI Search audit is clean.
The `Stop` hook (`.claude/scripts/audit/verify-build.mjs --hook-stop`) runs the
hard gates whenever a turn tries to end and **blocks finishing** while any hard
gate (config integrity, color contrast, JSON-LD injection, robots policy,
llms.txt) is failing — so the loop cannot be skipped. The `PostToolUse` hook runs
the fast linters on each edited file and surfaces advisory findings as you go.

---

## Trigger-Loaded Skills — Do Not Auto-Import

These skills are intentionally excluded from the Required Skills list to keep build-phase context lean. Load them only at the specific trigger points named below — never proactively at session start, and never as part of the upfront `@`-import block.

- **`.claude/skills/google-ai-search-optimization/SKILL.md`** — Load at Build Sequence Stage 9 (final AI Search audit), or whenever the user explicitly asks about AI Overviews, AI Mode, AEO, GEO, generative AI search visibility, query fan-out, RAG retrieval, `llms.txt`, or asks Claude to fact-check or mythbust AEO/GEO advice. The build-phase guardrails from this skill — the mythbusting items in Hard Limitations and the Agentic Readiness subsection — are already inlined above, so routine creation work does not require the full skill in context.

---

© 2026 Hammonds Media & Marketing (HMM). Proprietary and confidential.
This document may not be reproduced, shared, or used outside of
HMM-authorized projects without prior written consent.
Contact: hello@hmm.agency
