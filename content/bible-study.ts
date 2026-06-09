import type { BibleLesson } from './types'

/** The free, self-paced Bible study course. Lesson outlines are real in shape
 *  but the full lesson content will be supplied by the church. */
export const bibleCourse = {
  title: 'The Gospel, From the Beginning',
  subtitle: 'A free, self-paced study of the New Testament',
  description:
    'A short series of studies that walks through the Gospel as the New Testament tells it: who Jesus is, what He did, and how a person responds. The course is free, self-paced, and carries no obligation. Work through it on your own, or ask for someone to study alongside you in person or online.',
  lessonCount: 6,
  sample: true,
}

export const bibleLessons: BibleLesson[] = [
  {
    number: 1,
    slug: 'the-bible-as-the-source',
    title: 'The Bible as the Source',
    scripture: '2 Timothy 3:16-17',
    summary: 'Why this study begins and ends with Scripture, and how to read a passage in its context.',
    objectives: ['Understand what it means to treat the Bible as the standard', 'Learn to read a verse within its chapter', 'Set aside assumptions and let the text speak'],
    sample: true,
  },
  {
    number: 2,
    slug: 'who-is-jesus',
    title: 'Who Is Jesus?',
    scripture: 'John 1:1-14',
    summary: 'The New Testament’s claim about the identity of Jesus, in His own words and His apostles’.',
    objectives: ['Trace the claims Jesus made about Himself', 'See how the apostles described Him', 'Weigh the evidence of the resurrection'],
    sample: true,
  },
  {
    number: 3,
    slug: 'the-problem-of-sin',
    title: 'The Problem of Sin',
    scripture: 'Romans 3:23; 6:23',
    summary: 'What the Bible means by sin, why it matters, and the situation it leaves every person in.',
    objectives: ['Define sin as Scripture defines it', 'Understand the consequence the Bible describes', 'See why the problem requires a rescue'],
    sample: true,
  },
  {
    number: 4,
    slug: 'the-good-news',
    title: 'The Good News',
    scripture: '1 Corinthians 15:1-4',
    summary: 'The core of the Gospel: the death, burial, and resurrection of Jesus, and what it accomplished.',
    objectives: ['State the Gospel in the apostle Paul’s own terms', 'Connect the cross to the problem of sin', 'Understand grace as a gift, not a wage'],
    sample: true,
  },
  {
    number: 5,
    slug: 'responding-to-the-gospel',
    title: 'Responding to the Gospel',
    scripture: 'Acts 2:36-41',
    summary: 'How people in the New Testament responded when they believed: hearing, faith, repentance, confession, and baptism.',
    objectives: ['Walk through the response on the day of Pentecost', 'See the consistent pattern across Acts', 'Understand what baptism is connected to'],
    sample: true,
  },
  {
    number: 6,
    slug: 'the-new-life-and-the-church',
    title: 'The New Life and the Church',
    scripture: 'Acts 2:42-47',
    summary: 'What life looks like after responding: worship, fellowship, and growing within a local congregation.',
    objectives: ['See the daily life of the first church', 'Understand why Christians gather', 'Find your place in a local congregation'],
    sample: true,
  },
]
