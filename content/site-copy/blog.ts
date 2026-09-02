import type { PageCopySpec } from '@/lib/site-copy'

export const blogCopy: PageCopySpec = {
  path: '/blog',
  name: 'Blog',
  summary: 'The framing around the article list. Articles themselves are managed in the Articles area of the admin.',
  groups: [
    {
      id: 'intro',
      label: 'Introduction',
      fields: [
        { key: 'intro.eyebrow', label: 'Eyebrow', kind: 'text', value: 'From the congregation' },
        { key: 'intro.title', label: 'Headline', kind: 'text', value: 'Plain answers from Scripture' },
        {
          key: 'intro.lead',
          label: 'Opening paragraph',
          kind: 'longText',
          value:
            'No spin and no jargon. Each article takes a real question and walks through what the New Testament actually says, so you can weigh it yourself.',
        },
      ],
    },
    {
      id: 'list',
      label: 'Article list',
      fields: [
        { key: 'list.allLabel', label: 'All-categories filter label', kind: 'text', value: 'All' },
        {
          key: 'list.notice',
          label: 'Placeholder notice',
          kind: 'text',
          value: 'These articles are sample drafts written to demonstrate the layout.',
          help: 'Shown above the list while the articles are samples. Remove it once real articles are published.',
        },
        {
          key: 'list.empty',
          label: 'Empty-category message',
          kind: 'rich',
          value: 'No articles in this category yet. [View all articles](/blog).',
        },
      ],
    },
    {
      id: 'seo',
      label: 'Search and sharing',
      hint: 'What Google and social platforms show. None of this appears on the page.',
      fields: [
        { key: 'seo.title', label: 'Search title', kind: 'meta', value: 'Blog: Answers From Scripture' },
        {
          key: 'seo.description',
          label: 'Search description',
          kind: 'meta',
          value:
            'Articles from the Harrisonville Church of Christ on salvation, worship, the church, and Christian living, each answered plainly from the New Testament.',
        },
        { key: 'seo.ogTitle', label: 'Share title', kind: 'meta', value: 'Honest Questions, Answered From the Bible' },
        {
          key: 'seo.ogDescription',
          label: 'Share description',
          kind: 'meta',
          value: 'Short, Scripture-first articles that take real questions seriously, without denominational spin.',
        },
      ],
    },
  ],
}
