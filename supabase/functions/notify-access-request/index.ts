import { createClient } from 'npm:@supabase/supabase-js@2'

/**
 * Emails the church when someone requests member access.
 *
 * Called by a database trigger (pg_net) whenever a new unapproved profile is
 * inserted. The function never trusts the request payload: it reads the real
 * pending requests from the database with the service role, and it only sends
 * when a request NEWER than the last notification exists — so a stray or
 * repeated call cannot generate mail on its own. Sending goes through the
 * Resend API using the RESEND_API_KEY function secret.
 */

const NOTIFY_KIND = 'member-access-request'
const ADMIN_URL = 'https://harrisonvillecoc.com/members/admin/members'

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) return json({ error: 'missing Supabase environment' }, 500)

  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: pending, error: pendingError } = await supabase
    .from('member_profiles')
    .select('full_name, email, created_at')
    .eq('approved', false)
    .order('created_at', { ascending: false })

  if (pendingError) return json({ error: pendingError.message }, 500)
  if (!pending || pending.length === 0) return json({ sent: false, reason: 'no pending requests' })

  const { data: lastLog } = await supabase
    .from('admin_notification_log')
    .select('sent_at')
    .eq('kind', NOTIFY_KIND)
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const lastSent = lastLog?.sent_at ? new Date(lastLog.sent_at).getTime() : 0
  const hasNew = pending.some((p) => new Date(p.created_at).getTime() > lastSent)
  if (!hasNew) return json({ sent: false, reason: 'no new requests since last notification' })

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) return json({ error: 'RESEND_API_KEY is not configured' }, 500)

  const to = Deno.env.get('NOTIFY_TO_EMAIL') ?? 'gospel@harrisonvillecoc.com'
  const from = Deno.env.get('NOTIFY_FROM_EMAIL') ?? 'Harrisonville Church of Christ <no-reply@harrisonvillecoc.com>'

  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
  const rows = pending
    .map((p) => `<li>${escapeHtml(p.full_name || '(no name)')} &lt;${escapeHtml(p.email)}&gt; — requested ${fmt.format(new Date(p.created_at))}</li>`)
    .join('')
  const textRows = pending
    .map((p) => `- ${p.full_name || '(no name)'} <${p.email}> — requested ${fmt.format(new Date(p.created_at))}`)
    .join('\n')

  const count = pending.length
  const subject = count === 1 ? 'New member access request' : `${count} member access requests are waiting`

  const sendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html: `<p>Someone requested access to the members area of the church website.</p><p>Waiting for approval:</p><ul>${rows}</ul><p><a href="${ADMIN_URL}">Review and approve requests</a> (sign in, then Admin &rarr; Members).</p>`,
      text: `Someone requested access to the members area of the church website.\n\nWaiting for approval:\n${textRows}\n\nReview and approve: ${ADMIN_URL}`,
    }),
  })

  if (!sendRes.ok) {
    const detail = await sendRes.text()
    return json({ error: `resend ${sendRes.status}: ${detail.slice(0, 500)}` }, 502)
  }

  await supabase.from('admin_notification_log').insert({ kind: NOTIFY_KIND })
  return json({ sent: true, pending: count })
})
