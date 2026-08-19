/**
 * Canonical site configuration — the single source of truth for NAP (Name,
 * Address, Phone), navigation, hours, and social profiles. Consumed by the
 * layout, footer, metadata helper, and JSON-LD builders so the church's details
 * are defined exactly once.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://harrisonvillecoc.com'
).replace(/\/$/, '')

export const site = {
  name: 'Harrisonville Church of Christ',
  shortName: 'Harrisonville Church of Christ',
  legalName: 'Harrisonville Church of Christ',
  tagline: 'On Outlook Drive',
  description:
    'A Church of Christ in Harrisonville, Missouri, welcoming Cass County to simple, Scripture-based worship and open Bible study. No creed but the Bible.',
  url: SITE_URL,
  email: 'gospel@harrisonvillecoc.com',
  phone: '+18163261082',
  phoneDisplay: '(816) 326-1082',
  address: {
    street: '1203 Outlook Drive',
    city: 'Harrisonville',
    region: 'MO',
    regionName: 'Missouri',
    postalCode: '64701',
    country: 'US',
  },
  geo: {
    // Approximate coordinates for Harrisonville, MO (refine with the real
    // building location before launch).
    latitude: 38.6536,
    longitude: -94.3486,
  },
  areaServed: ['Harrisonville', 'Cass County', 'Belton', 'Pleasant Hill', 'Raymore'],
  founders: 'New Testament Christians',
  /** Assembly times, used for copy and OpeningHoursSpecification schema. */
  services: [
    { id: 'sun-am', day: 'Sunday', dayCode: 'Sunday', label: 'Sunday Morning Worship', time: '10:00', timeDisplay: '10:00 AM' },
    { id: 'sun-pm', day: 'Sunday', dayCode: 'Sunday', label: 'Sunday Afternoon Worship', time: '14:00', timeDisplay: '2:00 PM' },
    { id: 'wed', day: 'Wednesday', dayCode: 'Wednesday', label: 'Wednesday Evening Worship', time: '19:00', timeDisplay: '7:00 PM' },
  ],
  social: {
    facebook: 'https://www.facebook.com/harrisonvillecoc/',
  },
  /** Profiles for schema `sameAs`. */
  sameAs: ['https://www.facebook.com/harrisonvillecoc/'],
} as const

export type NavItem = {
  label: string
  href: string
  description?: string
  children?: NavItem[]
}

/** Primary navigation. Dropdowns group the About and Resources sections.
 *  The blog and member-stories pages are hidden from all navigation for now,
 *  at the congregation's direction; the routes remain so they can be made
 *  visible again later. */
export const primaryNav: NavItem[] = [
  {
    label: 'About',
    href: '/about',
    children: [
      { label: 'Who We Are', href: '/about', description: 'What the church believes and why' },
      { label: 'What to Expect', href: '/about/what-to-expect', description: 'A walkthrough of a first visit' },
      { label: 'Leadership', href: '/about/leadership', description: 'The men who serve and teach' },
    ],
  },
  { label: 'Events', href: '/events' },
  {
    label: 'Resources',
    href: '/resources',
    children: [
      { label: 'Sermons & Videos', href: '/resources/sermons', description: 'Watch and listen to recent lessons' },
      { label: 'Bible Study Course', href: '/resources/bible-study', description: 'A free, self-paced study of the Gospel' },
    ],
  },
  { label: 'Connect', href: '/contact' },
]

export const footerNav: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'About',
    items: [
      { label: 'Who We Are', href: '/about' },
      { label: 'What to Expect', href: '/about/what-to-expect' },
      { label: 'Leadership', href: '/about/leadership' },
    ],
  },
  {
    heading: 'Resources',
    items: [
      { label: 'Sermons & Videos', href: '/resources/sermons' },
      { label: 'Bible Study Course', href: '/resources/bible-study' },
      { label: 'Events', href: '/events' },
    ],
  },
  {
    heading: 'Connect',
    items: [
      { label: 'Plan Your Visit', href: '/about/what-to-expect' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Prayer Request', href: '/contact#prayer-request' },
      { label: 'Request a Bible Study', href: '/contact#request-bible-study' },
    ],
  },
  {
    heading: 'Site',
    items: [
      { label: 'Style Guide', href: '/style-guide' },
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Cookie Policy', href: '/cookie-policy' },
      { label: 'Sitemap', href: '/sitemap.xml' },
    ],
  },
]

export const PRIMARY_CTA = { label: 'Plan Your Visit', href: '/about/what-to-expect' }
