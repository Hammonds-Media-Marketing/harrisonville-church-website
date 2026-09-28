import type { PageSection } from '@/lib/page-sections'

/**
 * Starter layouts for a new page. Choosing one fills the builder with a
 * handful of sections whose fields hold short prompts ("Tell visitors…"),
 * so an editor starts from a shape that already looks like a finished
 * page and only has to write. Every prompt is plain wording to be replaced;
 * nothing here pretends to be real church content.
 *
 * Sections get fresh ids when a template is applied, so applying the same
 * template twice never produces duplicate ids.
 */

export type PageTemplate = {
  id: string
  label: string
  hint: string
  /** Section types in order, for the thumbnail. */
  build: () => Omit<PageSection, 'id'>[]
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'ministry',
    label: 'Ministry or program',
    hint: 'A photo and introduction, a row of cards, and an invitation.',
    build: () => [
      {
        type: 'imageText',
        tone: 'light',
        eyebrow: 'About this ministry',
        title: 'Who it is for and what we do',
        body: 'Tell visitors what this ministry is, who it serves, and why it matters to the congregation.\n\nA second paragraph can say when and where it meets.',
        image: '',
        imageAlt: '',
        imageSide: 'right',
      },
      {
        type: 'cardGrid',
        tone: 'surface',
        title: 'How to take part',
        columns: 3,
        cards: [
          { title: 'First step', body: 'Describe one way someone can get involved.' },
          { title: 'Second step', body: 'Describe another way to take part.' },
          { title: 'Third step', body: 'Describe a third, or remove this card.' },
        ],
      },
      {
        type: 'cta',
        title: 'Come and see',
        body: 'Invite visitors to a next step, like a visit or a question.',
        primaryLabel: 'Plan your visit',
        primaryHref: '/about/what-to-expect',
        secondaryLabel: 'Ask a question',
        secondaryHref: '/contact',
      },
    ],
  },
  {
    id: 'article',
    label: 'Simple text page',
    hint: 'Headings, paragraphs, and Scripture, then an invitation.',
    build: () => [
      {
        type: 'richText',
        tone: 'light',
        blocks: [
          { type: 'p', text: 'Open with a sentence or two that says what this page covers.' },
          { type: 'h2', text: 'A heading for the first point' },
          { type: 'p', text: 'Write the first point here.' },
          { type: 'scripture', text: 'Your word is a lamp to my feet and a light to my path.', ref: 'Psalm 119:105' },
        ],
      },
      {
        type: 'cta',
        title: 'Have a question?',
        primaryLabel: 'Contact us',
        primaryHref: '/contact',
      },
    ],
  },
  {
    id: 'questions',
    label: 'Questions page',
    hint: 'A short introduction, common questions, and an invitation.',
    build: () => [
      {
        type: 'richText',
        tone: 'light',
        title: 'What this page answers',
        blocks: [{ type: 'p', text: 'A sentence or two that sets up the questions below.' }],
      },
      {
        type: 'faq',
        tone: 'surface',
        title: 'Common questions',
        items: [
          { question: 'A question visitors often ask', answer: 'Its answer, in a few plain sentences.' },
          { question: 'Another common question', answer: 'Its answer.' },
        ],
      },
      {
        type: 'cta',
        title: 'Still wondering about something?',
        primaryLabel: 'Ask a question',
        primaryHref: '/contact',
      },
    ],
  },
  {
    id: 'free',
    label: 'Free layout',
    hint: 'A blank band to build from titles, photos, columns, and more.',
    build: () => [{ type: 'elements', elements: [] }],
  },
]
