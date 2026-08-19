import { SITE_URL, site } from './site'

/**
 * Server-rendered JSON-LD. This module is intentionally NOT a Client Component:
 * structured data must be present in the served HTML on the first response so
 * every crawler (including AI retrieval bots that do not run JavaScript) reads
 * it. Schema is applied for rich-result eligibility only — not over-engineered.
 */

const ORG_ID = `${SITE_URL}/#church`
const WEBSITE_ID = `${SITE_URL}/#website`

type Json = Record<string, unknown>

export function JsonLd({ data }: { data: Json | Json[] }) {
  const json = Array.isArray(data) ? data : [data]
  return (
    <script
      type="application/ld+json"
      // Server-rendered string; not injected on the client.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json.length === 1 ? json[0] : json) }}
    />
  )
}

/** The Church (a LocalBusiness subtype) — the organization node referenced everywhere. */
export function churchSchema(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Church',
    '@id': ORG_ID,
    name: site.name,
    description: site.description,
    url: `${SITE_URL}/`,
    telephone: site.phone,
    email: site.email,
    logo: `${SITE_URL}/assets/logos/logo-structured-data.png`,
    image: `${SITE_URL}/assets/og/og-default.svg`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: site.geo.latitude,
      longitude: site.geo.longitude,
    },
    areaServed: site.areaServed.map((name) => ({ '@type': 'AdministrativeArea', name })),
    sameAs: site.sameAs as unknown as string[],
    openingHoursSpecification: site.services.map((s) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${s.dayCode}`,
      opens: s.time,
      name: s.label,
    })),
  }
}

export function websiteSchema(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: site.name,
    publisher: { '@id': ORG_ID },
    inLanguage: 'en-US',
  }
}

export function breadcrumbSchema(crumbs: { name: string; path: string }[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.path === '/' ? '' : c.path}`,
    })),
  }
}

export function webPageSchema(opts: { name: string; description: string; path: string }): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${SITE_URL}${opts.path === '/' ? '' : opts.path}#webpage`,
    url: `${SITE_URL}${opts.path === '/' ? '' : opts.path}`,
    name: opts.name,
    description: opts.description,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORG_ID },
    inLanguage: 'en-US',
  }
}

export function faqSchema(items: { question: string; answer: string }[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.question,
      acceptedAnswer: { '@type': 'Answer', text: i.answer },
    })),
  }
}

export function personSchema(p: {
  name: string
  slug: string
  role: string
  bio: string
  image?: string
  sameAs?: string[]
}): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE_URL}/blog/author/${p.slug}#person`,
    name: p.name,
    jobTitle: p.role,
    description: p.bio,
    ...(p.image ? { image: `${SITE_URL}${p.image}` } : {}),
    worksFor: { '@id': ORG_ID },
    ...(p.sameAs && p.sameAs.length ? { sameAs: p.sameAs } : {}),
  }
}

export function articleSchema(a: {
  title: string
  description: string
  path: string
  image?: string
  datePublished: string
  dateModified?: string
  authorName: string
  authorSlug: string
}): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${SITE_URL}${a.path}#article`,
    headline: a.title,
    description: a.description,
    image: a.image ? `${SITE_URL}${a.image}` : `${SITE_URL}/assets/og/og-default.svg`,
    datePublished: a.datePublished,
    dateModified: a.dateModified || a.datePublished,
    author: { '@type': 'Person', name: a.authorName, url: `${SITE_URL}/blog/author/${a.authorSlug}` },
    publisher: { '@id': ORG_ID },
    mainEntityOfPage: `${SITE_URL}${a.path}`,
    inLanguage: 'en-US',
  }
}

export function eventSchema(e: {
  name: string
  description: string
  slug: string
  startDate: string
  endDate?: string
  locationName?: string
}): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: e.name,
    description: e.description,
    startDate: e.startDate,
    ...(e.endDate ? { endDate: e.endDate } : {}),
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    url: `${SITE_URL}/events#${e.slug}`,
    location: {
      '@type': 'Place',
      name: e.locationName || site.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: site.address.street,
        addressLocality: site.address.city,
        addressRegion: site.address.region,
        postalCode: site.address.postalCode,
        addressCountry: site.address.country,
      },
    },
    organizer: { '@id': ORG_ID },
    isAccessibleForFree: true,
  }
}

export function courseSchema(c: { name: string; description: string; path: string; lessons: number }): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: c.name,
    description: c.description,
    url: `${SITE_URL}${c.path}`,
    provider: { '@id': ORG_ID },
    isAccessibleForFree: true,
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: `PT${c.lessons}H`,
    },
  }
}
