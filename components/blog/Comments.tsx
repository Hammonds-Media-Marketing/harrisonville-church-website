'use client'

import { useState, type FormEvent } from 'react'
import { FieldShell, TextArea, TextField } from '@/components/primitives/Field'
import { Button } from '@/components/primitives/Button'

/**
 * Comment section. A moderated comment backend (the future Supabase table) is
 * not connected yet, so this renders an honest empty state plus a working-shaped
 * form that explains submissions are reviewed before posting. No invented
 * comments are shown.
 */
export function Comments({ slug }: { slug: string }) {
  const [submitted, setSubmitted] = useState(false)

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Backend pending — acknowledge locally without fabricating a posted comment.
    setSubmitted(true)
  }

  return (
    <section aria-labelledby="comments-heading" className="border-t border-border/50 pt-8">
      <h2 id="comments-heading" className="text-2xl">
        Join the conversation
      </h2>
      <p className="mt-1 text-muted">
        Comments are read and moderated before they appear, so the discussion stays kind and on topic.
      </p>

      <div className="mt-5 rounded-lg border border-border/60 bg-surface p-5 text-muted">
        <p>No comments yet. Be the first to share a thought or a question.</p>
      </div>

      {submitted ? (
        <div role="alert" className="mt-5 rounded-md border border-success/40 bg-success-surface px-4 py-3 text-ink">
          Thank you. Your comment has been received and will appear after it is reviewed.
        </div>
      ) : (
        <form onSubmit={onSubmit} aria-label="Leave a comment" className="mt-5 flex flex-col gap-4" data-post={slug}>
          <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
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
            <Button type="submit">Post comment</Button>
          </div>
        </form>
      )}
    </section>
  )
}
