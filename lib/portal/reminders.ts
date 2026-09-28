import { upcomingOccurrences } from '@/lib/recurrence'
import { addDays, chicagoToIso, compareKeys, getDateKey } from '@/lib/portal/time'
import type { Gender } from '@/lib/portal/types'

/**
 * Event email reminders: the pure rules behind the hourly cron at
 * /api/cron/event-reminders. Kept free of Supabase and fetch so the tests can
 * pin down exactly which occurrences are due in a given hour and exactly who
 * hears about each one.
 *
 * Timing. A reminder is "due" when its send time falls inside the hour the
 * cron is running in, [top of the hour, next hour). Timed events send 24 or
 * 48 hours before they start. All-day events have no start time worth
 * counting back from (midnight), so their reminders go out at 8 a.m. church
 * time one or two days before. Consecutive hourly runs cover consecutive
 * windows, so each reminder is due in exactly one run; the send log's unique
 * key is the safety net if a run repeats.
 */

export type EmailReminderSetting = 'none' | '1d' | '2d' | 'both'
export type ReminderType = '1d' | '2d'

export const EMAIL_REMINDER_OPTIONS: Array<{ value: EmailReminderSetting; label: string }> = [
  { value: 'none', label: 'No email reminder' },
  { value: '1d', label: 'The day before (about 24 hours ahead)' },
  { value: '2d', label: 'Two days before (about 48 hours ahead)' },
  { value: 'both', label: 'Both: two days before and again the day before' },
]

export function parseEmailReminder(value: string | null | undefined): EmailReminderSetting {
  return value === '1d' || value === '2d' || value === 'both' ? value : 'none'
}

export function reminderTypesFor(setting: string | null | undefined): ReminderType[] {
  const s = parseEmailReminder(setting)
  if (s === 'both') return ['2d', '1d']
  if (s === 'none') return []
  return [s]
}

export const REMINDER_LEAD_HOURS: Record<ReminderType, number> = { '1d': 24, '2d': 48 }
const HOUR_MS = 3_600_000
/** Church-time hour an all-day event's reminder goes out. */
export const ALL_DAY_SEND_TIME = '08:00'

export type ReminderWindow = { start: number; end: number } // ms, [start, end)

/** The hour the cron is running in: [top of this hour, top of the next). */
export function currentWindow(now: Date = new Date()): ReminderWindow {
  const start = Math.floor(now.getTime() / HOUR_MS) * HOUR_MS
  return { start, end: start + HOUR_MS }
}

/** When a reminder for an occurrence should go out, in ms. */
export function reminderSendTime(occurrenceStart: string, allDay: boolean, type: ReminderType): number {
  if (allDay) {
    const days = REMINDER_LEAD_HOURS[type] / 24
    const iso = chicagoToIso(addDays(getDateKey(occurrenceStart), -days), ALL_DAY_SEND_TIME)
    if (iso) return new Date(iso).getTime()
  }
  return new Date(occurrenceStart).getTime() - REMINDER_LEAD_HOURS[type] * HOUR_MS
}

export function isReminderDue(occurrenceStart: string, allDay: boolean, type: ReminderType, window: ReminderWindow): boolean {
  const at = reminderSendTime(occurrenceStart, allDay, type)
  return at >= window.start && at < window.end
}

export type ReminderEventKind = 'calendar' | 'special' | 'public'

/** One stored event, normalized from any of the three tables. */
export type ReminderSourceEvent = {
  kind: ReminderEventKind
  id: string
  title: string
  startsAt: string
  endsAt: string | null
  allDay: boolean
  location: string | null
  recurring: string | null
  recurrenceEndsOn: string | null
  emailReminder: string
}

export type DueReminder<T extends ReminderSourceEvent = ReminderSourceEvent> = {
  event: T
  occurrenceStart: string
  occurrenceEnd: string | null
  type: ReminderType
}

/**
 * Every (event, occurrence, reminder type) whose send time falls in the
 * window. Recurring events are expanded with the same helper the calendars
 * use, and a series end date is honored.
 */
export function dueReminders<T extends ReminderSourceEvent>(events: T[], window: ReminderWindow): Array<DueReminder<T>> {
  const out: Array<DueReminder<T>> = []
  // A due occurrence starts at least 16 hours after the window (an all-day
  // event's 8 a.m. reminder the day before) and at most about 49 hours
  // after, so expanding from the window start over four days covers it.
  const from = new Date(window.start)
  for (const event of events) {
    const types = reminderTypesFor(event.emailReminder)
    if (!types.length) continue
    const occurrences = event.recurring
      ? upcomingOccurrences({ startDate: event.startsAt, endDate: event.endsAt, recurring: event.recurring }, { from, max: 20, horizonDays: 4 })
      : [{ startDate: event.startsAt, endDate: event.endsAt ?? undefined }]
    for (const occurrence of occurrences) {
      if (event.recurring && event.recurrenceEndsOn && compareKeys(getDateKey(occurrence.startDate), event.recurrenceEndsOn) > 0) continue
      for (const type of types) {
        if (isReminderDue(occurrence.startDate, event.allDay, type, window)) {
          out.push({ event, occurrenceStart: new Date(occurrence.startDate).toISOString(), occurrenceEnd: occurrence.endDate ?? null, type })
        }
      }
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// Recipients
// ---------------------------------------------------------------------------

export type ReminderMember = {
  id: string
  email: string | null
  fullName: string
  role: 'member' | 'editor' | 'admin'
  approved: boolean
  gender: Gender | null
  /** notification_preferences.email_event_reminders (default true). */
  emailOptIn: boolean
}

export type ReminderGroup = {
  id: string
  kind: string
  isPublic: boolean
  archived: boolean
  memberIds: string[]
}

export type ReminderAudience =
  | { kind: 'all' }
  | { kind: 'leaders' }
  | { kind: 'group'; group: ReminderGroup | null }
  | {
      kind: 'special'
      audience: string
      createdBy: string
      rsvpEnabled: boolean
      excludedIds: string[]
      rsvps: Array<{ memberId: string; response: string }>
    }

const isLeader = (m: ReminderMember) => m.role === 'editor' || m.role === 'admin'

/** Mirrors can_access_group(): who can open a group (and so see its events). */
export function canSeeGroup(member: ReminderMember, group: ReminderGroup): boolean {
  if (!member.approved || group.archived) return false
  switch (group.kind) {
    case 'congregation':
      return true
    case 'men':
      return member.gender === 'male'
    case 'women':
      return member.gender === 'female'
    case 'custom':
      return group.isPublic || group.memberIds.includes(member.id)
    default:
      // Event chat groups follow their special event; they are not offered
      // as a calendar audience, so only leaders see such a row.
      return false
  }
}

/** Mirrors is_special_event_participant() for an already-published event. */
function isSpecialParticipant(member: ReminderMember, audience: string, excluded: Set<string>): boolean {
  if (!member.approved || excluded.has(member.id)) return false
  if (audience === 'everyone') return true
  if (audience === 'women') return member.gender === 'female'
  if (audience === 'men') return member.gender === 'male'
  return false
}

/** Calendar visibility to an audience. */
export function calendarAudience(visibility: string, group: ReminderGroup | null): ReminderAudience {
  if (visibility === 'members') return { kind: 'all' }
  if (visibility === 'group') return { kind: 'group', group }
  return { kind: 'leaders' }
}

/**
 * Everyone who should be reminded (in the app, at least), approved members
 * only, in a stable order.
 *  - all: every approved member (members calendar rows, public events)
 *  - leaders: editors and admins
 *  - group: the group's members plus editors and admins
 *  - special: members who said yes or maybe, plus the organizer; when the
 *    event does not take RSVPs, every eligible participant plus the organizer
 */
export function reminderRecipients(audience: ReminderAudience, members: ReminderMember[]): ReminderMember[] {
  const approved = members.filter((m) => m.approved)
  let picked: ReminderMember[]
  switch (audience.kind) {
    case 'all':
      picked = approved
      break
    case 'leaders':
      picked = approved.filter(isLeader)
      break
    case 'group': {
      const group = audience.group
      picked = approved.filter((m) => isLeader(m) || (group ? canSeeGroup(m, group) : false))
      break
    }
    case 'special': {
      const excluded = new Set(audience.excludedIds)
      const going = new Set(audience.rsvps.filter((r) => r.response === 'yes' || r.response === 'maybe').map((r) => r.memberId))
      picked = approved.filter(
        (m) =>
          m.id === audience.createdBy ||
          (isSpecialParticipant(m, audience.audience, excluded) && (!audience.rsvpEnabled || going.has(m.id)))
      )
      break
    }
  }
  return [...picked].sort((a, b) => a.fullName.localeCompare(b.fullName) || a.id.localeCompare(b.id))
}

/** Of the recipients, who also gets the email. */
export function emailableRecipients(recipients: ReminderMember[]): ReminderMember[] {
  return recipients.filter((m) => m.emailOptIn && Boolean(m.email && m.email.trim()))
}

/** Where a reminder links to, inside the site. */
export function reminderPath(event: { kind: ReminderEventKind; id: string; slug?: string | null }, occurrenceStart: string): string {
  if (event.kind === 'special') return `/members/events/${event.id}`
  if (event.kind === 'public' && event.slug) return `/events/${event.slug}`
  return `/members/calendar?date=${getDateKey(occurrenceStart)}`
}

/** Bell notification key: one per occurrence and reminder type. */
export function reminderNotificationKey(kind: ReminderEventKind, id: string, occurrenceStart: string, type: ReminderType): string {
  return `${kind}:${id}:${new Date(occurrenceStart).toISOString()}:${type}`
}
