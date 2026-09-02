import type { Metadata } from 'next'
import Image from 'next/image'
import { copyMetadata, pageCopy } from '@/lib/page-copy'
import { JsonLd, webPageSchema } from '@/lib/jsonld'
import { PRIMARY_CTA, site } from '@/lib/site'
import { Container, Eyebrow, Section, SectionHeading } from '@/components/primitives/Layout'
import { Button } from '@/components/primitives/Button'
import { Surface } from '@/components/primitives/Surface'
import { Wave } from '@/components/decor/Wave'
import { LighthouseScene } from '@/components/hero/LighthouseScene'
import { CardLink } from '@/components/blocks/cards'
import { BookIcon, CheckIcon, ClockIcon, MapPinIcon } from '@/components/ui/icons'

const PATH = '/'

export async function generateMetadata(): Promise<Metadata> {
  return copyMetadata(PATH, { rawTitle: true })
}

export default async function HomePage() {
  const copy = await pageCopy(PATH)
  const reassurances = [1, 2, 3] as const

  return (
    <>
      <JsonLd
        data={[webPageSchema({ name: site.name, description: copy.s('seo.description'), path: PATH })]}
      />

      {/* ---------------------------------------------------------------- Hero
          Pulled up behind the sticky header (with matching padding) so the sky
          gradient fills the strip behind the translucent nav instead of the
          white page background showing through. */}
      <section
        aria-labelledby="hero-heading"
        className="relative -mt-24 overflow-hidden pt-24 text-ink"
        style={{ background: 'var(--gradient-hero-sky)' }}
      >
        <div className="mx-auto grid max-w-container items-center gap-6 px-5 pb-9 pt-8 md:pb-10 md:pt-9 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col gap-5">
            <Eyebrow marks={false}>{copy.t('hero.eyebrow')}</Eyebrow>
            <h1 id="hero-heading" className="text-4xl md:text-5xl">
              {copy.t('hero.title')}
            </h1>
            <p className="max-w-xl text-lg text-muted">{copy.t('hero.lead')}</p>
            <div className="flex flex-wrap gap-3">
              <Button href={PRIMARY_CTA.href} size="lg">
                {PRIMARY_CTA.label}
              </Button>
              <Button href={copy.s('hero.secondaryHref')} variant="secondary" size="lg">
                {copy.t('hero.secondaryLabel')}
              </Button>
            </div>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-ink">
              <span className="inline-flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-primary-strong" />
                {copy.t('hero.times')}
              </span>
            </p>
          </div>

          {/* Interactive lighthouse — the beam follows the cursor on desktop
              and swings with scroll position on touch screens. */}
          <div className="relative mx-auto aspect-square w-full max-w-md lg:max-w-none">
            <LighthouseScene />
          </div>
        </div>
        <Wave fill="var(--color-bg)" />
      </section>

      {/* ------------------------------------------------------------ Welcome */}
      <Section tone="light" ariaLabelledby="welcome-heading">
        <Container>
          <SectionHeading
            id="welcome-heading"
            eyebrow={copy.t('welcome.eyebrow')}
            title={copy.t('welcome.title')}
            lead={copy.t('welcome.lead')}
          />
          <figure className="mb-7">
            <Image
              src={copy.s('welcome.photo')}
              alt={copy.s('welcome.photoAlt')}
              width={1600}
              height={900}
              loading="lazy"
              sizes="(max-width: 1160px) 100vw, 1100px"
              className="photo-grade h-auto w-full rounded-xl object-cover"
              {...copy.mark('welcome.photo')}
            />
            <figcaption className="mt-2 text-sm text-muted">{copy.t('welcome.caption')}</figcaption>
          </figure>
          <div className="grid gap-5 md:grid-cols-3">
            {reassurances.map((n) => (
              <Surface key={n} tone="card" className="flex flex-col gap-3">
                {/* Living-water green — the logo's grass color as the color of "yes". */}
                <span className="grid h-11 w-11 place-items-center rounded-full bg-surface text-accent-strong">
                  <CheckIcon className="h-6 w-6" />
                </span>
                <h3 className="text-xl">{copy.t(`welcome.card${n}.title`)}</h3>
                <p className="text-ink">{copy.t(`welcome.card${n}.body`)}</p>
              </Surface>
            ))}
          </div>
          <p className="mt-6">
            <CardLink href={copy.s('welcome.linkHref')}>{copy.t('welcome.linkLabel')}</CardLink>
          </p>
        </Container>
      </Section>

      {/* ------------------------------------------------- Service times band */}
      <Section tone="deep" ariaLabelledby="visit-heading">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="flex flex-col gap-4">
              <SectionHeading
                id="visit-heading"
                onDeep
                eyebrow={copy.t('visit.eyebrow')}
                title={copy.t('visit.title')}
                lead={copy.t('visit.lead')}
              />
              <Button href={PRIMARY_CTA.href} variant="primary" className="w-fit">
                {PRIMARY_CTA.label}
              </Button>
            </div>
            <Surface tone="deep" className="flex flex-col gap-4">
              <ul className="flex flex-col gap-3">
                {site.services.map((s) => (
                  <li key={s.id} className="flex items-baseline justify-between gap-4 border-b border-on-deep-muted/20 pb-3 last:border-0 last:pb-0">
                    <span className="font-display text-xl text-on-deep">{s.label}</span>
                    <span className="whitespace-nowrap font-semibold text-secondary">{s.timeDisplay}</span>
                  </li>
                ))}
              </ul>
              <p className="flex items-start gap-2 text-on-deep-muted">
                <MapPinIcon className="mt-0.5 h-5 w-5 text-secondary" />
                <span>
                  {site.address.street}, {site.address.city}, {site.address.region} {site.address.postalCode}
                </span>
              </p>
            </Surface>
          </div>
          <div className="mt-8 overflow-hidden rounded-xl border border-on-deep-muted/20">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1413829.9972563125!2d-96.8577587831071!3d37.13297595480021!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x87c12be6025a3b87%3A0x4505932af4760b7b!2sHarrisonville%20Church%20of%20Christ!5e0!3m2!1sen!2sus!4v1788190560791!5m2!1sen!2sus"
              title={copy.s('visit.mapTitle')}
              className="block h-80 w-full border-0 md:h-96"
              loading="lazy"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </Container>
      </Section>

      {/* ----------------------------------------------------------- Beliefs */}
      <Section tone="surface" ariaLabelledby="beliefs-heading">
        <Container>
          <SectionHeading
            id="beliefs-heading"
            align="center"
            eyebrow={copy.t('beliefs.eyebrow')}
            title={copy.t('beliefs.title')}
          />
          <div className="mx-auto flex max-w-2xl flex-col gap-4 text-center text-lg text-ink">
            <p>{copy.t('beliefs.p1')}</p>
            <p>{copy.t('beliefs.p2')}</p>
            <p>{copy.t('beliefs.p3')}</p>
          </div>
          <p className="mt-6 text-center">
            <CardLink href={copy.s('beliefs.linkHref')}>{copy.t('beliefs.linkLabel')}</CardLink>
          </p>
        </Container>
      </Section>

      {/* ------------------------------------------------- Bible study course */}
      <Section tone="light" ariaLabelledby="course-heading">
        <Container>
          <Surface tone="panel" className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-strong text-on-primary">
                <BookIcon className="h-6 w-6" />
              </span>
              <div>
                <h2 id="course-heading" className="text-2xl">{copy.t('course.title')}</h2>
                <p className="mt-1 max-w-2xl text-ink">{copy.t('course.body')}</p>
              </div>
            </div>
            <Button href={copy.s('course.ctaHref')} className="shrink-0">
              {copy.t('course.ctaLabel')}
            </Button>
          </Surface>
        </Container>
      </Section>

      {/* ----------------------------------------------------------- Final CTA */}
      <Section tone="deep">
        <Container className="flex flex-col items-center gap-5 text-center">
          <h2 className="text-3xl text-on-deep">{copy.t('cta.title')}</h2>
          <p className="max-w-xl text-lg text-on-deep-muted">{copy.t('cta.body')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button href={PRIMARY_CTA.href} variant="primary" size="lg">
              {PRIMARY_CTA.label}
            </Button>
            <Button href={copy.s('cta.secondaryHref')} variant="ghostOnDeep" size="lg">
              {copy.t('cta.secondaryLabel')}
            </Button>
          </div>
        </Container>
      </Section>
    </>
  )
}
