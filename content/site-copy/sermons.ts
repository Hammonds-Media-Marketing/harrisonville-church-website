import type { PageCopySpec } from '@/lib/site-copy'

export const sermonsCopy: PageCopySpec = {
  path: '/resources/sermons',
  name: 'Sermons & Videos',
  summary: 'The framing around the sermon library. Individual sermons are managed in the Sermons area of the admin.',
  groups: [
    {
      id: 'hero',
      label: 'Hero',
      fields: [
        { key: 'hero.eyebrow', label: 'Eyebrow', kind: 'text', value: 'Watch and listen' },
        { key: 'hero.title', label: 'Headline', kind: 'text', value: 'Sermon and video library' },
        {
          key: 'hero.lead',
          label: 'Opening paragraph',
          kind: 'longText',
          value:
            'Every lesson is built on a passage of Scripture, so you can open your Bible and follow along or study further on your own.',
        },
      ],
    },
    {
      id: 'library',
      label: 'Library',
      fields: [
        {
          key: 'library.notice',
          label: 'Placeholder notice',
          kind: 'text',
          value: 'These recordings are placeholders; real video will be connected later.',
          help: 'Shown above the library while the recordings are samples. Remove it once real video is connected.',
        },
        { key: 'library.featuredBadge', label: 'Featured badge', kind: 'text', value: 'Latest lesson' },
        {
          key: 'library.footerPrompt',
          label: 'Closing prompt',
          kind: 'text',
          value: 'Prefer to study a topic with someone directly?',
        },
        { key: 'library.footerLabel', label: 'Closing button label', kind: 'text', value: 'Request a Bible study' },
        { key: 'library.footerHref', label: 'Closing button link', kind: 'href', value: '/contact#request-bible-study' },
      ],
    },
    {
      id: 'seo',
      label: 'Search and sharing',
      hint: 'What Google and social platforms show. None of this appears on the page.',
      fields: [
        { key: 'seo.title', label: 'Search title', kind: 'meta', value: 'Sermons & Video Library' },
        {
          key: 'seo.description',
          label: 'Search description',
          kind: 'meta',
          value:
            'Watch and listen to recent sermons from the Harrisonville Church of Christ. Plain lessons from the New Testament on salvation, worship, and Christian living.',
        },
        {
          key: 'seo.ogTitle',
          label: 'Share title',
          kind: 'meta',
          value: 'Recent Lessons From the Harrisonville Church of Christ',
        },
        {
          key: 'seo.ogDescription',
          label: 'Share description',
          kind: 'meta',
          value: 'A growing library of sermons and videos, each grounded in a passage you can read for yourself.',
        },
      ],
    },
  ],
}
