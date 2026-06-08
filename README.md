# HMM Base Repository

The starting point for every website build at **Hammonds Media & Marketing (HMM)**.

This repository is not a finished website. It is the scaffold that every HMM
project is cloned from — a Claude Code configuration plus a library of skills
that encode HMM's standards for engineering, design, accessibility, SEO, and
copywriting. Clone it, drop in a project brief, and Claude Code builds the site
against a fixed set of rules so every deliverable meets the same bar.

---

## How it works

Two pieces drive every build:

1. **`.claude/CLAUDE.md`** — the build contract. It defines the tech stack,
   rendering strategy per route type, React Server Component rules, the default
   page architecture, SEO and accessibility requirements, content and copy
   rules, and the step-by-step build sequence. Claude Code reads it
   automatically at the start of every session and follows it without
   exception.

2. **`.claude/skills/`** — specialized capabilities Claude loads on demand.
   Each skill carries deep, source-grounded guidance for one domain (design,
   accessibility, schema, content, copy, forms, AI Search). Most are imported
   at session start; one is trigger-loaded only at final review to keep
   build-phase context lean.

To start a project: replace the contents of `.claude/project-brief.md` with the
client brief (company info, brand/style variables, any custom parameters), then
open the repository in Claude Code and describe what you want built.

---

## Tech stack produced

Builds target a modern, SEO-first Next.js stack:

- **Framework:** Next.js (App Router, latest stable)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, with a CSS-variable design system driven by a
  Style Guide page

Server Components are the default; `'use client'` is reserved for leaf-level
interactivity. Rendering mode is set per route — static for marketing pages,
ISR for blog content, dynamic for forms.

---

## Repository structure

```
.
├── README.md                            This file
├── .github/
│   └── workflows/
│       ├── validate-claude-config.yml   CI check — fails on a broken .claude reference
│       ├── verify-build.yml             CI check — runs the build audit suite (hard gates block)
│       └── deploy-pages.yml             Publishes a static-html build to GitHub Pages
└── .claude/
    ├── CLAUDE.md                        Build contract — staged dev loops every site follows
    ├── settings.json                    Registers SessionStart, PostToolUse, and Stop hooks
    ├── project-brief.md                 Per-project brief (replace before building)
    ├── build-modes/                     Page architecture per build type
    ├── build-stacks/                    Engineering mechanism per deployment stack
    ├── commands/
    │   └── build-audit.md               /build-audit — full final-review audit on demand
    ├── references/
    │   ├── bot-policy.md                Single source of truth for the crawler allow/deny policy
    │   └── indexnow.md                  Single source of truth for IndexNow
    ├── hooks/
    │   └── session-start.sh             Runs the config validator when a session opens
    ├── scripts/
    │   ├── validate-claude-config.mjs   Verifies every @-import and skill reference resolves
    │   └── audit/                       The dev-loop audit suite (see below)
    └── skills/                          Skill library (see below)
```

---

## Skill library

| Skill | Purpose |
|---|---|
| `frontend-design` | Distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics |
| `web-accessibility` | ADA/WCAG auditing, remediation, and the color-contrast build gate |
| `laws-of-ux` | UX critique and layout decisions grounded in behavioral heuristics |
| `website-schema-builder` | JSON-LD structured data generation and validation for rich-result eligibility |
| `eeat-content-writer` | Content written and audited to Google's E-E-A-T standard |
| `hmm-behavioral-science-copywriting` | Marketing copy grounded in HMM's behavioral science vault |
| `form-building` | Wires contact forms to a hosted endpoint with anti-spam and UTM attribution capture |
| `google-ai-search-optimization` | Audits pages for AI Overviews / AI Mode retrieval (trigger-loaded at final review) |

---

## Config integrity gate

The build contract depends on its references resolving — a `@`-import in
`CLAUDE.md` or a skill that points at a missing file fails silently and the
guidance simply never loads. `.claude/scripts/validate-claude-config.mjs`
(dependency-free Node) closes that gap. It confirms every `@`-import and
`.claude/...` path in `CLAUDE.md`, every `references/` and `assets/` file named
in each skill's `SKILL.md`, and that each skill folder contains a `SKILL.md`.

It runs at two points:

- **Session start** — the `SessionStart` hook in `.claude/settings.json` runs
  the validator when a session opens, so a broken reference surfaces in-session
  before any build work begins. The check is read-only and never aborts the
  session.
- **CI** — `.github/workflows/validate-claude-config.yml` runs the same
  validator on every push to `main` and every pull request, so a broken
  reference blocks the merge.

Run it manually anytime with `node .claude/scripts/validate-claude-config.mjs`.

---

## Build audit suite & dev loops

The build contract runs as **staged dev loops**: each stage of the build ends
with a Definition-of-Done gate, and the build is not done until every gate is
green. The gates live in `.claude/scripts/audit/` (dependency-free Node),
orchestrated by `verify-build.mjs`:

| Gate | Severity | Checks |
|---|---|---|
| `config-integrity` | hard | every `.claude` reference resolves; no bot-policy drift |
| `contrast-check` | hard | every color pairing meets its WCAG AA target |
| `schema-injection` | hard | JSON-LD is in the served HTML, not built by client-side JS |
| `robots-policy` | hard | no allowlisted retrieval bot is disallowed |
| `llms-txt` | hard | no `llms.txt` file present |
| `contrast-coverage` | soft | every UI color token is covered by a contrast pairing |
| `copy-lint` | soft | no banned filler, First/Second/Third structures, formal-copy contractions, or em-dash overuse |
| `seo-meta` | soft | unique titles/descriptions, one H1, alt text, canonical, OG ≠ meta |
| `schema-lint` | soft | every JSON-LD block parses and carries `@context` + `@type` |
| `served-dom` | soft | primary content is in the raw HTML without JavaScript |
| `token-drift` | soft | no hard-coded colors / font sizes outside the token files |

Enforcement is **mixed**: hard gates block the build, the PR, and the turn; soft
gates surface findings without blocking. The suite runs at three points:

- **As you edit** — the `PostToolUse` hook runs the fast linters on each changed
  build file and feeds advisory findings straight back.
- **Before finishing** — the `Stop` hook runs the hard gates and blocks the turn
  from ending while any hard gate is failing, so the loop cannot be skipped.
- **On demand and in CI** — `/build-audit` runs the full suite plus each skill's
  audit mode; `.github/workflows/verify-build.yml` runs it on every push and PR.

Run the whole suite anytime with `node .claude/scripts/audit/verify-build.mjs`.
Every gate skips cleanly until the matching build artifact exists, so the bare
template stays green.

---

## Standards enforced on every build

The build contract is strict by design. Highlights:

- **Accessibility as a gate.** WCAG AA is the floor; color contrast is verified
  by computation and wired as a `prebuild` and CI check, not judged by eye.
- **SEO in the server-rendered HTML.** Metadata, canonical URLs, and JSON-LD
  ship in the first response — never injected by client-side JavaScript.
- **Honest crawler policy.** `robots.ts` differentiates retrieval and indexing
  bots from training scrapers; the same content is served to all.
- **Dynamic sitemap and IndexNow.** Routes and CMS data generate the sitemap;
  publishes ping IndexNow for fast URL discovery.
- **Human copy.** No fabricated reviews, no marketing filler, no AI-tell writing
  patterns.

The full set of rules lives in [`.claude/CLAUDE.md`](.claude/CLAUDE.md).

---

© 2026 Hammonds Media & Marketing (HMM). Proprietary and confidential.
Contact: hello@hmm.agency
