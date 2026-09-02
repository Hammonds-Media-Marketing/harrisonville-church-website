import type { Metadata } from 'next'
import { copyMetadata, pageCopy } from '@/lib/page-copy'
import { JsonLd, breadcrumbSchema, webPageSchema } from '@/lib/jsonld'
import { site } from '@/lib/site'
import { Container, Section } from '@/components/primitives/Layout'
import { Surface } from '@/components/primitives/Surface'
import { PageHero } from '@/components/blocks/PageHero'
import { ParkingAerial } from '@/components/blocks/ParkingAerial'
import { LeadForm, type FormField } from '@/components/forms/LeadForm'
import { ClockIcon, MailIcon, MapPinIcon, PhoneIcon } from '@/components/ui/icons'

export const dynamic = 'force-dynamic'

const PATH = '/contact'

export async function generateMetadata(): Promise<Metadata> {
  return copyMetadata(PATH)
}

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
  { name: 'Connect', path: PATH },
]

export default async function ContactPage() {
  const copy = await pageCopy(PATH)

  return (
    <>
      <JsonLd
        data={[
          webPageSchema({ name: 'Contact', description: copy.s('seo.description'), path: PATH }),
          breadcrumbSchema(breadcrumbs),
        ]}
      />

      <PageHero
        id="contact-heading"
        eyebrow={copy.t('hero.eyebrow')}
        title={copy.t('hero.title')}
        lead={copy.t('hero.lead')}
        photo={{ src: copy.s('hero.photo'), alt: copy.s('hero.photoAlt') }}
      />

      <Section tone="light">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="flex flex-col gap-10">
              {/* General contact */}
              <section id="contact-form" aria-labelledby="general-heading" className="scroll-mt-32">
                <h2 id="general-heading" className="text-2xl">{copy.t('general.title')}</h2>
                <p className="mb-5 mt-1 text-muted">{copy.t('general.lead')}</p>
                <LeadForm
                  formType="general-contact"
                  ariaLabel="General contact form"
                  fields={generalFields}
                  submitLabel={copy.s('general.submit')}
                  successHeading={copy.s('general.successHeading')}
                  successBody={copy.s('general.successBody')}
                />
              </section>

              {/* Prayer request */}
              <section id="prayer-request" aria-labelledby="prayer-heading" className="scroll-mt-32 border-t border-border/50 pt-10">
                <h2 id="prayer-heading" className="text-2xl">{copy.t('prayer.title')}</h2>
                <p className="mb-5 mt-1 text-muted">{copy.t('prayer.lead')}</p>
                <LeadForm
                  formType="prayer-request"
                  ariaLabel="Prayer request form"
                  fields={prayerFields}
                  submitLabel={copy.s('prayer.submit')}
                  successHeading={copy.s('prayer.successHeading')}
                  successBody={copy.s('prayer.successBody')}
                />
              </section>

              {/* Bible study request */}
              <section id="request-bible-study" aria-labelledby="study-heading" className="scroll-mt-32 border-t border-border/50 pt-10">
                <h2 id="study-heading" className="text-2xl">{copy.t('study.title')}</h2>
                <p className="mb-5 mt-1 text-muted">{copy.t('study.lead')}</p>
                <LeadForm
                  formType="bible-study-request"
                  ariaLabel="Bible study request form"
                  fields={bibleStudyFields}
                  submitLabel={copy.s('study.submit')}
                  successHeading={copy.s('study.successHeading')}
                  successBody={copy.s('study.successBody')}
                />
              </section>
            </div>

            {/* Contact details sidebar */}
            <aside aria-label="Visit and contact details">
              <Surface tone="panel" className="sticky top-32 flex flex-col gap-5">
                <h2 className="text-xl">{copy.t('sidebar.title')}</h2>
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
                  <figcaption className="mt-2 text-sm text-muted">{copy.t('sidebar.parkingCaption')}</figcaption>
                </figure>
                <div className="flex items-start gap-3 border-t border-border/50 pt-4 text-ink">
                  <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary-strong" />
                  <div className="flex-1">
                    <p className="font-semibold text-heading">{copy.t('sidebar.timesLabel')}</p>
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
