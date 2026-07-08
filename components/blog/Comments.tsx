'use client'

import { useActionState } from 'react'
import { FieldShell, TextArea, TextField } from '@/components/primitives/Field'
import { Button } from '@/components/primitives/Button'
import { formatDate } from '@/lib/format'
import { submitComment, type CommentState } from '@/app/blog/actions'
import type { PublicComment } from '@/lib/blog'

/**
 * Comment section, backed by the Supabase blog_comments table. Approved
 * comments are rendered server-side (passed in as `comments`); new submissions
 * post through a server action and are held for moderation before they appear.
 * No comments are fabricated — an empty thread shows an honest empty state.
 */
export function Comments({ slug, comments }: { slug: string; comments: PublicComment[] }) {
  const [state, formAction, pending] = useActionState<CommentState, FormData>(submitComment, {
    status: 'idle',
  })

  return (
    <section aria-labelledby="comments-heading" className="border-t border-border/50 pt-8">
      <h2 id="comments-heading" className="text-2xl">
        Join the conversation
      </h2>
      <p className="mt-1 text-muted">
        Comments are read and moderated before they appear, so the discussion stays kind and on topic.
      </p>

      {comments.length ? (
        <ul className="mt-5 flex flex-col gap-4">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg border border-border/60 bg-surface p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold text-heading">{c.authorName}</p>
                <time dateTime={c.createdAt} className="text-sm text-muted">
                  {formatDate(c.createdAt)}
                </time>
              </div>
              <p className="mt-2 text-ink">{c.body}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 rounded-lg border border-border/60 bg-surface p-5 text-muted">
          <p>No comments yet. Be the first to share a thought or a question.</p>
        </div>
      )}

      {state.status === 'success' ? (
        <div role="alert" className="mt-5 rounded-md border border-success/40 bg-success-surface px-4 py-3 text-ink">
          Thank you. Your comment has been received and will appear after it is reviewed.
        </div>
      ) : (
        <form action={formAction} aria-label="Leave a comment" className="mt-5 flex flex-col gap-4">
          <input type="hidden" name="slug" value={slug} />
          <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
          {state.status === 'error' && state.message ? (
            <div role="alert" className="rounded-md border border-error/40 bg-error-surface px-4 py-3 text-ink">
              {state.message}
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldShell id={`${slug}-c-name`} label="Name" required>
              <TextField id={`${slug}-c-name`} name="name" required autoComplete="name" />
            </FieldShell>
            <FieldShell id={`${slug}-c-email`} label="Email" required helper="Not published.">
              <TextField id={`${slug}-c-email`} name="email" type="email" required autoComplete="email" />
            </FieldShell>
          </div>
          <FieldShell id={`${slug}-c-body`} label="Comment" required>
            <TextArea id={`${slug}-c-body`} name="comment" required rows={4} placeholder="Share a thought or ask a question." />
          </FieldShell>
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? 'Posting…' : 'Post comment'}
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}
