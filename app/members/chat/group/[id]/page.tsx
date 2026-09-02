import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getGroup, getMessagePage, requireApprovedMember } from '@/lib/portal/data'
import { ThreadFrame } from '@/components/portal/chat/ThreadFrame'
import { LiveThread } from '@/components/portal/chat/LiveThread'
import { Composer } from '@/components/portal/chat/Composer'

export const metadata: Metadata = {
  title: { absolute: 'Group chat | Harrisonville Church of Christ' },
  description: 'A group conversation for members of the Harrisonville Church of Christ.',
  robots: { index: false, follow: false },
}

export default async function GroupThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireApprovedMember()
  const { id } = await params
  const group = await getGroup(ctx, id)
  if (!group) notFound()
  const page = await getMessagePage(ctx, { groupId: id }, null)
  const subtitle = group.kind === 'congregation' ? 'Every approved member' : group.kind === 'men' ? 'The men of the congregation' : group.kind === 'women' ? 'The ladies of the congregation' : group.description ?? 'Group chat'

  return (
    <ThreadFrame title={group.name} kind="group" subtitle={subtitle}>
      <LiveThread initialMessages={page.messages} initialCursor={page.nextCursor} initialHasMore={page.hasMore} userId={ctx.userId} isAdmin={ctx.isAdmin} groupId={id} />
      <Composer groupId={id} userId={ctx.userId} placeholder={`Message ${group.name}`} confirmWholeCongregation={group.kind === 'congregation'} />
    </ThreadFrame>
  )
}
