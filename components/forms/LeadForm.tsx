'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { FieldShell, SelectField, TextArea, TextField } from '@/components/primitives/Field'
import { Button } from '@/components/primitives/Button'
import { CheckIcon } from '@/components/ui/icons'

/**
 * One configurable form, reused for the General Contact, Prayer Request, and
 * Bible Study Request forms. Wiring follows the HMM form-building skill:
 * honeypot, eight hidden last-touch attribution fields populated on idle,
 * uncontrolled inputs read via FormData, and a Formspree AJAX submit. The
 * endpoint falls back gracefully; with none set, submit shows the phone path.
 */

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

export type FormField =
  | { kind: 'text' | 'email' | 'tel'; name: string; label: string; required?: boolean; autoComplete?: string; helper?: string; placeholder?: string; full?: boolean }
  | { kind: 'textarea'; name: string; label: string; required?: boolean; helper?: string; placeholder?: string; rows?: number; full?: boolean }
  | { kind: 'select'; name: string; label: string; required?: boolean; options: string[]; helper?: string; full?: boolean }

const FORM_ENDPOINT = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT || ''

const TRACKING_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'msclkid'] as const

function readStoredAttribution(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem('hm_attribution')
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function LeadForm({
  formType,
  fields,
  submitLabel,
  successHeading,
  successBody,
  ariaLabel,
}: {
  formType: string
  fields: FormField[]
  submitLabel: string
  successHeading: string
  successBody: string
  ariaLabel: string
}) {
  const [status, setStatus] = useState<FormStatus>('idle')
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!formRef.current) return
    const populate = () => {
      const form = formRef.current
      if (!form) return
      const params = new URLSearchParams(window.location.search)
      const stored = readStoredAttribution()
      const externalReferrer =
        document.referrer && !document.referrer.startsWith(window.location.origin) ? document.referrer : ''
      const values: Record<string, string> = { original_referrer: externalReferrer || stored.original_referrer || '' }
      for (const field of TRACKING_FIELDS) values[field] = params.get(field) || stored[field] || ''
      for (const [name, value] of Object.entries(values)) {
        const input = form.querySelector<HTMLInputElement>(`input[name="${name}"]`)
        if (input) input.value = value
      }
    }
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback
    if (idle) idle(populate, { timeout: 1000 })
    else setTimeout(populate, 0)
  }, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!FORM_ENDPOINT) {
      // No endpoint configured yet ("Coming Soon") — fail gracefully to the
      // phone/email path rather than silently dropping the message.
      setStatus('error')
      return
    }
    setStatus('submitting')
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(e.currentTarget),
      })
      if (res.ok) {
        formRef.current?.reset()
        setStatus('success')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div role="alert" aria-live="polite" className="flex flex-col items-start gap-3 rounded-lg border border-success/40 bg-success-surface p-6">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-success text-on-status">
          <CheckIcon className="h-6 w-6" />
        </span>
        <h3 className="text-xl text-heading">{successHeading}</h3>
        <p className="text-ink">{successBody}</p>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} aria-label={ariaLabel} noValidate className="flex flex-col gap-5">
      {/* Honeypot — hidden from people, bots fill it; Formspree drops those. */}
      <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      {/* Identifies which form a submission came from. */}
      <input type="hidden" name="_form" value={formType} readOnly />
      <input type="hidden" name="_subject" value={`${ariaLabel} — harrisonvillecoc.com`} readOnly />

      {/* Hidden last-touch attribution fields (populated client-side on idle). */}
      <input type="hidden" name="utm_source" />
      <input type="hidden" name="utm_medium" />
      <input type="hidden" name="utm_campaign" />
      <input type="hidden" name="utm_content" />
      <input type="hidden" name="utm_term" />
      <input type="hidden" name="gclid" />
      <input type="hidden" name="msclkid" />
      <input type="hidden" name="original_referrer" />

      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((f) => {
          const id = `${formType}-${f.name}`
          const full = ('full' in f && f.full) || f.kind === 'textarea'
          return (
            <div key={f.name} className={full ? 'sm:col-span-2' : ''}>
              <FieldShell id={id} label={f.label} required={f.required} helper={'helper' in f ? f.helper : undefined}>
                {f.kind === 'textarea' ? (
                  <TextArea id={id} name={f.name} required={f.required} rows={f.rows} placeholder={f.placeholder} />
                ) : f.kind === 'select' ? (
                  <SelectField id={id} name={f.name} required={f.required} options={f.options} />
                ) : (
                  <TextField id={id} name={f.name} type={f.kind} required={f.required} autoComplete={f.autoComplete} placeholder={f.placeholder} />
                )}
              </FieldShell>
            </div>
          )
        })}
      </div>

      {status === 'error' ? (
        <p role="alert" aria-live="assertive" className="rounded-md border border-error/40 bg-error-surface px-4 py-3 text-error">
          {FORM_ENDPOINT
            ? 'Something went wrong sending your message. Please try again, or call (816) 326-1082.'
            : 'Online submissions are not connected yet. Please call (816) 326-1082 or email gospel@harrisonvillecoc.com and we will respond personally.'}
        </p>
      ) : null}

      <div>
        <Button type="submit" loading={status === 'submitting'} size="lg">
          {status === 'submitting' ? 'Sending…' : submitLabel}
        </Button>
      </div>
      <p className="text-sm text-muted">
        We will never share your information. A member of the congregation will read your message and reply to you
        personally.
      </p>
    </form>
  )
}
