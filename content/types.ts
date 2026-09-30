/**
 * Content model — typed to mirror the future Supabase tables so the swap from
 * these local seed files to a live database is a data-source change, not a
 * component rewrite. Every record below is SAMPLE content until the church
 * supplies the real text, photos, names, and reviews.
 */

export type Leader = {
  slug: string
  name: string
  role: string
  /** One- or two-sentence third-person summary for leader cards and meta descriptions. */
  shortBio: string
  /** Full third-person biography for the profile page, one string per paragraph. */
  bioParagraphs: string[]
  photo: string
  photoAlt: string
  sample: boolean
}

export type MemberStory = {
  slug: string
  name: string
  summary: string
  quote: string
  photo: string
  photoAlt: string
  sample: boolean
}

export type Testimonial = {
  id: string
  author: string
  source: string
  rating: number
  quote: string
  sample: boolean
}

/** One date/time of a multi-day event. */
export type EventSession = { startDate: string; endDate?: string }

export type EventAddress = { street: string; city: string; region: string; postalCode: string }

export type EventSpeaker = { name: string; role?: string; bio?: string; image?: string; imageAlt?: string }

export type EventFaq = { question: string; answer: string }

/** A free-form extra section on the event page (what to bring, lodging, meals). */
export type EventInfoSection = { heading: string; body: string }

export type ChurchEvent = {
  slug: string
  title: string
  summary: string
  description: string
  startDate: string // ISO 8601
  endDate?: string
  locationName?: string
  /** Street address of an off-site event; absent means the church building. */
  address?: EventAddress
  /** Each date/time of a multi-day event, soonest first. When present,
   *  startDate/endDate span the whole event. */
  sessions?: EventSession[]
  speakers?: EventSpeaker[]
  faqs?: EventFaq[]
  infoSections?: EventInfoSection[]
  category: 'Worship' | 'Bible Study' | 'Fellowship' | 'Outreach' | 'Youth'
  /** Human-readable repeat label shown on cards, e.g. "First Sunday monthly". */
  recurring?: string
  /** Machine recurrence rule; when present the calendar expands repeat dates. */
  recurrenceRule?: 'weekly' | 'biweekly' | 'monthly-weekday' | 'monthly-date'
  image?: string
  imageAlt?: string
  sample: boolean
}

export type Sermon = {
  slug: string
  title: string
  speaker: string
  date: string // ISO date
  scripture: string
  series?: string
  summary: string
  videoUrl?: string
  /** An MP3 (or other audio) recording; the sermon page plays it when there is no video. */
  audioUrl?: string
  durationMinutes: number
  thumbnail: string
  thumbnailAlt: string
  sample: boolean
}

export type Author = {
  slug: string
  name: string
  role: string
  bio: string
  longBio: string
  photo: string
  photoAlt: string
  linkedin?: string
  sample: boolean
}

export type BlogCategory = 'Salvation' | 'Worship' | 'The Church' | 'Christian Living' | 'Bible Study'

export type BlogPost = {
  slug: string
  title: string
  excerpt: string
  metaDescription: string
  ogTitle: string
  ogDescription: string
  category: BlogCategory
  tags: string[]
  authorSlug: string
  datePublished: string // ISO date
  dateModified?: string
  featureImage: string
  featureImageAlt: string
  readMinutes: number
  views: number
  /** Section blocks; `h2` entries seed the table of contents. */
  body: { type: 'h2' | 'h3' | 'p' | 'scripture' | 'list'; text?: string; items?: string[]; ref?: string }[]
  relatedSlugs: string[]
  sample: boolean
}

export type BibleLesson = {
  number: number
  slug: string
  title: string
  summary: string
  /** Booklet cover for the lesson, under /assets/images/bible-study-course-photos/. */
  photo: string
  photoAlt: string
  sample: boolean
}
