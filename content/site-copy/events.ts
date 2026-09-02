import type { PageCopySpec } from '@/lib/site-copy'

export const eventsCopy: PageCopySpec = {
  path: '/events',
  name: 'Events Calendar',
  summary: 'The framing around the events list. Individual events are managed in the Events area of the admin.',
  groups: [
    {
      id: 'hero',
      label: 'Hero',
      fields: [
        { key: 'hero.eyebrow', label: 'Eyebrow', kind: 'text', value: 'Calendar' },
        { key: 'hero.title', label: 'Headline', kind: 'text', value: 'Upcoming events and gatherings' },
        {
          key: 'hero.lead',
          label: 'Opening paragraph',
          kind: 'longText',
          value:
            'Beyond Sunday and Wednesday worship, the congregation gathers for study, fellowship, and service in the community. Guests are welcome at all of it, with no expectation to take part.',
        },
      ],
    },
    {
      id: 'list',
      label: 'Events list',
      fields: [
        {
          key: 'list.notice',
          label: 'Placeholder notice',
          kind: 'text',
          value: 'The events below are placeholders.',
          help: 'Shown above the list while the events are samples. Remove it once real events are published.',
        },
      ],
    },
    {
      id: 'cta',
      label: 'Closing invitation',
      fields: [
        { key: 'cta.title', label: 'Heading', kind: 'text', value: 'Want a reminder before the next gathering?' },
        {
          key: 'cta.body',
          label: 'Copy',
          kind: 'longText',
          value: 'Reach out and we will let you know what is coming up, or follow along on Facebook.',
        },
        { key: 'cta.label', label: 'Button label', kind: 'text', value: 'Get in touch' },
        { key: 'cta.href', label: 'Button link', kind: 'href', value: '/contact#contact-form' },
      ],
    },
    {
      id: 'seo',
      label: 'Search and sharing',
      hint: 'What Google and social platforms show. None of this appears on the page.',
      fields: [
        { key: 'seo.title', label: 'Search title', kind: 'meta', value: 'Events & Gatherings' },
        {
          key: 'seo.description',
          label: 'Search description',
          kind: 'meta',
          value:
            'Upcoming gatherings at the Harrisonville Church of Christ: gospel meetings, fellowship meals, and community outreach across Cass County.',
        },
        { key: 'seo.ogTitle', label: 'Share title', kind: 'meta', value: 'What Is Happening at the Church' },
        {
          key: 'seo.ogDescription',
          label: 'Share description',
          kind: 'meta',
          value: 'Gospel meetings, shared meals, and community outreach. Visitors are welcome at every gathering.',
        },
        { key: 'seo.ogImage', label: 'Share image', kind: 'image', value: '/assets/og/og-events.jpg' },
        {
          key: 'seo.ogImageAlt',
          label: 'Share image description',
          kind: 'alt',
          value: 'The Harrisonville Church of Christ congregation gathered at the front of the auditorium',
        },
      ],
    },
  ],
}
