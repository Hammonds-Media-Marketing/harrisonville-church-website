import type { Sermon } from './types'

/** SAMPLE sermons / videos. Replace with real recordings and thumbnails.
 *  videoUrl is intentionally empty so the player renders its placeholder state
 *  until real media is connected. */
export const sermons: Sermon[] = [
  {
    slug: 'who-is-the-church-of-christ',
    title: 'Who Is the Church of Christ?',
    speaker: 'Sample Speaker',
    date: '2026-05-31',
    scripture: 'Acts 2:36-47',
    series: 'Back to the Bible',
    summary:
      'A plain look at how the church began in the first century and what it means to follow that pattern today, drawn straight from the book of Acts.',
    videoUrl: '',
    durationMinutes: 34,
    thumbnail: '/assets/images/video-placeholder.png',
    thumbnailAlt: 'Sermon video placeholder — real thumbnail to be supplied',
    sample: true,
  },
  {
    slug: 'what-the-bible-says-about-baptism',
    title: 'What the Bible Says About Baptism',
    speaker: 'Sample Speaker',
    date: '2026-05-24',
    scripture: 'Acts 22:16; Romans 6:3-4',
    series: 'Hard Questions',
    summary:
      'Baptism, the burial in water that Scripture connects to the washing away of sin, explained verse by verse so you can weigh it for yourself.',
    videoUrl: '',
    durationMinutes: 41,
    thumbnail: '/assets/images/video-placeholder.png',
    thumbnailAlt: 'Sermon video placeholder — real thumbnail to be supplied',
    sample: true,
  },
  {
    slug: 'worship-in-spirit-and-truth',
    title: 'Worship in Spirit and Truth',
    speaker: 'Sample Speaker',
    date: '2026-05-17',
    scripture: 'John 4:19-24',
    series: 'Back to the Bible',
    summary:
      'Why the congregation sings without instruments and keeps worship simple, traced to what the New Testament shows the first Christians doing.',
    videoUrl: '',
    durationMinutes: 29,
    thumbnail: '/assets/images/video-placeholder.png',
    thumbnailAlt: 'Sermon video placeholder — real thumbnail to be supplied',
    sample: true,
  },
  {
    slug: 'the-lords-supper-every-week',
    title: 'The Lord’s Supper, Every Week',
    speaker: 'Sample Speaker',
    date: '2026-05-10',
    scripture: 'Acts 20:7; 1 Corinthians 11:23-26',
    series: 'Back to the Bible',
    summary:
      'A study of why the early church gathered on the first day of every week to remember the death of Jesus in the Lord’s Supper.',
    videoUrl: '',
    durationMinutes: 31,
    thumbnail: '/assets/images/video-placeholder.png',
    thumbnailAlt: 'Sermon video placeholder — real thumbnail to be supplied',
    sample: true,
  },
]

export function recentSermons(): Sermon[] {
  return [...sermons].sort((a, b) => b.date.localeCompare(a.date))
}

export function getSermon(slug: string): Sermon | undefined {
  return sermons.find((s) => s.slug === slug)
}

export const sermonSeries = Array.from(new Set(sermons.map((s) => s.series).filter(Boolean))) as string[]
