import type { Leader } from './types'

/** Leadership records. Photos, names, roles, and biographies are the real
 *  congregation leadership, supplied by the church; the profile-page
 *  biographies are lightly edited from those submissions.
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
    role: 'Elder',
    shortBio:
      'Jim serves as an elder of the congregation. Baptized in 1968, he and his family made Harrisonville their church home in 2003, and he was ordained in 2023.',
    bioParagraphs: [
      'Jim Bradford was baptized for the remission of his sins in 1968. He grew up in Belton, Missouri, and graduated from the University of Kansas with a degree in Civil Engineering. During his college years, he married his wife, Patty, in 1978, and they have been blessed with four daughters.',
      'Jim’s career took the family to the West Coast, where they lived and worshipped in the Seattle, Washington, area for six years and in Northern California for ten. In 2003, they chose to return to Missouri and make the Harrisonville congregation their church home. In August 2023, Jim was honored to be ordained as an elder of the congregation.',
      'One of Jim’s greatest passions is teaching and training others, and he especially enjoys helping his brothers become the most effective teachers they can be. On behalf of the church he has traveled to Ghana, Benin, Zimbabwe, and, especially, Togo, where the congregation has helped teach and train preachers for more than 25 years. Jim has also written many songs used in worship by congregations of the Lord’s church, believing music can touch the heart in ways words alone sometimes cannot.',
    ],
    photo: '/assets/photos/jim-bradford.jpg',
    photoAlt: 'Jim Bradford smiling in a blue jacket in front of a bookshelf',
    sample: false,
  },
  {
    slug: 'larry-bradford',
    name: 'Larry Bradford',
    role: 'Elder',
    shortBio:
      'Larry serves as an elder of the congregation. Baptized in 1973, he has shared in the work of the church in Harrisonville since 1993 and was ordained in 2023.',
    bioParagraphs: [
      'Larry Bradford grew up in Belton, Missouri. He obeyed the gospel and was baptized into the church in the spring of 1973. He earned a bachelor’s degree in Network and Communications Management from DeVry University and spent 37 years working in telecommunications and biomedical engineering at Truman Medical Center/University Health, until his retirement in December 2025.',
      'Larry married Barbara Middick in 1985. Together, they have three daughters and six grandchildren. Larry and Barb have been actively involved in the work of the church in Harrisonville since 1993.',
      'In August of 2023, Larry was ordained as an elder of the Harrisonville Church of Christ. He continues to have a deep love for God’s Word, the Lord’s church, and serving others through teaching, encouragement, and ministry.',
    ],
    photo: '/assets/photos/larry-bradford.jpg',
    photoAlt: 'Larry Bradford wearing glasses and a green tie in front of a bookshelf',
    sample: false,
  },
]

export function getLeader(slug: string): Leader | undefined {
  return leaders.find((l) => l.slug === slug)
}
