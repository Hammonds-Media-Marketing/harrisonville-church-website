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
import { deleteSermonAction } from '@/app/members/admin/actions'

export const metadata: Metadata = buildMetadata({
  title: 'Manage Sermons',
  description: 'Add, edit, publish, and remove sermons in the Harrisonville Church of Christ video library.',
  path: '/members/admin/sermons',
  ogTitle: 'Sermons Administration',
  ogDescription: 'Manage the public sermon library.',
  noindex: true,
})

export default async function AdminSermonsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; error?: string }>
}) {
  const supabase = await getSupabaseServer()
  const { data } = supabase
    ? await supabase.from('sermons').select('*').order('date', { ascending: false })
    : { data: null }
  const sermons = data ?? []
  const params = await searchParams

  return (
    <>
      <PageHero
        eyebrow="Site admin"
        title="Sermons"
        lead="The public sermon and video library. The newest published sermon becomes the featured lesson."
      />

      <Section tone="light">
        <Container className="max-w-4xl">
          <AdminNotices params={params} />
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <SectionHeading eyebrow="Library" title={`${sermons.length} sermon${sermons.length === 1 ? '' : 's'}`} />
            <Button href="/members/admin/sermons/new" variant="primary" size="sm">
              Add a sermon
            </Button>
          </div>

          {sermons.length ? (
            <ul className="flex list-none flex-col gap-4 p-0">
              {sermons.map((s) => (
                <li key={s.id}>
                  <Surface tone="card" className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        {s.series ? <Badge tone="neutral">{s.series}</Badge> : null}
                        {!s.published ? <Badge tone="sample">Draft</Badge> : null}
                        {s.sample ? <Badge tone="sample">Sample</Badge> : null}
                      </div>
                      <h3 className="text-lg">{s.title}</h3>
                      <p className="text-sm text-muted">
                        {s.speaker} &middot; {formatDate(s.date)} &middot; {s.scripture}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button href={`/members/admin/sermons/${s.id}`} variant="ghost" size="sm">
                        Edit
                      </Button>
                      <form action={deleteSermonAction}>
                        <input type="hidden" name="id" value={s.id} />
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
              <p className="text-muted">No sermons yet. Add the first one and it appears in the public library.</p>
            </Surface>
          )}
        </Container>
      </Section>
    </>
  )
}
