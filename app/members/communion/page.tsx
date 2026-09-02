import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { Container, Section, SectionHeading } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Badge } from '@/components/primitives/Badge'
import { Button } from '@/components/primitives/Button'
import { Avatar } from '@/components/primitives/Avatar'
import { SegmentedControl } from '@/components/primitives/Controls'
import { ParamNotices } from '@/components/primitives/Feedback'
import { FieldShell, SelectField } from '@/components/primitives/Field'
import { getCommunionYear, getMembers, requireApprovedMember } from '@/lib/portal/data'
import { getTodayKey, monthName } from '@/lib/portal/time'
import { claimCommunionMonthAction, releaseCommunionMonthAction } from '@/app/members/calendar/actions'

export const metadata: Metadata = buildMetadata({
  title: 'Communion Preparation Sign-Up',
  description: 'Sign your household up to prepare the Lord’s Supper for a month at the Harrisonville Church of Christ, and see who has each month covered.',
  path: '/members/communion',
  ogTitle: 'Prepare Communion for a Month',
  ogDescription: 'One household per month. Pick an open month.',
  noindex: true,
})

const notices = {
  saved: 'You are signed up. Thank you for serving.',
  deleted: 'The month is open again.',
  'error:taken': 'Someone claimed that month a moment before you. Pick another open month.',
  'error:month': 'Choose a valid month.',
  error: 'That did not save. Try again.',
}

export default async function CommunionPage({ searchParams }: { searchParams: Promise<{ year?: string; saved?: string; deleted?: string; error?: string }> }) {
  const ctx = await requireApprovedMember()
  const params = await searchParams
  const today = getTodayKey()
  const currentYear = Number(today.slice(0, 4))
  const currentMonth = Number(today.slice(5, 7))
  const requested = Number(params.year)
  const year = Number.isInteger(requested) && Math.abs(requested - currentYear) <= 1 ? requested : currentYear

  const [signups, members] = await Promise.all([getCommunionYear(ctx, year), ctx.isEditor ? getMembers() : Promise.resolve([])])
  const byMonth = new Map(signups.map((s) => [s.signup_month, s]))
  const thisMonth = year === currentYear ? byMonth.get(currentMonth) : undefined

  return (
    <>
      <PageHero
        eyebrow="Members"
        title="Communion preparation"
        lead="One household prepares the Lord’s Supper for each month: the bread and fruit of the vine for every Sunday. Pick an open month below. A reminder reaches you a week before and the day before your month begins."
      />
      <Section tone="light">
        <Container className="max-w-3xl">
          <ParamNotices params={params} messages={notices} />

          <Surface tone="panel" className="mb-6 flex flex-wrap items-center gap-4">
            {thisMonth?.member ? <Avatar name={thisMonth.member.fullName} photo={thisMonth.member.photo} photoPosition={thisMonth.member.photoPosition} size="md" /> : null}
            <div className="min-w-0 flex-1">
              <p className="m-0 text-sm font-semibold uppercase tracking-wide text-muted">{monthName(currentMonth)} {currentYear}</p>
              <p className="m-0 font-display text-xl text-heading">{thisMonth?.member ? `${thisMonth.member.fullName} is preparing communion this month.` : 'This month still needs someone.'}</p>
            </div>
          </Surface>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <SectionHeading eyebrow="Sign-up sheet" title={String(year)} />
            <SegmentedControl
              label="Year"
              value={String(year)}
              segments={[currentYear - 1, currentYear, currentYear + 1].map((y) => ({ value: String(y), label: String(y), href: `/members/communion?year=${y}` }))}
            />
          </div>

          <ol className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
              const signup = byMonth.get(month)
              const past = year < currentYear || (year === currentYear && month < currentMonth)
              const isMine = signup?.member_id === ctx.userId
              return (
                <li key={month}>
                  <Surface tone="card" as="article" className={`flex h-full flex-col gap-3 ${past && !signup ? 'opacity-70' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="m-0 text-lg">{monthName(month)}</h3>
                      {signup ? <Badge tone={isMine ? 'gold' : 'primary'}>{isMine ? 'Your month' : 'Covered'}</Badge> : past ? <Badge tone="neutral">Past</Badge> : <Badge tone="sample">Open</Badge>}
                    </div>
                    {signup ? (
                      <div className="flex items-center gap-3">
                        {signup.member ? <Avatar name={signup.member.fullName} photo={signup.member.photo} photoPosition={signup.member.photoPosition} size="sm" /> : null}
                        <div className="min-w-0">
                          <p className="m-0 font-semibold text-heading">{signup.member?.fullName ?? 'A member'}</p>
                          {signup.notes ? <p className="m-0 text-sm text-muted">{signup.notes}</p> : null}
                        </div>
                      </div>
                    ) : (
                      <p className="m-0 text-sm text-muted">{past ? 'No one was recorded for this month.' : 'No one has claimed this month yet.'}</p>
                    )}
                    <div className="mt-auto flex flex-wrap gap-2 pt-1">
                      {!signup && !past ? (
                        <form action={claimCommunionMonthAction} className="flex w-full flex-col gap-3">
                          <input type="hidden" name="year" value={year} />
                          <input type="hidden" name="month" value={month} />
                          {ctx.isEditor && members.length ? (
                            <FieldShell id={`for-${month}`} label="Sign up on behalf of" helper="Leave blank to sign yourself up.">
                              <SelectField id={`for-${month}`} name="member_id" options={[{ value: '', label: 'Myself' }, ...members.map((m) => ({ value: m.id, label: m.fullName }))]} defaultValue="" />
                            </FieldShell>
                          ) : null}
                          <Button type="submit" variant="primary" size="sm">
                            Sign up for {monthName(month)}
                          </Button>
                        </form>
                      ) : null}
                      {signup && (isMine || ctx.isEditor) && !past ? (
                        <form action={releaseCommunionMonthAction}>
                          <input type="hidden" name="id" value={signup.id} />
                          <input type="hidden" name="year" value={year} />
                          <Button type="submit" variant="ghost" size="sm">
                            {isMine ? 'I can no longer take this month' : 'Release this month'}
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </Surface>
                </li>
              )
            })}
          </ol>
        </Container>
      </Section>
    </>
  )
}
