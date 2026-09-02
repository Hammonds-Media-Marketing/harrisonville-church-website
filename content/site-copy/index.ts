import type { PageCopySpec } from '@/lib/site-copy'
import { homeCopy } from '@/content/site-copy/home'
import { aboutCopy } from '@/content/site-copy/about'
import { whatToExpectCopy } from '@/content/site-copy/what-to-expect'
import { leadershipCopy } from '@/content/site-copy/leadership'
import { storiesCopy } from '@/content/site-copy/stories'
import { eventsCopy } from '@/content/site-copy/events'
import { resourcesCopy } from '@/content/site-copy/resources'
import { bibleStudyCopy } from '@/content/site-copy/bible-study'
import { sermonsCopy } from '@/content/site-copy/sermons'
import { blogCopy } from '@/content/site-copy/blog'
import { contactCopy } from '@/content/site-copy/contact'
import { privacyPolicyCopy } from '@/content/site-copy/privacy-policy'
import { cookiePolicyCopy } from '@/content/site-copy/cookie-policy'

/**
 * Every hand-built page that can be edited in the visual editor, in the order
 * the editor lists them. A page joins this list by declaring a spec and
 * rendering through `pageCopy(path)`; the editor picks it up with no further
 * wiring.
 */
export const SITE_COPY: PageCopySpec[] = [
  homeCopy,
  aboutCopy,
  whatToExpectCopy,
  leadershipCopy,
  storiesCopy,
  eventsCopy,
  resourcesCopy,
  bibleStudyCopy,
  sermonsCopy,
  blogCopy,
  contactCopy,
  privacyPolicyCopy,
  cookiePolicyCopy,
]

const BY_PATH = new Map(SITE_COPY.map((spec) => [spec.path, spec]))

export function getCopySpec(path: string): PageCopySpec | undefined {
  return BY_PATH.get(path)
}

/** Normalize an editor-supplied path ("about/leadership") to a spec path. */
export function normalizeCopyPath(segments: string[] | undefined): string {
  if (!segments?.length) return '/'
  return `/${segments.join('/')}`
}
