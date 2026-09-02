import type { PageCopySpec } from '@/lib/site-copy'

export const storiesCopy: PageCopySpec = {
  path: '/about/stories',
  name: 'Member Stories',
  summary: 'Accounts from members about how they came to be part of the congregation.',
  groups: [
    {
      id: 'intro',
      label: 'Introduction',
      fields: [
        { key: 'intro.eyebrow', label: 'Eyebrow', kind: 'text', value: 'In their own words' },
        { key: 'intro.title', label: 'Headline', kind: 'text', value: 'Member stories' },
        {
          key: 'intro.lead',
          label: 'Opening paragraph',
          kind: 'longText',
          value:
            'Sometimes the most helpful thing is to hear from someone who was once standing exactly where you are. These are accounts from members about how they came to be part of this congregation.',
        },
        {
          key: 'intro.notice',
          label: 'Placeholder notice',
          kind: 'text',
          value: 'The stories below are placeholders pending real, consented accounts.',
          help: 'Shown above the cards while the stories are samples. Remove it once real stories are in place.',
        },
      ],
    },
    {
      id: 'cta',
      label: 'Closing invitation',
      fields: [
        { key: 'cta.title', label: 'Heading', kind: 'text', value: 'Your story could start with one visit' },
        {
          key: 'cta.body',
          label: 'Copy',
          kind: 'longText',
          value: 'Every member here was once a first-time visitor with questions. There is room for yours.',
        },
        { key: 'cta.label', label: 'Button label', kind: 'text', value: 'Plan your visit' },
        { key: 'cta.href', label: 'Button link', kind: 'href', value: '/about/what-to-expect' },
      ],
    },
    {
      id: 'seo',
      label: 'Search and sharing',
      hint: 'What Google and social platforms show. None of this appears on the page.',
      fields: [
        { key: 'seo.title', label: 'Search title', kind: 'meta', value: 'Member Stories' },
        {
          key: 'seo.description',
          label: 'Search description',
          kind: 'meta',
          value:
            'Real members of the Harrisonville Church of Christ describe how they found a church home, asked hard questions, and came to faith without pressure.',
        },
        { key: 'seo.ogTitle', label: 'Share title', kind: 'meta', value: 'How People Found a Church Home Here' },
        {
          key: 'seo.ogDescription',
          label: 'Share description',
          kind: 'meta',
          value: 'Honest accounts from members about first visits, hard questions, and finding a place to belong.',
        },
      ],
    },
  ],
}
