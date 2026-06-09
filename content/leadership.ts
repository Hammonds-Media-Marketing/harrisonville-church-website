import type { Leader } from './types'

/** SAMPLE leadership records. Replace names, roles, bios, and photos with the
 *  real congregation before launch. Structure matches the future Supabase table. */
export const leaders: Leader[] = [
  {
    slug: 'sample-evangelist',
    name: 'Sample Name',
    role: 'Evangelist / Preacher',
    bio: 'Placeholder biography for the preaching evangelist. The real bio will describe his background, his years of study in the New Testament, and his approach to teaching the Gospel plainly and patiently.',
    photo: '/assets/images/placeholder.jpg',
    photoAlt: 'Placeholder portrait — leadership photo to be supplied by the church',
    sample: true,
  },
  {
    slug: 'sample-elder-one',
    name: 'Sample Elder',
    role: 'Elder / Shepherd',
    bio: 'Placeholder biography for a shepherding elder. Elders in a Church of Christ oversee the spiritual care of the congregation. The real text will describe his family, his service, and how members can reach him for prayer or counsel.',
    photo: '/assets/images/placeholder.jpg',
    photoAlt: 'Placeholder portrait — elder photo to be supplied by the church',
    sample: true,
  },
  {
    slug: 'sample-deacon-one',
    name: 'Sample Deacon',
    role: 'Deacon',
    bio: 'Placeholder biography for a serving deacon. Deacons care for practical needs of the congregation, from benevolence to facilities. The real bio will name the area he serves and how to contact him.',
    photo: '/assets/images/placeholder.jpg',
    photoAlt: 'Placeholder portrait — deacon photo to be supplied by the church',
    sample: true,
  },
]

export function getLeader(slug: string): Leader | undefined {
  return leaders.find((l) => l.slug === slug)
}
