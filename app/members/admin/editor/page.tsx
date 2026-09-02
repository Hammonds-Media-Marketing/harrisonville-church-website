import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { Container, Section, SectionHeading } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Badge } from '@/components/primitives/Badge'
import { Button } from '@/components/primitives/Button'
import { getSupabaseServer } from '@/lib/supabase-server'
import { SITE_COPY } from '@/content/site-copy'
import { copyFields, parseOverrides } from '@/lib/site-copy'

export const metadata: Metadata = buildMetadata({
  title: 'Edit Pages Visually',
  description:
    'Open any page of the Harrisonville Church of Christ website and rewrite its words and photographs directly on the page.',
  path: '/members/admin/editor',
  ogTitle: 'Visual Page Editor',
  ogDescription: 'Rewrite the words and photographs on any page of the site, seeing the result as you type.',
  noindex: true,
})

const editorPath = (path: string) => `/members/admin/editor${path === '/' ? '/home' : path}`

export default async function EditorIndexPage() {
  const supabase = await getSupabaseServer()
  const { data } = supabase ? await supabase.from('page_content').select('path, values, updated_at') : { data: null }

  const edits = new Map(
    (data ?? []).map((row) => [row.path, Object.keys(parseOverrides(row.values)).length])
  )

  return (
    <>
      <PageHero
        eyebrow="Site admin"
        title="Edit pages visually"
        lead="Open a page, click any words on it, and rewrite them in place. Photographs, buttons, and the wording search engines show can be changed the same way."
      />

      <Section tone="light">
        <Container className="max-w-4xl">
          <SectionHeading
            eyebrow="The site's core pages"
            title={`${SITE_COPY.length} pages you can edit`}
            lead="These pages are designed in code, so their layout and custom visuals stay intact. Everything a visitor reads on them is yours to change."
          />
          <ul className="flex list-none flex-col gap-4 p-0">
            {SITE_COPY.map((spec) => {
              const changed = edits.get(spec.path) ?? 0
              return (
                <li key={spec.path}>
                  <Surface tone="card" className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        {changed ? (
                          <Badge tone="primary">{changed} edited</Badge>
                        ) : (
                          <Badge tone="sample">Original wording</Badge>
                        )}
                      </div>
                      <h3 className="text-lg">{spec.name}</h3>
                      <p className="m-0 text-sm text-muted">
                        {spec.path} · {copyFields(spec).length} editable items
                      </p>
                      <p className="m-0 mt-1 text-sm text-muted">{spec.summary}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button href={spec.path} variant="link" size="sm">
                        View
                      </Button>
                      <Button href={editorPath(spec.path)} variant="secondary" size="sm">
                        Edit
                      </Button>
                    </div>
                  </Surface>
                </li>
              )
            })}
          </ul>
        </Container>
      </Section>

      <Section tone="surface">
        <Container className="max-w-4xl">
          <SectionHeading
            eyebrow="Built from sections"
            title="Pages you build yourself"
            lead="Pages created in the section builder are edited there, where you can add, reorder, and remove whole sections."
          />
          <Button href="/members/admin/pages" variant="ghost" size="sm">
            Open the page builder
          </Button>
        </Container>
      </Section>
    </>
  )
}
