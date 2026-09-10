import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Container, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Badge } from '@/components/primitives/Badge'
import { Button } from '@/components/primitives/Button'
import { Avatar } from '@/components/primitives/Avatar'
import { RadioCards } from '@/components/primitives/Controls'
import { FieldShell, TextField } from '@/components/primitives/Field'
import { ParamNotices, StatTile } from '@/components/primitives/Feedback'
import { CalendarIcon, MapPinIcon, MessageIcon } from '@/components/ui/icons'
import { getMessagePage, getSpecialEvent, requireApprovedMember } from '@/lib/portal/data'
import { RSVP_OPTIONS, audienceLabel, categoryLabel, eventSections, rsvpLabel, sortInvitees, summarizeRsvps } from '@/lib/portal/special-events'
import { formatWhen, formatRelative } from '@/lib/portal/time'
import { claimSignupAction, rsvpAction, withdrawSignupAction } from '@/app/members/events/actions'
import { LiveThread } from '@/components/portal/chat/LiveThread'
import { Composer } from '@/components/portal/chat/Composer'

export const metadata: Metadata = {
  title: { absolute: 'Event | Harrisonville Church of Christ' },
  description: 'A members-only event with RSVPs and sign-ups.',
  robots: { index: false, follow: false },
}

const notices = {
  saved: 'Event saved.',
  'saved:rsvp': 'Your response is saved. Thank you.',
  'saved:signup': 'You are signed up. Thank you for helping.',
  'saved:withdrawn': 'You have been taken off that spot.',
  'error:full': 'That spot filled up a moment ago. Pick another if you can.',
  'error:rsvp': 'Your response did not save. Try again.',
  'error:signup': 'That did not save. Try again.',
  error: 'That did not save. Try again.',
}

export default async function EventDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string; tab?: string }> }) {
  const ctx = await requireApprovedMember()
  const { id } = await params
  const detail = await getSpecialEvent(ctx, id)
  if (!detail) notFound()
  const query = await searchParams
  const { event, items, myRsvp, invitees, canManage, participates, organizer } = detail
  const hasChat = participates && Boolean(event.chat_group_id)
  const sections = eventSections({ description: event.description, signupItemCount: items.length, hasChat })
  const tab = sections.includes(query.tab as 'details') ? (query.tab as 'details' | 'signups' | 'chat') : sections[0]
  const chat = hasChat && tab === 'chat' && event.chat_group_id ? await getMessagePage(ctx, { groupId: event.chat_group_id }, null) : null
  const summary = summarizeRsvps(invitees)
  const totalSpots = items.reduce((n, i) => n + i.volunteers_needed, 0)
  const filledSpots = items.reduce((n, i) => n + i.signups.length, 0)

  return (
    <>
      <PageHero eyebrow={categoryLabel(event.category)} title={event.title} lead={organizer ? `Organized by ${organizer.fullName}` : undefined}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={event.audience === 'everyone' ? 'primary' : 'gold'}>{audienceLabel(event.audience)}</Badge>
          {event.status === 'draft' ? <Badge tone="sample">Draft, only you and the editors can see this</Badge> : null}
          {canManage ? (
            <Button href={`/members/events/${id}/edit`} variant="ghost" size="sm">
              Edit event
            </Button>
          ) : null}
          <Link href="/members/events" className="text-sm">
            All events
          </Link>
        </div>
      </PageHero>

      <Section tone="light">
        <Container className="max-w-3xl">
          <ParamNotices params={query} messages={notices} />
          <div className="flex flex-col gap-6">
            <Surface tone="card" className="flex flex-col gap-2">
              {event.starts_at ? (
                <p className="m-0 flex items-start gap-2 text-ink">
                  <CalendarIcon className="mt-1 h-4 w-4 shrink-0 text-primary-strong" /> {formatWhen(event.starts_at, event.ends_at, event.all_day)}
                </p>
              ) : (
                <p className="m-0 text-muted">Date to be announced.</p>
              )}
              {event.location ? (
                <p className="m-0 flex items-start gap-2 text-ink">
                  <MapPinIcon className="mt-1 h-4 w-4 shrink-0 text-primary-strong" /> {event.location}
                </p>
              ) : null}
              {totalSpots ? (
                <p className="m-0 text-sm text-muted">
                  {filledSpots} of {totalSpots} helper spot{totalSpots === 1 ? '' : 's'} filled
                </p>
              ) : null}
            </Surface>

            {participates && event.rsvp_enabled ? (
              <Surface tone="panel" as="section" aria-labelledby="rsvp-heading">
                <h2 id="rsvp-heading" className="m-0 mb-1 text-xl">
                  Are you coming?
                </h2>
                <p className="m-0 mb-4 text-sm text-muted">{myRsvp ? `You said: ${rsvpLabel(myRsvp.response)}${myRsvp.guest_count ? `, bringing ${myRsvp.guest_count}` : ''}.` : 'A quick answer helps the organizer plan food and seats.'}</p>
                <form action={rsvpAction} className="flex flex-col gap-4">
                  <input type="hidden" name="event_id" value={id} />
                  <RadioCards name="response" legend="Your response" options={RSVP_OPTIONS} defaultValue={myRsvp?.response ?? null} />
                  <FieldShell id="guests" label="Others coming with you" helper="Spouse, children, or a guest. Just a number.">
                    <TextField id="guests" name="guest_count" type="number" defaultValue={String(myRsvp?.guest_count ?? 0)} />
                  </FieldShell>
                  <div>
                    <Button type="submit" variant="primary" size="md">
                      Save my response
                    </Button>
                  </div>
                </form>
              </Surface>
            ) : null}

            {canManage ? (
              <details className="rounded-lg border border-border-strong/40 bg-bg p-4 shadow-sm">
                <summary className="cursor-pointer font-display text-lg font-semibold text-heading">Who responded ({summary.yes} going)</summary>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <StatTile label="Invited" value={summary.invited} />
                  <StatTile label="Going" value={summary.yes} tone="primary" helper={summary.guests ? `+${summary.guests} guests` : undefined} />
                  <StatTile label="Maybe" value={summary.maybe} />
                  <StatTile label="Not going" value={summary.no} />
                  <StatTile label="No answer" value={summary.noResponse} />
                </div>
                <ul className="m-0 mt-4 flex list-none flex-col divide-y divide-border/40 p-0">
                  {sortInvitees(invitees).map((p) => (
                    <li key={p.member_id} className="flex items-center gap-3 py-2">
                      <Avatar name={p.full_name} photo={p.photo} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-heading">{p.full_name}</span>
                        {p.responded_at ? <span className="block text-xs text-muted">Responded {formatRelative(p.responded_at)}</span> : null}
                      </span>
                      <Badge tone={p.response === 'yes' ? 'primary' : p.response === 'maybe' ? 'gold' : 'neutral'}>
                        {rsvpLabel(p.response)}
                        {p.response === 'yes' && p.guest_count ? ` +${p.guest_count}` : ''}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}

            {sections.length > 1 ? (
              <nav aria-label="Event sections" className="grid gap-1 rounded-full border border-border-strong bg-surface p-1" style={{ gridTemplateColumns: `repeat(${sections.length}, minmax(0, 1fr))` }}>
                {sections.map((s) => (
                  <Link
                    key={s}
                    href={`/members/events/${id}?tab=${s}`}
                    aria-current={tab === s ? 'page' : undefined}
                    scroll={false}
                    className={`rounded-full px-3 py-2 text-center text-sm font-semibold no-underline ${tab === s ? 'bg-primary-strong text-on-primary' : 'text-primary-strong hover:bg-surface-2'}`}
                  >
                    {s === 'details' ? 'Details' : s === 'signups' ? `Sign-ups (${filledSpots}/${totalSpots})` : `Chat${detail.event.chat_group_id ? '' : ''}`}
                  </Link>
                ))}
              </nav>
            ) : null}

            {tab === 'details' && event.description.trim() ? (
              <Surface tone="card" as="section" aria-label="Details">
                <p className="m-0 whitespace-pre-wrap text-ink">{event.description}</p>
              </Surface>
            ) : null}

            {tab === 'signups' ? (
              <section id="signups" aria-labelledby="signups-heading" className="flex flex-col gap-4 scroll-mt-32">
                <h2 id="signups-heading" className="m-0 text-xl">
                  {totalSpots - filledSpots > 0 ? `${totalSpots - filledSpots} spot${totalSpots - filledSpots === 1 ? '' : 's'} still open` : 'Every spot is filled. Thank you.'}
                </h2>
                {items.map((item) => {
                  const remaining = item.volunteers_needed - item.signups.length
                  const mine = item.signups.find((s) => s.member_id === ctx.userId)
                  return (
                    <Surface key={item.id} tone="card" as="article" className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="m-0 text-lg">{item.title}</h3>
                          {item.description ? <p className="m-0 text-sm text-muted">{item.description}</p> : null}
                          {item.needed_at ? <p className="m-0 text-sm text-muted">Needed by {formatWhen(item.needed_at, null, false)}</p> : null}
                        </div>
                        <Badge tone={remaining > 0 ? 'primary' : 'neutral'}>
                          {item.signups.length} of {item.volunteers_needed} filled
                        </Badge>
                      </div>
                      {item.signups.length ? (
                        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                          {item.signups.map((s) => (
                            <li key={s.member_id} className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface py-1 pl-1 pr-3 text-sm">
                              <Avatar name={s.person?.fullName ?? 'Member'} photo={s.person?.photo} photoPosition={s.person?.photoPosition} size="xs" />
                              {s.person?.fullName ?? 'Member'}
                              {s.note ? <span className="text-muted">· {s.note}</span> : null}
                              {(s.member_id === ctx.userId || canManage) ? (
                                <form action={withdrawSignupAction}>
                                  <input type="hidden" name="event_id" value={id} />
                                  <input type="hidden" name="item_id" value={item.id} />
                                  <input type="hidden" name="member_id" value={s.member_id} />
                                  <button type="submit" className="text-xs font-semibold text-primary-strong" aria-label={`Remove ${s.person?.fullName ?? 'this member'} from ${item.title}`}>
                                    Remove
                                  </button>
                                </form>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {participates && !mine && remaining > 0 ? (
                        <form action={claimSignupAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                          <input type="hidden" name="event_id" value={id} />
                          <input type="hidden" name="item_id" value={item.id} />
                          <div className="flex-1">
                            <FieldShell id={`note-${item.id}`} label="A note for the organizer" helper="Optional: what you are bringing, or when you can arrive.">
                              <TextField id={`note-${item.id}`} name="note" />
                            </FieldShell>
                          </div>
                          <Button type="submit" variant="secondary" size="md">
                            I will do this
                          </Button>
                        </form>
                      ) : null}
                    </Surface>
                  )
                })}
              </section>
            ) : null}

            {tab === 'chat' && hasChat && event.chat_group_id ? (
              <section aria-labelledby="chat-heading" className="flex h-[32rem] flex-col overflow-hidden rounded-lg border border-border-strong/40 bg-bg shadow-sm">
                <h2 id="chat-heading" className="m-0 flex items-center gap-2 border-b border-border/50 px-4 py-3 text-lg">
                  <MessageIcon className="h-5 w-5 text-primary-strong" /> Event chat
                </h2>
                <LiveThread initialMessages={chat?.messages ?? []} initialCursor={chat?.nextCursor ?? null} initialHasMore={chat?.hasMore ?? false} userId={ctx.userId} isAdmin={ctx.isAdmin} groupId={event.chat_group_id} />
                <Composer groupId={event.chat_group_id} userId={ctx.userId} placeholder={`Message everyone invited to ${event.title}`} />
              </section>
            ) : null}
          </div>
        </Container>
      </Section>
    </>
  )
}
