import type { MemberStory } from './types'

/** SAMPLE member stories. These illustrate the section layout. Replace with
 *  real, consented member accounts before launch — never publish invented
 *  testimony as though it were real. */
export const memberStories: MemberStory[] = [
  {
    slug: 'sample-story-found-a-home',
    name: 'Sample Member',
    summary: 'How a quiet first visit turned into a church family',
    quote: 'Placeholder quote. The real account will describe, in the member’s own words, what it was like to walk in for the first time and how the congregation made them feel welcome without any pressure.',
    photo: '/assets/images/placeholder.jpg',
    photoAlt: 'Placeholder portrait — member photo to be supplied with consent',
    sample: true,
  },
  {
    slug: 'sample-story-questions-answered',
    name: 'Sample Member',
    summary: 'Bringing hard questions to an open Bible',
    quote: 'Placeholder quote. The real story will share how studying the Scriptures directly, rather than being handed an opinion, helped answer long-standing questions about baptism and salvation.',
    photo: '/assets/images/placeholder.jpg',
    photoAlt: 'Placeholder portrait — member photo to be supplied with consent',
    sample: true,
  },
  {
    slug: 'sample-story-back-to-faith',
    name: 'Sample Member',
    summary: 'Returning to worship after years away',
    quote: 'Placeholder quote. The real account will describe coming back to regular worship after time away, and finding a congregation that values sincerity over performance.',
    photo: '/assets/images/placeholder.jpg',
    photoAlt: 'Placeholder portrait — member photo to be supplied with consent',
    sample: true,
  },
]

export function getStory(slug: string): MemberStory | undefined {
  return memberStories.find((s) => s.slug === slug)
}
