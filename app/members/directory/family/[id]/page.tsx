import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Container, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Avatar } from '@/components/primitives/Avatar'
import { Badge } from '@/components/primitives/Badge'
import { MapPinIcon } from '@/components/ui/icons'
import { getFamily, requireApprovedMember } from '@/lib/portal/data'
import { mapsHref, telHref } from '@/components/portal/PersonDetail'
import { formatMonthDay } from '@/lib/portal/time'

export const metadata: Metadata = {
  title: { absolute: 'Family | Harrisonville Church of Christ' },
  description: 'A family in the Harrisonville Church of Christ directory.',
  robots: { index: false, follow: false },
}

export default async function FamilyPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireApprovedMember()
  const { id } = await params
  const family = await getFamily(id)
  if (!family) notFound()
  const anniversaries = Array.from(new Set(family.members.map((m) => m.anniversary).filter((a): a is string => Boolean(a))))
  const isMine = ctx.profile.family_id === family.id

  return (
    <>
      <PageHero
        eyebrow="Directory"
        title={family.familyName}
        photo={family.photo ? { src: family.photo, alt: `The ${family.familyName}` } : undefined}
        lead={anniversaries.length ? `Anniversary ${anniversaries.map((a) => formatMonthDay(a)).join(' and ')}` : undefined}
      >
        <p className="m-0 text-sm">
          <Link href="/members/directory">Back to the directory</Link>
          {isMine ? (
            <>
              {' · '}
              <Link href="/members/profile?tab=family">Edit our family</Link>
            </>
          ) : null}
        </p>
      </PageHero>
      <Section tone="light">
        <Container className="max-w-3xl">
          <div className="flex flex-col gap-6">
            {family.address.length ? (
              <Surface tone="panel" className="flex flex-wrap items-start justify-between gap-3">
                <address className="not-italic">
                  <p className="m-0 text-sm font-semibold uppercase tracking-wide text-muted">Address</p>
                  {family.address.map((line) => (
                    <p key={line} className="m-0 text-ink">
                      {line}
                    </p>
                  ))}
                </address>
                <a href={mapsHref(family.address)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold">
                  <MapPinIcon className="h-4 w-4" /> Open in Maps
                </a>
              </Surface>
            ) : null}

            <Surface tone="card">
              <h2 className="text-xl">Household</h2>
              <ul className="m-0 flex list-none flex-col divide-y divide-border/40 p-0">
                {family.members.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center gap-3 py-3">
                    <Avatar name={m.fullName} photo={m.photo} photoPosition={m.photoPosition} size="md" />
                    <span className="min-w-0 flex-1">
                      <Link href={`/members/directory/${m.id}`} className="block font-semibold text-heading no-underline hover:underline">
                        {m.fullName}
                      </Link>
                      {m.birthday ? <span className="block text-sm text-muted">Birthday {formatMonthDay(m.birthday)}</span> : null}
                    </span>
                    <span className="flex flex-wrap gap-2 text-sm">
                      {m.phone ? <a href={telHref(m.phone)}>Call</a> : null}
                      {m.email ? <a href={`mailto:${m.email}`}>Email</a> : null}
                      {m.id !== ctx.userId ? <Link href={`/members/chat/direct/${m.id}`}>Message</Link> : null}
                    </span>
                  </li>
                ))}
                {family.children.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                    <Avatar name={c.fullName} photo={c.photo} photoPosition={c.photoPosition} size="md" />
                    <span className="min-w-0 flex-1">
                      <Link href={`/members/directory/child/${c.id}`} className="block font-semibold text-heading no-underline hover:underline">
                        {c.fullName}
                      </Link>
                      {c.birthday ? <span className="block text-sm text-muted">Birthday {formatMonthDay(c.birthday)}</span> : null}
                    </span>
                    <Badge tone="neutral">Child</Badge>
                  </li>
                ))}
              </ul>
            </Surface>
          </div>
        </Container>
      </Section>
    </>
  )
}
