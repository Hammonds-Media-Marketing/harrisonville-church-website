import type { PageCopySpec } from '@/lib/site-copy'

export const aboutCopy: PageCopySpec = {
  path: '/about',
  name: 'About — Who We Are',
  summary: 'The congregation’s welcome, what kind of church this is, and the three convictions behind it.',
  groups: [
    {
      id: 'hero',
      label: 'Hero',
      fields: [
        { key: 'hero.eyebrow', label: 'Eyebrow', kind: 'text', value: 'About the congregation' },
        { key: 'hero.title', label: 'Headline', kind: 'text', value: 'A church with one authority: the Bible' },
        {
          key: 'hero.lead',
          label: 'Opening paragraph',
          kind: 'longText',
          value:
            'We are a group of Christians in Harrisonville, Missouri, dedicated to worshiping God, honoring the Lord Jesus Christ, and growing together in the understanding of the Bible.',
        },
        { key: 'hero.photo', label: 'Photograph', kind: 'image', value: '/assets/photos/congregation-outlook-drive.jpg' },
        {
          key: 'hero.photoAlt',
          label: 'Photograph description',
          kind: 'alt',
          value:
            'The Harrisonville Church of Christ congregation, several generations together at the front of the auditorium beneath the wooden cross',
        },
      ],
    },
    {
      id: 'welcome',
      label: 'A welcome from the congregation',
      fields: [
        { key: 'welcome.title', label: 'Heading', kind: 'text', value: 'A welcome from the congregation' },
        {
          key: 'welcome.p1',
          label: 'Paragraph 1',
          kind: 'rich',
          value:
            'We are the Harrisonville church of Christ, a community of Christians in Harrisonville, Missouri devoted to following true Christianity as revealed in the New Testament Scriptures. We believe that Jesus Christ is the only Savior and hope for the world, and it is our passion to share His Gospel locally and abroad.',
        },
        {
          key: 'welcome.p2',
          label: 'Paragraph 2',
          kind: 'rich',
          value:
            'We are committed to speaking where the Bible speaks and being silent where the Bible is silent (1 Peter 4:11). We are not ashamed of the Gospel of Christ, for it is the power of God unto salvation to everyone who believes (Romans 1:16). We believe God has revealed His will through the New Testament, and we seek to answer all questions regarding salvation, the church, and worship by that inspired Word. In all things, we give precedence to Holy Scripture as inspired and inerrant, above every preference, creed, and tradition of man, resting on our belief that God’s Word contains “all things that pertain to life and godliness” (2 Peter 1:3).',
        },
        {
          key: 'welcome.p3',
          label: 'Paragraph 3',
          kind: 'rich',
          value:
            'Coming from many different backgrounds and walks of life, we come together as God’s spiritual family. We strive to serve God, encourage one another, and love our neighbors in an atmosphere of kindness, support, and spiritual growth.',
        },
        { key: 'welcome.photo', label: 'Photograph', kind: 'image', value: '/assets/photos/singing-in-the-pews.jpg' },
        {
          key: 'welcome.photoAlt',
          label: 'Photograph description',
          kind: 'alt',
          value: 'An older and a younger member of the congregation lean over an open book together across the pews',
        },
        {
          key: 'welcome.caption',
          label: 'Photograph caption',
          kind: 'text',
          value: 'Studying and singing together across the pews.',
        },
        {
          key: 'welcome.p4',
          label: 'Closing paragraph',
          kind: 'rich',
          value:
            'The Harrisonville church of Christ is made up of people of all ages and life stages, united by faith in Jesus Christ and love for one another (Ephesians 4:11–15). **But we are missing—you.** We invite you to [join us for worship](/about/what-to-expect), or to [let us know how we can serve you](/contact) in your spiritual journey.',
          help: 'Links are written as [the words](/the-page); bold is written as **the words**.',
        },
      ],
    },
    {
      id: 'kind',
      label: 'What kind of church is this?',
      fields: [
        { key: 'kind.title', label: 'Heading', kind: 'text', value: 'What kind of church is this?' },
        {
          key: 'kind.p1',
          label: 'Paragraph 1',
          kind: 'rich',
          value:
            'A Church of Christ is a local congregation that aims to follow the New Testament pattern for the church without later additions. There is no headquarters, no denominational hierarchy, and no central office that sets policy. Each congregation governs itself under the oversight of its own elders, who are members chosen to shepherd the group according to the qualifications Scripture describes.',
        },
        {
          key: 'kind.p2',
          label: 'Paragraph 2',
          kind: 'rich',
          value:
            'That independence is intentional. It keeps the focus on the Bible rather than on the decisions of a distant board. When you ask us why we do something, the honest answer is always meant to be a passage, not a tradition.',
        },
      ],
    },
    {
      id: 'pillars',
      label: 'Our convictions',
      hint: 'Three cards, each a question and its answer.',
      fields: [
        { key: 'pillars.eyebrow', label: 'Eyebrow', kind: 'text', value: 'Our convictions' },
        { key: 'pillars.title', label: 'Heading', kind: 'text', value: 'Three convictions that shape everything' },
        {
          key: 'pillars.1.q',
          label: 'Card 1 question',
          kind: 'text',
          value: 'Why do we say "no creed but the Bible"?',
        },
        {
          key: 'pillars.1.a',
          label: 'Card 1 answer',
          kind: 'longText',
          value:
            'A creed is a written statement of belief that a church binds on its members. We do not bind any creed beyond Scripture itself. The reason is simple: a creed can be wrong, and it places a human document between a person and the Word of God. When every belief must be shown in the New Testament, you can check it for yourself.',
        },
        {
          key: 'pillars.2.q',
          label: 'Card 2 question',
          kind: 'text',
          value: 'What does restoring the first-century church mean?',
        },
        {
          key: 'pillars.2.a',
          label: 'Card 2 answer',
          kind: 'longText',
          value:
            'Rather than build on centuries of added tradition, we look back to the church as the New Testament describes it and try to be that same kind of congregation: the same worship, the same plan of salvation, the same simple organization. It is less about being old-fashioned and more about going back to the source.',
        },
        {
          key: 'pillars.3.q',
          label: 'Card 3 question',
          kind: 'text',
          value: 'How do we decide what is right in worship?',
        },
        {
          key: 'pillars.3.a',
          label: 'Card 3 answer',
          kind: 'longText',
          value:
            'We ask what the New Testament shows the first Christians doing, and we follow that pattern. Where Scripture is clear, we hold to it. Where it is silent, we are cautious about adding. That single habit explains most of what a visitor will notice on a Sunday morning.',
        },
      ],
    },
    {
      id: 'next',
      label: 'Where to go next',
      hint: 'Two panels linking deeper into the site.',
      fields: [
        { key: 'next.1.eyebrow', label: 'Panel 1 eyebrow', kind: 'text', value: 'For visitors' },
        { key: 'next.1.title', label: 'Panel 1 heading', kind: 'text', value: 'What to expect on a first visit' },
        {
          key: 'next.1.body',
          label: 'Panel 1 copy',
          kind: 'text',
          value: 'A walkthrough of a Sunday morning, so nothing catches you off guard.',
        },
        { key: 'next.1.linkLabel', label: 'Panel 1 link label', kind: 'text', value: 'See what to expect' },
        { key: 'next.1.linkHref', label: 'Panel 1 link target', kind: 'href', value: '/about/what-to-expect' },
        { key: 'next.2.eyebrow', label: 'Panel 2 eyebrow', kind: 'text', value: 'The people' },
        { key: 'next.2.title', label: 'Panel 2 heading', kind: 'text', value: 'Meet the leadership' },
        {
          key: 'next.2.body',
          label: 'Panel 2 copy',
          kind: 'text',
          value: 'The men who teach, shepherd, and serve this congregation.',
        },
        { key: 'next.2.linkLabel', label: 'Panel 2 link label', kind: 'text', value: 'Meet the leaders' },
        { key: 'next.2.linkHref', label: 'Panel 2 link target', kind: 'href', value: '/about/leadership' },
      ],
    },
    {
      id: 'cta',
      label: 'Closing invitation',
      fields: [
        { key: 'cta.title', label: 'Heading', kind: 'text', value: 'Come see for yourself' },
        {
          key: 'cta.body',
          label: 'Copy',
          kind: 'longText',
          value:
            'The best way to understand a congregation is to sit with it. You are welcome any Sunday, with no pressure and no spotlight.',
        },
      ],
    },
    {
      id: 'seo',
      label: 'Search and sharing',
      hint: 'What Google and social platforms show. None of this appears on the page.',
      fields: [
        { key: 'seo.title', label: 'Search title', kind: 'meta', value: 'Who We Are' },
        {
          key: 'seo.description',
          label: 'Search description',
          kind: 'meta',
          value:
            'The Harrisonville Church of Christ follows the New Testament alone as its guide for worship and teaching. Learn what we believe and why, in plain language.',
        },
        {
          key: 'seo.ogTitle',
          label: 'Share title',
          kind: 'meta',
          value: 'New Testament Christians in Harrisonville, Missouri',
        },
        {
          key: 'seo.ogDescription',
          label: 'Share description',
          kind: 'meta',
          value:
            'No creed but the Bible. See how letting Scripture answer every question shapes the way this congregation worships and teaches.',
        },
        { key: 'seo.ogImage', label: 'Share image', kind: 'image', value: '/assets/og/og-about.jpg' },
        {
          key: 'seo.ogImageAlt',
          label: 'Share image description',
          kind: 'alt',
          value: 'Two members of the congregation follow along in an open book together in the pews',
        },
      ],
    },
  ],
}
