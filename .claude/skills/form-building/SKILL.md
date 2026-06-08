---
name: form-building
description: Wire a contact form on a Next.js App Router site to a hosted form endpoint (Formspree by default, swappable for Resend/SendGrid/custom gateway). Adds a hidden honeypot anti-spam field, captures last-touch UTM/gclid/msclkid/external-referrer attribution to localStorage on every page load, and auto-populates hidden form fields at submit time. Use when the user asks to wire up a contact form, "make the form actually send", connect a form to email or Formspree, capture campaign attribution, add UTM tracking to a form, or replace a stub onSubmit with a real submission.
---

# Form Building

Builds a real, production-ready contact form on a Next.js App Router site. Two layers handle the work: a page-level component that captures attribution data on every load, and a form-level component that POSTs to a hosted form endpoint with the captured data riding along as hidden fields.

## When to invoke

Trigger this skill when the user asks to:
- **Wire up / connect / hook up a contact form** ("make the form work", "the form goes nowhere", "where do submissions go")
- **Replace a stub submit handler with a real one** (existing `await new Promise((r) => setTimeout(r, 1000))` pattern, etc.)
- **Add UTM / campaign attribution / hidden tracking fields** to a form
- **Add a honeypot or anti-spam field** to a form
- **Switch a form between providers** (Formspree → Resend, etc.)

If the user is *designing* form UI from scratch, this skill is still the right pick — it provides both the wiring and a working form template that adapts to the project's existing layout.

## Required inputs (gather before writing code)

1. **Form endpoint** — Formspree URL (`https://formspree.io/f/<id>`) or another provider endpoint. **If unknown, ask.** Recommend Formspree for v1 since it requires zero backend.
2. **Existing form file path** — typically `src/components/home/ContactCTA.tsx` or `src/components/<section>/ContactForm.tsx`. If a form exists, edit in place; if not, scaffold one based on the template.
3. **Layout file path** — typically `src/app/layout.tsx`. Needed to mount `AttributionTracker`.
4. **Field set** — confirm the visible fields. Default: First Name, Last Name, Phone, Email, Topic/Coverage select, Message. Adapt to what the project actually needs (e.g., a B2B form might add Company, Job Title).

## Architecture

Two components do the work. They are decoupled — the tracker can run without a form on the page (e.g., on a blog post), and the form populator works against whatever the tracker has stored.

### 1. AttributionTracker (page-level capture)

A `'use client'` component that returns `null`, mounted once near the bottom of `<body>` in `app/layout.tsx`. On every page load it:

- Reads `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid`, `msclkid` from `window.location.search`
- Captures `document.referrer` if the referrer host is **external** (not the current site)
- Persists the payload to `localStorage` under key `hm_attribution`
- Uses **last-touch attribution** — fresh URL params overwrite the stored payload. If no URL params and nothing already stored, captures the external referrer alone.
- Wraps everything in `requestIdleCallback` (with `setTimeout(_, 0)` fallback) so it runs during browser idle time and never blocks first paint, hydration, or LCP.
- Wraps localStorage I/O in `try/catch` so private browsing / quota errors silently no-op.

Source: `templates/AttributionTracker.tsx.template`

### 2. Form component (form-level populate + submit)

A `'use client'` form with these critical structural choices:

- **Uncontrolled inputs** — no `value`/`onChange` on visible fields. Submit reads everything via `new FormData(e.currentTarget)`. This lets external scripts (a populate effect, a GTM tag, a third-party autofill) write to `input.value` directly without React state plumbing.
- **Bare hidden tracking inputs** — `<input type="hidden" name="utm_source">` and seven more. **Do not** wrap them in descriptive `<div>`s — the populate effect targets them via `name` attribute.
- **Honeypot** — `<input type="text" name="_gotcha" className="hidden" tabIndex={-1} aria-hidden autoComplete="off">`. Formspree drops any submission where `_gotcha` is non-empty.
- **Population effect** — on mount, reads URL params first (current visit), `localStorage.hm_attribution` second (last persisted touch), and writes the merged values into each hidden input via the form ref. Runs inside `requestIdleCallback`.
- **Submit handler** — `fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(e.currentTarget) })`. The `Accept: application/json` header is required for Formspree to return JSON instead of a 302 redirect.
- **Status state** — `idle | submitting | success | error`. Form unmounts on success and shows a thank-you message; error state keeps the form mounted with a phone fallback.

Source: `templates/ContactForm.tsx.template`

## Build steps

1. **Read the existing form** (if any) so you understand the visible-field layout, copy, and section design. Preserve the visible UX; only swap the wiring + add hidden fields.
2. **Endpoint via env var** — `NEXT_PUBLIC_FORMSPREE_ENDPOINT`. Read from `process.env` with a hardcoded fallback equal to the user's actual endpoint:
   ```ts
   const FORMSPREE_ENDPOINT =
     process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT || '<the user's endpoint>'
   ```
   Why: prod works without env config (resilient default); other environments (staging, future clients) override via Vercel project settings.
3. **Mount `AttributionTracker`** at the end of `<body>` in `layout.tsx`. Import it from a stable path (e.g., `@/components/layout/AttributionTracker`).
4. **Update the form component** based on `templates/ContactForm.tsx.template`:
   - Remove all `value`/`onChange` from visible inputs
   - Add the hidden tracking inputs and the honeypot
   - Add the `useEffect` populate logic
   - Replace the stub `handleSubmit` with the real `fetch` call
   - Keep the existing visible-field layout, copy, and surrounding section markup
5. **Add `.env.example`** documenting the env var (see `templates/env.example`).
6. **Verify the build** — `npm run build`. No new lint errors expected.
7. **Test locally if possible** — submit a test entry, confirm it lands in the provider dashboard with all fields including hidden tracking ones.

## Things to NOT do

- **Don't make visible inputs controlled.** Controlled inputs override `input.value` writes from external scripts. Uncontrolled + FormData is the only pattern that lets the populate effect, possible GTM tags, and React all coexist.
- **Don't wrap hidden tracking inputs in descriptive `<div>`s.** Bare hidden inputs with a `name` attribute are sufficient and simpler.
- **Don't capture attribution synchronously during render.** Always inside `useEffect` (post-hydration) and inside `requestIdleCallback` (browser idle time). Form fill takes seconds — populate has milliseconds to spare.
- **Don't swallow `Accept: application/json`.** Without it, Formspree returns a 302 redirect that the AJAX handler can't follow, and the success state never fires.
- **Don't loudly throw on localStorage errors.** Wrap in `try/catch` and silently no-op. Private browsing, disabled storage, quota exceeded — all real, all should not break the form.
- **Don't introduce a state library or react-hook-form for this.** Uncontrolled + FormData + four-state machine is enough. Adding a form library defeats the external-population trick.

## Multi-tenant / multi-client

Every client's site uses the same code; only `NEXT_PUBLIC_FORMSPREE_ENDPOINT` changes. Set it in the deployment platform's project settings per client. The fallback in code stays as a sane default so misconfigured environments don't silently fail.

For provider swaps (Formspree → Resend → self-hosted), only the `handleSubmit` body changes. See `references/providers.md`.

## Static HTML variant (GitHub Pages stack)

The `.tsx` templates above target Next.js. For the **static-HTML / GitHub Pages**
stack, use the vanilla port in `templates/static/` instead — same attribution
model, honeypot, hidden-field set, and last-touch logic, no framework:

- `templates/static/contact-form.html` — progressively-enhanced form. Its
  `action`/`method` POST to the endpoint so it works with JavaScript disabled;
  the honeypot and the eight hidden tracking inputs are named exactly as the
  Next.js template.
- `templates/static/attribution.js` — vanilla equivalent of `AttributionTracker`
  plus the populate/submit logic: idle-time last-touch capture to `localStorage`,
  hidden-field population (URL first, stored fallback), and an AJAX `fetch` submit
  with `Accept: application/json` that swaps in the inline success/error regions.

Build steps for the static variant: copy both files into the site, set the form
`action` to the real endpoint (ask if the brief does not supply it), include
`attribution.js` with `<script defer>`, and verify the same way as below
(visit with UTM params → check `localStorage` → inspect populated hidden inputs
→ submit → confirm the provider received all fields). Everything in **Things to
NOT do** applies here too, except the React-specific notes (controlled inputs,
state libraries) — the static form is uncontrolled by nature.

## References

- `references/attribution-model.md` — last-touch vs first-touch rationale + storage payload shape
- `references/performance.md` — useEffect + `requestIdleCallback` + uncontrolled inputs, with timing details
- `references/providers.md` — swapping Formspree for Resend, SendGrid, or a custom gateway

## Verification checklist

After implementing, confirm in this order:

1. `npm run build` passes.
2. Visit the page with `?utm_source=google&utm_medium=cpc&utm_campaign=test`. Open DevTools → Application → Local Storage. The `hm_attribution` key should hold a JSON payload with those values.
3. DevTools → Elements → inspect the form. The seven hidden tracking inputs (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid`, `msclkid`, `original_referrer`) should have non-empty `value=` attributes for the params you visited with.
4. Submit the form with test data. The provider's dashboard receives all visible fields plus the eight hidden tracking fields, and a `_gotcha` field is conspicuously absent (Formspree strips it).
5. Submit again from the same browser without UTM params in the URL. The hidden inputs still populate from `localStorage` (last-touch behavior).
