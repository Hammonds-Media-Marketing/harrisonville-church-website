import type { PageCopySpec } from '@/lib/site-copy'

/**
 * The congregation's name, email, phone, and address are written as {site.name},
 * {site.email}, {site.phone}, and {site.address}. They resolve from lib/site.ts
 * when the page renders, so the policy always cites the current details.
 */
export const privacyPolicyCopy: PageCopySpec = {
  path: '/privacy-policy',
  name: 'Privacy Policy',
  summary: 'What the site collects, how it is used, and how to reach the congregation about it.',
  groups: [
    {
      id: 'header',
      label: 'Header',
      fields: [
        { key: 'header.title', label: 'Headline', kind: 'text', value: 'Privacy Policy' },
        { key: 'header.updated', label: 'Last-updated line', kind: 'text', value: 'Last updated June 9, 2026' },
      ],
    },
    {
      id: 'body',
      label: 'Policy',
      hint: 'Links are written as [the words](/the-page). Contact details are filled in automatically.',
      fields: [
        {
          key: 'body.intro',
          label: 'Opening paragraph',
          kind: 'rich',
          value:
            'The {site.name} respects your privacy. This policy explains what information this website collects, why it is collected, and the choices you have. We collect as little as possible.',
        },
        { key: 'body.collect.title', label: 'Section 1 heading', kind: 'text', value: 'What information do we collect?' },
        {
          key: 'body.collect.p1',
          label: 'Section 1, paragraph 1',
          kind: 'rich',
          value:
            'When you submit a form on this site, such as the contact, prayer request, or Bible study request form, we receive the details you choose to provide. That may include your name, email address, phone number, and the content of your message. You decide how much to share.',
        },
        {
          key: 'body.collect.p2',
          label: 'Section 1, paragraph 2',
          kind: 'rich',
          value:
            'The site also captures basic campaign attribution, such as how you arrived here, stored in your browser so we can understand which efforts help people find us. See the [Cookie Usage Policy](/cookie-policy) for details.',
        },
        { key: 'body.use.title', label: 'Section 2 heading', kind: 'text', value: 'How is your information used?' },
        {
          key: 'body.use.p1',
          label: 'Section 2 paragraph',
          kind: 'rich',
          value:
            'Information from forms is used only to respond to you. We do not sell, rent, or trade your personal information, and you will not be added to an automated sales sequence. Expect a personal reply from a member of the congregation.',
        },
        { key: 'body.processors.title', label: 'Section 3 heading', kind: 'text', value: 'Who processes the information?' },
        {
          key: 'body.processors.p1',
          label: 'Section 3 paragraph',
          kind: 'rich',
          value:
            'Form submissions are delivered through Formspree, a third-party form provider, which forwards your message to the congregation. Anonymous, aggregate website usage may be measured with Google Analytics 4 and Mixpanel. These providers process data under their own privacy terms. We configure analytics to avoid collecting more than is necessary.',
        },
        { key: 'body.retention.title', label: 'Section 4 heading', kind: 'text', value: 'How long is information kept?' },
        {
          key: 'body.retention.p1',
          label: 'Section 4 paragraph',
          kind: 'rich',
          value:
            'Messages are retained only as long as needed to respond and to keep a record of our correspondence with you. You may ask us to delete your information at any time.',
        },
        { key: 'body.choices.title', label: 'Section 5 heading', kind: 'text', value: 'What are your choices?' },
        {
          key: 'body.choices.p1',
          label: 'Section 5 paragraph',
          kind: 'rich',
          value:
            'You may request access to, correction of, or deletion of the personal information you have shared with us. You may also control cookies through your browser settings, as described in the Cookie Usage Policy.',
        },
        { key: 'body.contact.title', label: 'Section 6 heading', kind: 'text', value: 'How can you reach us?' },
        {
          key: 'body.contact.p1',
          label: 'Section 6 paragraph',
          kind: 'rich',
          value:
            'For any question about this policy or your information, contact us at [{site.email}](mailto:{site.email}) or {site.phone}, or by mail at {site.address}.',
        },
      ],
    },
    {
      id: 'seo',
      label: 'Search and sharing',
      hint: 'What Google and social platforms show. None of this appears on the page.',
      fields: [
        { key: 'seo.title', label: 'Search title', kind: 'meta', value: 'Privacy Policy' },
        {
          key: 'seo.description',
          label: 'Search description',
          kind: 'meta',
          value:
            'How the Harrisonville Church of Christ handles the information you share through forms and the limited analytics used on this website.',
        },
        { key: 'seo.ogTitle', label: 'Share title', kind: 'meta', value: 'How We Handle Your Information' },
        {
          key: 'seo.ogDescription',
          label: 'Share description',
          kind: 'meta',
          value: 'A plain-language explanation of what this website collects, why, and how to reach us about it.',
        },
      ],
    },
  ],
}
