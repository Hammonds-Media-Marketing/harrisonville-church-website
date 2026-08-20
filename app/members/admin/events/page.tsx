import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { formatDateRange } from '@/lib/format'
import { Container, Section, SectionHeading } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Badge } from '@/components/primitives/Badge'
import { Button } from '@/components/primitives/Button'
import { AdminNotices } from '@/components/members/AdminNotices'
import { getSupabaseServer } from '@/lib/supabase-server'
import { deleteEventAction } from '@/app/members/admin/actions'

export const metadata: Metadata = buildMetadata({
  title: 'Manage Events',
  description: 'Create, edit, publish, and remove events on the Harrisonville Church of Christ website.',
  path: '/members/admin/events',
  ogTitle: 'Events Administration',
  ogDescription: 'Manage the public events calendar.',
  noindex: true,
})

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; error?: string }>
}) {
  const supabase = await getSupabaseServer()
  const { data } = supabase
    ? await supabase.from('events').select('*').order('start_date', { ascending: true })
    : { data: null }
  const events = data ?? []
  const params = await searchParams

  return (
    <>
      <PageHero
        eyebrow="Site admin"
        title="Events"
        lead="Everything on the public events page. Unpublished events stay hidden from visitors until you are ready."
      />

      <Section tone="light">
        <Container className="max-w-4xl">
          <AdminNotices params={params} />
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <SectionHeading eyebrow="Calendar" title={`${events.length} event${events.length === 1 ? '' : 's'}`} />
            <Button href="/members/admin/events/new" variant="primary" size="sm">
              Add an event
            </Button>
          </div>

          {events.length ? (
            <ul className="flex list-none flex-col gap-4 p-0">
              {events.map((e) => (
                <li key={e.id}>
                  <Surface tone="card" className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <Badge tone="neutral">{e.category}</Badge>
                        {!e.published ? <Badge tone="sample">Draft</Badge> : null}
                        {e.sample ? <Badge tone="sample">Sample</Badge> : null}
                      </div>
                      <h3 className="text-lg">{e.title}</h3>
                      <p className="text-sm text-muted">{formatDateRange(e.start_date, e.end_date ?? undefined)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button href={`/members/admin/events/${e.id}`} variant="ghost" size="sm">
                        Edit
                      </Button>
                      <form action={deleteEventAction}>
                        <input type="hidden" name="id" value={e.id} />
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
              <p className="text-muted">No events yet. Add the first one and it appears on the public calendar.</p>
            </Surface>
          )}
        </Container>
      </Section>
    </>
  )
}
