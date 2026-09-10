import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Container, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Button } from '@/components/primitives/Button'
import { SpecialEventForm } from '@/components/portal/events/SpecialEventForm'
import { getMembers, getSpecialEvent, requireApprovedMember } from '@/lib/portal/data'
import { archiveSpecialEventAction } from '@/app/members/events/actions'

export const metadata: Metadata = {
  title: { absolute: 'Edit event | Harrisonville Church of Christ' },
  description: 'Edit a members-only event.',
  robots: { index: false, follow: false },
}

export default async function EditEventPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const ctx = await requireApprovedMember()
  const { id } = await params
  const [detail, members] = await Promise.all([getSpecialEvent(ctx, id), getMembers()])
  if (!detail || !detail.canManage) notFound()
  const { error } = await searchParams
  return (
    <>
      <PageHero eyebrow="Events" title={`Edit: ${detail.event.title}`}>
        <p className="m-0 text-sm">
          <Link href={`/members/events/${id}`}>Back to the event</Link>
        </p>
      </PageHero>
      <Section tone="light">
        <Container className="max-w-3xl">
          <div className="flex flex-col gap-6">
            <Surface tone="card">
              <SpecialEventForm event={detail.event} items={detail.items} excludedIds={detail.excludedIds} members={members} currentUserId={ctx.userId} error={error} />
            </Surface>
            <Surface tone="panel">
              <form action={archiveSpecialEventAction} className="flex flex-wrap items-center justify-between gap-3">
                <input type="hidden" name="id" value={id} />
                <p className="m-0 text-sm text-muted">Archiving hides the event and its chat from everyone. RSVPs and sign-ups are kept.</p>
                <Button type="submit" variant="ghost" size="sm">
                  Archive event
                </Button>
              </form>
            </Surface>
          </div>
        </Container>
      </Section>
    </>
  )
}
