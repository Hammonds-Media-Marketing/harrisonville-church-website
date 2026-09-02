import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Container } from '@/components/primitives/Layout'
import { Badge } from '@/components/primitives/Badge'
import { Button } from '@/components/primitives/Button'
import { PageHero } from '@/components/blocks/PageHero'
import { PageRenderer, heroWaveFill } from '@/components/pages/PageRenderer'
import { getSupabaseServer } from '@/lib/supabase-server'
import { mapPageRow } from '@/lib/pages'

export const metadata: Metadata = {
  title: { absolute: 'Page Preview | Site Admin' },
  description: 'Preview a draft page exactly as visitors will see it.',
  robots: { index: false, follow: false },
}

/**
 * Draft preview: renders the stored page through the same PageRenderer the
 * public route uses, under the editor's session — so an unpublished draft is
 * viewable here and nowhere else. Reachable only through the admin layout's
 * editor gate.
 */
export default async function PagePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await getSupabaseServer()
  if (!supabase) notFound()

  const { data } = await supabase.from('pages').select('*').eq('id', id).maybeSingle()
  if (!data) notFound()
  const page = mapPageRow(data)

  return (
    <>
      <div className="border-b border-border bg-surface">
        <Container className="flex flex-wrap items-center gap-3 py-3">
          <Badge tone={page.published ? 'primary' : 'sample'}>{page.published ? 'Published' : 'Draft preview'}</Badge>
          <p className="m-0 min-w-0 flex-1 truncate text-sm text-muted">
            Shown exactly as visitors will see it at /{page.slug}.
          </p>
          <Button href={`/members/admin/pages/${page.id}`} variant="ghost" size="sm">
            Back to the editor
          </Button>
        </Container>
      </div>

      <PageHero eyebrow={page.heroEyebrow} title={page.title} lead={page.heroLead} waveFill={heroWaveFill(page.sections)} />
      <PageRenderer sections={page.sections} />
    </>
  )
}
