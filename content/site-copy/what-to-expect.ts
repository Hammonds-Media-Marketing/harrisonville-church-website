import type { CopyField, PageCopySpec } from '@/lib/site-copy'
import { visitFaqs } from '@/content/faqs'

/**
 * The FAQ defaults come straight from content/faqs.ts so the questions have a
 * single home: the page renders the resolved values and builds its FAQ
 * structured data from the same list, so an edited answer stays in sync with
 * what search engines read.
 */
const faqFields: CopyField[] = visitFaqs.flatMap((faq, i) => [
  { key: `faq.${i + 1}.question`, label: `Question ${i + 1}`, kind: 'text', value: faq.question },
  { key: `faq.${i + 1}.answer`, label: `Answer ${i + 1}`, kind: 'longText', value: faq.answer },
])

export const whatToExpectCopy: PageCopySpec = {
  path: '/about/what-to-expect',
  name: 'What to Expect',
  summary: 'The visitor walkthrough: promises, service times, the step-by-step arrival, worship explained, and the FAQ.',
  groups: [
    {
      id: 'hero',
      label: 'Hero',
      fields: [
        { key: 'hero.eyebrow', label: 'Eyebrow', kind: 'text', value: 'Planning your visit' },
        { key: 'hero.title', label: 'Headline', kind: 'text', value: 'What a first visit actually looks like' },
        {
          key: 'hero.lead',
          label: 'Opening paragraph',
          kind: 'longText',
          value:
            'The fear of the unknown keeps a lot of good people standing at the door. Here is exactly what happens on a Sunday, so you can walk in already knowing what to expect.',
        },
        { key: 'hero.photo', label: 'Photograph', kind: 'image', value: '/assets/photos/singing-in-the-pews.jpg' },
        {
          key: 'hero.photoAlt',
          label: 'Photograph description',
          kind: 'alt',
          value: 'An older and a younger member of the congregation lean over an open book together across the pews',
        },
      ],
    },
    {
      id: 'promise',
      label: 'What will never happen',
      fields: [
        { key: 'promise.title', label: 'Heading', kind: 'text', value: 'What will never happen to you here' },
        {
          key: 'promise.lead',
          label: 'Intro paragraph',
          kind: 'longText',
          value:
            'For many people, the real worry is being embarrassed. We take that seriously, so here is our promise.',
        },
        {
          key: 'promise.1',
          label: 'Promise 1',
          kind: 'text',
          value: 'You will not be asked to stand up or introduce yourself.',
        },
        {
          key: 'promise.2',
          label: 'Promise 2',
          kind: 'text',
          value: 'You will not be singled out as a visitor in front of the room.',
        },
        { key: 'promise.3', label: 'Promise 3', kind: 'text', value: 'You will not be expected to give.' },
        { key: 'promise.4', label: 'Promise 4', kind: 'text', value: 'You will not be put on the spot.' },
        { key: 'times.title', label: 'Service times heading', kind: 'text', value: 'When to come' },
      ],
    },
    {
      id: 'steps',
      label: 'Step by step',
      hint: 'The stacking cards beside the parking photograph.',
      fields: [
        { key: 'steps.eyebrow', label: 'Eyebrow', kind: 'text', value: 'Step by step' },
        { key: 'steps.title', label: 'Heading', kind: 'text', value: 'Walking through a Sunday morning' },
        {
          key: 'steps.caption',
          label: 'Parking photo caption',
          kind: 'text',
          value:
            'The parking lot from above. Enter from 2 Highway, near the corner of 2 Highway and Outlook Drive, and the front door is a short walk from the lot.',
        },
        { key: 'steps.1.title', label: 'Step 1 heading', kind: 'text', value: 'Arriving and parking' },
        {
          key: 'steps.1.body',
          label: 'Step 1 copy',
          kind: 'longText',
          value:
            'Enter the parking lot from 2 Highway, near the corner of 2 Highway and Outlook Drive. The overhead photo beside these steps marks the entrance with an arrow. Come a few minutes early if you can, and someone near the door will greet you when you arrive.',
        },
        { key: 'steps.2.title', label: 'Step 2 heading', kind: 'text', value: 'Finding a seat' },
        {
          key: 'steps.2.body',
          label: 'Step 2 copy',
          kind: 'longText',
          value: 'Sit anywhere. There are no reserved sections and no expectation about where guests sit.',
        },
        { key: 'steps.3.title', label: 'Step 3 heading', kind: 'text', value: 'The worship itself' },
        {
          key: 'steps.3.body',
          label: 'Step 3 copy',
          kind: 'longText',
          value:
            'Sunday morning worship lasts about 75 to 90 minutes. It includes congregational singing, prayers, the Lord’s Supper, a sermon from the Bible, and a collection that is for members. As a guest, you simply observe.',
        },
        { key: 'steps.4.title', label: 'Step 4 heading', kind: 'text', value: 'After the service' },
        {
          key: 'steps.4.body',
          label: 'Step 4 copy',
          kind: 'longText',
          value:
            'When the assembly ends, members are glad to visit with one another. We encourage you to stay, visit with us, and ask any question on your mind.',
        },
      ],
    },
    {
      id: 'worship',
      label: 'A walk through worship',
      hint: 'The order of service tabs and the meaning of each act of worship.',
      fields: [
        { key: 'worship.eyebrow', label: 'Eyebrow', kind: 'text', value: 'A walk through worship' },
        { key: 'worship.title', label: 'Heading', kind: 'text', value: 'What happens during a worship service?' },
        {
          key: 'worship.lead',
          label: 'Intro paragraph',
          kind: 'longText',
          value:
            'Our worship is a time to glorify God and encourage one another. Select a service time to see the order it follows and what each part of worship means.',
        },
        {
          key: 'worship.actsIntro',
          label: 'Note above the explanations',
          kind: 'longText',
          value:
            'We encourage you to worship with us. If any part is unfamiliar, there is no pressure to participate.',
        },
        { key: 'worship.act.prayer.title', label: 'Prayer heading', kind: 'text', value: 'Prayer' },
        {
          key: 'worship.act.prayer.body',
          label: 'Prayer explanation',
          kind: 'longText',
          value:
            'Prayer is God’s appointed means of praising Him, giving thanks, interceding for others, and seeking His guidance (Philippians 4:6; Matthew 6:9–13; 1 Timothy 2:8).',
        },
        { key: 'worship.act.singing.title', label: 'Singing heading', kind: 'text', value: 'Singing' },
        {
          key: 'worship.act.singing.body',
          label: 'Singing explanation',
          kind: 'longText',
          value:
            'We are instructed to “sing and make melody in your heart to the Lord” (Ephesians 5:19; Colossians 3:16). In our assemblies, the whole congregation joins together in vocal praise to God.',
        },
        { key: 'worship.act.teaching.title', label: 'Teaching heading', kind: 'text', value: 'Teaching' },
        {
          key: 'worship.act.teaching.body',
          label: 'Teaching explanation',
          kind: 'longText',
          value:
            'Each service includes “the public reading of Scripture, exhortation, and teaching” (1 Timothy 4:13). This is done in an orderly manner (1 Corinthians 14:40), with the goal of instruction, encouragement, and spiritual growth.',
        },
        { key: 'worship.act.communion.title', label: 'Communion heading', kind: 'text', value: 'Communion' },
        {
          key: 'worship.act.communion.body',
          label: 'Communion explanation',
          kind: 'longText',
          value:
            'Each Sunday morning the members of the congregation partake of the Lord’s Supper, following the pattern Christ gave on the night He was betrayed (1 Corinthians 11:23–26; Matthew 26:26–29). As a visitor, you are not obligated to participate.',
        },
        { key: 'worship.act.collection.title', label: 'Collection heading', kind: 'text', value: 'Collection' },
        {
          key: 'worship.act.collection.body',
          label: 'Collection explanation',
          kind: 'longText',
          value:
            'The New Testament church is supported by the free-will offerings of its members. On the first day of every week, each member lays by in store as they have been prospered (1 Corinthians 16:1–2). This act of giving is for members of the congregation and is not a solicitation of visitors.',
        },
        {
          key: 'worship.closing',
          label: 'Closing line',
          kind: 'longText',
          value:
            'We invite you to join with us and experience the joy of worshiping our Creator in spirit and truth (John 4:24).',
        },
      ],
    },
    {
      id: 'faq',
      label: 'Frequently asked questions',
      hint: 'These questions and answers are also what search engines read as the page’s FAQ data.',
      fields: [
        { key: 'faq.eyebrow', label: 'Eyebrow', kind: 'text', value: 'Before you visit' },
        { key: 'faq.title', label: 'Heading', kind: 'text', value: 'Frequently Asked Questions' },
        ...faqFields,
      ],
    },
    {
      id: 'cta',
      label: 'Closing invitation',
      fields: [
        { key: 'cta.title', label: 'Heading', kind: 'text', value: 'Now that you know what to expect' },
        {
          key: 'cta.body',
          label: 'Copy',
          kind: 'longText',
          value: 'There is nothing left to be nervous about. We would love to save you a seat this Sunday.',
        },
        { key: 'cta.label', label: 'Button label', kind: 'text', value: 'Let us know you are coming' },
        { key: 'cta.href', label: 'Button link', kind: 'href', value: '/contact#contact-form' },
      ],
    },
    {
      id: 'seo',
      label: 'Search and sharing',
      hint: 'What Google and social platforms show. None of this appears on the page.',
      fields: [
        { key: 'seo.title', label: 'Search title', kind: 'meta', value: 'What to Expect on a Visit' },
        {
          key: 'seo.description',
          label: 'Search description',
          kind: 'meta',
          value:
            'A plain walkthrough of a Sunday at the Harrisonville Church of Christ: where to park, what worship includes, and why you are never put on the spot.',
        },
        { key: 'seo.ogTitle', label: 'Share title', kind: 'meta', value: 'Your First Visit, With No Surprises' },
        {
          key: 'seo.ogDescription',
          label: 'Share description',
          kind: 'meta',
          value:
            'Parking, timing, what a service includes, and what will never happen to you as a guest. Everything you need to walk in at ease.',
        },
        { key: 'seo.ogImage', label: 'Share image', kind: 'image', value: '/assets/og/og-what-to-expect.jpg' },
        {
          key: 'seo.ogImageAlt',
          label: 'Share image description',
          kind: 'alt',
          value: 'Two members shake hands by the front door of the church building',
        },
      ],
    },
  ],
}
