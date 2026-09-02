import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Container, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { getChild, requireApprovedMember } from '@/lib/portal/data'
import { FactList, PersonHeader, birthdayFact } from '@/components/portal/PersonDetail'

export const metadata: Metadata = {
  title: { absolute: 'Family member | Harrisonville Church of Christ' },
  description: 'A child in a Harrisonville Church of Christ family.',
  robots: { index: false, follow: false },
}

export default async function ChildPage({ params }: { params: Promise<{ id: string }> }) {
  await requireApprovedMember()
  const { id } = await params
  const child = await getChild(id)
  if (!child) notFound()
  return (
    <>
      <PageHero eyebrow="Directory" title={child.fullName}>
        <p className="m-0 text-sm">
          <Link href={`/members/directory/family/${child.familyId}`}>Back to the {child.familyName}</Link>
        </p>
      </PageHero>
      <Section tone="light">
        <Container className="max-w-3xl">
          <div className="flex flex-col gap-6">
            <PersonHeader name={child.fullName} photo={child.photo} photoPosition={child.photoPosition} subtitle={`${child.familyName} · Child`} />
            <FactList facts={[{ label: 'Birthday', value: birthdayFact(child.birthday) }, { label: 'Family', value: child.familyName, href: `/members/directory/family/${child.familyId}` }]} />
          </div>
        </Container>
      </Section>
    </>
  )
}
