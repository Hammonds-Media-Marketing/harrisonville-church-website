import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { renderEventReminderEmail, sendEmailBatch, type EmailMessage } from '@/lib/portal/email'
import {
  calendarAudience,
  currentWindow,
  dueReminders,
  emailableRecipients,
  reminderNotificationKey,
  reminderPath,
  reminderRecipients,
  type DueReminder,
  type ReminderAudience,
  type ReminderGroup,
  type ReminderMember,
  type ReminderSourceEvent,
} from '@/lib/portal/reminders'
import { formatWhen } from '@/lib/portal/time'
import type { Gender } from '@/lib/portal/types'
import { parseSessions } from '@/lib/event-details'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Hourly cron: event email reminders.
 *
 * Finds every members-calendar event, special event, and public event whose
 * "Email reminder" is set and whose reminder falls in this hour (see
 * lib/portal/reminders.ts for the timing rules), works out who should hear
 * about it, and for each person:
 *   1. claims a row in event_reminder_log (unique per event, occurrence,
 *      reminder, and member, so a rerun never sends twice),
 *   2. adds a bell notification (which also reaches their phone when they
 *      have phone notifications on),
 *   3. emails them, unless they turned off "Email me event reminders".
 *
 * Same auth pattern as the communion cron: Vercel sends CRON_SECRET as a
 * bearer token, and this route is one of the two places the app uses the
 * service role key.
 */

type Db = ReturnType<typeof createClient<Database>>

type Source = ReminderSourceEvent & {
  slug?: string | null
  visibility?: string
  groupId?: string | null
  special?: { audience: string; createdBy: string; rsvpEnabled: boolean }
}

const ENTITY_TYPE: Record<Source['kind'], string> = { calendar: 'calendar_event', special: 'special_event', public: 'event' }

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET is not set' }, { status: 503 })
  if (request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 503 })

  const supabase = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const window = currentWindow()
  const from = `"${new Date(window.start).toISOString()}"`

  const [calendar, specials, publicEvents] = await Promise.all([
    supabase.from('calendar_events').select('*').neq('email_reminder', 'none').or(`recurring.not.is.null,starts_at.gte.${from}`),
    supabase
      .from('special_events')
      .select('*')
      .neq('email_reminder', 'none')
      .eq('status', 'published')
      .is('archived_at', null)
      .not('starts_at', 'is', null)
      .gte('starts_at', new Date(window.start).toISOString()),
    supabase
      .from('events')
      .select('*')
      .neq('email_reminder', 'none')
      .eq('published', true)
      .or(`recurring.not.is.null,start_date.gte.${from},end_date.gte.${from}`),
  ])
  const loadError = calendar.error ?? specials.error ?? publicEvents.error
  if (loadError) return NextResponse.json({ error: loadError.message }, { status: 500 })

  const sources: Source[] = [
    ...(calendar.data ?? []).map((e) => ({
      kind: 'calendar' as const,
      id: e.id,
      title: e.title,
      startsAt: e.starts_at,
      endsAt: e.ends_at,
      allDay: e.all_day,
      location: e.location,
      recurring: e.recurring,
      recurrenceEndsOn: e.recurrence_ends_on,
      emailReminder: e.email_reminder,
      visibility: e.visibility,
      groupId: e.group_id,
    })),
    ...(specials.data ?? []).flatMap((e) =>
      e.starts_at
        ? [
            {
              kind: 'special' as const,
              id: e.id,
              title: e.title,
              startsAt: e.starts_at,
              endsAt: e.ends_at,
              allDay: e.all_day,
              location: e.location,
              recurring: null,
              recurrenceEndsOn: null,
              emailReminder: e.email_reminder,
              special: { audience: e.audience, createdBy: e.created_by, rsvpEnabled: e.rsvp_enabled },
            },
          ]
        : []
    ),
    // A multi-day event is one source per session, so each day gets its own
    // reminder (the log's occurrence_start keeps them apart).
    ...(publicEvents.data ?? []).flatMap((e) => {
      const sessions = parseSessions(e.sessions)
      const dates = sessions.length > 1 ? sessions : [{ startDate: e.start_date, endDate: e.end_date ?? undefined }]
      return dates.map((d) => ({
        kind: 'public' as const,
        id: e.id,
        slug: e.slug,
        title: e.title,
        startsAt: d.startDate,
        endsAt: d.endDate ?? null,
        allDay: false,
        location: e.location_name,
        recurring: sessions.length > 1 ? null : e.recurring,
        recurrenceEndsOn: null,
        emailReminder: e.email_reminder,
      }))
    }),
  ]

  const due = dueReminders(sources, window)
  if (!due.length) return NextResponse.json({ window: new Date(window.start).toISOString(), due: 0, notified: 0, emailed: 0 })

  const context = await loadAudienceContext(supabase, due)
  if ('error' in context) return NextResponse.json({ error: context.error }, { status: 500 })

  let notified = 0
  let emailed = 0
  const failures: string[] = []
  for (const reminder of due) {
    try {
      const result = await sendReminder(supabase, reminder, context)
      notified += result.notified
      emailed += result.emailed
    } catch (error) {
      failures.push(`${reminder.event.kind}:${reminder.event.id}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  if (failures.length) console.warn('[event-reminders] failures:', failures)
  return NextResponse.json({ window: new Date(window.start).toISOString(), due: due.length, notified, emailed, failures: failures.length })
}

type AudienceContext = {
  members: ReminderMember[]
  groups: Map<string, ReminderGroup>
  rsvps: Map<string, Array<{ memberId: string; response: string }>>
  exclusions: Map<string, string[]>
}

async function loadAudienceContext(supabase: Db, due: Array<DueReminder<Source>>): Promise<AudienceContext | { error: string }> {
  const groupIds = [...new Set(due.map((d) => d.event.groupId).filter((x): x is string => Boolean(x)))]
  const specialIds = [...new Set(due.filter((d) => d.event.kind === 'special').map((d) => d.event.id))]

  const [profiles, prefs, groups, groupMembers, rsvps, exclusions] = await Promise.all([
    supabase.from('member_profiles').select('id, email, full_name, role, approved, gender').eq('approved', true),
    supabase.from('notification_preferences').select('member_id, email_event_reminders'),
    groupIds.length ? supabase.from('groups').select('id, kind, is_public, archived_at').in('id', groupIds) : Promise.resolve({ data: [], error: null }),
    groupIds.length ? supabase.from('group_members').select('group_id, member_id').in('group_id', groupIds) : Promise.resolve({ data: [], error: null }),
    specialIds.length ? supabase.from('special_event_rsvps').select('event_id, member_id, response').in('event_id', specialIds) : Promise.resolve({ data: [], error: null }),
    specialIds.length ? supabase.from('special_event_exclusions').select('event_id, member_id').in('event_id', specialIds) : Promise.resolve({ data: [], error: null }),
  ])
  const error = profiles.error ?? prefs.error ?? groups.error ?? groupMembers.error ?? rsvps.error ?? exclusions.error
  if (error) return { error: error.message }

  const optIn = new Map((prefs.data ?? []).map((p) => [p.member_id, p.email_event_reminders]))
  const members: ReminderMember[] = (profiles.data ?? []).map((p) => ({
    id: p.id,
    email: p.email,
    fullName: p.full_name,
    role: p.role,
    approved: p.approved,
    gender: p.gender === 'male' || p.gender === 'female' ? (p.gender as Gender) : null,
    emailOptIn: optIn.get(p.id) ?? true,
  }))

  const groupMap = new Map<string, ReminderGroup>()
  for (const g of groups.data ?? []) {
    groupMap.set(g.id, { id: g.id, kind: g.kind, isPublic: g.is_public, archived: Boolean(g.archived_at), memberIds: [] })
  }
  for (const gm of groupMembers.data ?? []) groupMap.get(gm.group_id)?.memberIds.push(gm.member_id)

  const rsvpMap = new Map<string, Array<{ memberId: string; response: string }>>()
  for (const r of rsvps.data ?? []) {
    const list = rsvpMap.get(r.event_id) ?? []
    list.push({ memberId: r.member_id, response: r.response })
    rsvpMap.set(r.event_id, list)
  }
  const exclusionMap = new Map<string, string[]>()
  for (const x of exclusions.data ?? []) {
    const list = exclusionMap.get(x.event_id) ?? []
    list.push(x.member_id)
    exclusionMap.set(x.event_id, list)
  }

  return { members, groups: groupMap, rsvps: rsvpMap, exclusions: exclusionMap }
}

function audienceFor(event: Source, context: AudienceContext): ReminderAudience {
  if (event.kind === 'public') return { kind: 'all' }
  if (event.kind === 'special' && event.special) {
    return {
      kind: 'special',
      audience: event.special.audience,
      createdBy: event.special.createdBy,
      rsvpEnabled: event.special.rsvpEnabled,
      excludedIds: context.exclusions.get(event.id) ?? [],
      rsvps: context.rsvps.get(event.id) ?? [],
    }
  }
  return calendarAudience(event.visibility ?? 'members', event.groupId ? context.groups.get(event.groupId) ?? null : null)
}

async function sendReminder(supabase: Db, reminder: DueReminder<Source>, context: AudienceContext): Promise<{ notified: number; emailed: number }> {
  const { event, occurrenceStart, occurrenceEnd, type } = reminder
  const recipients = reminderRecipients(audienceFor(event, context), context.members)
  if (!recipients.length) return { notified: 0, emailed: 0 }

  // 1. Claim. Only rows this run inserted come back; anyone already in the
  //    log for this reminder was handled by an earlier run.
  const logKey = { event_kind: event.kind, event_id: event.id, occurrence_start: occurrenceStart, reminder_type: type }
  const { data: claimedRows, error: claimError } = await supabase
    .from('event_reminder_log')
    .upsert(
      recipients.map((r) => ({ ...logKey, recipient_id: r.id })),
      { onConflict: 'event_kind,event_id,occurrence_start,reminder_type,recipient_id', ignoreDuplicates: true }
    )
    .select('recipient_id')
  if (claimError) throw new Error(claimError.message)
  const claimed = new Set((claimedRows ?? []).map((r) => r.recipient_id))
  const mine = recipients.filter((r) => claimed.has(r.id))
  if (!mine.length) return { notified: 0, emailed: 0 }

  const path = reminderPath({ kind: event.kind, id: event.id, slug: event.slug }, occurrenceStart)
  const when = formatWhen(occurrenceStart, occurrenceEnd, event.allDay)
  const title = `${type === '1d' ? 'Tomorrow' : 'In two days'}: ${event.title}`

  // 2. Bell (and phone) notification.
  const { data: notified, error: notifyError } = await supabase.rpc('send_event_reminder_notifications', {
    target_recipients: mine.map((r) => r.id),
    target_key: reminderNotificationKey(event.kind, event.id, occurrenceStart, type),
    target_title: title,
    target_body: event.location ? `${when} · ${event.location}` : when,
    target_url: path,
    target_entity_type: ENTITY_TYPE[event.kind],
    target_entity_id: event.id,
  })
  if (notifyError) console.warn('[event-reminders] in-app notify failed:', notifyError.message)

  // 3. Email, for everyone who has not turned reminder emails off.
  const emailable = emailableRecipients(mine)
  const emailableIds = new Set(emailable.map((r) => r.id))
  const messages: EmailMessage[] = emailable.map((r) => {
    const { subject, html, text } = renderEventReminderEmail({
      title: event.title,
      startsAt: occurrenceStart,
      endsAt: occurrenceEnd,
      allDay: event.allDay,
      location: event.location,
      path,
      type,
      recipientName: r.fullName,
    })
    return { to: r.email ?? '', subject, html, text }
  })
  const statuses = await sendEmailBatch(messages)

  // Record what happened to each email, grouped by outcome.
  const byStatus = new Map<string, string[]>()
  const note = (status: string, id: string) => byStatus.set(status, [...(byStatus.get(status) ?? []), id])
  emailable.forEach((r, i) => note(statuses[i] === 'sent' ? 'sent' : statuses[i] === 'not_configured' ? 'not_configured' : 'failed', r.id))
  for (const r of mine) if (!emailableIds.has(r.id)) note(r.emailOptIn ? 'no_email' : 'opted_out', r.id)
  for (const [email_status, ids] of byStatus) {
    await supabase.from('event_reminder_log').update({ email_status }).match(logKey).in('recipient_id', ids)
  }

  return { notified: typeof notified === 'number' ? notified : 0, emailed: byStatus.get('sent')?.length ?? 0 }
}
