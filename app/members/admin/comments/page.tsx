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
import { deleteCommentAction, setCommentApprovedAction } from '@/app/members/admin/actions'

export const metadata: Metadata = buildMetadata({
  title: 'Moderate Comments',
  description: 'Review, approve, and remove visitor comments on Harrisonville Church of Christ articles.',
  path: '/members/admin/comments',
  ogTitle: 'Comment Moderation',
  ogDescription: 'Approve or remove visitor comments.',
  noindex: true,
})

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; error?: string }>
}) {
  const supabase = await getSupabaseServer()
  const { data } = supabase ? await supabase.rpc('moderation_comments') : { data: null }
  const comments = data ?? []
  const pending = comments.filter((c) => !c.approved).length
  const params = await searchParams

  return (
    <>
      <PageHero
        eyebrow="Site admin"
        title="Comment moderation"
        lead="Visitor comments stay hidden until approved here. Email addresses are visible to editors only and never publish."
      />

      <Section tone="light">
        <Container className="max-w-4xl">
          <AdminNotices params={params} />
          <SectionHeading
            eyebrow="Blog"
            title={`${comments.length} comment${comments.length === 1 ? '' : 's'}`}
            lead={pending ? `${pending} awaiting review.` : 'Nothing is waiting for review.'}
          />

          {comments.length ? (
            <ul className="flex list-none flex-col gap-4 p-0">
              {comments.map((c) => (
                <li key={c.id}>
                  <Surface tone="card" as="article">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {c.approved ? <Badge tone="primary">Approved</Badge> : <Badge tone="sample">Awaiting review</Badge>}
                      <span className="text-sm text-muted">
                        On <span className="font-semibold">{c.post_slug}</span> · {formatDate(c.created_at)}
                      </span>
                    </div>
                    <p className="mb-1 font-semibold text-heading">
                      {c.author_name} <span className="font-normal text-muted">&lt;{c.author_email}&gt;</span>
                    </p>
                    <p className="mb-4 whitespace-pre-line text-ink">{c.body}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={setCommentApprovedAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="post_slug" value={c.post_slug} />
                        {c.approved ? null : <input type="hidden" name="approve" value="on" />}
                        <Button type="submit" variant={c.approved ? 'ghost' : 'secondary'} size="sm">
                          {c.approved ? 'Unapprove' : 'Approve'}
                        </Button>
                      </form>
                      <form action={deleteCommentAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="post_slug" value={c.post_slug} />
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
              <p className="text-muted">No comments yet. New ones land here for review before they publish.</p>
            </Surface>
          )}
        </Container>
      </Section>
    </>
  )
}
