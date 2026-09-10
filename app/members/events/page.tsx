import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo'
import { Container, Section, SectionHeading } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Badge } from '@/components/primitives/Badge'
import { Button } from '@/components/primitives/Button'
import { CountBadge, EmptyState, ParamNotices } from '@/components/primitives/Feedback'
import { CalendarIcon, MapPinIcon } from '@/components/ui/icons'
import { listSpecialEvents, requireApprovedMember } from '@/lib/portal/data'
import { audienceLabel, categoryLabel } from '@/lib/portal/special-events'
import { formatWhen } from '@/lib/portal/time'

export const metadata: Metadata = buildMetadata({
  title: 'Events and Sign-Ups',
  description: 'Fellowship meals, showers, gospel meetings, meal trains, and service projects for the Harrisonville Church of Christ family, with RSVPs, sign-up lists, and a chat for each event.',
  path: '/members/events',
  ogTitle: 'Church Family Events',
  ogDescription: 'RSVP, sign up to help, and talk with everyone invited.',
  noindex: true,
})

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string; error?: string }> }) {
  const ctx = await requireApprovedMember()
  const params = await searchParams
  const events = await listSpecialEvents(ctx)
  const now = Date.now()
  const upcoming = events.filter((e) => !e.starts_at || new Date(e.ends_at ?? e.starts_at).getTime() >= now - 6 * 3_600_000)
  const past = events.filter((e) => !upcoming.includes(e))

  const card = (e: (typeof events)[number]) => (
    <li key={e.id}>
      <Surface tone="card" interactive as="article" className="flex h-full flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{categoryLabel(e.category)}</Badge>
          <Badge tone={e.audience === 'everyone' ? 'primary' : 'gold'}>{audienceLabel(e.audience)}</Badge>
          {e.status === 'draft' ? <Badge tone="sample">Draft</Badge> : null}
          <CountBadge count={e.unread} label={`${e.unread} unread chat messages`} className="ml-auto" />
        </div>
        <h3 className="m-0 text-xl">
          <Link href={`/members/events/${e.id}`} className="text-heading no-underline after:absolute after:inset-0">
            {e.title}
          </Link>
        </h3>
        {e.starts_at ? (
          <p className="m-0 flex items-start gap-2 text-sm text-muted">
            <CalendarIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary-strong" /> {formatWhen(e.starts_at, e.ends_at, e.all_day)}
          </p>
        ) : (
          <p className="m-0 text-sm text-muted">Date to be announced</p>
        )}
        {e.location ? (
          <p className="m-0 flex items-start gap-2 text-sm text-muted">
            <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary-strong" /> {e.location}
          </p>
        ) : null}
        <p className="m-0 mt-auto pt-2 text-xs text-muted">Organized by {e.organizer?.fullName ?? 'a member'}</p>
      </Surface>
    </li>
  )

  return (
    <>
      <PageHero eyebrow="Members" title="Events and sign-ups" lead="Showers, meals, gospel meetings, and projects. RSVP, claim a spot to help, and talk with everyone invited. Any member can organize one.">
        <div>
          <Button href="/members/events/new" variant="primary" size="sm">
            Organize an event
          </Button>
        </div>
      </PageHero>
      <Section tone="light">
        <Container>
          <ParamNotices params={params} messages={{ deleted: 'The event has been archived.', saved: 'Saved.' }} />
          <SectionHeading eyebrow="Coming up" title={`${upcoming.length} event${upcoming.length === 1 ? '' : 's'}`} />
          {upcoming.length ? (
            <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">{upcoming.map(card)}</ul>
          ) : (
            <EmptyState icon={<CalendarIcon className="h-6 w-6" />} title="Nothing planned right now" action={<Button href="/members/events/new" variant="secondary" size="sm">Organize an event</Button>}>
              <p>When someone organizes a meal, a shower, or a project, it appears here and everyone invited gets a note in their bell.</p>
            </EmptyState>
          )}
          {past.length ? (
            <div className="mt-10">
              <SectionHeading title="Past events" />
              <ul className="grid list-none gap-4 p-0 opacity-80 sm:grid-cols-2 lg:grid-cols-3">{past.slice(0, 9).map(card)}</ul>
            </div>
          ) : null}
        </Container>
      </Section>
    </>
  )
}
