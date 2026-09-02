import type { PageCopySpec } from '@/lib/site-copy'
import { bibleCourse } from '@/content/bible-study'

export const bibleStudyCopy: PageCopySpec = {
  path: '/resources/bible-study',
  name: 'Bible Study Course',
  summary: 'The two ways to take the course and the six-lesson outline. Lesson titles come from the course record.',
  groups: [
    {
      id: 'hero',
      label: 'Hero',
      fields: [
        { key: 'hero.eyebrow', label: 'Eyebrow', kind: 'text', value: 'Free, self-paced study' },
        { key: 'hero.title', label: 'Headline', kind: 'text', value: 'Study The Bible With Us' },
        { key: 'hero.lead', label: 'Opening paragraph', kind: 'longText', value: bibleCourse.description },
        { key: 'hero.primaryLabel', label: 'First button label', kind: 'text', value: 'Study With Evangelist' },
        { key: 'hero.primaryHref', label: 'First button link', kind: 'href', value: '/contact#request-bible-study' },
        { key: 'hero.secondaryLabel', label: 'Second button label', kind: 'text', value: 'Study Online' },
        {
          key: 'hero.secondaryHref',
          label: 'Second button link',
          kind: 'href',
          value: 'https://thetruthfrees.com/',
          help: 'The online home of the course. A full web address opens in a new tab.',
        },
      ],
    },
    {
      id: 'ways',
      label: 'Two ways to study',
      fields: [
        { key: 'ways.eyebrow', label: 'Eyebrow', kind: 'text', value: 'Two ways to study' },
        { key: 'ways.title', label: 'Heading', kind: 'text', value: 'How would you like to take the course?' },
        { key: 'ways.online.title', label: 'Online card heading', kind: 'text', value: 'Online, at your own pace' },
        {
          key: 'ways.online.body',
          label: 'Online card copy',
          kind: 'longText',
          value:
            'The full course is available online, the same study the congregation mails as a printed booklet. Work through the lessons whenever it suits you, save your place, and return anytime.',
        },
        { key: 'ways.online.label', label: 'Online card button', kind: 'text', value: 'Start the online course' },
        { key: 'ways.person.title', label: 'In-person card heading', kind: 'text', value: 'In person, with our evangelist' },
        {
          key: 'ways.person.body',
          label: 'In-person card copy',
          kind: 'longText',
          value:
            'We invite you to study with our evangelist in person. He will walk through the same lessons with you, answer questions from the Bible as they come up, and go at whatever pace suits you.',
        },
        { key: 'ways.person.label', label: 'In-person card button', kind: 'text', value: 'Request an in-person study' },
        { key: 'ways.person.href', label: 'In-person card link', kind: 'href', value: '/contact#request-bible-study' },
      ],
    },
    {
      id: 'lessons',
      label: 'Lesson list',
      hint: 'Lesson titles, summaries, and covers are managed with the course content, not here.',
      fields: [
        { key: 'lessons.eyebrow', label: 'Eyebrow', kind: 'text', value: 'The 6-lesson journey' },
        { key: 'lessons.title', label: 'Heading', kind: 'text', value: 'What the course covers' },
      ],
    },
    {
      id: 'cta',
      label: 'Closing invitation',
      fields: [
        { key: 'cta.title', label: 'Heading', kind: 'text', value: 'Would you rather not study alone?' },
        {
          key: 'cta.body',
          label: 'Copy',
          kind: 'longText',
          value:
            'Request a study and a member will walk through the lessons with you, in person or over video, at whatever pace suits you.',
        },
        { key: 'cta.label', label: 'Button label', kind: 'text', value: 'Request a Bible study' },
        { key: 'cta.href', label: 'Button link', kind: 'href', value: '/contact#request-bible-study' },
      ],
    },
    {
      id: 'seo',
      label: 'Search and sharing',
      hint: 'What Google and social platforms show. None of this appears on the page.',
      fields: [
        { key: 'seo.title', label: 'Search title', kind: 'meta', value: 'Free Bible Study Course' },
        {
          key: 'seo.description',
          label: 'Search description',
          kind: 'meta',
          value:
            'The Truth Frees Correspondence Course, offered free through the Harrisonville Church of Christ. Six self-paced lessons walk through the Gospel. No cost and no obligation.',
        },
        {
          key: 'seo.ogTitle',
          label: 'Share title',
          kind: 'meta',
          value: 'The Truth Frees Correspondence Course: A Free Bible Study',
        },
        {
          key: 'seo.ogDescription',
          label: 'Share description',
          kind: 'meta',
          value: 'Six self-paced lessons through the New Testament. Study on your own, or ask someone to study with you.',
        },
        { key: 'seo.ogImage', label: 'Share image', kind: 'image', value: '/assets/og/og-bible-study.jpg' },
        {
          key: 'seo.ogImageAlt',
          label: 'Share image description',
          kind: 'alt',
          value: 'Two men studying an open Bible together in the pews at the Harrisonville Church of Christ',
        },
      ],
    },
  ],
}
