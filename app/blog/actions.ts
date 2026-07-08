'use server'

import { getSupabase } from '@/lib/supabase'

/**
 * Server action for visitor comments. Inserts through the public anon key,
 * which Row Level Security forces to land unapproved (approved = false) for
 * moderation — no comment appears until a church admin approves it in Supabase.
 * A hidden honeypot field silently absorbs bot submissions.
 */
export type CommentState = {
  status: 'idle' | 'success' | 'error'
  message?: string
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export async function submitComment(_prev: CommentState, formData: FormData): Promise<CommentState> {
  // Honeypot: a real user never fills this. Pretend success so bots learn nothing.
  if (String(formData.get('_gotcha') || '').trim()) {
    return { status: 'success' }
  }

  const slug = String(formData.get('slug') || '').trim()
  const name = String(formData.get('name') || '').trim()
  const email = String(formData.get('email') || '').trim()
  const body = String(formData.get('comment') || '').trim()

  if (!slug || !name || !email || !body) {
    return { status: 'error', message: 'Please complete every field before posting.' }
  }
  if (name.length > 120) {
    return { status: 'error', message: 'Please shorten your name.' }
  }
  if (!EMAIL.test(email)) {
    return { status: 'error', message: 'Please enter a valid email address.' }
  }
  if (body.length > 4000) {
    return { status: 'error', message: 'Please shorten your comment.' }
  }

  const supabase = getSupabase()
  if (!supabase) {
    return { status: 'error', message: 'Comments are temporarily unavailable. Please try again later.' }
  }

  const { error } = await supabase.from('blog_comments').insert({
    post_slug: slug,
    author_name: name,
    author_email: email,
    body,
  })

  if (error) {
    console.warn('[blog] comment insert failed:', error.message)
    return { status: 'error', message: 'Something went wrong while posting your comment. Please try again.' }
  }

  return { status: 'success' }
}
