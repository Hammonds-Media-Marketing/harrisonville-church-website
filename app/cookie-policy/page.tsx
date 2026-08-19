import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo'
import { JsonLd, breadcrumbSchema, webPageSchema } from '@/lib/jsonld'
import { Container, Section } from '@/components/primitives/Layout'
import { site } from '@/lib/site'

export const dynamic = 'force-static'

export const metadata: Metadata = buildMetadata({
  title: 'Cookie Usage Policy',
  description:
    'What cookies and browser storage the Harrisonville Church of Christ website uses, what each one is for, and how to control them.',
  path: '/cookie-policy',
  ogTitle: 'Cookies and Browser Storage on This Site',
  ogDescription: 'A plain explanation of the limited storage this website uses and how you stay in control of it.',
})

const breadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'Cookie Policy', path: '/cookie-policy' },
]

export default function CookiePolicyPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageSchema({ name: 'Cookie Usage Policy', description: metadata.description as string, path: '/cookie-policy' }),
          breadcrumbSchema(breadcrumbs),
        ]}
      />
      <Section tone="surface">
        <Container prose>
          <h1 className="mt-5 text-4xl">Cookie Usage Policy</h1>
          <p className="text-muted">Last updated June 9, 2026</p>
        </Container>
      </Section>

      <Section tone="light">
        <Container prose>
          <p>
            Cookies and similar browser storage are small pieces of data a website saves in your browser. This page
            explains what the {site.name} website uses and why. We keep this to a minimum.
          </p>

          <h2 className="text-2xl">What does this site store?</h2>
          <p>There are three kinds of storage you may encounter here:</p>
          <ul className="flex flex-col gap-3">
            <li>
              <strong className="text-heading">Attribution storage.</strong> The site saves a small record in your
              browser local storage, under the key <code>hm_attribution</code>, noting how you arrived, such as a search
              campaign or a referring link. This helps the congregation understand which efforts help people find the
              church. It is not used to identify you personally.
            </li>
            <li>
              <strong className="text-heading">Analytics cookies.</strong> If analytics are enabled, Google Analytics 4
              and Mixpanel may set cookies to measure anonymous, aggregate usage, such as which pages are visited most.
            </li>
            <li>
              <strong className="text-heading">Essential function.</strong> Some storage supports basic site function,
              such as remembering that you submitted a form during your visit.
            </li>
          </ul>

          <h2 className="text-2xl">Does this site use advertising cookies?</h2>
          <p>No. There are no advertising or retargeting networks running on this website.</p>

          <h2 className="text-2xl">How can you control cookies?</h2>
          <p>
            You can clear or block cookies and local storage through your browser settings. Most browsers let you remove
            existing data and prevent new storage. Blocking storage will not stop you from reading the site, though some
            conveniences may not work as smoothly.
          </p>

          <h2 className="text-2xl">Where can you learn more?</h2>
          <p>
            See our{' '}
            <Link href="/privacy-policy" className="text-link hover:text-link-hover">
              Privacy Policy
            </Link>{' '}
            for how information is handled, or contact us at{' '}
            <a href={`mailto:${site.email}`} className="text-link hover:text-link-hover">
              {site.email}
            </a>
            .
          </p>
        </Container>
      </Section>
    </>
  )
}
