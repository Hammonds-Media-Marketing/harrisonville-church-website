import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { JsonLd, breadcrumbSchema, webPageSchema } from '@/lib/jsonld'
import { site } from '@/lib/site'
import { Container, Section } from '@/components/primitives/Layout'
import { Surface } from '@/components/primitives/Surface'
import { PageHero } from '@/components/blocks/PageHero'
import { ParkingAerial } from '@/components/blocks/ParkingAerial'
import { LeadForm, type FormField } from '@/components/forms/LeadForm'
import { ClockIcon, MailIcon, MapPinIcon, PhoneIcon } from '@/components/ui/icons'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildMetadata({
  title: 'Contact, Prayer and Bible Study',
  description:
    'Reach the Harrisonville Church of Christ. Ask a question, send a prayer request, or request a free Bible study in person or online. A real person will reply.',
  path: '/contact',
  ogTitle: 'Connect With the Harrisonville Church of Christ',
  ogDescription:
    'Questions, prayer requests, and free Bible study requests all reach a real member who will respond personally.',
})

const generalFields: FormField[] = [
  { kind: 'text', name: 'firstName', label: 'First name', required: true, autoComplete: 'given-name' },
  { kind: 'text', name: 'lastName', label: 'Last name', required: true, autoComplete: 'family-name' },
  { kind: 'email', name: 'email', label: 'Email', required: true, autoComplete: 'email' },
  { kind: 'tel', name: 'phone', label: 'Phone', autoComplete: 'tel' },
  { kind: 'select', name: 'topic', label: 'What is this about?', required: true, options: ['Planning a visit', 'A question about the Bible', 'A question about the church', 'Something else'], full: true },
  { kind: 'textarea', name: 'message', label: 'Your message', required: true, placeholder: 'How can we help?', rows: 5 },
]

const prayerFields: FormField[] = [
  { kind: 'text', name: 'firstName', label: 'First name', required: true, autoComplete: 'given-name' },
  { kind: 'text', name: 'lastName', label: 'Last name', autoComplete: 'family-name', helper: 'A last name is optional. Use only what you are comfortable sharing.' },
  { kind: 'email', name: 'email', label: 'Email', autoComplete: 'email' },
  { kind: 'select', name: 'visibility', label: 'How should we handle this request?', required: true, options: ['Keep it private to the leadership', 'Share it with the congregation for prayer'], full: true },
  { kind: 'textarea', name: 'request', label: 'Your prayer request', required: true, placeholder: 'Share as much or as little as you wish.', rows: 5 },
]

const bibleStudyFields: FormField[] = [
  { kind: 'text', name: 'firstName', label: 'First name', required: true, autoComplete: 'given-name' },
  { kind: 'text', name: 'lastName', label: 'Last name', required: true, autoComplete: 'family-name' },
  { kind: 'email', name: 'email', label: 'Email', required: true, autoComplete: 'email' },
  { kind: 'tel', name: 'phone', label: 'Phone', autoComplete: 'tel' },
  { kind: 'select', name: 'format', label: 'Preferred format', required: true, options: ['In person', 'Online (video)', 'Either is fine'] },
  { kind: 'textarea', name: 'about', label: 'Tell us about yourself', required: true, placeholder: 'Tell us about your religious background, or how we may assist you spiritually.', rows: 4, full: true },
  { kind: 'textarea', name: 'availability', label: 'Anything else, including your availability', placeholder: 'Optional: days or times that work, and any question on your mind.', rows: 4 },
]

const breadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'Connect', path: '/contact' },
]

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageSchema({ name: 'Contact', description: metadata.description as string, path: '/contact' }),
          breadcrumbSchema(breadcrumbs),
        ]}
      />

      <PageHero
        id="contact-heading"
        eyebrow="Connect with us"
        title="We would be glad to hear from you"
        lead="Whether you are planning a first visit, carrying something heavy, or want to open a Bible together, there is a way to reach us below. A real member reads every message and replies personally."
        photo={{
          src: '/assets/photos/welcome-handshake.jpg',
          alt: 'A member welcomes a visitor with a handshake just inside the front door of the building',
        }}
      />

      <Section tone="light">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="flex flex-col gap-10">
              {/* General contact */}
              <section id="contact-form" aria-labelledby="general-heading" className="scroll-mt-32">
                <h2 id="general-heading" className="text-2xl">Send a general message</h2>
                <p className="mb-5 mt-1 text-muted">Questions about visiting, the church, or anything else.</p>
                <LeadForm
                  formType="general-contact"
                  ariaLabel="General contact form"
                  fields={generalFields}
                  submitLabel="Send message"
                  successHeading="Message received"
                  successBody="Thank you for reaching out. A member of the congregation will reply to you personally, usually within a day or two."
                />
              </section>

              {/* Prayer request */}
              <section id="prayer-request" aria-labelledby="prayer-heading" className="scroll-mt-32 border-t border-border/50 pt-10">
                <h2 id="prayer-heading" className="text-2xl">Send a prayer request</h2>
                <p className="mb-5 mt-1 text-muted">
                  You do not need to be a member to ask for prayer. Your request is treated with care.
                </p>
                <LeadForm
                  formType="prayer-request"
                  ariaLabel="Prayer request form"
                  fields={prayerFields}
                  submitLabel="Send prayer request"
                  successHeading="Your request is received"
                  successBody="Thank you for trusting us with this. The congregation will be praying, and we will honor how you asked us to handle it."
                />
              </section>

              {/* Bible study request */}
              <section id="request-bible-study" aria-labelledby="study-heading" className="scroll-mt-32 border-t border-border/50 pt-10">
                <h2 id="study-heading" className="text-2xl">Request a Bible study</h2>
                <p className="mb-5 mt-1 text-muted">A free Bible study, in person or online.</p>
                <LeadForm
                  formType="bible-study-request"
                  ariaLabel="Bible study request form"
                  fields={bibleStudyFields}
                  submitLabel="Request a study"
                  successHeading="We will be in touch"
                  successBody="Thank you for your interest in studying the Bible. Someone will reach out to arrange a time that works for you."
                />
              </section>
            </div>

            {/* Contact details sidebar */}
            <aside aria-label="Visit and contact details">
              <Surface tone="panel" className="sticky top-32 flex flex-col gap-5">
                <h2 className="text-xl">Visit or reach us</h2>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(`${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postalCode}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 text-ink hover:text-link"
                >
                  <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary-strong" />
                  <span>
                    {site.address.street}
                    <br />
                    {site.address.city}, {site.address.region} {site.address.postalCode}
                  </span>
                </a>
                <a href={`tel:${site.phone}`} className="flex items-center gap-3 text-ink hover:text-link">
                  <PhoneIcon className="h-5 w-5 shrink-0 text-primary-strong" />
                  {site.phoneDisplay}
                </a>
                <a href={`mailto:${site.email}`} className="flex items-center gap-3 text-sm text-ink hover:text-link">
                  <MailIcon className="h-5 w-5 shrink-0 text-primary-strong" />
                  <span className="whitespace-nowrap">{site.email}</span>
                </a>
                <figure className="border-t border-border/50 pt-4">
                  <ParkingAerial sizes="(max-width: 1024px) 100vw, 320px" />
                  <figcaption className="mt-2 text-sm text-muted">
                    Enter the parking lot from 2 Highway, near the corner of 2 Highway and Outlook Drive.
                  </figcaption>
                </figure>
                <div className="flex items-start gap-3 border-t border-border/50 pt-4 text-ink">
                  <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary-strong" />
                  <div className="flex-1">
                    <p className="font-semibold text-heading">Assembly times</p>
                    <ul className="mt-2 flex flex-col gap-1.5 text-sm">
                      {site.services.map((s) => (
                        <li key={s.id} className="flex items-baseline justify-between gap-3">
                          <span className="whitespace-nowrap text-muted">{s.label.replace(' Worship', '')}</span>
                          <span className="whitespace-nowrap font-semibold text-heading">{s.timeDisplay}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Surface>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  )
}
