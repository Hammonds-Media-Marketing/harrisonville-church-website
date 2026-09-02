import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Container, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { getFamily, getMember, requireApprovedMember } from '@/lib/portal/data'
import { FactList, PersonHeader, birthdayFact, telHref } from '@/components/portal/PersonDetail'

export const metadata: Metadata = {
  title: { absolute: 'Member | Harrisonville Church of Christ' },
  description: 'A member of the Harrisonville Church of Christ.',
  robots: { index: false, follow: false },
}

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireApprovedMember()
  const { id } = await params
  const member = await getMember(id)
  if (!member) notFound()
  const family = member.familyId ? await getFamily(member.familyId) : null
  const isMe = member.id === ctx.userId

  const actions = [
    ...(member.phone ? [{ href: telHref(member.phone), label: 'Call', icon: 'phone' as const }] : []),
    ...(member.email ? [{ href: `mailto:${member.email}`, label: 'Email', icon: 'mail' as const }] : []),
    ...(!isMe ? [{ href: `/members/chat/direct/${member.id}`, label: 'Message', icon: 'message' as const }] : []),
  ]

  return (
    <>
      <PageHero eyebrow="Directory" title={member.fullName} lead={member.about ?? undefined}>
        <p className="m-0 text-sm">
          <Link href="/members/directory">Back to the directory</Link>
        </p>
      </PageHero>
      <Section tone="light">
        <Container className="max-w-3xl">
          <div className="flex flex-col gap-6">
            <PersonHeader
              name={member.fullName}
              photo={member.photo}
              photoPosition={member.photoPosition}
              subtitle={family ? family.familyName : null}
              badges={[...(member.role !== 'member' ? [{ label: member.role === 'admin' ? 'Admin' : 'Editor', tone: 'primary' as const }] : []), ...(isMe ? [{ label: 'You', tone: 'gold' as const }] : [])]}
              actions={actions}
            />
            <FactList
              facts={[
                { label: 'Email', value: member.email, href: member.email ? `mailto:${member.email}` : undefined },
                { label: 'Phone', value: member.phone, href: member.phone ? telHref(member.phone) : undefined },
                { label: 'Birthday', value: birthdayFact(member.birthday) },
                { label: 'Anniversary', value: birthdayFact(member.anniversary) },
                { label: 'Address', value: family?.address.length ? family.address.join(', ') : member.address },
                { label: 'Family', value: family?.familyName ?? null, href: family ? `/members/directory/family/${family.id}` : undefined },
              ]}
            />
            {isMe ? (
              <p className="m-0 text-sm text-muted">
                This is how other members see you. <Link href="/members/profile">Edit your profile</Link> to change what is shared.
              </p>
            ) : null}
          </div>
        </Container>
      </Section>
    </>
  )
}
