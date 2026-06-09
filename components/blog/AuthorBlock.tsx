import Image from 'next/image'
import Link from 'next/link'
import type { Author } from '@/content/types'
import { LinkedInIcon } from '@/components/ui/icons'

/** Author block shown at the top and bottom of every article: photo, short bio,
 *  a LinkedIn button using the LinkedIn logo, and a link to the full author page. */
export function AuthorBlock({ author, variant = 'full' }: { author: Author; variant?: 'compact' | 'full' }) {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-border/50 bg-surface p-5">
      <Image
        src={author.photo}
        alt={author.photoAlt}
        width={64}
        height={64}
        loading="lazy"
        className="h-16 w-16 shrink-0 rounded-full object-cover"
      />
      <div className="flex flex-col gap-1">
        <p className="font-display text-lg text-heading">{author.name}</p>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-strong">{author.role}</p>
        {variant === 'full' ? <p className="mt-1 text-ink">{author.bio}</p> : null}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Link
            href={`/blog/author/${author.slug}`}
            className="inline-flex items-center rounded-full border border-border px-4 py-1.5 text-sm font-semibold text-ink hover:bg-bg"
          >
            Read full bio
          </Link>
          {author.linkedin ? (
            <a
              href={author.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${author.name} on LinkedIn`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-strong text-on-primary hover:bg-primary-hover"
            >
              <LinkedInIcon className="h-5 w-5" />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  )
}
