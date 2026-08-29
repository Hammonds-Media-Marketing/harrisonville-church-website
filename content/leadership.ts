import type { Leader } from './types'

/** Leadership records. Photos and names are the real congregation leadership.
 *  Isaac's role and biography were supplied by the congregation; biographies
 *  for Jim and Larry are pending, so their role labels stay general and their
 *  profile text says plainly that the full account is on its way.
 *  Structure matches the future Supabase table. */
export const leaders: Leader[] = [
  {
    slug: 'isaac-moreno',
    name: 'Isaac Moreno',
    role: 'Evangelist',
    shortBio:
      'Isaac serves as the evangelist for the congregation. He obeyed the gospel in 2018, was ordained in 2022, and has preached across the United States and abroad.',
    bioParagraphs: [
      'Isaac Moreno serves as the evangelist for the Harrisonville church of Christ.',
      'Isaac is originally from Oakdale, California. At the age of 19, he was introduced to the church through several friends who were members. After several months of visiting and studying the Bible on his own, he obeyed the gospel in January 2018.',
      'Following his conversion, Isaac spent several years training under faithful preachers. In 2022, he was formally ordained as an evangelist to preach the gospel. He then worked with the East Auburn church of Christ for three years before moving to Harrisonville with his wife, Lexie. Since beginning his work in evangelism, he has had the opportunity to preach the gospel across the United States and internationally in Zimbabwe and South Africa.',
      'Isaac loves preaching and teaching God’s Word, studying the Bible with others, and sharing the gospel of Jesus Christ. It is his desire to help others know, understand, and obey the truth of God’s Word.',
    ],
    photo: '/assets/photos/isaac-moreno.jpg',
    photoAlt: 'Isaac Moreno smiling in a light gray suit in front of a wall of books',
    sample: false,
  },
  {
    slug: 'jim-bradford',
    name: 'Jim Bradford',
    role: 'Leadership',
    shortBio:
      'Jim serves in the leadership of the congregation. His full biography will be added soon, and visitors are always welcome to meet him in person on a Sunday.',
    bioParagraphs: [
      'Jim Bradford serves in the leadership of the Harrisonville church of Christ. His full biography is being prepared with the congregation and will be added here soon.',
      'Until it is ready, the best introduction is a simple one: say hello after any service. Jim would be glad to meet you.',
    ],
    photo: '/assets/photos/jim-bradford.jpg',
    photoAlt: 'Jim Bradford smiling in a blue jacket in front of a bookshelf',
    sample: false,
  },
  {
    slug: 'larry-bradford',
    name: 'Larry Bradford',
    role: 'Leadership',
    shortBio:
      'Larry serves in the leadership of the congregation. His full biography is on its way, and he would be glad to meet you at any service in the meantime.',
    bioParagraphs: [
      'Larry Bradford serves in the leadership of the Harrisonville church of Christ. His full biography is being prepared with the congregation and will be added here soon.',
      'Until it is ready, the best introduction is a simple one: say hello after any service. Larry would be glad to meet you.',
    ],
    photo: '/assets/photos/larry-bradford.jpg',
    photoAlt: 'Larry Bradford wearing glasses and a green tie in front of a bookshelf',
    sample: false,
  },
]

export function getLeader(slug: string): Leader | undefined {
  return leaders.find((l) => l.slug === slug)
}
