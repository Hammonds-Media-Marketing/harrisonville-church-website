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
  bio: string
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

export type ChurchEvent = {
  slug: string
  title: string
  summary: string
  description: string
  startDate: string // ISO 8601
  endDate?: string
  locationName?: string
  category: 'Worship' | 'Bible Study' | 'Fellowship' | 'Outreach' | 'Youth'
  recurring?: string
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
  scripture: string
  summary: string
  objectives: string[]
  sample: boolean
}
