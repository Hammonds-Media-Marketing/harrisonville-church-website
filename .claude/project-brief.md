# Project Brief — Harrisonville Church of Christ

> Source of truth for the build. Claude Code reads this with `.claude/CLAUDE.md` and follows the Build Sequence.

## 1. Project Basics
- **Build type:** Full website — Next.js (latest) + TypeScript + Tailwind, deploy to Vercel
- **Client / business:** Harrisonville Church of Christ
- **What they do:** A Church of Christ congregation in Harrisonville, Missouri, inviting the community to simple, Scripture-based worship and Bible study.
- **Industry / vertical:** Religious Organization
- **Primary domain (canonical base):** harrisonvillecoc.com

### Core services
Sunday worship services
Bible study resources
Gospel outreach and evangelism
Community welcome and visitor support

## 2. Business Identity & NAP
- **Local business:** Yes
- **Primary LocalBusiness schema subtype:** Church
- **Address:** 1203 Outlook Drive, Harrisonville, MO 64701
- **Phone (E.164):** +18163261082
- **Public email:** gospel@harrisonvillecoc.com
- **Service area / locations served:** Harrisonville, Missouri and surrounding Cass County area
- **Hours (for OpeningHoursSpecification):** Sundays at 10:00am and 2:00pm, Wednesdays at 7:00pm

## 3. Audience & Positioning
- **Target audience:** Residents of Harrisonville and Cass County who are spiritually seeking, unchurched, or looking for a welcoming congregation rooted in New Testament teaching
- **Audience pain points:** Confusion caused by doctrinal differences across denominations; uncertainty about which church truly follows the Bible; desire for a low-pressure, non-embarrassing worship environment
- **Audience motivators:** Desire for genuine community and spiritual family; seeking clear, Scripture-grounded answers about salvation and worship; wanting a simple, reverent service free from man-made traditions
- **Primary conversion goal:** Lead form
- **Core competitors (internal positioning context only — never on-site copy):** Harrisonville United Methodist Church; Harrisonville Church of the Nazarene; Worship Center Harrisonville; Harrisonville Community Church
- **Company differentiators:** Strict New Testament authority as the sole guide for worship and doctrine; no instrumental music or human creeds; explicit focus on restoring first-century Christianity rather than following denominational tradition
- **Unique point of view (E-E-A-T + AI search):** New Testament Christians who let Scripture alone answer every question about God, salvation, and worship — no creed but the Bible, no practice not found in the New Testament

### Audience profile
# Audience Profile: Harrisonville Church of Christ
**Prepared by Hammonds Media & Marketing | Storyteller-Tactics Framework**

---

## WHO THEY ARE

Residents of Harrisonville and Cass County, Missouri — adults ranging from their mid-20s to late 60s — who feel a genuine pull toward spiritual life but have not found a church home that fits, or have drifted away from one they once had. Many grew up with some religious exposure but carry lingering doubt, confusion, or quiet frustration about organized religion. They value sincerity over showmanship and are skeptical of anything that feels performative or sales-driven.

---

## THE PROBLEMS THEY CARRY

Denominational noise is their primary source of confusion. They have watched friends attend different churches, each claiming biblical authority, and cannot reconcile why those churches contradict one another. The result is a kind of doctrinal paralysis — they want answers but do not know who to trust to give them.

They also carry a social fear: the fear of walking into a church and feeling spotlighted, corrected, or pressured. Past experiences with high-energy services, unfamiliar rituals, or aggressive altar calls (public invitations to make a decision in front of the congregation) have left them guarded.

Many feel they are not "church people" yet — and they are not sure they ever will be. That identity gap keeps them at a distance even when curiosity pulls them closer.

---

## WHAT MOTIVATES THEM

Belonging is the deep driver. Behavioral research on social connection — including work on what psychologists call "mattering," the felt sense that one is significant to a group — confirms that people will endure significant friction to find a community where they feel known. This audience is no different. They want a spiritual family, not a spiritual transaction.

They also want clarity without condescension. When someone can sit down with them, open a Bible, and show them the reasoning behind a belief or practice rather than simply asserting it, that experience builds trust quickly. Scripture-anchored answers satisfy both the intellect and the conscience.

A simple, reverent worship assembly — no fog machines, no cover-charge energy — signals to this audience that the congregation takes God seriously and does not need to manufacture an experience.

---

## WHAT THEY FEAR

They fear being embarrassed in a public setting — called on without warning, asked to raise a hand, or singled out as a visitor in front of the room.

They fear investing emotionally in a community and later discovering that its teaching rests on tradition or institutional preference rather than Scripture. They have seen people hurt by that before.

They fear that their questions — about baptism, salvation, church authority, the afterlife — mark them as outsiders who do not belong.

---

## WHAT THEY ALREADY SAY AND DO

In conversation, they say things like:

- "I believe in God, I just do not go to church."
- "Every church says they are the right one — how do you even know?"
- "I do not want anyone making a big deal out of me when I walk in."
- "I want something real, not a production."

In behavior, they scroll quietly — searching phrases like "churches near me," "what does the Bible really say about baptism," or "non-denominational church Harrisonville" — before they ever contact anyone. They ask a trusted friend before they walk through a door. They observe for several weeks before they engage. Social proof (seeing someone they respect attend) is often the tipping point that moves them from consideration to action.

---

## STRATEGIC NOTE

This audience does not need to be sold. They need to be de-risked. Every touchpoint — a Facebook post, a website page, a first conversation — should lower the perceived cost of showing up and raise the perceived reward of belonging. Transparency about what to expect on a Sunday morning, paired with a clear, non-pressured explanation of what the congregation believes and why, will do more work than any promotional campaign.

### Taglines / value prop (options)
- `REPLACE_ME`

## 4. Content Sensitivity
- **YMYL level:** None

### Client-specific copy constraints (must be honored in the build)
All claims must be grounded in cited Scripture; tone must be warm and inviting, never coercive or high-pressure; visitors must be reassured they will not be embarrassed or forced to participate

## 5. Brand & Style Guide Tokens
| Token | Role | Value |
|---|---|---|
| `--color-primary` | Primary | #008BBB |
| `--color-accent` | Accent | #5F9023 |
| `--color-accent` | Accent | #FFCF5E |
| `--color-ink` | Text / ink | #111111 |
| `--color-bg` | Background | #ffffff |

- **Display font:** Display: Montserrat / Body: Mulish
- **Body font:** `Mulish`
- **Aesthetic direction:** N/A
- **Logo / assets:** Raster only (needs vectorizing)

> **Accessibility note:** the bundled contrast build gate (`scripts/contrast-check.mjs`) computes every foreground/background pairing in every state. Any pairing below WCAG AA must be adjusted until it passes — accessibility overrides these brand values, with the substitution noted.

## 6. Page Architecture
**Included:**
- *The symbol "#" = section anchored on a page*
- ## Homepage
- ### About Us
- - What To Expect
- - Leadership Bio Collection
- - Member Stories Library
- ### Events
- - Events Collection
- ### Resources
- - Bible Study Course
- - Blog
- - Blog Collection
- - Blog Author
- - Sermon and Video Library
- - Sermon/Video Collection
- ### Connect With Us/Contact Us
- - #General Contact Form
- - #Prayer Request Form
- - #Request Bible Study
- ***Other Pages***
- - Privacy Policy
- - Cookie Usage Policy
- - Style Guide
- - 404
- - Sitemap (app/sitemap.ts)
- - Robots (app/robots.ts)

- **FAQ sections on (strategic pages only):** N/A
- **Ecommerce:** No

## 7. CMS & Technical
- **CMS:** Supabase
- **Form provider:** Formspree
- **Form endpoint (NEXT_PUBLIC_FORMSPREE_ENDPOINT):** `Coming Soon`
- **Ad networks running:** None
- **Attribution capture:** base TRACKED_PARAMS already cover `utm_*`, `gclid`.
- **Analytics stack:** GA4, Mixpanel

## 8. E-E-A-T / Authorship
- **Author name:** 
- **Author role:** 
- **Author bio:** 
- **Author LinkedIn:** 
- **Organization sameAs profiles:** https://www.facebook.com/harrisonvillecoc/
- **AI-content disclosure (how/why):** Not applicable.

## 9. Social Proof
- **Real reviews / testimonials available:** Yes — source: Google Business Profile
- **Awards / press / certifications:** N/A


---
*Generated with the HMM Project Brief Builder.*
