import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { formatDate } from '@/lib/format'
import { Container, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Badge } from '@/components/primitives/Badge'
import { Button } from '@/components/primitives/Button'
import { AdminNotices } from '@/components/members/AdminNotices'
import { getSupabaseServer } from '@/lib/supabase-server'
import { deletePageAction } from '@/app/members/admin/actions'
import { SITE_COPY } from '@/content/site-copy'
import { parseOverrides } from '@/lib/site-copy'
import { countElements, parsePageElements } from '@/lib/page-elements'

export const metadata: Metadata = buildMetadata({
  title: 'Manage Pages',
  description: 'Edit, build, publish, and remove pages on the Harrisonville Church of Christ website.',
  path: '/members/admin/pages',
  ogTitle: 'Pages Administration',
  ogDescription: 'Every page of the website in one place, ready to edit.',
  noindex: true,
})

/** One row in the combined list, whichever editor the page opens in. */
type Row = {
  key: string
  name: string
  path: string
  kind: 'designed' | 'built'
  status: 'published' | 'draft'
  note: string
  editHref: string
  viewHref: string
  historyHref: string
  /** Built pages only: what the delete form needs. */
  deletable?: { id: string; slug: string }
}

const editorPath = (path: string) => `/members/admin/editor${path === '/' ? '/home' : path}`

/**
 * Every page of the website in one list. The site's designed pages open in
 * the visual editor (their layout is fixed in code; words, photos, and added
 * sections are editable) and pages made here open in the page builder (every
 * section can be added, moved, or removed). Editors pick a page and the right
 * editor opens; they never have to know there are two.
 */
export default async function AdminPagesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; error?: string }>
}) {
  const supabase = await getSupabaseServer()
  const [{ data: built }, { data: edits }] = supabase
    ? await Promise.all([
        supabase.from('pages').select('id, slug, title, published, updated_at').order('slug'),
        supabase.from('page_content').select('path, values, elements, updated_at'),
      ])
    : [{ data: null }, { data: null }]
  const params = await searchParams

  const editsByPath = new Map((edits ?? []).map((e) => [e.path, e]))

  const rows: Row[] = [
    ...SITE_COPY.map((spec): Row => {
      const edit = editsByPath.get(spec.path)
      const lines = edit ? Object.keys(parseOverrides(edit.values)).length : 0
      const added = edit ? countElements(parsePageElements(edit.elements)) : 0
      const changes = [lines ? `${lines} line${lines === 1 ? '' : 's'} reworded` : '', added ? `${added} element${added === 1 ? '' : 's'} added` : '']
        .filter(Boolean)
        .join(', ')
      return {
        key: `designed:${spec.path}`,
        name: spec.name,
        path: spec.path,
        kind: 'designed',
        status: 'published',
        note: changes ? `${changes} · updated ${formatDate(edit!.updated_at)}` : 'Original wording',
        editHref: editorPath(spec.path),
        viewHref: spec.path,
        historyHref: `/members/admin/history?path=${encodeURIComponent(spec.path)}`,
      }
    }),
    ...(built ?? []).map((p): Row => ({
      key: `built:${p.id}`,
      name: p.title,
      path: `/${p.slug}`,
      kind: 'built',
      status: p.published ? 'published' : 'draft',
      note: `Updated ${formatDate(p.updated_at)}`,
      editHref: `/members/admin/pages/${p.id}`,
      viewHref: p.published ? `/${p.slug}` : `/members/admin/pages/${p.id}/preview`,
      historyHref: `/members/admin/history?page=${p.id}`,
      deletable: { id: p.id, slug: p.slug },
    })),
  ].sort((a, b) => (a.path === '/' ? -1 : b.path === '/' ? 1 : a.path.localeCompare(b.path)))

  return (
    <>
      <PageHero
        eyebrow="Site admin"
        title="Pages"
        lead="Every page of the website in one place. Open any page to edit it on a live preview, or start a new one. Drafts stay hidden until you publish them."
      >
        <div>
          <Button href="/members/admin/pages/new" variant="primary">
            New page
          </Button>
        </div>
      </PageHero>

      <Section tone="light">
        <Container className="max-w-4xl">
          <AdminNotices params={params} />
          <p className="mb-5 text-sm text-muted">
            <Badge tone="neutral">Designed</Badge> pages have a layout set by the site&apos;s design: their words and photos
            can be changed and new sections added between their bands.{' '}
            <Badge tone="gold">Custom</Badge> pages are built here, section by section, and every part can be moved or removed.
          </p>

          <ul className="flex list-none flex-col gap-3 p-0">
            {rows.map((row) => (
              <li key={row.key}>
                <Surface tone="card" className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      {row.kind === 'designed' ? <Badge tone="neutral">Designed</Badge> : <Badge tone="gold">Custom</Badge>}
                      {row.status === 'draft' ? <Badge tone="sample">Draft</Badge> : null}
                    </div>
                    <h2 className="m-0 font-body text-lg font-semibold text-heading">{row.name}</h2>
                    <p className="m-0 text-sm text-muted">
                      {row.path} · {row.note}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button href={row.viewHref} variant="link" size="sm">
                      {row.status === 'draft' ? 'Preview' : 'View'}
                    </Button>
                    <Button href={row.historyHref} variant="link" size="sm">
                      History
                    </Button>
                    <Button href={row.editHref} variant="secondary" size="sm">
                      Edit
                    </Button>
                    {row.deletable ? (
                      <form action={deletePageAction}>
                        <input type="hidden" name="id" value={row.deletable.id} />
                        <input type="hidden" name="slug" value={row.deletable.slug} />
                        <Button type="submit" variant="ghost" size="sm" aria-label={`Delete ${row.name}`}>
                          Delete
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </Surface>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
    </>
  )
}
