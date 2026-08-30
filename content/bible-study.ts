import type { BibleLesson } from './types'

/** The free, self-paced Bible study course. Branding, lesson titles,
 *  summaries, and cover art come from the published course at
 *  thetruthfrees.com — used with the author's permission. It is the same
 *  study the congregation mails as a printed booklet. */
export const bibleCourse = {
  title: 'The Truth Frees Correspondence Course',
  subtitle: 'A free, self-paced study of the New Testament',
  description:
    'A six-lesson study that walks through the Gospel as the New Testament tells it: who Jesus is, what He did, and how a person responds. The course is free, self-paced, and carries no obligation. Work through it on your own, or ask for someone to study alongside you in person or online.',
  lessonCount: 6,
  sample: false,
}

const coverPath = '/assets/images/bible-study-course-photos'

export const bibleLessons: BibleLesson[] = [
  {
    number: 1,
    slug: 'the-inspired-word-of-god',
    title: 'The Inspired Word of God',
    summary: 'Why you can trust the Bible.',
    photo: `${coverPath}/lesson1_inspiredword.jpg`,
    photoAlt: 'Lesson 1 booklet cover, The Inspired Word of God, blue forest scene with the course seal',
    sample: false,
  },
  {
    number: 2,
    slug: 'a-better-covenant',
    title: 'A Better Covenant',
    summary: 'See how Jesus fulfills the Old Testament.',
    photo: `${coverPath}/lesson2_bettercovenant.jpg`,
    photoAlt: 'Lesson 2 booklet cover, A Better Covenant, red mountain landscape with the course seal',
    sample: false,
  },
  {
    number: 3,
    slug: 'the-new-testament-church',
    title: 'The New Testament Church',
    summary: 'Explore how the first Christians worshiped.',
    photo: `${coverPath}/lesson3_newtestamentchurch.jpg`,
    photoAlt: 'Lesson 3 booklet cover, The New Testament Church, green field under an open sky with the course seal',
    sample: false,
  },
  {
    number: 4,
    slug: 'what-must-i-do-to-be-saved',
    title: 'What Must I Do To Be Saved?',
    summary: 'Scripture’s answer to the most important question.',
    photo: `${coverPath}/lesson4_besaved.jpg`,
    photoAlt: 'Lesson 4 booklet cover, What Must I Do To Be Saved, orange sunset over water with the course seal',
    sample: false,
  },
  {
    number: 5,
    slug: 'new-testament-worship',
    title: 'New Testament Worship',
    summary: 'Worshipping in spirit and in truth.',
    photo: `${coverPath}/lesson5_newtestamentworship.jpg`,
    photoAlt: 'Lesson 5 booklet cover, New Testament Worship, teal forest path with a lone figure and the course seal',
    sample: false,
  },
  {
    number: 6,
    slug: 'judgment-to-come',
    title: 'Judgment To Come',
    summary: 'Hope for all who obey the gospel.',
    photo: `${coverPath}/lesson6_judgment.jpg`,
    photoAlt: 'Lesson 6 booklet cover, Judgment To Come, deep blue mountain silhouette with the course seal',
    sample: false,
  },
]
