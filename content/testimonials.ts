import type { Testimonial } from './types'

/**
 * SAMPLE testimonials. The brief notes real reviews exist on the church's
 * Google Business Profile; those are not yet supplied, so these placeholders
 * stand in and are visibly labeled as samples in the UI. Replace with the real,
 * attributed reviews before launch. Never present invented reviews as real.
 */
export const testimonials: Testimonial[] = [
  {
    id: 'sample-1',
    author: 'Sample Reviewer',
    source: 'Google Business Profile (placeholder)',
    rating: 5,
    quote: 'Placeholder review text. The real review, pulled from the church’s Google Business Profile, will appear here once it is supplied.',
    sample: true,
  },
  {
    id: 'sample-2',
    author: 'Sample Reviewer',
    source: 'Google Business Profile (placeholder)',
    rating: 5,
    quote: 'Placeholder review text. A second real review will be shown here. Reviews are quoted exactly as written, with the reviewer’s name as it appears publicly.',
    sample: true,
  },
  {
    id: 'sample-3',
    author: 'Sample Reviewer',
    source: 'Google Business Profile (placeholder)',
    rating: 5,
    quote: 'Placeholder review text. A third real review will be shown here once the church confirms which reviews to feature.',
    sample: true,
  },
]
