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
import { deleteArticleAction } from '@/app/members/admin/actions'

export const metadata: Metadata = buildMetadata({
  title: 'Manage Articles',
  description: 'Write, edit, publish, and remove Bible study articles on the Harrisonville Church of Christ blog.',
  path: '/members/admin/articles',
  ogTitle: 'Articles Administration',
  ogDescription: 'Manage the public article library.',
  noindex: true,
})

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; error?: string }>
}) {
  const supabase = await getSupabaseServer()
  const { data } = supabase
    ? await supabase.from('blog_posts').select('id, slug, title, category, date_published, published, sample').order('date_published', { ascending: false })
    : { data: null }
  const posts = data ?? []
  const params = await searchParams

  return (
    <>
      <PageHero
        eyebrow="Site admin"
        title="Articles"
        lead="The Bible study articles on the public blog. Drafts stay hidden until published."
      />

      <Section tone="light">
        <Container className="max-w-4xl">
          <AdminNotices params={params} />
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <SectionHeading eyebrow="Blog" title={`${posts.length} article${posts.length === 1 ? '' : 's'}`} />
            <Button href="/members/admin/articles/new" variant="primary" size="sm">
              Write an article
            </Button>
          </div>

          {posts.length ? (
            <ul className="flex list-none flex-col gap-4 p-0">
              {posts.map((p) => (
                <li key={p.id}>
                  <Surface tone="card" className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <Badge tone="neutral">{p.category}</Badge>
                        {!p.published ? <Badge tone="sample">Draft</Badge> : null}
                        {p.sample ? <Badge tone="sample">Sample</Badge> : null}
                      </div>
                      <h3 className="text-lg">{p.title}</h3>
                      <p className="text-sm text-muted">{formatDate(p.date_published)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button href={`/members/admin/articles/${p.id}`} variant="ghost" size="sm">
                        Edit
                      </Button>
                      <form action={deleteArticleAction}>
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
              <p className="text-muted">No articles yet. Write the first one and it appears on the public blog.</p>
            </Surface>
          )}
        </Container>
      </Section>
    </>
  )
}
