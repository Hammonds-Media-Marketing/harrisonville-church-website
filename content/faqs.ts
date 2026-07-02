/** FAQ content for the strategic pages (Home and What to Expect). These answer
 *  the real questions this audience searches before visiting, written to lower
 *  the perceived cost of showing up. */

export type Faq = { question: string; answer: string }

export const visitFaqs: Faq[] = [
  {
    question: 'What should I wear to a service?',
    answer:
      'Come as you are comfortable. Some members dress up and some dress casually. Nobody will judge what you wear, and no one will single you out.',
  },
  {
    question: 'Will I be asked to speak, stand up, or give money?',
    answer:
      'No. Visitors are guests. You will not be asked to introduce yourself, stand, raise a hand, or participate in any way you do not choose. The collection is for members; guests are never expected to give.',
  },
  {
    question: 'How long does the Sunday morning service last?',
    answer:
      'Sunday morning worship runs about an hour. It includes singing, prayer, the Lord’s Supper, a sermon from the Bible, and a collection for members.',
  },
  {
    question: 'Where do I go when I arrive, and is there parking?',
    answer:
      'There is parking at the building at 1203 Outlook Drive. When you come in, a member near the entrance can point you to the auditorium and answer any question. You are welcome to simply sit and observe.',
  },
  {
    question: 'Do you have a place for my children?',
    answer:
      'Children are welcome to stay with you in the assembly. The congregation worships together as one, so there is no separate program, and no one minds the normal sounds of little ones during worship.',
  },
  {
    question: 'What makes a Church of Christ different from other churches?',
    answer:
      'The congregation looks to the New Testament alone as its guide for worship and teaching, without later creeds or human traditions. Worship is simple and includes singing without instruments, weekly observance of the Lord’s Supper, and a sermon drawn directly from Scripture.',
  },
]

export const homeFaqs: Faq[] = [
  {
    question: 'What does "no creed but the Bible" mean?',
    answer:
      'It means the congregation does not bind any written creed, catechism, or statement of faith beyond Scripture itself. Every belief and practice is meant to be shown in the New Testament, so you can check it for yourself.',
  },
  {
    question: 'Why does the church sing without instruments?',
    answer:
      'The New Testament describes the early church singing, and the congregation follows that pattern closely. It is a conviction drawn from Scripture, not a test a visitor has to pass.',
  },
  {
    question: 'Can I just visit and observe without being noticed?',
    answer:
      'Yes. You are welcome to come, sit, and observe with no pressure to participate or introduce yourself. Many people attend for several weeks before they say much at all.',
  },
  {
    question: 'How can I study the Bible without joining anything?',
    answer:
      'You can begin the free, self-paced Bible study course on this site, or request to study with someone in person or online. There is no cost and no obligation to attend or join.',
  },
]
