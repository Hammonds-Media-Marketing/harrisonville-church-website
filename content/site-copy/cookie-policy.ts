import type { PageCopySpec } from '@/lib/site-copy'

export const cookiePolicyCopy: PageCopySpec = {
  path: '/cookie-policy',
  name: 'Cookie Policy',
  summary: 'What the site stores in a visitor’s browser, why, and how to control it.',
  groups: [
    {
      id: 'header',
      label: 'Header',
      fields: [
        { key: 'header.title', label: 'Headline', kind: 'text', value: 'Cookie Usage Policy' },
        { key: 'header.updated', label: 'Last-updated line', kind: 'text', value: 'Last updated June 9, 2026' },
      ],
    },
    {
      id: 'body',
      label: 'Policy',
      hint: 'Links are written as [the words](/the-page); bold is written as **the words**.',
      fields: [
        {
          key: 'body.intro',
          label: 'Opening paragraph',
          kind: 'rich',
          value:
            'Cookies and similar browser storage are small pieces of data a website saves in your browser. This page explains what the {site.name} website uses and why. We keep this to a minimum.',
        },
        { key: 'body.stores.title', label: 'Section 1 heading', kind: 'text', value: 'What does this site store?' },
        {
          key: 'body.stores.lead',
          label: 'Section 1 intro',
          kind: 'rich',
          value: 'There are three kinds of storage you may encounter here:',
        },
        {
          key: 'body.stores.1',
          label: 'Storage kind 1',
          kind: 'rich',
          value:
            '**Attribution storage.** The site saves a small record in your browser local storage, under the key hm_attribution, noting how you arrived, such as a search campaign or a referring link. This helps the congregation understand which efforts help people find the church. It is not used to identify you personally.',
        },
        {
          key: 'body.stores.2',
          label: 'Storage kind 2',
          kind: 'rich',
          value:
            '**Analytics cookies.** If analytics are enabled, Google Analytics 4 and Mixpanel may set cookies to measure anonymous, aggregate usage, such as which pages are visited most.',
        },
        {
          key: 'body.stores.3',
          label: 'Storage kind 3',
          kind: 'rich',
          value:
            '**Essential function.** Some storage supports basic site function, such as remembering that you submitted a form during your visit.',
        },
        {
          key: 'body.ads.title',
          label: 'Section 2 heading',
          kind: 'text',
          value: 'Does this site use advertising cookies?',
        },
        {
          key: 'body.ads.p1',
          label: 'Section 2 paragraph',
          kind: 'rich',
          value: 'No. There are no advertising or retargeting networks running on this website.',
        },
        { key: 'body.control.title', label: 'Section 3 heading', kind: 'text', value: 'How can you control cookies?' },
        {
          key: 'body.control.p1',
          label: 'Section 3 paragraph',
          kind: 'rich',
          value:
            'You can clear or block cookies and local storage through your browser settings. Most browsers let you remove existing data and prevent new storage. Blocking storage will not stop you from reading the site, though some conveniences may not work as smoothly.',
        },
        { key: 'body.more.title', label: 'Section 4 heading', kind: 'text', value: 'Where can you learn more?' },
        {
          key: 'body.more.p1',
          label: 'Section 4 paragraph',
          kind: 'rich',
          value:
            'See our [Privacy Policy](/privacy-policy) for how information is handled, or contact us at [{site.email}](mailto:{site.email}).',
        },
      ],
    },
    {
      id: 'seo',
      label: 'Search and sharing',
      hint: 'What Google and social platforms show. None of this appears on the page.',
      fields: [
        { key: 'seo.title', label: 'Search title', kind: 'meta', value: 'Cookie Usage Policy' },
        {
          key: 'seo.description',
          label: 'Search description',
          kind: 'meta',
          value:
            'What cookies and browser storage the Harrisonville Church of Christ website uses, what each one is for, and how to control them.',
        },
        { key: 'seo.ogTitle', label: 'Share title', kind: 'meta', value: 'Cookies and Browser Storage on This Site' },
        {
          key: 'seo.ogDescription',
          label: 'Share description',
          kind: 'meta',
          value: 'A plain explanation of the limited storage this website uses and how you stay in control of it.',
        },
      ],
    },
  ],
}
