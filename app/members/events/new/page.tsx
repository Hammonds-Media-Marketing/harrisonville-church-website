import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { Container, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { SpecialEventForm } from '@/components/portal/events/SpecialEventForm'
import { getMembers, requireApprovedMember } from '@/lib/portal/data'

export const metadata: Metadata = buildMetadata({
  title: 'Organize an Event',
  description: 'Create a members-only event for the Harrisonville Church of Christ family with an audience, RSVPs, and sign-up needs.',
  path: '/members/events/new',
  ogTitle: 'New Church Family Event',
  ogDescription: 'Set the audience, ask for RSVPs, and list what is needed.',
  noindex: true,
})

export default async function NewEventPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const ctx = await requireApprovedMember()
  const members = await getMembers()
  const { error } = await searchParams
  return (
    <>
      <PageHero eyebrow="Events" title="Organize an event" lead="Only a title is required to save a draft. Publish when the date is set and everyone invited gets a note." />
      <Section tone="light">
        <Container className="max-w-3xl">
          <Surface tone="card">
            <SpecialEventForm event={null} items={[]} excludedIds={[]} members={members} currentUserId={ctx.userId} error={error} />
          </Surface>
        </Container>
      </Section>
    </>
  )
}
