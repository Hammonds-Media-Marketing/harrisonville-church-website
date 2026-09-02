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
import { deletePageAction } from '@/app/members/admin/actions'

export const metadata: Metadata = buildMetadata({
  title: 'Manage Pages',
  description: 'Build, edit, publish, and remove pages on the Harrisonville Church of Christ website.',
  path: '/members/admin/pages',
  ogTitle: 'Pages Administration',
  ogDescription: 'Build and manage website pages with the section builder.',
  noindex: true,
})

/**
 * The site's hand-built pages. These are designed in code with bespoke
 * components (the lighthouse hero, the map, the portrait clusters), so they
 * are listed here for a complete picture of the site but edited through a
 * code change by HMM rather than the section builder.
 */
const BUILT_IN_PAGES = [
  { title: 'Home', path: '/' },
  { title: 'About — Who We Are', path: '/about' },
  { title: 'What to Expect', path: '/about/what-to-expect' },
  { title: 'Leadership', path: '/about/leadership' },
  { title: 'Events Calendar', path: '/events' },
  { title: 'Resources', path: '/resources' },
  { title: 'Bible Study Course', path: '/resources/bible-study' },
  { title: 'Contact Us', path: '/contact' },
  { title: 'Privacy Policy', path: '/privacy-policy' },
  { title: 'Cookie Policy', path: '/cookie-policy' },
]

export default async function AdminPagesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; error?: string }>
}) {
  const supabase = await getSupabaseServer()
  const { data } = supabase ? await supabase.from('pages').select('*').order('slug') : { data: null }
  const pages = data ?? []
  const params = await searchParams

  return (
    <>
      <PageHero
        eyebrow="Site admin"
        title="Pages"
        lead="Pages built from sections: text, photos, card grids, questions and answers, and calls to action. Drafts stay hidden until published."
      />

      <Section tone="light">
        <Container className="max-w-4xl">
          <AdminNotices params={params} />
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <SectionHeading
              eyebrow="Page builder"
              title={`${pages.length} custom page${pages.length === 1 ? '' : 's'}`}
            />
            <Button href="/members/admin/pages/new" variant="primary" size="sm">
              Build a page
            </Button>
          </div>

          {pages.length ? (
            <ul className="flex list-none flex-col gap-4 p-0">
              {pages.map((p) => (
                <li key={p.id}>
                  <Surface tone="card" className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        {!p.published ? <Badge tone="sample">Draft</Badge> : <Badge tone="primary">Published</Badge>}
                        {p.sample ? <Badge tone="sample">Sample</Badge> : null}
                      </div>
                      <h3 className="text-lg">{p.title}</h3>
                      <p className="text-sm text-muted">
                        /{p.slug} · updated {formatDate(p.updated_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.published ? (
                        <Button href={`/${p.slug}`} variant="link" size="sm">
                          View
                        </Button>
                      ) : (
                        <Button href={`/members/admin/pages/${p.id}/preview`} variant="link" size="sm">
                          Preview
                        </Button>
                      )}
                      <Button href={`/members/admin/pages/${p.id}`} variant="ghost" size="sm">
                        Edit
                      </Button>
                      <form action={deletePageAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="slug" value={p.slug} />
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
              <p className="text-muted">
                No custom pages yet. Build the first one from sections — it stays a private draft until you
                publish it. The site&apos;s core pages are listed below and keep working either way.
              </p>
            </Surface>
          )}
        </Container>
      </Section>

      <Section tone="surface">
        <Container className="max-w-4xl">
          <SectionHeading
            eyebrow="Designed in code"
            title="Built-in pages"
            lead="The site's core pages, designed and maintained in code with their custom visuals. To change their content, send the wording to HMM — the builder above is for new pages."
          />
          <ul className="grid list-none gap-4 p-0 sm:grid-cols-2">
            {BUILT_IN_PAGES.map((p) => (
              <li key={p.path}>
                <Surface tone="card" className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg">{p.title}</h3>
                    <p className="m-0 text-sm text-muted">{p.path}</p>
                  </div>
                  <Button href={p.path} variant="link" size="sm">
                    View
                  </Button>
                </Surface>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
    </>
  )
}
