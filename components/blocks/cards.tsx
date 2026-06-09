import Image from 'next/image'
import Link from 'next/link'
import { Surface } from '@/components/primitives/Surface'
import { Badge } from '@/components/primitives/Badge'
import { ArrowRightIcon, CalendarIcon, ClockIcon, EyeIcon, PlayIcon, QuoteIcon } from '@/components/ui/icons'
import { formatDate, formatDateRange, formatViews } from '@/lib/format'
import type { BlogPost, ChurchEvent, Leader, MemberStory, Sermon, Testimonial } from '@/content/types'
import type { Author } from '@/content/types'

/** Star rating, used by testimonials. */
function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} aria-hidden="true" className={i < rating ? 'text-secondary-active' : 'text-border'}>
          ★
        </span>
      ))}
    </span>
  )
}

export function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <Surface tone="panel" className="flex h-full flex-col gap-3">
      <QuoteIcon className="h-7 w-7 text-primary" />
      <blockquote className="flex-1 text-lg text-ink">{t.quote}</blockquote>
      <footer className="flex items-center justify-between gap-2 border-t border-border/50 pt-3">
        <div>
          <p className="font-semibold text-heading">{t.author}</p>
          <p className="text-sm text-muted">{t.source}</p>
        </div>
        <Stars rating={t.rating} />
      </footer>
    </Surface>
  )
}

export function EventCard({ event }: { event: ChurchEvent }) {
  return (
    <Surface id={event.slug} tone="card" interactive className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Badge tone="primary">{event.category}</Badge>
        {event.recurring ? <span className="text-sm text-muted">{event.recurring}</span> : null}
      </div>
      <h3 className="text-xl">{event.title}</h3>
      <p className="flex items-center gap-2 text-sm text-muted">
        <CalendarIcon className="h-4 w-4 text-primary-strong" />
        {formatDateRange(event.startDate, event.endDate)}
      </p>
      <p className="flex-1 text-ink">{event.summary}</p>
    </Surface>
  )
}

export function SermonCard({ sermon }: { sermon: Sermon }) {
  return (
    <Surface tone="card" interactive className="flex h-full flex-col gap-3 p-0">
      <div className="relative aspect-video overflow-hidden rounded-t-lg bg-surface-deep">
        <Image
          src={sermon.thumbnail}
          alt={sermon.thumbnailAlt}
          fill
          loading="lazy"
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover opacity-80"
        />
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-primary-strong text-on-primary">
            <PlayIcon className="h-6 w-6" />
          </span>
        </span>
        {sermon.series ? (
          <span className="absolute left-3 top-3">
            <Badge tone="gold">{sermon.series}</Badge>
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-xl">{sermon.title}</h3>
        <p className="text-sm font-semibold text-primary-strong">{sermon.scripture}</p>
        <p className="flex-1 text-ink">{sermon.summary}</p>
        <p className="flex items-center gap-3 text-sm text-muted">
          <span>{sermon.speaker}</span>
          <span aria-hidden="true">&middot;</span>
          <span>{formatDate(sermon.date)}</span>
          <span aria-hidden="true">&middot;</span>
          <span className="inline-flex items-center gap-1">
            <ClockIcon className="h-4 w-4" />
            {sermon.durationMinutes} min
          </span>
        </p>
      </div>
    </Surface>
  )
}

export function PostCard({ post, author }: { post: BlogPost; author?: Author }) {
  return (
    <Surface tone="card" interactive className="flex h-full flex-col gap-3 p-0">
      <Link href={`/blog/${post.slug}`} className="group flex h-full flex-col">
        <div className="relative aspect-[16/9] overflow-hidden rounded-t-lg bg-surface">
          <Image
            src={post.featureImage}
            alt={post.featureImageAlt}
            fill
            loading="lazy"
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-slow ease-out group-hover:scale-105"
          />
          <span className="absolute left-3 top-3">
            <Badge tone="primary">{post.category}</Badge>
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-5">
          <h3 className="text-xl text-heading group-hover:text-link-hover">{post.title}</h3>
          <p className="flex-1 text-ink">{post.excerpt}</p>
          <p className="flex flex-wrap items-center gap-3 text-sm text-muted">
            {author ? <span>{author.name}</span> : null}
            <span aria-hidden="true">&middot;</span>
            <span>{formatDate(post.datePublished)}</span>
            <span aria-hidden="true">&middot;</span>
            <span>{post.readMinutes} min read</span>
            <span aria-hidden="true">&middot;</span>
            <span className="inline-flex items-center gap-1">
              <EyeIcon className="h-4 w-4" />
              {formatViews(post.views)}
            </span>
          </p>
        </div>
      </Link>
    </Surface>
  )
}

export function LeaderCard({ leader }: { leader: Leader }) {
  return (
    <Surface tone="card" className="flex h-full flex-col gap-3 text-center">
      <div className="mx-auto h-28 w-28 overflow-hidden rounded-full bg-surface">
        <Image
          src={leader.photo}
          alt={leader.photoAlt}
          width={112}
          height={112}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
      <div>
        <h3 className="text-xl">{leader.name}</h3>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-strong">{leader.role}</p>
      </div>
      <p className="text-ink">{leader.bio}</p>
    </Surface>
  )
}

export function StoryCard({ story }: { story: MemberStory }) {
  return (
    <Surface tone="panel" className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <Image
          src={story.photo}
          alt={story.photoAlt}
          width={56}
          height={56}
          loading="lazy"
          className="h-14 w-14 rounded-full object-cover"
        />
        <div>
          <h3 className="text-lg">{story.name}</h3>
          <p className="text-sm text-muted">{story.summary}</p>
        </div>
      </div>
      <blockquote className="flex-1 text-ink">
        <QuoteIcon className="mb-1 h-6 w-6 text-primary" />
        {story.quote}
      </blockquote>
    </Surface>
  )
}

/** A simple "read more" inline affordance for cards that link out. */
export function CardLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 font-semibold text-link hover:text-link-hover">
      {children}
      <ArrowRightIcon className="h-4 w-4" />
    </Link>
  )
}
