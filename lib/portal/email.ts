import { SITE_URL, site } from '@/lib/site'

/**
 * Welcome email, sent once when an admin approves a member. Delivery goes
 * through Resend's REST API with a plain fetch, so no SDK is needed. When
 * RESEND_API_KEY is unset the send reports "not_configured" and approval
 * still succeeds; the admin sees that in the confirmation message.
 */

export type WelcomeEmailStatus = 'sent' | 'not_configured' | 'invalid_recipient' | 'rejected' | 'network_error'

export type WelcomeEmailResult = { status: WelcomeEmailStatus; messageId?: string }

export const TEST_EMAIL_LIMIT = { limit: 5, windowMs: 10 * 60 * 1000 }

const EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/

export function normalizeRecipientEmail(value: string | null | undefined): string | null {
  const email = String(value ?? '').trim().toLowerCase()
  if (!email || email.length > 254 || /[\r\n,;]/.test(email) || !EMAIL_PATTERN.test(email)) return null
  return email
}

export function welcomeEmailSubject(): string {
  return `Welcome to the ${site.name} members area`
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function displayName(profile: { full_name?: string | null; email?: string | null }): string {
  return (profile.full_name ?? '').trim() || (profile.email ?? '').trim() || 'Member'
}

/**
 * Table-based HTML so it renders the same in Outlook, Gmail, and Apple
 * Mail. Colors are the brand tokens written out as hex, because email
 * clients do not read CSS variables.
 */
export function renderWelcomeEmail(profile: { full_name?: string | null; email?: string | null }): { html: string; text: string } {
  const name = escapeHtml(displayName(profile))
  const membersUrl = `${SITE_URL}/members`
  const guideUrl = `${SITE_URL}/members/getting-started`
  const profileUrl = `${SITE_URL}/members/profile`
  const step = (n: string, title: string, body: string) => `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:12px;border:1px solid #c3d4dc;border-radius:12px;">
      <tr>
        <td style="width:44px;padding:16px 0 16px 16px;vertical-align:top;">
          <div style="height:30px;width:30px;border-radius:999px;background:#015f84;color:#ffffff;text-align:center;line-height:30px;font-weight:700;font-size:14px;">${n}</div>
        </td>
        <td style="padding:16px 16px 16px 10px;">
          <div style="font-size:15px;font-weight:700;color:#0a1f31;">${escapeHtml(title)}</div>
          <div style="margin-top:4px;font-size:14px;line-height:1.6;color:#4c5f70;">${escapeHtml(body)}</div>
        </td>
      </tr>
    </table>`

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(welcomeEmailSubject())}</title>
  </head>
  <body style="margin:0;background:#f1f6f9;font-family:Helvetica,Arial,sans-serif;color:#16293b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f6f9;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #c3d4dc;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:#0b2538;padding:28px;color:#eef5f9;">
                <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;font-weight:700;color:#ffcf5e;">${escapeHtml(site.name)}</div>
                <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;font-weight:600;color:#ffffff;">Welcome, ${name}</h1>
                <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#a7c3d4;">Your members area access has been approved.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0;font-size:16px;line-height:1.7;color:#16293b;">The members area is where the church family keeps up between assemblies: announcements, the directory, the calendar, group chat, and sign-ups for events and communion preparation.</p>
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0;">
                  <tr>
                    <td style="border-radius:999px;background:#ffcf5e;">
                      <a href="${membersUrl}" style="display:inline-block;padding:14px 22px;color:#281f04;text-decoration:none;font-size:15px;font-weight:700;">Open the members area</a>
                    </td>
                    <td style="width:12px;"></td>
                    <td style="border-radius:999px;border:1px solid #5d7280;background:#ffffff;">
                      <a href="${guideUrl}" style="display:inline-block;padding:13px 20px;color:#015f84;text-decoration:none;font-size:15px;font-weight:700;">Getting started</a>
                    </td>
                  </tr>
                </table>
                <h2 style="margin:0 0 4px;font-size:20px;line-height:1.3;color:#0a1f31;">Three quick steps</h2>
                ${step('1', 'Add it to your phone', 'Open the members area in Safari or Chrome and choose Add to Home Screen. It then opens like an app.')}
                ${step('2', 'Complete your profile', 'Add a phone number, birthday, and photo so the church family can recognize and reach you. You choose what the directory shows.')}
                ${step('3', 'Say hello in chat', 'The Congregation chat is open to every member. Direct messages reach one person.')}
                <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#4c5f70;">Questions? Reply to this email or speak with one of the elders on Sunday. Your profile: <a href="${profileUrl}" style="color:#0a6c8c;">${profileUrl}</a></p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;font-size:12px;color:#4c5f70;">${escapeHtml(site.name)} · ${escapeHtml(site.address.street)}, ${escapeHtml(site.address.city)}, ${escapeHtml(site.address.region)} ${escapeHtml(site.address.postalCode)}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const text = [
    `Welcome, ${displayName(profile)}`,
    '',
    `Your ${site.name} members area access has been approved.`,
    '',
    `Open the members area: ${membersUrl}`,
    `Getting started: ${guideUrl}`,
    '',
    'Three quick steps:',
    '1. Add it to your phone: open the members area in Safari or Chrome and choose Add to Home Screen.',
    '2. Complete your profile: add a phone number, birthday, and photo.',
    '3. Say hello in chat: the Congregation chat is open to every member.',
    '',
    `Questions? Reply to this email or speak with one of the elders on Sunday.`,
  ].join('\n')

  return { html, text }
}

export function approvalFeedback(status: WelcomeEmailStatus): string {
  switch (status) {
    case 'sent':
      return 'Member approved. A welcome email is on its way.'
    case 'not_configured':
      return 'Member approved. Welcome emails are not configured yet, so none was sent.'
    case 'invalid_recipient':
      return 'Member approved. Their email address did not look valid, so no welcome email was sent.'
    default:
      return 'Member approved. The welcome email could not be sent; you may want to reach out directly.'
  }
}

export function testEmailFeedback(status: WelcomeEmailStatus, email: string): string {
  if (status === 'sent') return `Test welcome email sent to ${email}.`
  if (status === 'not_configured') return 'Email delivery is not configured. Add RESEND_API_KEY and WELCOME_EMAIL_FROM to send email.'
  return 'The test email could not be sent. Check the Resend configuration and try again.'
}

/** Send through Resend. Never throws; every failure maps to a status. */
export async function sendWelcomeEmail(
  recipient: { email: string | null | undefined; full_name?: string | null },
  opts: { fetchImpl?: typeof fetch; apiKey?: string; from?: string } = {}
): Promise<WelcomeEmailResult> {
  const apiKey = (opts.apiKey ?? process.env.RESEND_API_KEY ?? '').trim()
  const from = (opts.from ?? process.env.WELCOME_EMAIL_FROM ?? '').trim()
  if (!apiKey || !from) return { status: 'not_configured' }
  const to = normalizeRecipientEmail(recipient.email)
  if (!to) return { status: 'invalid_recipient' }
  const { html, text } = renderWelcomeEmail(recipient)
  const doFetch = opts.fetchImpl ?? fetch
  try {
    const response = await doFetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject: welcomeEmailSubject(), html, text }),
    })
    if (!response.ok) return { status: 'rejected' }
    const data = (await response.json().catch(() => ({}))) as { id?: string }
    return { status: 'sent', messageId: typeof data.id === 'string' ? data.id : undefined }
  } catch {
    return { status: 'network_error' }
  }
}

/** Tiny in-memory rate limiter for the admin test-send button. */
const buckets = new Map<string, number[]>()

export function takeRateLimitSlot(key: string, limit = TEST_EMAIL_LIMIT.limit, windowMs = TEST_EMAIL_LIMIT.windowMs, now = Date.now()): boolean {
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= limit) {
    buckets.set(key, recent)
    return false
  }
  recent.push(now)
  buckets.set(key, recent)
  return true
}
