import type { PageCopySpec } from '@/lib/site-copy'

export const leadershipCopy: PageCopySpec = {
  path: '/about/leadership',
  name: 'Leadership',
  summary: 'The elders, evangelist, and deacons, with an explanation of how a congregation is organized.',
  groups: [
    {
      id: 'hero',
      label: 'Hero',
      hint: 'The portraits come from the leadership records, not from this page.',
      fields: [
        { key: 'hero.eyebrow', label: 'Eyebrow', kind: 'text', value: 'The people who serve' },
        {
          key: 'hero.title',
          label: 'Headline',
          kind: 'text',
          value: 'Leadership at the Harrisonville Church of Christ',
        },
        {
          key: 'hero.lead',
          label: 'Opening paragraph',
          kind: 'longText',
          value:
            'A Church of Christ is overseen by its own elders, taught by an evangelist, and served by deacons. There is no outside hierarchy. These are the members who serve here.',
        },
      ],
    },
    {
      id: 'structure',
      label: 'How a congregation is organized',
      fields: [
        { key: 'structure.title', label: 'Heading', kind: 'text', value: 'How is a Church of Christ organized?' },
        {
          key: 'structure.body',
          label: 'Paragraph',
          kind: 'rich',
          value:
            'Each congregation is independent and self-governing. Qualified men called elders, also described in Scripture as shepherds or overseers, watch over the spiritual welfare of the group. Deacons attend to practical needs, from benevolence to the care of the building. An evangelist, sometimes called the preacher, teaches publicly and studies with people one-on-one. This is the simple structure the New Testament describes, with no office above the local congregation.',
        },
      ],
    },
    {
      id: 'seo',
      label: 'Search and sharing',
      hint: 'What Google and social platforms show. None of this appears on the page.',
      fields: [
        { key: 'seo.title', label: 'Search title', kind: 'meta', value: 'Leadership' },
        {
          key: 'seo.description',
          label: 'Search description',
          kind: 'meta',
          value:
            'Meet the elders, evangelist, and deacons who teach, shepherd, and serve the Harrisonville Church of Christ according to the qualifications Scripture describes.',
        },
        {
          key: 'seo.ogTitle',
          label: 'Share title',
          kind: 'meta',
          value: 'The Men Who Serve and Shepherd the Congregation',
        },
        {
          key: 'seo.ogDescription',
          label: 'Share description',
          kind: 'meta',
          value: 'Each congregation governs itself under its own elders. Meet the people who carry that responsibility here.',
        },
        { key: 'seo.ogImage', label: 'Share image', kind: 'image', value: '/assets/og/og-leadership.jpg' },
        {
          key: 'seo.ogImageAlt',
          label: 'Share image description',
          kind: 'alt',
          value: 'Portraits of Isaac Moreno, Jim Bradford, and Larry Bradford of the Harrisonville Church of Christ',
        },
      ],
    },
  ],
}
