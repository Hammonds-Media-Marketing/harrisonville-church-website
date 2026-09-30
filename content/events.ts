import type { ChurchEvent } from './types'

/** SAMPLE events. Replace with the real calendar before launch. Dates are kept
 *  in the near future so the collection renders an "upcoming" view. */
export const events: ChurchEvent[] = [
  {
    slug: 'gospel-meeting-fall',
    title: 'Fall Gospel Meeting',
    summary: 'Three evenings of lessons from a visiting Gospel preacher. All are welcome.',
    description:
      'A Gospel meeting is a series of sermons, usually over several days, where a visiting preacher walks through a theme from the New Testament. There is no cost, no registration, and no pressure to participate. Come for one lesson or every one.',
    startDate: '2026-11-13T19:00:00-06:00',
    endDate: '2026-11-15T11:00:00-06:00',
    sessions: [
      { startDate: '2026-11-13T19:00:00-06:00', endDate: '2026-11-13T20:00:00-06:00' },
      { startDate: '2026-11-14T19:00:00-06:00', endDate: '2026-11-14T20:00:00-06:00' },
      { startDate: '2026-11-15T10:00:00-06:00', endDate: '2026-11-15T11:00:00-06:00' },
    ],
    faqs: [
      {
        question: 'Is there a cost to attend?',
        answer: 'No. Every lesson is free and open to the public, and no collection is taken from visitors.',
      },
      {
        question: 'Do I need to come every night?',
        answer: 'No. Each lesson stands on its own, so come to whichever ones you can.',
      },
    ],
    infoSections: [
      {
        heading: 'Bringing children',
        body: 'Children are welcome in every lesson. Families sit together, and there is a quiet room near the auditorium if a little one needs a break.',
      },
    ],
    category: 'Outreach',
    sample: true,
  },
  {
    slug: 'fellowship-meal-monthly',
    title: 'Monthly Fellowship Meal',
    summary: 'A shared meal after Sunday morning worship on the first Sunday of each month.',
    description:
      'On the first Sunday of each month the congregation shares a meal together after morning worship. It is a relaxed way to meet members and ask questions. Visitors are guests, never expected to bring anything.',
    startDate: '2026-07-05T11:30:00-05:00',
    category: 'Fellowship',
    recurring: 'First Sunday monthly',
    sample: true,
  },
  {
    slug: 'community-food-drive',
    title: 'Cass County Food Drive',
    summary: 'Collecting non-perishable food for neighbors in need across Cass County.',
    description:
      'The congregation gathers non-perishable food and household goods for distribution to families in Harrisonville and the surrounding Cass County area. Donations may be dropped off at the building during any assembly.',
    startDate: '2026-08-01T09:00:00-05:00',
    endDate: '2026-08-31T17:00:00-05:00',
    category: 'Outreach',
    sample: true,
  },
]

export function upcomingEvents(): ChurchEvent[] {
  return [...events].sort((a, b) => a.startDate.localeCompare(b.startDate))
}

export function getEvent(slug: string): ChurchEvent | undefined {
  return events.find((e) => e.slug === slug)
}
