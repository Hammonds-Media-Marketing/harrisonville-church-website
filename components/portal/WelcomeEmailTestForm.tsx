'use client'

import { useActionState } from 'react'
import { Button } from '@/components/primitives/Button'
import { FieldShell, TextField } from '@/components/primitives/Field'
import { Notice } from '@/components/primitives/Feedback'
import { sendTestWelcomeEmailAction } from '@/app/members/admin/portal-actions'

export function WelcomeEmailTestForm({ defaultEmail }: { defaultEmail: string }) {
  const [state, action, pending] = useActionState(sendTestWelcomeEmailAction, { message: '', ok: false })
  return (
    <form action={action} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex-1">
        <FieldShell id="test-email" label="Send a test to" helper="Five per ten minutes, to keep the sending reputation clean.">
          <TextField id="test-email" name="email" type="email" required defaultValue={defaultEmail} />
        </FieldShell>
      </div>
      <Button type="submit" variant="secondary" loading={pending}>
        Send test email
      </Button>
      {state.message ? (
        <div className="basis-full">
          <Notice tone={state.ok ? 'success' : 'error'}>{state.message}</Notice>
        </div>
      ) : null}
    </form>
  )
}
