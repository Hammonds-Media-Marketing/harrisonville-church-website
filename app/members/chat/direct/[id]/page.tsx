import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getMember, getMessagePage, requireApprovedMember } from '@/lib/portal/data'
import { ThreadFrame } from '@/components/portal/chat/ThreadFrame'
import { LiveThread } from '@/components/portal/chat/LiveThread'
import { Composer } from '@/components/portal/chat/Composer'

export const metadata: Metadata = {
  title: { absolute: 'Direct message | Harrisonville Church of Christ' },
  description: 'A private conversation between two members of the Harrisonville Church of Christ.',
  robots: { index: false, follow: false },
}

export default async function DirectThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireApprovedMember()
  const { id } = await params
  if (id === ctx.userId) redirect('/members/chat')
  const member = await getMember(id)
  if (!member) notFound()
  const page = await getMessagePage(ctx, { recipientId: id }, null)

  return (
    <ThreadFrame title={member.fullName} kind="direct" photo={member.photo} photoPosition={member.photoPosition} subtitle="Direct message">
      <LiveThread initialMessages={page.messages} initialCursor={page.nextCursor} initialHasMore={page.hasMore} userId={ctx.userId} isAdmin={ctx.isAdmin} recipientId={id} />
      <Composer recipientId={id} userId={ctx.userId} placeholder={`Message ${member.firstName}`} />
    </ThreadFrame>
  )
}
