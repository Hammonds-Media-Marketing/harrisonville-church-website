import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

/**
 * Sends a bell notification to the recipient's phones and computers (web push).
 *
 * Called by the in_app_notifications_push trigger (pg_net) with { id } when a
 * notification is created or refreshed, and only when the recipient has at
 * least one device turned on. The function never trusts the payload beyond
 * the id: claim_push_notification() loads the row with the service role and
 * stamps pushed_at in the same statement, returning nothing when it was
 * already pushed, pushed in the last five minutes (a busy chat), read, or the
 * member turned "Send to my phone" off. So a stray or repeated call cannot
 * send anything twice.
 *
 * Subscriptions the push service reports as gone (404 or 410) are deleted.
 *
 * Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (a mailto: or
 * https: contact), plus the built-in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 * Deploy with JWT verification off, like notify-access-request, because the
 * database trigger calls it without a user token.
 */

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) return json({ error: 'missing Supabase environment' }, 500)

  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY')
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY')
  const subject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:gospel@harrisonvillecoc.com'
  if (!publicKey || !privateKey) return json({ error: 'VAPID keys are not configured' }, 500)

  let id = ''
  try {
    const body = (await req.json()) as { id?: unknown }
    id = typeof body.id === 'string' ? body.id : ''
  } catch {
    // fall through to the check below
  }
  if (!UUID.test(id)) return json({ error: 'missing notification id' }, 400)

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

  const { data: claimed, error: claimError } = await supabase.rpc('claim_push_notification', { target_id: id })
  if (claimError) return json({ error: claimError.message }, 500)
  const notification = Array.isArray(claimed) ? claimed[0] : null
  if (!notification) return json({ sent: 0, reason: 'nothing to push' })

  const { data: subscriptions, error: subError } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('member_id', notification.recipient_id)
  if (subError) return json({ error: subError.message }, 500)
  if (!subscriptions?.length) return json({ sent: 0, reason: 'no devices' })

  webpush.setVapidDetails(subject, publicKey, privateKey)

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    url: notification.destination_url,
    tag: `${notification.notification_type}:${notification.event_key}`,
  })

  let sent = 0
  const gone: string[] = []
  const delivered: string[] = []
  await Promise.all(
    subscriptions.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 24, urgency: 'normal' })
        sent += 1
        delivered.push(s.id)
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) gone.push(s.id)
        else console.warn('[send-push] delivery failed', status, (error as Error).message)
      }
    })
  )

  if (gone.length) await supabase.from('push_subscriptions').delete().in('id', gone)
  if (delivered.length) await supabase.from('push_subscriptions').update({ last_used_at: new Date().toISOString() }).in('id', delivered)

  return json({ sent, removed: gone.length })
})
