/** FAQ content for the What to Expect page — the single FAQ section on the
 *  site, per the congregation's direction. These answer the real questions
 *  this audience searches before visiting, written to lower the perceived
 *  cost of showing up. */

export type Faq = { question: string; answer: string }

export const visitFaqs: Faq[] = [
  {
    question: 'Will I be asked to speak, stand up, or give money?',
    answer:
      'No. Visitors are guests. You will not be asked to introduce yourself, stand, raise a hand, or participate in any way you do not choose. The collection is for members; guests are never expected to give.',
  },
  {
    question: 'How long does the Sunday morning service last?',
    answer:
      'Sunday morning worship runs about 75 to 90 minutes. It includes singing, prayer, the Lord’s Supper, a sermon from the Bible, and a collection for members.',
  },
  {
    question: 'Where do I go when I arrive, and is there parking?',
    answer:
      'Parking is accessed from 2 Highway, at the corner of 2 Highway and Outlook Drive. When you come in, a member near the entrance can point you to the auditorium and answer any question. You are welcome to simply sit and observe.',
  },
  {
    question: 'What makes a Church of Christ different from other churches?',
    answer:
      'The congregation looks to the New Testament alone as its guide for worship and teaching, without later creeds or human traditions. Worship is simple and includes acapella singing, weekly observance of the Lord’s Supper, and a sermon drawn directly from Scripture.',
  },
]
