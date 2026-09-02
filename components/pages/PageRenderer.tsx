import Image from 'next/image'
import { Container, Section, SectionHeading } from '@/components/primitives/Layout'
import { Surface } from '@/components/primitives/Surface'
import { Button } from '@/components/primitives/Button'
import { Faq } from '@/components/blocks/Faq'
import { ArticleBody } from '@/components/blog/ArticleBody'
import type {
  CardGridSection,
  CtaSection,
  FaqSection,
  ImageTextSection,
  PageSection,
  RichTextSection,
} from '@/lib/page-sections'

/**
 * Renders an editor-built page's section list through the site's primitives.
 * Server component: every word an editor publishes is in the served HTML for
 * readers and retrieval agents, with the same semantics, tones, and contrast
 * as the hand-built pages. Section headings are H2s under the page's single
 * H1 (the hero), so the document outline stays correct no matter how
 * sections are arranged.
 */

/** Blank lines in editor copy separate paragraphs. */
function paragraphs(body: string): string[] {
  return body
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

/** Only optimize images we know the image loader is configured for. */
const canOptimize = (src: string) => src.startsWith('/') || /\.supabase\.co\//.test(src)

function RichTextBand({ section }: { section: RichTextSection }) {
  const onDeep = section.tone === 'deep'
  const headingId = section.title ? `${section.id}-heading` : undefined
  return (
    <Section tone={section.tone} ariaLabelledby={headingId}>
      <Container prose>
        {section.title ? (
          <SectionHeading id={headingId} eyebrow={section.eyebrow} title={section.title} onDeep={onDeep} />
        ) : null}
        {/* Scripture quotes keep their light card inside deep bands, so their
            ink text stays readable; everything else flips to the deep tokens. */}
        <div className={onDeep ? '[&_h2]:text-on-deep [&_h3]:text-on-deep [&_p]:text-on-deep [&_li_span]:text-on-deep [&_blockquote_p]:text-ink' : ''}>
          <ArticleBody body={section.blocks} />
        </div>
      </Container>
    </Section>
  )
}

function ImageTextBand({ section }: { section: ImageTextSection }) {
  const onDeep = section.tone === 'deep'
  const headingId = `${section.id}-heading`
  return (
    <Section tone={section.tone} ariaLabelledby={headingId}>
      <Container>
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div className={section.imageSide === 'left' ? 'lg:order-2' : ''}>
            <SectionHeading id={headingId} eyebrow={section.eyebrow} title={section.title} onDeep={onDeep} />
            <div className="flex max-w-prose flex-col gap-4">
              {paragraphs(section.body).map((p) => (
                <p key={p} className={onDeep ? 'text-on-deep-muted' : 'text-ink'}>
                  {p}
                </p>
              ))}
              {section.ctaLabel && section.ctaHref ? (
                <div className="mt-2">
                  <Button href={section.ctaHref} variant={onDeep ? 'ghostOnDeep' : 'secondary'}>
                    {section.ctaLabel}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
          <div className={`relative mx-auto w-full max-w-md lg:max-w-none ${section.imageSide === 'left' ? 'lg:order-1' : ''}`}>
            <div aria-hidden="true" className="absolute inset-0 translate-x-3 translate-y-3 rounded-xl bg-primary-strong/20" />
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl shadow-md">
              {/* Below the hero, so lazy loading (the next/image default) applies. */}
              <Image
                src={section.image}
                alt={section.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                unoptimized={!canOptimize(section.image)}
                className="photo-grade object-cover"
              />
            </div>
          </div>
        </div>
      </Container>
    </Section>
  )
}

function CardGridBand({ section }: { section: CardGridSection }) {
  const onDeep = section.tone === 'deep'
  const headingId = `${section.id}-heading`
  return (
    <Section tone={section.tone} ariaLabelledby={headingId}>
      <Container>
        <SectionHeading
          id={headingId}
          eyebrow={section.eyebrow}
          title={section.title}
          lead={section.lead}
          onDeep={onDeep}
        />
        <ul className={`grid list-none gap-5 p-0 sm:grid-cols-2 ${section.columns === 3 ? 'lg:grid-cols-3' : ''}`}>
          {section.cards.map((card) => (
            <li key={card.title}>
              <Surface
                tone={onDeep ? 'deep' : 'card'}
                interactive={Boolean(card.linkHref)}
                className="flex h-full flex-col gap-2"
              >
                <h3 className={`text-xl ${onDeep ? 'text-on-deep' : ''}`}>{card.title}</h3>
                <p className={onDeep ? 'text-on-deep-muted' : 'text-muted'}>{card.body}</p>
                {card.linkHref && card.linkLabel ? (
                  <p className="mt-auto pt-2">
                    <Button href={card.linkHref} variant="link" className="after:absolute after:inset-0">
                      {card.linkLabel}
                    </Button>
                  </p>
                ) : null}
              </Surface>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  )
}

function FaqBand({ section }: { section: FaqSection }) {
  const headingId = `${section.id}-heading`
  return (
    <Section tone={section.tone === 'deep' ? 'surface' : section.tone} ariaLabelledby={headingId}>
      <Container prose>
        <SectionHeading id={headingId} eyebrow={section.eyebrow} title={section.title} lead={section.lead} />
        <Faq items={section.items} />
      </Container>
    </Section>
  )
}

function CtaBand({ section }: { section: CtaSection }) {
  const headingId = `${section.id}-heading`
  return (
    <Section tone="deep" ariaLabelledby={headingId}>
      <Container className="flex flex-col items-center gap-5 text-center">
        <h2 id={headingId} className="max-w-prose text-3xl text-on-deep md:text-4xl">
          {section.title}
        </h2>
        {section.body ? <p className="max-w-prose text-lg text-on-deep-muted">{section.body}</p> : null}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button href={section.primaryHref} variant="primary">
            {section.primaryLabel}
          </Button>
          {section.secondaryLabel && section.secondaryHref ? (
            <Button href={section.secondaryHref} variant="ghostOnDeep">
              {section.secondaryLabel}
            </Button>
          ) : null}
        </div>
      </Container>
    </Section>
  )
}

export function PageRenderer({ sections }: { sections: PageSection[] }) {
  return (
    <>
      {sections.map((section) => {
        switch (section.type) {
          case 'richText':
            return <RichTextBand key={section.id} section={section} />
          case 'imageText':
            return <ImageTextBand key={section.id} section={section} />
          case 'cardGrid':
            return <CardGridBand key={section.id} section={section} />
          case 'faq':
            return <FaqBand key={section.id} section={section} />
          case 'cta':
            return <CtaBand key={section.id} section={section} />
        }
      })}
    </>
  )
}

/** Hero wave fill matching the first section's background, so the hero band
 *  flows into the page without a color seam. */
export function heroWaveFill(sections: PageSection[]): string {
  const first = sections[0]
  if (!first) return 'var(--color-bg)'
  const tone = first.type === 'cta' ? 'deep' : first.type === 'faq' && first.tone === 'deep' ? 'surface' : first.tone
  if (tone === 'deep') return 'var(--color-surface-deep)'
  if (tone === 'surface') return 'var(--color-surface)'
  return 'var(--color-bg)'
}

/** All question-and-answer pairs on a page, for FAQ structured data. */
export function faqItemsFromSections(sections: PageSection[]): { question: string; answer: string }[] {
  return sections.flatMap((s) => (s.type === 'faq' ? s.items : []))
}
