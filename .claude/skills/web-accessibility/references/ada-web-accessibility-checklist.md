# ADA Web Accessibility Compliance Checklist
## Developer Delivery Reference Guide

**Baseline Standard:** WCAG 2.1 Level AA (ADA Title II legal minimum)  
**Recommended Target:** WCAG 2.2 Level AA (future-proof compliance)  
**Source Authority:** W3C WCAG 2.1/2.2, ADA Title II Final Rule (April 2024), Section 508 of the Rehabilitation Act  
**Items marked ⬆️ ABOVE & BEYOND** pull from WCAG 2.2 AA additions and achievable AAA criteria.

> **Critical reminder:** Overlay widgets (AccessiBe, UserWay, AudioEye) do NOT provide legal compliance and have been cited in ADA lawsuits. All fixes must be in the source code. Automated scanning catches only ~30–40% of issues — manual testing is required for the rest.

---

## 🧱 FOUNDATION

- [ ] Confirm target standard in writing: **WCAG 2.1 Level AA** (legal minimum) or **WCAG 2.2 Level AA** (recommended)
- [ ] Specify that overlay widgets are **not acceptable** — all fixes must be in the source code
- [ ] Require both **automated scanning** and **manual testing** across all page templates
- [ ] Build accessibility testing into every deployment cycle — not a one-time audit
- [ ] Require delivery of a completed **Accessibility Conformance Report (ACR)** upon project completion

---

## 👁️ PRINCIPLE 1: PERCEIVABLE
*All content must be presentable to users in ways they can perceive.*

### Text Alternatives (SC 1.1.1 — Level A)
- [ ] Every meaningful image must have descriptive `alt` text that conveys its purpose — not just its visual appearance
- [ ] Decorative images must use empty alt attributes (`alt=""`) so screen readers skip them
- [ ] Images of text must have alt text matching the visible text exactly
- [ ] Complex images (charts, graphs, diagrams) must have long-form text alternatives — either adjacent on the page or linked
- [ ] Icon buttons (hamburger menu, search, close) must have accessible names via `aria-label` or visually hidden text
- [ ] CAPTCHAs must offer an audio alternative plus a text description of the purpose

### Time-Based Media (SC 1.2.x — Levels A & AA)
- [ ] All pre-recorded video with audio must include synchronized **closed captions** (SC 1.2.2)
- [ ] All pre-recorded audio-only content (podcasts, recordings) must have a full **text transcript** (SC 1.2.1)
- [ ] All pre-recorded video must include an **audio description track** or text alternative for visual-only information (SC 1.2.3/1.2.5)
- [ ] Live video/audio must have real-time captions (SC 1.2.4)
- [ ] ⬆️ **ABOVE & BEYOND:** Provide extended audio descriptions for pre-recorded video (SC 1.2.7, Level AAA) for content-dense educational or product videos

### Adaptable Content (SC 1.3.x — Levels A & AA)
- [ ] All page structure must be conveyed through **semantic HTML** — use `<header>`, `<nav>`, `<main>`, `<footer>`, `<section>`, `<article>` correctly
- [ ] Heading hierarchy must be logical and sequential (`h1` → `h2` → `h3`) — never skip levels for visual styling
- [ ] All HTML tables used for data must have proper `<th>` headers with `scope` attributes
- [ ] Never use layout tables — use CSS Grid or Flexbox for page layout
- [ ] Form inputs must be programmatically associated with their `<label>` elements using `for`/`id` matching or `aria-labelledby`
- [ ] Reading and navigation order in the DOM must match the visual layout (SC 1.3.2)
- [ ] Sensory instructions must not rely on shape, color, size, location, or sound alone — e.g., "click the red button" is insufficient; must include a label (SC 1.3.3)
- [ ] Content must not be restricted to portrait or landscape orientation unless essential (SC 1.3.4)
- [ ] All input fields collecting personal data (name, email, address, credit card) must have the correct HTML `autocomplete` attribute (SC 1.3.5 — `name`, `email`, `street-address`, etc.)

### Distinguishable (SC 1.4.x — Levels A & AA)
- [ ] **Color must never be the only means** of conveying information — always pair with text, icons, or patterns (SC 1.4.1)
- [ ] Audio that plays automatically for more than 3 seconds must have a mechanism to pause or stop it (SC 1.4.2)
- [ ] **Verify contrast by computation, not by eye** — resolve every color (including `var()` tokens, `currentColor`, and named colors) to a literal sRGB value, then run the contrast script in `references/color-contrast-verification.md`. Eyeballing is how invisible same-color headings and unchecked hover states slip through.
- [ ] **Check every state and pairing** — body text, all heading levels, links/`:visited`, placeholders, and every interactive control in default/`:hover`/`:focus`/`:active`/`:disabled`/selected states; text over images uses the lightest and darkest pixel it can sit over
- [ ] **Brand rules never override contrast** — if a brand or Style Guide color computes below the required ratio, adjust the color until it passes in every context and note the substitution
- [ ] **Normal text:** minimum contrast ratio of **4.5:1** between text and background, confirmed by computed ratio (SC 1.4.3)
- [ ] **Large text** (18pt+ or 14pt+ bold): minimum contrast ratio of **3:1**, confirmed by computed ratio (SC 1.4.3)
- [ ] Text must remain readable when the browser is zoomed to **200%** without loss of content or function (SC 1.4.4)
- [ ] Images of text are prohibited for decorative or stylistic purposes — use actual text with CSS styling (SC 1.4.5); only acceptable when essential (logos, branded wordmarks)
- [ ] **Non-text contrast:** UI components (button borders, input field outlines, focus indicators, icons) must meet a **3:1** contrast ratio against adjacent colors (SC 1.4.11)
- [ ] **Text spacing:** The site must not lose content or functionality when users set: line height to 1.5× font size, letter spacing to 0.12em, word spacing to 0.16em, paragraph spacing to 2× font size (SC 1.4.12)
- [ ] Content that appears on hover or focus (tooltips, dropdown previews) must be: dismissible without moving focus, hoverable (pointer can move over it), and persistent until dismissed (SC 1.4.13)
- [ ] Page content must reflow into a single column at **320px wide** without horizontal scrolling (equivalent to 400% zoom on a 1280px screen) (SC 1.4.10)
- [ ] ⬆️ **ABOVE & BEYOND:** Target a contrast ratio of **7:1** for normal text and **4.5:1** for large text (SC 1.4.6, Level AAA)

---

## ⌨️ PRINCIPLE 2: OPERABLE
*All users must be able to operate the interface — including keyboard-only users.*

### Keyboard Accessible (SC 2.1.x — Levels A & AA)
- [ ] Every interactive element (links, buttons, forms, modals, dropdowns, carousels, date pickers) must be fully operable with a keyboard alone — no mouse required (SC 2.1.1)
- [ ] Users must never get **trapped** in a keyboard focus — all modal dialogs, custom widgets, and embedded content must have a clear keyboard escape path (SC 2.1.2)
- [ ] No keyboard shortcut may consist of a single printable character unless: the user can turn it off, remap it, or it's only active when the component has focus (SC 2.1.4)
- [ ] ⬆️ **ABOVE & BEYOND:** Ensure all functionality is operable with a single pointer — no path-based gestures required unless essential (SC 2.1.3, Level AAA)

### Enough Time (SC 2.2.x — Levels A & AA)
- [ ] Any time limits must offer users the ability to: turn off the limit, adjust it (at least 10× the default), or receive a warning and extend by at least 20 more seconds (SC 2.2.1)
- [ ] Moving, blinking, scrolling, or auto-updating content that starts automatically and lasts more than 5 seconds must have a mechanism to **pause, stop, or hide** it (SC 2.2.2)

### Seizures and Physical Reactions (SC 2.3.x — Level A)
- [ ] No element on the page may flash more than **3 times per second** (SC 2.3.1)
- [ ] ⬆️ **ABOVE & BEYOND:** Eliminate all flashing entirely, or provide a warning before any page with flashing content (SC 2.3.2, Level AAA)

### Navigable (SC 2.4.x — Levels A & AA)
- [ ] A **"Skip to main content"** link must be the first focusable element on every page — visible on focus (SC 2.4.1)
- [ ] Every page must have a descriptive, unique `<title>` tag that identifies the page topic and site name (SC 2.4.2)
- [ ] Focus order must follow a logical sequence that preserves meaning — tab order must make sense (SC 2.4.3)
- [ ] All link text must describe the destination or purpose on its own — "click here" and "read more" are non-compliant; use "Read our privacy policy" or `aria-label` to supplement (SC 2.4.4)
- [ ] Multiple navigation methods must be available: site-wide nav, breadcrumbs, search, sitemap — at minimum two (SC 2.4.5)
- [ ] Headings and labels must be descriptive enough to describe the section's topic or purpose (SC 2.4.6)
- [ ] Keyboard focus indicator must be **visible** at all times — never remove the default browser outline without replacing it with a clearly visible custom indicator (SC 2.4.7)
- [ ] ⬆️ **ABOVE & BEYOND (WCAG 2.2 AA):** When a component receives keyboard focus, it must not be **fully hidden** by sticky headers, overlapping modals, or other content (SC 2.4.11)
- [ ] ⬆️ **ABOVE & BEYOND (WCAG 2.2 AA):** Focus indicators must have a minimum area, contrast, and visibility — the focus outline must meet a **3:1** contrast ratio against the unfocused state (SC 2.4.13)

### Input Modalities (SC 2.5.x — Levels A & AA)
- [ ] All multipoint gestures (pinch-to-zoom, two-finger swipe) must also be achievable with a **single pointer** (SC 2.5.1)
- [ ] For pointer actions, the function must not execute on the **down-event** — use the up-event (mouseup, touchend) and allow the user to abort mid-action by dragging away (SC 2.5.2)
- [ ] Visible labels on UI components (buttons, inputs) must match or be contained in the accessible name programmed into the element (SC 2.5.3)
- [ ] Functionality operable by device motion (shake, tilt) must also be operable via UI controls, and the motion trigger must be able to be disabled (SC 2.5.4)
- [ ] Touch/click targets must be at least **24×24 CSS pixels** in size with adequate spacing (SC 2.5.8 — WCAG 2.2)
- [ ] ⬆️ **ABOVE & BEYOND (WCAG 2.2 AA):** Dragging interactions must have a single-pointer alternative — e.g., drag-to-reorder must also have up/down buttons (SC 2.5.7)
- [ ] ⬆️ **ABOVE & BEYOND:** Touch targets of at least **44×44 CSS pixels** (SC 2.5.5, Level AAA — recommended for mobile)

---

## 🧠 PRINCIPLE 3: UNDERSTANDABLE
*Content and interface operation must be understandable.*

### Readable (SC 3.1.x — Levels A & AA)
- [ ] The page's primary **human language** must be set in the `<html lang="">` attribute (e.g., `lang="en"`) (SC 3.1.1)
- [ ] Any inline passage in a different language must have a `lang` attribute on its wrapping element (SC 3.1.2)

### Predictable (SC 3.2.x — Levels A & AA)
- [ ] UI components must not trigger a **context change** on focus alone — a link or dropdown must not auto-navigate when tabbed to (SC 3.2.1)
- [ ] Changing an input's value must not auto-submit a form or navigate away without user confirmation (SC 3.2.2)
- [ ] Navigation menus and recurring components (headers, footers, sidebars) must appear in the **same location** across all pages (SC 3.2.3)
- [ ] UI components with the same function must be **labeled consistently** across pages (SC 3.2.4)
- [ ] ⬆️ **ABOVE & BEYOND (WCAG 2.2 Level A):** If the site provides help (chat, contact, phone, FAQs), those help mechanisms must appear in the **same location** on every page (SC 3.2.6)

### Input Assistance (SC 3.3.x — Levels A & AA)
- [ ] If a form input error is detected, the **error must be described in text** — not just highlighted in red (SC 3.3.1)
- [ ] Form fields must have **text labels or instructions** visible before submission — not just placeholder text that disappears on typing (SC 3.3.2)
- [ ] If an input error is detected and a correction is known, **suggest the fix** in the error message (SC 3.3.3)
- [ ] Legal, financial, or data-deletion submissions must allow users to **review and confirm** before final submission, or allow reversal (SC 3.3.4)
- [ ] ⬆️ **ABOVE & BEYOND (WCAG 2.2 Level A):** Authentication processes must not rely solely on a **cognitive function test** without an alternative — support password managers, paste functionality, or biometrics (SC 3.3.8)
- [ ] ⬆️ **ABOVE & BEYOND (WCAG 2.2 Level A):** Multi-step forms must not require users to **re-enter information** they already provided in the same session (SC 3.3.7)
- [ ] ⬆️ **ABOVE & BEYOND:** Provide context-sensitive help for forms and complex tasks (SC 3.3.5, Level AAA)

---

## 🤖 PRINCIPLE 4: ROBUST
*Content must be robust enough for assistive technologies to reliably interpret it.*

### Compatible (SC 4.1.x — Levels A & AA)
- [ ] All HTML must be **valid and well-formed** — proper nesting, no duplicate IDs, no unclosed tags (SC 4.1.1)
- [ ] All UI components must have a programmatically determinable **name, role, and value** — use native HTML elements where possible; use ARIA only when native HTML cannot meet the need (SC 4.1.2)
- [ ] Status messages (form success, errors, loading states, cart updates) must be announced to screen readers without requiring focus shift — use `role="status"`, `role="alert"`, or `aria-live` regions (SC 4.1.3)

### ARIA Best Practices (Supports SC 4.1.x)
- [ ] Follow the rule: **no ARIA is better than bad ARIA** — incorrect ARIA attributes actively break screen readers
- [ ] Custom interactive widgets (accordions, tabs, sliders, date pickers) must implement the correct **ARIA design pattern** from the W3C ARIA Authoring Practices Guide (APG)
- [ ] `aria-expanded`, `aria-controls`, `aria-selected`, `aria-checked`, and `aria-current` must reflect the true current state of interactive components dynamically
- [ ] Never use `aria-hidden="true"` on elements that receive keyboard focus
- [ ] Landmark roles (`banner`, `main`, `navigation`, `contentinfo`, `complementary`, `search`) must be applied correctly so screen reader users can skip between page regions

---

## 📄 DOCUMENTS, PDFs & DOWNLOADABLE FILES

- [ ] All linked PDF documents must be **tagged PDFs** — not scanned image PDFs; tagging preserves reading order and accessibility for screen readers
- [ ] PDFs must include: document title, language setting, heading tags, alt text for images, and logical tab order for form fields
- [ ] Word documents and spreadsheets linked from the site must follow their own accessibility standards (proper heading styles, alt text, table headers)
- [ ] Never use a scanned image as the only version of a document — always provide a text-based alternative

---

## 📱 MOBILE & RESPONSIVE

- [ ] The site must be fully operable on **iOS VoiceOver** and **Android TalkBack** screen readers
- [ ] Touch targets must be large enough (24×24px minimum per WCAG 2.2; 44×44px recommended) and spaced so adjacent targets aren't accidentally activated
- [ ] Pinch-to-zoom must not be disabled via `<meta name="viewport" content="user-scalable=no">`
- [ ] The site must not require hover-only interactions — hover states must have touch/keyboard equivalents

---

## 🧪 TESTING & DOCUMENTATION DELIVERABLES

- [ ] Run automated scans with **axe DevTools**, **WAVE**, or **Lighthouse** and resolve all flagged issues before manual testing begins
- [ ] Conduct **manual keyboard-only navigation** testing across all interactive page templates
- [ ] Test with at least two screen readers: **NVDA + Chrome** (Windows) and/or **JAWS + Chrome**, plus **VoiceOver + Safari** (Mac/iOS)
- [ ] Deliver a completed **Accessibility Conformance Report (ACR)** documenting conformance against each success criterion
- [ ] Publish an **Accessibility Statement** on the website that includes: the standard you conform to, date of last audit, contact method for accessibility issues, and timeline for resolving reported issues
- [ ] Conduct periodic **re-audits** — accessibility degrades with content updates; build a quarterly or release-based audit cadence

---

## ⬆️ GOING ABOVE & BEYOND: WCAG 2.2 AA + AAA HIGHLIGHTS

- [ ] **WCAG 2.2 AA — SC 2.4.11:** Focused elements are never fully hidden behind sticky headers or overlapping layers
- [ ] **WCAG 2.2 AA — SC 2.4.13:** Focus indicators are visually robust — minimum area of the perimeter times 2 CSS pixels, 3:1 contrast against surroundings
- [ ] **WCAG 2.2 AA — SC 2.5.7:** All drag-and-drop interactions have a single-pointer alternative
- [ ] **WCAG 2.2 AA — SC 3.3.7:** No redundant data entry required within a session
- [ ] **WCAG 2.2 AA — SC 3.3.8:** Authentication never requires a user to solve a puzzle or memorize a code without an alternative
- [ ] **AAA — SC 1.4.6:** Text contrast meets 7:1 (enhanced) — ideal for high-readability brand standards
- [ ] **AAA — SC 2.4.9:** Every link's purpose is clear from its text alone, with no surrounding context needed
- [ ] **AAA — SC 2.5.5:** All touch/click targets are at least **44×44 CSS pixels**
- [ ] **AAA — SC 3.1.3:** Unusual words, abbreviations, and jargon have inline definitions or a linked glossary
- [ ] **User testing:** Have real users with disabilities test the site — tools alone cannot catch everything
- [ ] **Cognitive accessibility:** Follow W3C's *Making Content Usable for People with Cognitive and Learning Disabilities* guidance — plain language, consistent icons, reduced cognitive load
- [ ] **Reduced motion:** Implement `prefers-reduced-motion` CSS media query to suppress animations for users with vestibular disorders

---

## 📊 COMPLIANCE STANDARD QUICK REFERENCE

| Context | Required Standard |
|---|---|
| U.S. federal agencies | Section 508 / WCAG 2.0 AA |
| U.S. state & local governments | ADA Title II / WCAG 2.1 AA |
| U.S. private businesses | ADA Title III / WCAG 2.1 AA (via litigation) |
| EU/European markets | EN 301 549 / EAA / WCAG 2.1 AA |
| Federal contractors/vendors | Section 508 (VPAT required) |

---

*W3C recommends targeting **WCAG 2.2 AA** — it satisfies all earlier versions and positions the site ahead of future regulatory changes. Compliance is an ongoing process, not a one-time deliverable.*

**Key Reference Links:**
- WCAG 2.1 Full Specification: https://www.w3.org/TR/WCAG21/
- WCAG 2.2 Full Specification: https://www.w3.org/TR/WCAG22/
- ADA Title II Final Rule: https://www.ada.gov/resources/2024-03-08-web-rule/
- Section 508 Standards: https://www.section508.gov/manage/laws-and-policies/
- ARIA Authoring Practices Guide: https://www.w3.org/WAI/ARIA/apg/
