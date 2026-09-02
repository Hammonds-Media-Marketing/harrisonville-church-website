'use client'

import { useActionState } from 'react'
import { Button } from '@/components/primitives/Button'
import { FieldShell, TextField } from '@/components/primitives/Field'
import { Notice } from '@/components/primitives/Feedback'
import { requestPasswordResetAction, updatePasswordAction } from '@/app/members/actions'

const initial = { error: '', success: '' }

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, initial)
  if (state.success) return <Notice tone="success">{state.success}</Notice>
  return (
    <form action={action} className="flex flex-col gap-5">
      <FieldShell id="forgot-email" label="Email" required>
        <TextField id="forgot-email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
      </FieldShell>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      <Button type="submit" variant="primary" loading={pending}>
        Email me a reset link
      </Button>
    </form>
  )
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, initial)
  if (state.success) {
    return (
      <div className="flex flex-col gap-4">
        <Notice tone="success">{state.success}</Notice>
        <Button href="/members" variant="primary">
          Go to the members area
        </Button>
      </div>
    )
  }
  return (
    <form action={action} className="flex flex-col gap-5">
      <FieldShell id="reset-password" label="New password" required helper="At least 8 characters.">
        <TextField id="reset-password" name="password" type="password" required minLength={8} autoComplete="new-password" />
      </FieldShell>
      <FieldShell id="reset-confirm" label="Type it again" required>
        <TextField id="reset-confirm" name="confirm_password" type="password" required minLength={8} autoComplete="new-password" />
      </FieldShell>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      <Button type="submit" variant="primary" loading={pending}>
        Save new password
      </Button>
    </form>
  )
}
