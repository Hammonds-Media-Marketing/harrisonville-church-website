# Build Mode — Campaign Landing Page

Loaded by the Build Mode Router in `CLAUDE.md` when the build type is a
single-purpose campaign landing page. Applies on top of the universal standards
in `CLAUDE.md` and the chosen stack doc.

A campaign landing page has one job: convert traffic from a specific campaign.
It is conversion-first, not navigation-first.

---

## General Notes

- Include motion design / interaction design to make the page more engaging.
- Include some kind of offer — but **do not invent one**. If the offer is not
  in `project-brief.md`, ask for it before building.
- Use interactive elements that increase on-page clicks (micro-interactions,
  expanders, hover reveals) where they aid the conversion path.
- Create time-based or quantity scarcity when possible — a countdown clock, a
  quantity counter, etc. **IMPORTANT:** Never fabricate scarcity. Only include a
  scarcity element if it is specified in `project-brief.md`. Otherwise, ask for
  the details and omit it until provided.

---

## Sections / Components (no required order)

- **Sticky top nav bar** — no off-page links except the company logo linking to
  the homepage. It should mimic a regular navigation, but the buttons lead to
  **page anchors tied to the H2 of each section**, not to other pages.
- **Hero section** — a clear CTA with friction-reducer bullet points underneath.
- **Client logos** (optional, proof of authority) — ask for details if not in the brief.
- **Stats section** (optional) — ask for details if not in the brief.
- **Testimonials / reviews section** (optional) — ask for details if not in the brief.
- **Product / services section** (optional) — ask for details if not in the brief.
- **Benefits section.**
- **Process section** (optional) — ask for details if not in the brief.
- **CTA section.**
- **FAQ section.**
- **Footer nav** — may link to other parts of a site if more pages exist. The
  universal footer is fine to use here if one is available.

Optional sections appear only when the brief supplies the content. Do not pad
the page with empty or invented sections.

---

## Mode Notes

- Every nav button is an in-page anchor to a section H2 — keep the heading
  hierarchy clean so the anchors map to real `<h2>` targets.
- The CTA repeats: once in the hero, once in the dedicated CTA section, and
  wherever the conversion path naturally peaks. Keep CTA copy consistent.
- Apply the behavioral-science copywriting skill to the hero, CTA, and any
  scarcity/social-proof elements — but only with real, supplied facts.
- Single H1 (the hero headline); each section leads with an `<h2>`.
