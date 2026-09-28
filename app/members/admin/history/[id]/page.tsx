import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Container } from '@/components/primitives/Layout'
import { Badge } from '@/components/primitives/Badge'
import { Button } from '@/components/primitives/Button'
import { PageHero } from '@/components/blocks/PageHero'
import { PageRenderer, heroWaveFill } from '@/components/pages/PageRenderer'
import { getSupabaseServer } from '@/lib/supabase-server'
import { mapPageRow } from '@/lib/pages'
import { restoreRevisionAction } from '@/app/members/admin/actions'
import type { Database } from '@/lib/database.types'

export const metadata: Metadata = {
  title: { absolute: 'Earlier Version | Site Admin' },
  description: 'Preview an earlier version of a built page before restoring it.',
  robots: { index: false, follow: false },
}

/** An earlier version of a built page, rendered exactly as it looked. */
export default async function RevisionPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await getSupabaseServer()
  if (!supabase) notFound()

  const { data: revision } = await supabase.from('content_revisions').select('*').eq('id', Number(id)).maybeSingle()
  if (!revision || revision.entity !== 'page') notFound()

  const page = mapPageRow(revision.snapshot as unknown as Database['public']['Tables']['pages']['Row'])

  return (
    <>
      <div className="border-b border-border bg-surface">
        <Container className="flex flex-wrap items-center gap-3 py-3">
          <Badge tone="sample">Earlier version</Badge>
          <p className="m-0 min-w-0 flex-1 truncate text-sm text-muted">
            How /{page.slug} looked before the save on{' '}
            {new Date(revision.created_at).toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'medium', timeStyle: 'short' })}.
          </p>
          <form action={restoreRevisionAction}>
            <input type="hidden" name="id" value={revision.id} />
            <Button type="submit" variant="secondary" size="sm">
              Restore this version
            </Button>
          </form>
          <Button href={`/members/admin/history?page=${revision.entity_key}`} variant="ghost" size="sm">
            Back to the history
          </Button>
        </Container>
      </div>

      <PageHero eyebrow={page.heroEyebrow} title={page.title} lead={page.heroLead} waveFill={heroWaveFill(page.sections)} />
      <PageRenderer sections={page.sections} />
    </>
  )
}
