import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { buildMetadata } from '@/lib/seo'
import { formatDate } from '@/lib/format'
import { Container, Section, SectionHeading } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Badge } from '@/components/primitives/Badge'
import { Button } from '@/components/primitives/Button'
import { EmptyState } from '@/components/primitives/Feedback'
import { MegaphoneIcon } from '@/components/ui/icons'
import { getAuthContext } from '@/lib/supabase-server'
import { getAnnouncements } from '@/lib/members'
import { getInstalledApp, getServiceAssignments, getUpcoming, requireMember } from '@/lib/portal/data'
import { getOnboardingStatus } from '@/lib/portal/onboarding'
import { upcomingAssignments } from '@/lib/portal/service-schedule'
import { addDays, getTodayKey, monthName } from '@/lib/portal/time'
import { ServiceAssignmentsCard, SetupChecklist, UpcomingList } from '@/components/portal/HomeCards'
import { getSupabaseServer } from '@/lib/supabase-server'

export const metadata: Metadata = buildMetadata({
  title: 'Members Home',
  description:
    'The Harrisonville Church of Christ members home: announcements, what is coming up on the calendar, who is serving at the next assemblies, and quick links to the directory and chat.',
  path: '/members',
  ogTitle: 'Church Family Home',
  ogDescription: 'Announcements, upcoming events, and service assignments for members.',
  noindex: true,
})

export default async function MembersHomePage() {
  const { user, profile } = await getAuthContext()
  if (!user) redirect('/members/login')
  const approved = Boolean(profile?.approved)
  const firstName = profile?.full_name?.split(' ')[0] || 'friend'

  if (!approved) {
    const rejected = Boolean(profile?.rejected_at)
    return (
      <>
        <PageHero eyebrow="Members" title={`Welcome, ${firstName}`} lead="Your account is set up. One more step before the members area opens." />
        <Section tone="light">
          <Container className="max-w-3xl">
            <Surface tone="panel">
              <h2 className="mb-2 text-xl">{rejected ? 'Your request was not approved' : 'Your access is awaiting approval'}</h2>
              <p className="text-muted">
                {rejected
                  ? 'An admin reviewed this request and did not approve it. If you believe that was a mistake, please speak with one of the elders or contact the church office.'
                  : 'Thank you for confirming your email. A church admin still needs to approve your membership before announcements, the directory, chat, and the calendar open up. If it has been more than a day or two, mention it to one of the elders or contact the church office.'}
              </p>
              <p className="m-0 text-sm text-muted">
                While you wait you can fill in your <Link href="/members/profile">profile</Link>.
              </p>
            </Surface>
          </Container>
        </Section>
      </>
    )
  }

  const ctx = await requireMember()
  const today = getTodayKey()
  const [announcements, upcoming, assignmentRows, installed, supabase] = await Promise.all([
    getAnnouncements(),
    getUpcoming(ctx, 6),
    getServiceAssignments(ctx, today, addDays(today, 21)),
    getInstalledApp(ctx),
    getSupabaseServer(),
  ])
  const onboarding = getOnboardingStatus({ profile: ctx.profile, hasInstalledApp: Boolean(installed?.standalone_detected) })
  const nextDays = upcomingAssignments(assignmentRows, { todayKey: today, maxServices: 3 })
  let arranger: string | null = null
  if (supabase && nextDays[0]) {
    const [y, m] = nextDays[0].dateKey.split('-').map(Number)
    const { data } = await supabase.from('service_schedule_months').select('arranger_name').eq('year', y).eq('month', m).maybeSingle()
    arranger = data?.arranger_name ?? null
  }

  const [ty, tm] = today.split('-').map(Number)
  const { data: communion } = supabase
    ? await supabase.from('communion_signups').select('member_id').eq('signup_year', ty).eq('signup_month', tm).is('removed_at', null).maybeSingle()
    : { data: null }

  return (
    <>
      <PageHero
        eyebrow="Members"
        title={`Welcome back, ${firstName}`}
        lead="News for the church family between assemblies: announcements, what is coming up, and who is serving."
      />

      <Section tone="light">
        <Container>
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="flex flex-col gap-6">
              <SetupChecklist status={onboarding} />

              <section aria-labelledby="announcements-heading" id="announcements">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <SectionHeading eyebrow="This week" title="Announcements" id="announcements-heading" />
                  {ctx.isEditor ? (
                    <Button href="/members/admin/announcements/new" variant="ghost" size="sm">
                      Post an announcement
                    </Button>
                  ) : null}
                </div>
                {announcements.length ? (
                  <ul className="flex list-none flex-col gap-4 p-0">
                    {announcements.map((a) => (
                      <li key={a.id} id={`announcement-${a.id}`} className="scroll-mt-32">
                        <Surface tone="card" as="article">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            {a.pinned ? <Badge tone="gold">Pinned</Badge> : null}
                            {a.category ? <Badge tone="neutral">{a.category}</Badge> : null}
                            <span className="text-sm text-muted">{formatDate(a.publishDate)}</span>
                          </div>
                          <h3 className="text-xl">{a.title}</h3>
                          <p className="m-0 whitespace-pre-line text-ink">{a.body}</p>
                        </Surface>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState icon={<MegaphoneIcon className="h-6 w-6" />} title="No announcements right now">
                    <p>When the elders or the church office post news, it lands here and in your notification bell.</p>
                  </EmptyState>
                )}
              </section>
            </div>

            <aside className="flex flex-col gap-6" aria-label="At a glance">
              <Surface tone="card" as="section" aria-labelledby="upcoming-heading">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 id="upcoming-heading" className="m-0 text-xl">
                    Coming up
                  </h2>
                  <Link href="/members/calendar" className="text-sm font-semibold">
                    Calendar
                  </Link>
                </div>
                <UpcomingList items={upcoming} />
              </Surface>

              <ServiceAssignmentsCard days={nextDays} arranger={arranger} />

              <Surface tone="panel" as="section" aria-labelledby="communion-heading">
                <h2 id="communion-heading" className="m-0 text-xl">
                  Communion preparation
                </h2>
                <p className="m-0 mt-1 text-sm text-muted">
                  {communion ? `${monthName(tm)} is covered.` : `${monthName(tm)} still needs a household to prepare communion.`}
                </p>
                <div className="mt-3">
                  <Button href="/members/communion" variant={communion ? 'ghost' : 'primary'} size="sm">
                    {communion ? 'See the sign-up list' : 'Sign up for a month'}
                  </Button>
                </div>
              </Surface>

              <nav aria-label="Quick links" className="grid grid-cols-2 gap-2">
                {[
                  { href: '/members/directory', label: 'Directory' },
                  { href: '/members/chat', label: 'Chat' },
                  { href: '/members/events', label: 'Events and sign-ups' },
                  { href: '/members/directory/birthdays-anniversaries', label: 'Birthdays' },
                ].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="rounded-md border border-border-strong/40 bg-bg px-3 py-3 text-center text-sm font-semibold text-heading no-underline shadow-sm transition-colors hover:bg-surface"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  )
}
