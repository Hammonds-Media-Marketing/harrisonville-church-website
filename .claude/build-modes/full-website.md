# Build Mode — Full Website (Multi-Page)

Loaded by the Build Mode Router in `CLAUDE.md` when the build type is a full,
multi-page website. Applies on top of the universal standards in `CLAUDE.md`
and the chosen stack doc.

---

## Default Page Architecture

Build the following pages unless the project brief explicitly removes one:

- **Home Page**
- **About Us**
- **Contact Us**
- **Blog Collection** — include blog category filters
  - **Blog Article Page** — see full spec below
  - **Blog Author Page**
- **Privacy Policy**
- **Cookie Usage Policy**
- **Style Guide** — built with CSS variables that control typography and color across the entire site; updating the Style Guide updates the whole site; link this to a global CSS file
- **404 Page**
- **Sitemap** (generated — see the stack doc for the mechanism)
- **Robots policy** (generated — see the stack doc for the mechanism)

---

## RSS Feed

Generate an RSS feed for the blog collection. Keep it in sync with published
articles. (On Next.js, generate via a route handler; on static HTML, emit a
static `rss.xml` alongside the sitemap.)

---

## Blog Article Page — Required Features

Every blog article page must include all of the following:

- **Scroll progress indicator**
- **Sticky table of contents**
- **Feature image** at the top of the article
- **Share buttons** positioned underneath the table of contents
- **Author block at top and bottom** of the article — each instance must include:
  - Author photo
  - Short bio
  - LinkedIn profile button using the LinkedIn logo as the button element
  - Button linking to the full author bio page
- **Related articles section** — visible only when related articles exist; hidden completely when none are available
- **Page view count** displayed in a fairly prominent location for social proof
- **Comment section** at the bottom of the page
- **Read time estimate**
- **Publish date** — replaced by Updated date if the article has been revised
- **Blog category tags**

---

## Sitemap Content Rules

The sitemap must be generated from routes and CMS data — never hardcoded. Include:

- All static routes (Home, About, Services, Contact, Privacy, Cookie Policy)
- All blog article URLs pulled from the CMS at build time
- All author pages
- `lastModified` populated from actual CMS publish or updated-at timestamps — not a hardcoded date
- `changefreq` and `priority` set per route type (home: weekly/1.0, blog articles: monthly/0.8, legal pages: yearly/0.3)

---

## Mode Notes

- The Style Guide page is the single source of truth for design tokens — every other page consumes its CSS variables.
- Apply the universal FAQ rule: add FAQ sections to strategic pages (Home, key Services), not to every page.
- Internal linking matters most here — cross-link blog articles, services, and author pages where contextually relevant.
