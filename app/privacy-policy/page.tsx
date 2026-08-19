import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo'
import { JsonLd, breadcrumbSchema, webPageSchema } from '@/lib/jsonld'
import { Container, Section } from '@/components/primitives/Layout'
import { site } from '@/lib/site'

export const dynamic = 'force-static'

export const metadata: Metadata = buildMetadata({
  title: 'Privacy Policy',
  description:
    'How the Harrisonville Church of Christ handles the information you share through forms and the limited analytics used on this website.',
  path: '/privacy-policy',
  ogTitle: 'How We Handle Your Information',
  ogDescription: 'A plain-language explanation of what this website collects, why, and how to reach us about it.',
})

const breadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'Privacy Policy', path: '/privacy-policy' },
]

export default function PrivacyPolicyPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageSchema({ name: 'Privacy Policy', description: metadata.description as string, path: '/privacy-policy' }),
          breadcrumbSchema(breadcrumbs),
        ]}
      />
      <Section tone="surface">
        <Container prose>
          <h1 className="mt-5 text-4xl">Privacy Policy</h1>
          <p className="text-muted">Last updated June 9, 2026</p>
        </Container>
      </Section>

      <Section tone="light">
        <Container prose>
          <p>
            The {site.name} respects your privacy. This policy explains what information this website collects, why it
            is collected, and the choices you have. We collect as little as possible.
          </p>

          <h2 className="text-2xl">What information do we collect?</h2>
          <p>
            When you submit a form on this site, such as the contact, prayer request, or Bible study request form, we
            receive the details you choose to provide. That may include your name, email address, phone number, and the
            content of your message. You decide how much to share.
          </p>
          <p>
            The site also captures basic campaign attribution, such as how you arrived here, stored in your browser so we
            can understand which efforts help people find us. See the{' '}
            <Link href="/cookie-policy" className="text-link hover:text-link-hover">
              Cookie Usage Policy
            </Link>{' '}
            for details.
          </p>

          <h2 className="text-2xl">How is your information used?</h2>
          <p>
            Information from forms is used only to respond to you. We do not sell, rent, or trade your personal
            information, and you will not be added to an automated sales sequence. Expect a personal reply from a member
            of the congregation.
          </p>

          <h2 className="text-2xl">Who processes the information?</h2>
          <p>
            Form submissions are delivered through Formspree, a third-party form provider, which forwards your message to
            the congregation. Anonymous, aggregate website usage may be measured with Google Analytics 4 and Mixpanel.
            These providers process data under their own privacy terms. We configure analytics to avoid collecting more
            than is necessary.
          </p>

          <h2 className="text-2xl">How long is information kept?</h2>
          <p>
            Messages are retained only as long as needed to respond and to keep a record of our correspondence with you.
            You may ask us to delete your information at any time.
          </p>

          <h2 className="text-2xl">What are your choices?</h2>
          <p>
            You may request access to, correction of, or deletion of the personal information you have shared with us. You
            may also control cookies through your browser settings, as described in the Cookie Usage Policy.
          </p>

          <h2 className="text-2xl">How can you reach us?</h2>
          <p>
            For any question about this policy or your information, contact us at{' '}
            <a href={`mailto:${site.email}`} className="text-link hover:text-link-hover">
              {site.email}
            </a>{' '}
            or {site.phoneDisplay}, or by mail at {site.address.street}, {site.address.city}, {site.address.region}{' '}
            {site.address.postalCode}.
          </p>
        </Container>
      </Section>
    </>
  )
}
