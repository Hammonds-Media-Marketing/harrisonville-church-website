import type { PageCopySpec } from '@/lib/site-copy'

/**
 * Editable copy for the homepage. Defaults are the wording the page shipped
 * with; an editor's changes are stored as overrides against these keys.
 * Service times, the address, and the "Plan Your Visit" button come from
 * lib/site.ts, which is shared by every page and the navigation, so they are
 * not listed here.
 */
export const homeCopy: PageCopySpec = {
  path: '/',
  name: 'Home',
  summary: 'The front door of the site: the hero, the welcome, service times, beliefs, and the closing invitation.',
  groups: [
    {
      id: 'hero',
      label: 'Hero',
      hint: 'The first screen, beside the lighthouse illustration.',
      fields: [
        {
          key: 'hero.eyebrow',
          label: 'Eyebrow',
          kind: 'text',
          value: 'Harrisonville Church of Christ · On Outlook Drive',
        },
        {
          key: 'hero.title',
          label: 'Headline',
          kind: 'text',
          value: 'A steady light for people seeking something real.',
          help: 'The page’s only H1. Keep it to one clear sentence.',
        },
        {
          key: 'hero.lead',
          label: 'Opening paragraph',
          kind: 'longText',
          value:
            'We are New Testament Christians in Harrisonville, Missouri, gathered around simple worship and an open Bible. If you are tired of noise and unsure who to trust, you are welcome here. Come, sit, and see for yourself.',
        },
        {
          key: 'hero.secondaryLabel',
          label: 'Second button label',
          kind: 'text',
          value: 'Start a Free Bible Study',
        },
        { key: 'hero.secondaryHref', label: 'Second button link', kind: 'href', value: '/resources/bible-study' },
        {
          key: 'hero.times',
          label: 'Service times line',
          kind: 'text',
          value: 'Sundays 10:00 AM & 2:00 PM, Wednesdays 7:00 PM',
        },
      ],
    },
    {
      id: 'welcome',
      label: 'Welcome',
      hint: 'The reassurance band with the congregation photograph and three cards.',
      fields: [
        { key: 'welcome.eyebrow', label: 'Eyebrow', kind: 'text', value: 'You are welcome here' },
        {
          key: 'welcome.title',
          label: 'Heading',
          kind: 'text',
          value: 'Walking into a new church should not feel like a risk',
        },
        {
          key: 'welcome.lead',
          label: 'Intro paragraph',
          kind: 'longText',
          value:
            'Many people who visit have questions they were never allowed to ask. Here, every question is welcome, and every visitor is treated as a guest.',
        },
        { key: 'welcome.photo', label: 'Photograph', kind: 'image', value: '/assets/photos/congregation-outlook-drive.jpg' },
        {
          key: 'welcome.photoAlt',
          label: 'Photograph description',
          kind: 'alt',
          value:
            'The Harrisonville Church of Christ congregation, several generations together at the front of the auditorium beneath the wooden cross',
          help: 'Read aloud by screen readers. Describe what is in the photograph.',
        },
        {
          key: 'welcome.caption',
          label: 'Photograph caption',
          kind: 'text',
          value: 'The congregation, gathered in the auditorium on Outlook Drive.',
        },
        { key: 'welcome.card1.title', label: 'Card 1 heading', kind: 'text', value: 'Bible-based worship services' },
        {
          key: 'welcome.card1.body',
          label: 'Card 1 copy',
          kind: 'longText',
          value:
            'Singing, prayer, the Lord’s Supper, and a sermon from the Bible, in the pattern the New Testament describes.',
        },
        { key: 'welcome.card2.title', label: 'Card 2 heading', kind: 'text', value: 'Visitors are honored guests' },
        {
          key: 'welcome.card2.body',
          label: 'Card 2 copy',
          kind: 'longText',
          value:
            'Visitors are guests. No one will ask you to stand, speak, raise a hand, or give. Come and simply observe.',
        },
        { key: 'welcome.card3.title', label: 'Card 3 heading', kind: 'text', value: 'Questions are welcome here' },
        {
          key: 'welcome.card3.body',
          label: 'Card 3 copy',
          kind: 'longText',
          value:
            'Ask anything. We will open the New Testament and show you the reasoning, rather than hand you an opinion.',
        },
        {
          key: 'welcome.linkLabel',
          label: 'Link label',
          kind: 'text',
          value: 'See exactly what a first visit looks like',
        },
        { key: 'welcome.linkHref', label: 'Link target', kind: 'href', value: '/about/what-to-expect' },
      ],
    },
    {
      id: 'visit',
      label: 'Plan your visit',
      hint: 'The navy band with service times and the map.',
      fields: [
        { key: 'visit.eyebrow', label: 'Eyebrow', kind: 'text', value: 'Plan your visit' },
        { key: 'visit.title', label: 'Heading', kind: 'text', value: 'When and where we gather' },
        {
          key: 'visit.lead',
          label: 'Directions paragraph',
          kind: 'longText',
          value:
            'There is parking at the building. Enter the lot from 2 Highway, near the corner of 2 Highway and Outlook Drive, and a member will greet you when you arrive.',
        },
        {
          key: 'visit.mapTitle',
          label: 'Map description',
          kind: 'alt',
          value: 'Map to Harrisonville Church of Christ at 1203 Outlook Drive, Harrisonville, Missouri',
          help: 'Names the embedded map for screen readers.',
        },
      ],
    },
    {
      id: 'beliefs',
      label: 'Beliefs',
      hint: 'The centered band about the church family.',
      fields: [
        { key: 'beliefs.eyebrow', label: 'Eyebrow', kind: 'text', value: 'Simply Christians' },
        {
          key: 'beliefs.title',
          label: 'Heading',
          kind: 'text',
          value: 'A church family with open hearts and open doors',
        },
        {
          key: 'beliefs.p1',
          label: 'Paragraph 1',
          kind: 'longText',
          value:
            'We are a Christ-centered church family in Harrisonville, Missouri. If you have been thinking, praying, searching, or hoping for a place to belong, there is a home awaiting you here in God’s family.',
        },
        {
          key: 'beliefs.p2',
          label: 'Paragraph 2',
          kind: 'longText',
          value:
            'Every person, whatever their background or walk of life, has been created in the image of God and possesses an everlasting soul. It is our desire to share the joy of living a life in service to the Lord Jesus Christ with anyone who is willing.',
        },
        {
          key: 'beliefs.p3',
          label: 'Paragraph 3',
          kind: 'rich',
          value:
            'Our spiritual family has open hearts and open hands. You are always welcome to visit during any of our public worship services. [Come and see](/about/what-to-expect) for yourself.',
          help: 'Links are written as [the words](/the-page).',
        },
        { key: 'beliefs.linkLabel', label: 'Link label', kind: 'text', value: 'Learn who we are' },
        { key: 'beliefs.linkHref', label: 'Link target', kind: 'href', value: '/about' },
      ],
    },
    {
      id: 'course',
      label: 'Bible study panel',
      fields: [
        { key: 'course.title', label: 'Heading', kind: 'text', value: 'Study the Gospel at your own pace' },
        {
          key: 'course.body',
          label: 'Copy',
          kind: 'longText',
          value:
            'A free, self-paced course that walks through the New Testament from the beginning. No cost, no obligation, and no need to attend anything to start.',
        },
        { key: 'course.ctaLabel', label: 'Button label', kind: 'text', value: 'Begin the course' },
        { key: 'course.ctaHref', label: 'Button link', kind: 'href', value: '/resources/bible-study' },
      ],
    },
    {
      id: 'cta',
      label: 'Closing invitation',
      fields: [
        { key: 'cta.title', label: 'Heading', kind: 'text', value: 'There is a seat for you this Sunday' },
        {
          key: 'cta.body',
          label: 'Copy',
          kind: 'longText',
          value:
            'Bring your questions and your doubts. You will find a congregation that takes the Bible seriously and takes you seriously too.',
        },
        { key: 'cta.secondaryLabel', label: 'Second button label', kind: 'text', value: 'Contact us' },
        { key: 'cta.secondaryHref', label: 'Second button link', kind: 'href', value: '/contact' },
      ],
    },
    {
      id: 'seo',
      label: 'Search and sharing',
      hint: 'What Google and social platforms show. None of this appears on the page.',
      fields: [
        {
          key: 'seo.title',
          label: 'Search title',
          kind: 'meta',
          value: 'Harrisonville Church of Christ | Bible-Based Worship',
          help: 'Aim for 15 to 65 characters.',
        },
        {
          key: 'seo.description',
          label: 'Search description',
          kind: 'meta',
          value:
            'Harrisonville Church of Christ welcomes Cass County to simple, Scripture-based worship and open Bible study. Visit with no pressure. No creed but the Bible.',
          help: 'Aim for 50 to 160 characters.',
        },
        {
          key: 'seo.ogTitle',
          label: 'Share title',
          kind: 'meta',
          value: 'A Welcoming Church Home on Outlook Drive',
          help: 'Shown when the page is shared. Keep it different from the search title.',
        },
        {
          key: 'seo.ogDescription',
          label: 'Share description',
          kind: 'meta',
          value:
            'Come as you are, sit, and observe. Worship rooted in the New Testament, with plain answers to honest questions about faith.',
        },
        { key: 'seo.ogImage', label: 'Share image', kind: 'image', value: '/assets/og/og-home.jpg' },
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
