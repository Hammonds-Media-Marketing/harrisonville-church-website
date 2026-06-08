# Provider swap guide

Only `handleSubmit` and the endpoint env var change between providers. The form structure (uncontrolled inputs, hidden fields, honeypot, FormData submit, status state) is identical.

## Formspree (default)

Easiest. No backend. Honeypot built in via `_gotcha` field name.

```ts
const FORM_ENDPOINT =
  process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT || 'https://formspree.io/f/<form-id>'

const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault()
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
```

Per-client setup: create a Formspree form, set `NEXT_PUBLIC_FORMSPREE_ENDPOINT` to the form URL.

## Resend (own backend, your domain)

When you want submissions to send from your own verified domain instead of Formspree's. Requires a Next.js API route.

**Form's submit handler:**
```ts
const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  setStatus('submitting')
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      body: new FormData(e.currentTarget),
    })
    setStatus(res.ok ? 'success' : 'error')
    if (res.ok) formRef.current?.reset()
  } catch {
    setStatus('error')
  }
}
```

**API route** (`src/app/api/contact/route.ts`):
```ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const data = await req.formData()

  // Honeypot — drop bot submissions silently.
  if (data.get('_gotcha')) return Response.json({ ok: true })

  const fields: Record<string, string> = {}
  data.forEach((value, key) => {
    if (typeof value === 'string') fields[key] = value
  })

  const lines = Object.entries(fields)
    .filter(([k]) => k !== '_gotcha')
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  await resend.emails.send({
    from: 'website@yourdomain.com',
    to: process.env.LEAD_INBOX!,
    replyTo: fields.email || undefined,
    subject: `New contact: ${fields.firstName || ''} ${fields.lastName || ''}`.trim(),
    text: lines,
  })

  return Response.json({ ok: true })
}
```

Per-client setup: Resend account + verified domain (one-time), `RESEND_API_KEY` and `LEAD_INBOX` in env.

## SendGrid

Same shape as Resend, different SDK. Replace the Resend import + send call. Worth picking only if the agency already has SendGrid relationships.

## Self-hosted gateway

The "agency forms gateway" pattern: one Next.js project on `forms.<agency>.com/api/submit` that all client sites POST to with a `clientSlug`. The gateway routes to per-client destinations (email, Slack, Airtable, CRM).

**Form's submit handler:**
```ts
const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  setStatus('submitting')
  const data = new FormData(e.currentTarget)
  data.set('clientSlug', '<this-client-slug>')
  try {
    const res = await fetch('https://forms.<agency>.com/api/submit', {
      method: 'POST',
      body: data,
    })
    setStatus(res.ok ? 'success' : 'error')
    if (res.ok) formRef.current?.reset()
  } catch {
    setStatus('error')
  }
}
```

**Gateway** is a separate Next.js project not covered by this skill. Pattern outline:
- API route reads `clientSlug`, looks up routing config (per-client email, Slack webhook, Airtable base ID)
- Drops honeypot submissions silently
- Forwards to whichever destinations the client is configured for
- Returns `{ ok: true }` on success
- Logs every submission to a single Airtable base for audit + searchability

The gateway becomes the agency's SLA — if it's down, every client form is down. Mitigate by making the route stateless on the hot path (don't await the audit log write; fire-and-forget) and pinning to a stable host.

## Per-client deployment matrix

| Provider | Per-client account? | Per-client domain verify? | Per-client deploy config |
|---|---|---|---|
| Formspree | Yes (one form per client) | No | `NEXT_PUBLIC_FORMSPREE_ENDPOINT` |
| Resend (one agency account, multi-domain) | No | Yes (verify each client domain in your Resend account) | `RESEND_API_KEY`, `LEAD_INBOX` |
| Self-hosted gateway | No | No | Just the `clientSlug` in code |

Default to Formspree until the per-client account count starts hurting (~10+ clients), then graduate to a self-hosted gateway. Resend sits in between as "your domain, but you maintain an API route".
