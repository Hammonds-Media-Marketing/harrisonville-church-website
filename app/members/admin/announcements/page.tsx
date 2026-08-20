import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { formatDate } from '@/lib/format'
import { Container, Section, SectionHeading } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Badge } from '@/components/primitives/Badge'
import { Button } from '@/components/primitives/Button'
import { AdminNotices } from '@/components/members/AdminNotices'
import { getSupabaseServer } from '@/lib/supabase-server'
import { deleteAnnouncementAction } from '@/app/members/admin/actions'

export const metadata: Metadata = buildMetadata({
  title: 'Manage Announcements',
  description: 'Post and edit members-only announcements for the Harrisonville Church of Christ congregation.',
  path: '/members/admin/announcements',
  ogTitle: 'Announcements Administration',
  ogDescription: 'Manage congregation announcements.',
  noindex: true,
})

export default async function AdminAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; error?: string }>
}) {
  const supabase = await getSupabaseServer()
  const { data } = supabase
    ? await supabase
        .from('announcements')
        .select('*')
        .order('pinned', { ascending: false })
        .order('publish_date', { ascending: false })
    : { data: null }
  const items = data ?? []
  const params = await searchParams

  return (
    <>
      <PageHero
        eyebrow="Site admin"
        title="Announcements"
        lead="Only signed-in, approved members ever see these. Expired items drop off the member dashboard on their own."
      />

      <Section tone="light">
        <Container className="max-w-4xl">
          <AdminNotices params={params} />
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <SectionHeading eyebrow="Members only" title={`${items.length} announcement${items.length === 1 ? '' : 's'}`} />
            <Button href="/members/admin/announcements/new" variant="primary" size="sm">
              Post an announcement
            </Button>
          </div>

          {items.length ? (
            <ul className="flex list-none flex-col gap-4 p-0">
              {items.map((a) => (
                <li key={a.id}>
                  <Surface tone="card" className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        {a.pinned ? <Badge tone="gold">Pinned</Badge> : null}
                        {a.category ? <Badge tone="neutral">{a.category}</Badge> : null}
                        {!a.published ? <Badge tone="sample">Draft</Badge> : null}
                      </div>
                      <h3 className="text-lg">{a.title}</h3>
                      <p className="text-sm text-muted">
                        Posted {formatDate(a.publish_date)}
                        {a.expires_on ? ` · expires ${formatDate(a.expires_on)}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button href={`/members/admin/announcements/${a.id}`} variant="ghost" size="sm">
                        Edit
                      </Button>
                      <form action={deleteAnnouncementAction}>
                        <input type="hidden" name="id" value={a.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Delete
                        </Button>
                      </form>
                    </div>
                  </Surface>
                </li>
              ))}
            </ul>
          ) : (
            <Surface tone="panel">
              <p className="text-muted">Nothing posted yet. Announcements appear on the members dashboard.</p>
            </Surface>
          )}
        </Container>
      </Section>
    </>
  )
}
