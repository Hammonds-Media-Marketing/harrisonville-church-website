import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { buildMetadata } from '@/lib/seo'
import { formatDate } from '@/lib/format'
import { Container, Section, SectionHeading } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Badge } from '@/components/primitives/Badge'
import { getAuthContext } from '@/lib/supabase-server'
import { getAnnouncements } from '@/lib/members'

export const metadata: Metadata = buildMetadata({
  title: 'Member Announcements',
  description:
    'Congregation announcements for members of the Harrisonville Church of Christ: schedule changes, prayer requests, and church family news.',
  path: '/members',
  ogTitle: 'Congregation Announcements',
  ogDescription: 'News and updates for the church family.',
  noindex: true,
})

export default async function MembersDashboardPage() {
  const { user, profile } = await getAuthContext()
  if (!user) redirect('/members/login')

  const approved = Boolean(profile?.approved)
  const announcements = approved ? await getAnnouncements() : []
  const firstName = profile?.full_name?.split(' ')[0] || 'friend'

  return (
    <>
      <PageHero
        eyebrow="Members"
        title={`Welcome back, ${firstName}`}
        lead="News for the church family between assemblies: announcements, schedule changes, and ways to serve."
      />

      <Section tone="light">
        <Container className="max-w-3xl">
          {!approved ? (
            <Surface tone="panel">
              <h2 className="mb-2 text-xl">Your access is awaiting approval</h2>
              <p className="text-muted">
                Thank you for confirming your email. A church admin still needs to approve your
                membership before announcements and the directory open up. If it has been more than a
                day or two, mention it to one of the elders or contact the church office.
              </p>
            </Surface>
          ) : (
            <>
              <SectionHeading
                eyebrow="This week"
                title="Announcements"
                lead={
                  announcements.length
                    ? 'Pinned items stay at the top until they expire.'
                    : undefined
                }
              />
              {announcements.length ? (
                <ul className="flex list-none flex-col gap-5 p-0">
                  {announcements.map((a) => (
                    <li key={a.id}>
                      <Surface tone="card" as="article">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          {a.pinned ? <Badge tone="gold">Pinned</Badge> : null}
                          {a.category ? <Badge tone="neutral">{a.category}</Badge> : null}
                          <span className="text-sm text-muted">{formatDate(a.publishDate)}</span>
                        </div>
                        <h3 className="mb-2 text-xl">{a.title}</h3>
                        <p className="whitespace-pre-line text-ink">{a.body}</p>
                      </Surface>
                    </li>
                  ))}
                </ul>
              ) : (
                <Surface tone="panel">
                  <p className="text-muted">
                    No announcements right now. Check back after the next assembly.
                  </p>
                </Surface>
              )}
            </>
          )}
        </Container>
      </Section>
    </>
  )
}
