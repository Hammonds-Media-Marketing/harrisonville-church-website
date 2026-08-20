'use client'

import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/primitives/Button'
import { FieldShell, TextField } from '@/components/primitives/Field'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

type Mode = 'sign-in' | 'request-access'

/**
 * Members sign-in / access-request form. Sign-in sets the session cookie and
 * hands off to the server; a new account lands unapproved until an admin
 * approves it, so requesting access exposes nothing by itself.
 */
export function LoginForm() {
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<Mode>('sign-in')
  const [error, setError] = useState<string | null>(
    searchParams.get('error') === 'confirm'
      ? 'That confirmation link is invalid or expired. Try signing in, or request access again.'
      : null
  )
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setNotice(null)

    const supabase = getSupabaseBrowser()
    if (!supabase) {
      setError('The members area is not connected yet. Please check back soon.')
      return
    }

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')
    setBusy(true)

    if (mode === 'sign-in') {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      setBusy(false)
      if (signInError) {
        setError('That email and password combination did not work. Please try again.')
        return
      }
      const next = searchParams.get('next')
      window.location.assign(next && next.startsWith('/members') ? next : '/members')
      return
    }

    const fullName = String(form.get('full_name') ?? '').trim()
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/members/auth/confirm`,
      },
    })
    setBusy(false)
    if (signUpError) {
      setError('We could not create the account. Please try again or contact the church office.')
      return
    }
    setNotice(
      'Check your email for a confirmation link. After you confirm, a church admin will approve your access.'
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate={false} className="flex flex-col gap-5">
      <div role="group" aria-label="Sign in or request access" className="flex gap-2">
        <Button
          type="button"
          variant={mode === 'sign-in' ? 'secondary' : 'ghost'}
          size="sm"
          aria-pressed={mode === 'sign-in'}
          onClick={() => setMode('sign-in')}
        >
          Sign in
        </Button>
        <Button
          type="button"
          variant={mode === 'request-access' ? 'secondary' : 'ghost'}
          size="sm"
          aria-pressed={mode === 'request-access'}
          onClick={() => setMode('request-access')}
        >
          Request access
        </Button>
      </div>

      {mode === 'request-access' ? (
        <FieldShell id="login-name" label="Full name" required>
          <TextField id="login-name" name="full_name" required autoComplete="name" placeholder="Jane Smith" />
        </FieldShell>
      ) : null}

      <FieldShell id="login-email" label="Email" required>
        <TextField id="login-email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
      </FieldShell>

      <FieldShell
        id="login-password"
        label="Password"
        required
        helper={mode === 'request-access' ? 'At least 8 characters.' : undefined}
      >
        <TextField
          id="login-password"
          name="password"
          type="password"
          required
          minLength={mode === 'request-access' ? 8 : undefined}
          autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
        />
      </FieldShell>

      {error ? (
        <p role="alert" className="font-semibold text-error">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="font-semibold text-primary-strong">
          {notice}
        </p>
      ) : null}

      <Button type="submit" variant="primary" loading={busy}>
        {mode === 'sign-in' ? 'Sign in to the members area' : 'Request member access'}
      </Button>
    </form>
  )
}
