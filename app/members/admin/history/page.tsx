import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Container, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Badge } from '@/components/primitives/Badge'
import { Button } from '@/components/primitives/Button'
import { getSupabaseServer } from '@/lib/supabase-server'
import { getCopySpec } from '@/content/site-copy'
import { parseOverrides } from '@/lib/site-copy'
import { countElements, parsePageElements } from '@/lib/page-elements'
import { restoreRevisionAction } from '@/app/members/admin/actions'
import type { Json } from '@/lib/database.types'

export const metadata: Metadata = {
  title: { absolute: 'Version History | Site Admin' },
  description: 'Earlier versions of a website page, ready to restore.',
  robots: { index: false, follow: false },
}

const stamp = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

/** One line describing what a saved version held. */
function describe(entity: string, snapshot: Json): string {
  const snap = (snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot) ? snapshot : {}) as Record<string, unknown>
  if (entity === 'page') {
    const sections = Array.isArray(snap.sections) ? snap.sections.length : 0
    return `“${String(snap.title ?? '')}” with ${sections} section${sections === 1 ? '' : 's'}${snap.published ? ', published' : ', draft'}`
  }
  const lines = Object.keys(parseOverrides(snap.values)).length
  const added = countElements(parsePageElements(snap.elements ?? {}))
  if (!lines && !added) return 'The original wording, with nothing added'
  return [lines ? `${lines} line${lines === 1 ? '' : 's'} reworded` : '', added ? `${added} element${added === 1 ? '' : 's'} added` : '']
    .filter(Boolean)
    .join(', ')
}

/**
 * Version history for one page: a page built in the page builder (?page=id)
 * or a hand-built page edited in the visual editor (?path=/about). Every
 * save keeps the version it replaced (see the content_revisions migration),
 * and any of them can be put back.
 */
export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; path?: string; restored?: string; error?: string }>
}) {
  const params = await searchParams
  const supabase = await getSupabaseServer()
  if (!supabase) notFound()

  const entity = params.page ? 'page' : 'page_content'
  const key = params.page ?? params.path ?? ''
  if (!key) notFound()

  let name = key
  let editHref = '/members/admin'
  if (entity === 'page') {
    const { data } = await supabase.from('pages').select('title, slug').eq('id', key).maybeSingle()
    name = data?.title ?? 'A deleted page'
    editHref = `/members/admin/pages/${key}`
  } else {
    const spec = getCopySpec(key)
    if (!spec) notFound()
    name = spec.name
    editHref = `/members/admin/editor${key === '/' ? '/home' : key}`
  }

  const { data: revisions, error } = await supabase
    .from('content_revisions')
    .select('id, snapshot, replaced_by, created_at')
    .eq('entity', entity)
    .eq('entity_key', key)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(30)

  const editorIds = Array.from(new Set((revisions ?? []).map((r) => r.replaced_by).filter((v): v is string => Boolean(v))))
  const { data: people } = editorIds.length
    ? await supabase.from('member_profiles').select('id, full_name, email').in('id', editorIds)
    : { data: [] }
  const who = new Map((people ?? []).map((p) => [p.id, p.full_name || p.email]))

  return (
    <>
      <PageHero
        eyebrow="Site admin"
        title={`Version history: ${name}`}
        lead="Every time someone saves this page, the version it replaced is kept here. Restoring one puts the page back the way it was; the version you replace is kept too, so a restore can be undone the same way."
      >
        <Button href={editHref} variant="ghost" size="sm">
          Back to the editor
        </Button>
      </PageHero>

      <Section tone="light">
        <Container className="max-w-3xl">
          {params.restored ? (
            <p role="status" className="mb-5 font-semibold text-primary-strong">
              Restored. The page is live with that version.
            </p>
          ) : params.error ? (
            <p role="alert" className="mb-5 font-semibold text-error">
              {params.error === 'gone'
                ? 'That page no longer exists, so the version cannot be restored onto it.'
                : 'That did not restore. Check your connection and try again.'}
            </p>
          ) : null}

          {error ? (
            <p role="alert" className="font-semibold text-error">
              The version history is not available yet. Ask the site administrator to apply the latest database update.
            </p>
          ) : revisions?.length ? (
            <ol className="flex list-none flex-col gap-3 p-0">
              {revisions.map((r, index) => {
                const snap = (r.snapshot ?? {}) as Record<string, unknown>
                const savedAt = typeof snap.updated_at === 'string' ? snap.updated_at : null
                return (
                  <li key={r.id}>
                    <Surface tone="card" className="flex flex-wrap items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          {index === 0 ? <Badge tone="primary">Most recent</Badge> : null}
                          <h2 className="m-0 font-body text-base font-semibold text-heading">
                            {savedAt ? `Saved ${stamp(savedAt)}` : 'Earlier version'}
                          </h2>
                        </div>
                        <p className="m-0 text-sm text-ink">{describe(entity, r.snapshot)}</p>
                        <p className="m-0 mt-1 text-sm text-muted">
                          Replaced {stamp(r.created_at)}
                          {r.replaced_by && who.get(r.replaced_by) ? ` by ${who.get(r.replaced_by)}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {entity === 'page' ? (
                          <Button href={`/members/admin/history/${r.id}`} variant="link" size="sm">
                            Preview
                          </Button>
                        ) : null}
                        <form action={restoreRevisionAction}>
                          <input type="hidden" name="id" value={r.id} />
                          <Button type="submit" variant="secondary" size="sm">
                            Restore this version
                          </Button>
                        </form>
                      </div>
                    </Surface>
                  </li>
                )
              })}
            </ol>
          ) : (
            <p className="rounded-lg border border-border/60 bg-surface p-6 text-muted">
              No earlier versions yet. The first one appears the next time this page is saved.
            </p>
          )}
        </Container>
      </Section>
    </>
  )
}
