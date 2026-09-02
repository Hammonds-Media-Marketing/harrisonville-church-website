import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo'
import { Container, Section, SectionHeading } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Avatar } from '@/components/primitives/Avatar'
import { CountBadge, EmptyState } from '@/components/primitives/Feedback'
import { MessageIcon, UsersIcon } from '@/components/ui/icons'
import { NewMessagePicker } from '@/components/portal/chat/NewMessagePicker'
import { getConversations, getMembers, requireApprovedMember } from '@/lib/portal/data'
import { formatConversationStamp } from '@/lib/portal/time'

export const metadata: Metadata = buildMetadata({
  title: 'Member Chat',
  description: 'Group chats and direct messages for members of the Harrisonville Church of Christ: the whole congregation, the men, the ladies, and any group the church sets up.',
  path: '/members/chat',
  ogTitle: 'Church Family Chat',
  ogDescription: 'Talk with the congregation, a group, or one member.',
  noindex: true,
})

export default async function ChatPage() {
  const ctx = await requireApprovedMember()
  const [{ groups, direct }, members] = await Promise.all([getConversations(ctx), getMembers()])
  const people = members.filter((m) => m.id !== ctx.userId).map((m) => ({ ...m, familyName: m.familyName }))
  const noGender = !ctx.profile.gender

  return (
    <>
      <PageHero eyebrow="Members" title="Chat" lead="Conversations stay inside the church family. Long-press or right-click a message to react, edit, or remove it.">
        <div>
          <NewMessagePicker people={people} />
        </div>
      </PageHero>
      <Section tone="light">
        <Container className="max-w-3xl">
          <div className="flex flex-col gap-8">
            <section aria-labelledby="groups-heading">
              <SectionHeading eyebrow="Groups" title="Group chats" id="groups-heading" lead={noGender ? 'Add your gender on your profile to join the Men or Ladies chat.' : undefined} />
              <ul className="m-0 flex list-none flex-col divide-y divide-border/40 rounded-lg border border-border-strong/40 bg-bg p-0 shadow-sm">
                {groups.map((g) => (
                  <li key={g.id}>
                    <Link href={`/members/chat/group/${g.id}`} className="flex items-center gap-3 px-4 py-3 no-underline hover:bg-surface">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-surface text-primary-strong">
                        <UsersIcon className="h-6 w-6" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate font-semibold text-heading">{g.name}</span>
                          {g.lastAt ? <span className="shrink-0 text-xs text-muted">{formatConversationStamp(g.lastAt)}</span> : null}
                        </span>
                        <span className="block truncate text-sm text-muted">{g.preview}</span>
                      </span>
                      <CountBadge count={g.unread} label={`${g.unread} unread in ${g.name}`} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="direct-heading">
              <SectionHeading eyebrow="One to one" title="Direct messages" id="direct-heading" />
              {direct.length ? (
                <ul className="m-0 flex list-none flex-col divide-y divide-border/40 rounded-lg border border-border-strong/40 bg-bg p-0 shadow-sm">
                  {direct.map((d) => (
                    <li key={d.id}>
                      <Link href={`/members/chat/direct/${d.id}`} className="flex items-center gap-3 px-4 py-3 no-underline hover:bg-surface">
                        <Avatar name={d.name} photo={d.photo} photoPosition={d.photoPosition} size="md" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="truncate font-semibold text-heading">{d.name}</span>
                            {d.lastAt ? <span className="shrink-0 text-xs text-muted">{formatConversationStamp(d.lastAt)}</span> : null}
                          </span>
                          <span className="block truncate text-sm text-muted">{d.preview}</span>
                        </span>
                        <CountBadge count={d.unread} label={`${d.unread} unread from ${d.name}`} />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon={<MessageIcon className="h-6 w-6" />} title="No direct messages yet" action={<NewMessagePicker people={people} />}>
                  <p>Pick a member to start a private conversation.</p>
                </EmptyState>
              )}
            </section>
          </div>
        </Container>
      </Section>
    </>
  )
}
