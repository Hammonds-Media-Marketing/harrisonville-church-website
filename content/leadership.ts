import type { Leader } from './types'

/** Leadership records. Photos and names are the real congregation leadership;
 *  individual titles and full biographies are pending confirmation from the
 *  church, so the role label stays general until they are supplied.
 *  Structure matches the future Supabase table. */
export const leaders: Leader[] = [
  {
    slug: 'issac-moreno',
    name: 'Issac Moreno',
    role: 'Leadership',
    bio: 'A full biography for Issac is being prepared. Until it is ready, the best introduction is a simple one: say hello after any service.',
    photo: '/assets/photos/issac-moreno.jpg',
    photoAlt: 'Issac Moreno smiling in a light gray suit in front of a wall of books',
    sample: false,
  },
  {
    slug: 'jim-bradford',
    name: 'Jim Bradford',
    role: 'Leadership',
    bio: 'A full biography for Jim will be added soon. Visitors are always welcome to meet the leadership in person on a Sunday.',
    photo: '/assets/photos/jim-bradford.jpg',
    photoAlt: 'Jim Bradford smiling in a blue jacket in front of a bookshelf',
    sample: false,
  },
  {
    slug: 'larry-bradford',
    name: 'Larry Bradford',
    role: 'Leadership',
    bio: 'A biography for Larry is on its way. If you would like to reach the leadership sooner, the contact page is the quickest path.',
    photo: '/assets/photos/larry-bradford.jpg',
    photoAlt: 'Larry Bradford wearing glasses and a green tie in front of a bookshelf',
    sample: false,
  },
]

export function getLeader(slug: string): Leader | undefined {
  return leaders.find((l) => l.slug === slug)
}
