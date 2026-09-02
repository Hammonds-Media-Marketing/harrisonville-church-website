import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo'
import { Container, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Button } from '@/components/primitives/Button'
import { Badge } from '@/components/primitives/Badge'
import { Avatar } from '@/components/primitives/Avatar'
import { EmptyState } from '@/components/primitives/Feedback'
import { CakeIcon, HeartIcon } from '@/components/ui/icons'
import { getFamilies, getMembers, requireApprovedMember } from '@/lib/portal/data'
import { buildAnniversaries, buildBirthdays, type CelebrationPerson } from '@/lib/portal/celebrations'
import { addDays, formatKey, formatWeekRange, getTodayKey, isValidDateKey, startOfWeek } from '@/lib/portal/time'

export const metadata: Metadata = buildMetadata({
  title: 'Birthdays and Anniversaries',
  description: 'This week’s birthdays and wedding anniversaries in the Harrisonville Church of Christ family, Sunday through Saturday.',
  path: '/members/directory/birthdays-anniversaries',
  ogTitle: 'Celebrations This Week',
  ogDescription: 'Who to wish a happy birthday or anniversary this week.',
  noindex: true,
})

export default async function CelebrationsPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  await requireApprovedMember()
  const { week } = await searchParams
  const today = getTodayKey()
  const weekStart = startOfWeek(week && isValidDateKey(week) ? week : today)
  const thisWeek = startOfWeek(today)

  const [members, families] = await Promise.all([getMembers({ listedOnly: true }), getFamilies()])
  const familyById = new Map(families.map((f) => [f.id, f]))
  const people: CelebrationPerson[] = [
    ...members.map((m) => ({
      id: m.id,
      displayName: m.fullName,
      photo: m.photo,
      photoPosition: m.photoPosition,
      birthday: m.birthday,
      anniversary: m.anniversary,
      familyId: m.familyId,
      familyName: m.familyName,
      familyPhoto: m.familyId ? familyById.get(m.familyId)?.photo ?? null : null,
      kind: 'adult' as const,
    })),
    ...families.flatMap((f) =>
      f.children.map((c) => ({
        id: c.id,
        displayName: c.fullName,
        photo: c.photo,
        photoPosition: c.photoPosition,
        birthday: c.birthday,
        familyId: f.id,
        familyName: f.familyName,
        kind: 'child' as const,
      }))
    ),
  ]
  const birthdays = buildBirthdays(people, weekStart, today)
  const anniversaries = buildAnniversaries(people, weekStart, today)

  return (
    <>
      <PageHero eyebrow="Directory" title="Birthdays and anniversaries" lead={formatWeekRange(weekStart)}>
        <nav aria-label="Week" className="flex flex-wrap gap-2">
          <Button href={`/members/directory/birthdays-anniversaries?week=${addDays(weekStart, -7)}`} variant="ghost" size="sm">
            Previous week
          </Button>
          <Button href="/members/directory/birthdays-anniversaries" variant={weekStart === thisWeek ? 'secondary' : 'ghost'} size="sm" aria-current={weekStart === thisWeek ? 'date' : undefined}>
            This week
          </Button>
          <Button href={`/members/directory/birthdays-anniversaries?week=${addDays(weekStart, 7)}`} variant="ghost" size="sm">
            Next week
          </Button>
        </nav>
      </PageHero>
      <Section tone="light">
        <Container className="max-w-3xl">
          <div className="grid gap-6 md:grid-cols-2">
            <Surface tone="card" as="section" aria-labelledby="birthdays-heading">
              <h2 id="birthdays-heading" className="flex items-center gap-2 text-xl">
                <CakeIcon className="h-5 w-5 text-primary-strong" /> Birthdays
              </h2>
              {birthdays.length ? (
                <ul className="m-0 flex list-none flex-col divide-y divide-border/40 p-0">
                  {birthdays.map((b, i) => (
                    <li key={b.key} className="flex items-center gap-3 py-3">
                      <Avatar name={b.displayName} photo={b.photo} photoPosition={b.photoPosition} size="md" priority={i < 3} />
                      <span className="min-w-0 flex-1">
                        <Link href={b.kind === 'child' ? `/members/directory/child/${b.personId}` : `/members/directory/${b.personId}`} className="block font-semibold text-heading no-underline hover:underline">
                          {b.displayName}
                        </Link>
                        <span className="block text-sm text-muted">
                          {formatKey(b.dateKey, { weekday: true, year: false })}
                          {b.familyName ? ` · ${b.familyName}` : ''}
                        </span>
                      </span>
                      {b.isToday ? <Badge tone="gold">Today</Badge> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="No birthdays this week" />
              )}
            </Surface>
            <Surface tone="card" as="section" aria-labelledby="anniversaries-heading">
              <h2 id="anniversaries-heading" className="flex items-center gap-2 text-xl">
                <HeartIcon className="h-5 w-5 text-primary-strong" /> Anniversaries
              </h2>
              {anniversaries.length ? (
                <ul className="m-0 flex list-none flex-col divide-y divide-border/40 p-0">
                  {anniversaries.map((a) => (
                    <li key={a.key} className="flex items-center gap-3 py-3">
                      <Avatar name={a.displayName} photo={a.photo} photoPosition={a.photoPosition} size="md" shape={a.displayName.startsWith('The ') ? 'square' : 'circle'} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-heading">{a.displayName}</span>
                        <span className="block text-sm text-muted">{formatKey(a.dateKey, { weekday: true, year: false })}</span>
                      </span>
                      {a.isToday ? <Badge tone="gold">Today</Badge> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="No anniversaries this week" />
              )}
            </Surface>
          </div>
          <p className="mt-6 text-sm text-muted">
            Only members who chose to share a birthday or anniversary appear here. A February 29 birthday shows in weeks that contain February 29.
          </p>
        </Container>
      </Section>
    </>
  )
}
