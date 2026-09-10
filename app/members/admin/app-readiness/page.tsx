import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { buildMetadata } from '@/lib/seo'
import { Container, Section, SectionHeading } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Avatar } from '@/components/primitives/Avatar'
import { StatTile } from '@/components/primitives/Feedback'
import { getAuthContext, isAdminRole } from '@/lib/supabase-server'
import { getAppReadiness, requireAdmin } from '@/lib/portal/data'
import { formatRelative } from '@/lib/portal/time'
import type { MemberProfileRow } from '@/lib/portal/types'

export const metadata: Metadata = buildMetadata({
  title: 'App Readiness',
  description: 'How ready the Harrisonville Church of Christ congregation is on the members area: who has installed it on a phone, who has signed in recently, and whose profile still needs details.',
  path: '/members/admin/app-readiness',
  ogTitle: 'Members Area Adoption',
  ogDescription: 'Installed, active, and incomplete at a glance.',
  noindex: true,
})

function MemberList({ title, people, detail }: { title: string; people: MemberProfileRow[]; detail?: (p: MemberProfileRow) => string | null }) {
  return (
    <Surface tone="card" as="section" aria-label={title} className="flex flex-col">
      <h3 className="m-0 mb-2 text-lg">
        {title} <span className="text-muted">({people.length})</span>
      </h3>
      {people.length ? (
        <ul className="m-0 max-h-72 list-none divide-y divide-border/40 overflow-y-auto p-0">
          {people.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2">
              <Avatar name={p.full_name || p.email} photo={p.photo} photoPosition={p.photo_position} size="xs" />
              <span className="min-w-0 flex-1">
                <Link href={`/members/admin/members#member-${p.id}`} className="block truncate font-semibold text-heading no-underline hover:underline">
                  {p.full_name || p.email}
                </Link>
                {detail?.(p) ? <span className="block truncate text-xs text-muted">{detail(p)}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 text-sm text-muted">No one.</p>
      )}
    </Surface>
  )
}

export default async function AppReadinessPage() {
  const { profile } = await getAuthContext()
  if (!isAdminRole(profile)) redirect('/members/admin')
  const ctx = await requireAdmin()
  const r = await getAppReadiness(ctx)
  const pct = (n: number) => (r.approved.length ? Math.round((n / r.approved.length) * 100) : 0)

  return (
    <>
      <PageHero eyebrow="Site admin" title="App readiness" lead="Approved members only. Installed means the members area has opened from a home-screen icon; browsers do not report installs any other way." />
      <Section tone="light">
        <Container className="max-w-5xl">
          <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label="Approved members" value={r.approved.length} tone="primary" helper={`${r.familyCount} families`} />
            <StatTile label="Installed on a phone" value={`${pct(r.installed.length)}%`} helper={`${r.installed.length} of ${r.approved.length}`} tone="gold" />
            <StatTile label="Active this week" value={`${pct(r.activeThisWeek.length)}%`} helper={`${r.activeThisWeek.length} signed in`} />
            <StatTile label="Profile complete" value={`${pct(r.approved.length - r.incompleteProfiles.length)}%`} helper="phone, birthday, gender" />
          </div>

          <SectionHeading eyebrow="Follow up" title="Who could use a nudge" lead="A phone call on Sunday does more than any reminder in the app." />
          <div className="grid gap-4 md:grid-cols-2">
            <MemberList title="Never signed in since approval" people={r.neverSignedIn} />
            <MemberList title="Not installed on a phone" people={r.notInstalled} detail={(p) => (p.last_seen_at ? `Last seen ${formatRelative(p.last_seen_at)}` : null)} />
            <MemberList title="Profile missing phone, birthday, or gender" people={r.incompleteProfiles} detail={(p) => [!p.phone && 'phone', !p.birthday && 'birthday', !p.gender && 'gender'].filter(Boolean).join(', ')} />
            <MemberList title="No profile photo" people={r.noPhoto} />
            <MemberList title="Not in a family" people={r.noFamily} />
            <MemberList title="Welcome email not sent" people={r.welcomeNotSent} />
          </div>

          <div className="mt-8">
            <SectionHeading eyebrow="Installed" title="Home-screen launches recorded" />
            <MemberList
              title="Installed"
              people={r.installed}
              detail={(p) => {
                const d = r.detectionByMember.get(p.id)
                return d ? `${d.platform_category} · last opened ${formatRelative(d.last_detected_at)}` : null
              }}
            />
          </div>
        </Container>
      </Section>
    </>
  )
}
