import type { PageCopySpec } from '@/lib/site-copy'

export const contactCopy: PageCopySpec = {
  path: '/contact',
  name: 'Contact Us',
  summary: 'The three forms, their confirmation messages, and the visit-details sidebar.',
  groups: [
    {
      id: 'hero',
      label: 'Hero',
      fields: [
        { key: 'hero.eyebrow', label: 'Eyebrow', kind: 'text', value: 'Connect with us' },
        { key: 'hero.title', label: 'Headline', kind: 'text', value: 'We would be glad to hear from you' },
        {
          key: 'hero.lead',
          label: 'Opening paragraph',
          kind: 'longText',
          value:
            'Whether you are planning a first visit, carrying something heavy, or want to open a Bible together, there is a way to reach us below. A real member reads every message and replies personally.',
        },
        { key: 'hero.photo', label: 'Photograph', kind: 'image', value: '/assets/photos/welcome-handshake.jpg' },
        {
          key: 'hero.photoAlt',
          label: 'Photograph description',
          kind: 'alt',
          value: 'A member welcomes a visitor with a handshake just inside the front door of the building',
        },
      ],
    },
    {
      id: 'general',
      label: 'General message form',
      hint: 'The field labels inside the form are part of the form itself and are not edited here.',
      fields: [
        { key: 'general.title', label: 'Heading', kind: 'text', value: 'Send a general message' },
        {
          key: 'general.lead',
          label: 'Intro line',
          kind: 'text',
          value: 'Questions about visiting, the church, or anything else.',
        },
        { key: 'general.submit', label: 'Submit button', kind: 'text', value: 'Send message' },
        { key: 'general.successHeading', label: 'Confirmation heading', kind: 'text', value: 'Message received' },
        {
          key: 'general.successBody',
          label: 'Confirmation message',
          kind: 'longText',
          value:
            'Thank you for reaching out. A member of the congregation will reply to you personally, usually within a day or two.',
        },
      ],
    },
    {
      id: 'prayer',
      label: 'Prayer request form',
      fields: [
        { key: 'prayer.title', label: 'Heading', kind: 'text', value: 'Send a prayer request' },
        {
          key: 'prayer.lead',
          label: 'Intro line',
          kind: 'longText',
          value: 'You do not need to be a member to ask for prayer. Your request is treated with care.',
        },
        { key: 'prayer.submit', label: 'Submit button', kind: 'text', value: 'Send prayer request' },
        { key: 'prayer.successHeading', label: 'Confirmation heading', kind: 'text', value: 'Your request is received' },
        {
          key: 'prayer.successBody',
          label: 'Confirmation message',
          kind: 'longText',
          value:
            'Thank you for trusting us with this. The congregation will be praying, and we will honor how you asked us to handle it.',
        },
      ],
    },
    {
      id: 'study',
      label: 'Bible study request form',
      fields: [
        { key: 'study.title', label: 'Heading', kind: 'text', value: 'Request a Bible study' },
        { key: 'study.lead', label: 'Intro line', kind: 'text', value: 'A free Bible study, in person or online.' },
        { key: 'study.submit', label: 'Submit button', kind: 'text', value: 'Request a study' },
        { key: 'study.successHeading', label: 'Confirmation heading', kind: 'text', value: 'We will be in touch' },
        {
          key: 'study.successBody',
          label: 'Confirmation message',
          kind: 'longText',
          value:
            'Thank you for your interest in studying the Bible. Someone will reach out to arrange a time that works for you.',
        },
      ],
    },
    {
      id: 'sidebar',
      label: 'Visit details sidebar',
      hint: 'The address, phone number, email, and service times come from the site-wide details in the code.',
      fields: [
        { key: 'sidebar.title', label: 'Heading', kind: 'text', value: 'Visit or reach us' },
        {
          key: 'sidebar.parkingCaption',
          label: 'Parking photo caption',
          kind: 'text',
          value: 'Enter the parking lot from 2 Highway, near the corner of 2 Highway and Outlook Drive.',
        },
        { key: 'sidebar.timesLabel', label: 'Service times label', kind: 'text', value: 'Assembly times' },
      ],
    },
    {
      id: 'seo',
      label: 'Search and sharing',
      hint: 'What Google and social platforms show. None of this appears on the page.',
      fields: [
        { key: 'seo.title', label: 'Search title', kind: 'meta', value: 'Contact, Prayer and Bible Study' },
        {
          key: 'seo.description',
          label: 'Search description',
          kind: 'meta',
          value:
            'Reach the Harrisonville Church of Christ. Ask a question, send a prayer request, or request a free Bible study in person or online. A real person will reply.',
        },
        {
          key: 'seo.ogTitle',
          label: 'Share title',
          kind: 'meta',
          value: 'Connect With the Harrisonville Church of Christ',
        },
        {
          key: 'seo.ogDescription',
          label: 'Share description',
          kind: 'meta',
          value:
            'Questions, prayer requests, and free Bible study requests all reach a real member who will respond personally.',
        },
        { key: 'seo.ogImage', label: 'Share image', kind: 'image', value: '/assets/og/og-contact.jpg' },
        {
          key: 'seo.ogImageAlt',
          label: 'Share image description',
          kind: 'alt',
          value: 'Two members of the Harrisonville Church of Christ shaking hands inside the building entrance',
        },
      ],
    },
  ],
}
