import type { PageCopySpec } from '@/lib/site-copy'

export const resourcesCopy: PageCopySpec = {
  path: '/resources',
  name: 'Resources',
  summary: 'The hub linking to the free study material.',
  groups: [
    {
      id: 'hero',
      label: 'Hero',
      fields: [
        { key: 'hero.eyebrow', label: 'Eyebrow', kind: 'text', value: 'Free resources' },
        { key: 'hero.title', label: 'Headline', kind: 'text', value: 'Study the Bible on your own terms' },
        {
          key: 'hero.lead',
          label: 'Opening paragraph',
          kind: 'longText',
          value:
            'Everything here is free, and none of it requires you to attend or join anything. Start wherever your questions are.',
        },
      ],
    },
    {
      id: 'card',
      label: 'Bible study card',
      fields: [
        { key: 'card.eyebrow', label: 'Eyebrow', kind: 'text', value: 'Resource' },
        { key: 'card.title', label: 'Heading', kind: 'text', value: 'Bible Study Course' },
        {
          key: 'card.body',
          label: 'Copy',
          kind: 'longText',
          value:
            'The Truth Frees Correspondence Course: six free, self-paced lessons through the New Testament. No cost, no obligation.',
        },
        { key: 'card.linkLabel', label: 'Link label', kind: 'text', value: 'Begin the course' },
        { key: 'card.linkHref', label: 'Link target', kind: 'href', value: '/resources/bible-study' },
      ],
    },
    {
      id: 'seo',
      label: 'Search and sharing',
      hint: 'What Google and social platforms show. None of this appears on the page.',
      fields: [
        { key: 'seo.title', label: 'Search title', kind: 'meta', value: 'Resources for Studying the Bible' },
        {
          key: 'seo.description',
          label: 'Search description',
          kind: 'meta',
          value:
            'Free resources from the Harrisonville Church of Christ: a self-paced Bible study course drawn straight from Scripture.',
        },
        { key: 'seo.ogTitle', label: 'Share title', kind: 'meta', value: 'Study the Bible at Your Own Pace' },
        {
          key: 'seo.ogDescription',
          label: 'Share description',
          kind: 'meta',
          value: 'A free, self-paced Bible study course that answers honest questions from the New Testament.',
        },
      ],
    },
  ],
}
