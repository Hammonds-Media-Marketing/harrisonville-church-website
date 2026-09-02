/**
 * Section model for editor-built pages. A page is a hero (title, eyebrow,
 * lead — the one H1) followed by an ordered list of typed sections. Editors
 * arrange sections in the drag-and-drop builder; PageRenderer maps each type
 * onto the same primitives the hand-built pages use, so an editor cannot
 * produce off-brand or inaccessible markup.
 *
 * The list is stored as JSONB. parsePageSections is the single validating
 * gate on both save and read: unknown section types and malformed fields are
 * dropped, so a bad payload degrades to a skipped section — never a broken
 * page. This module is dependency-free and safe to import from client
 * components (the builder) and server components (the renderer) alike.
 */

/** Prose block inside a rich text section — the article body model. */
export type ProseBlock = {
  type: 'h2' | 'h3' | 'p' | 'scripture' | 'list'
  text?: string
  items?: string[]
  ref?: string
}

/** Band tones an editor can pick; each maps to the Section primitive. */
export type SectionTone = 'light' | 'surface' | 'deep'

export type RichTextSection = {
  id: string
  type: 'richText'
  tone: SectionTone
  eyebrow?: string
  title?: string
  blocks: ProseBlock[]
}

export type ImageTextSection = {
  id: string
  type: 'imageText'
  tone: SectionTone
  eyebrow?: string
  title: string
  /** Blank lines separate paragraphs. */
  body: string
  image: string
  imageAlt: string
  imageSide: 'left' | 'right'
  ctaLabel?: string
  ctaHref?: string
}

export type CardGridSection = {
  id: string
  type: 'cardGrid'
  tone: SectionTone
  eyebrow?: string
  title: string
  lead?: string
  columns: 2 | 3
  cards: { title: string; body: string; linkLabel?: string; linkHref?: string }[]
}

export type FaqSection = {
  id: string
  type: 'faq'
  tone: SectionTone
  eyebrow?: string
  title: string
  lead?: string
  items: { question: string; answer: string }[]
}

export type CtaSection = {
  id: string
  type: 'cta'
  title: string
  body?: string
  primaryLabel: string
  primaryHref: string
  secondaryLabel?: string
  secondaryHref?: string
}

export type PageSection = RichTextSection | ImageTextSection | CardGridSection | FaqSection | CtaSection

export const SECTION_TYPES = ['richText', 'imageText', 'cardGrid', 'faq', 'cta'] as const
export type SectionType = (typeof SECTION_TYPES)[number]

/** Editor-facing names and one-line explanations for the builder palette. */
export const SECTION_LABELS: Record<SectionType, { label: string; hint: string }> = {
  richText: { label: 'Text', hint: 'Headings, paragraphs, lists, and Scripture quotes.' },
  imageText: { label: 'Image and text', hint: 'A photo beside a heading and copy, with an optional button.' },
  cardGrid: { label: 'Card grid', hint: 'A row of cards for ministries, reasons, or next steps.' },
  faq: { label: 'Questions and answers', hint: 'An accordion of common questions, marked up for search.' },
  cta: { label: 'Call to action', hint: 'A deep-navy band with a headline and buttons.' },
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined)

const tone = (v: unknown): SectionTone => (v === 'surface' || v === 'deep' ? v : 'light')

const sectionId = (v: unknown, index: number): string => {
  const raw = typeof v === 'string' ? v : ''
  const clean = raw.replace(/[^a-zA-Z0-9-]/g, '')
  return clean || `section-${index + 1}`
}

function parseBlocks(v: unknown): ProseBlock[] {
  if (!Array.isArray(v)) return []
  const blocks: ProseBlock[] = []
  for (const item of v) {
    if (!item || typeof item !== 'object') continue
    const b = item as Record<string, unknown>
    switch (b.type) {
      case 'h2':
      case 'h3':
      case 'p': {
        const text = str(b.text)
        if (text) blocks.push({ type: b.type, text })
        break
      }
      case 'scripture': {
        const text = str(b.text)
        if (text) blocks.push({ type: 'scripture', text, ...(str(b.ref) ? { ref: str(b.ref) } : {}) })
        break
      }
      case 'list': {
        const items = Array.isArray(b.items)
          ? b.items.filter((i): i is string => typeof i === 'string' && !!i.trim()).map((i) => i.trim())
          : []
        if (items.length) blocks.push({ type: 'list', items })
        break
      }
    }
  }
  return blocks
}

function parseSection(item: unknown, index: number): PageSection | null {
  if (!item || typeof item !== 'object') return null
  const s = item as Record<string, unknown>
  const id = sectionId(s.id, index)

  switch (s.type) {
    case 'richText': {
      const blocks = parseBlocks(s.blocks)
      const title = str(s.title)
      if (!blocks.length && !title) return null
      return { id, type: 'richText', tone: tone(s.tone), eyebrow: str(s.eyebrow), title, blocks }
    }
    case 'imageText': {
      const title = str(s.title)
      const body = str(s.body)
      const image = str(s.image)
      if (!title || !body || !image) return null
      return {
        id,
        type: 'imageText',
        tone: tone(s.tone),
        eyebrow: str(s.eyebrow),
        title,
        body,
        image,
        imageAlt: str(s.imageAlt) ?? '',
        imageSide: s.imageSide === 'left' ? 'left' : 'right',
        ctaLabel: str(s.ctaLabel),
        ctaHref: str(s.ctaHref),
      }
    }
    case 'cardGrid': {
      const title = str(s.title)
      const cards = Array.isArray(s.cards)
        ? s.cards.flatMap((c) => {
            if (!c || typeof c !== 'object') return []
            const card = c as Record<string, unknown>
            const cardTitle = str(card.title)
            const cardBody = str(card.body)
            if (!cardTitle || !cardBody) return []
            return [{ title: cardTitle, body: cardBody, linkLabel: str(card.linkLabel), linkHref: str(card.linkHref) }]
          })
        : []
      if (!title || !cards.length) return null
      return {
        id,
        type: 'cardGrid',
        tone: tone(s.tone),
        eyebrow: str(s.eyebrow),
        title,
        lead: str(s.lead),
        columns: s.columns === 2 ? 2 : 3,
        cards,
      }
    }
    case 'faq': {
      const title = str(s.title)
      const items = Array.isArray(s.items)
        ? s.items.flatMap((i) => {
            if (!i || typeof i !== 'object') return []
            const qa = i as Record<string, unknown>
            const question = str(qa.question)
            const answer = str(qa.answer)
            return question && answer ? [{ question, answer }] : []
          })
        : []
      if (!title || !items.length) return null
      return { id, type: 'faq', tone: tone(s.tone), eyebrow: str(s.eyebrow), title, lead: str(s.lead), items }
    }
    case 'cta': {
      const title = str(s.title)
      const primaryLabel = str(s.primaryLabel)
      const primaryHref = str(s.primaryHref)
      if (!title || !primaryLabel || !primaryHref) return null
      return {
        id,
        type: 'cta',
        title,
        body: str(s.body),
        primaryLabel,
        primaryHref,
        secondaryLabel: str(s.secondaryLabel),
        secondaryHref: str(s.secondaryHref),
      }
    }
    default:
      return null
  }
}

/**
 * Validate an unknown value (a JSONB read or a posted JSON string) into a
 * clean section list. Sections that fail validation are dropped.
 */
export function parsePageSections(raw: unknown): PageSection[] {
  let value = raw
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return []
    }
  }
  if (!Array.isArray(value)) return []
  return value.map(parseSection).filter((s): s is PageSection => s !== null)
}

/** One-line description of a section for the builder's collapsed cards. */
export function sectionSummary(section: PageSection): string {
  switch (section.type) {
    case 'richText': {
      const first = section.blocks.find((b) => b.text)?.text
      return section.title ?? first ?? 'Empty text section'
    }
    case 'imageText':
      return section.title
    case 'cardGrid':
      return `${section.title} (${section.cards.length} card${section.cards.length === 1 ? '' : 's'})`
    case 'faq':
      return `${section.title} (${section.items.length} question${section.items.length === 1 ? '' : 's'})`
    case 'cta':
      return section.title
  }
}
