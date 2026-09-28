import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calendarAudience,
  currentWindow,
  dueReminders,
  emailableRecipients,
  isReminderDue,
  parseEmailReminder,
  reminderNotificationKey,
  reminderPath,
  reminderRecipients,
  reminderSendTime,
  reminderTypesFor,
} from '@/lib/portal/reminders'
import { renderEventReminderEmail, sendEmail, sendEmailBatch } from '@/lib/portal/email'

const HOUR = 3_600_000

test('reminder settings parse safely and expand to reminder types', () => {
  assert.equal(parseEmailReminder('both'), 'both')
  assert.equal(parseEmailReminder('weekly'), 'none')
  assert.equal(parseEmailReminder(null), 'none')
  assert.deepEqual(reminderTypesFor('none'), [])
  assert.deepEqual(reminderTypesFor('1d'), ['1d'])
  assert.deepEqual(reminderTypesFor('both'), ['2d', '1d'])
})

test('the window is the current clock hour', () => {
  const w = currentWindow(new Date('2026-10-01T15:42:10Z'))
  assert.equal(new Date(w.start).toISOString(), '2026-10-01T15:00:00.000Z')
  assert.equal(w.end - w.start, HOUR)
})

test('timed events are due 24 and 48 hours ahead, exactly once across hourly runs', () => {
  const start = '2026-10-04T00:30:00.000Z' // Saturday 7:30 p.m. church time
  assert.equal(reminderSendTime(start, false, '1d'), new Date(start).getTime() - 24 * HOUR)
  assert.equal(reminderSendTime(start, false, '2d'), new Date(start).getTime() - 48 * HOUR)
  let hits = 0
  for (let h = 0; h < 72; h++) {
    const w = currentWindow(new Date(Date.parse('2026-10-01T00:00:00Z') + h * HOUR + 17 * 60_000))
    if (isReminderDue(start, false, '1d', w)) hits++
  }
  assert.equal(hits, 1)
})

test('all-day events remind at 8 a.m. church time the day (or two) before', () => {
  const start = '2026-10-10T05:00:00.000Z' // midnight Oct 10, CDT
  assert.equal(new Date(reminderSendTime(start, true, '1d')).toISOString(), '2026-10-09T13:00:00.000Z')
  assert.equal(new Date(reminderSendTime(start, true, '2d')).toISOString(), '2026-10-08T13:00:00.000Z')
})

const base = { title: 'Singing', endsAt: null, allDay: false, location: null, recurring: null, recurrenceEndsOn: null }

test('dueReminders finds one-time and recurring occurrences in the window', () => {
  const window = currentWindow(new Date('2026-10-03T00:10:00Z'))
  const events = [
    { ...base, kind: 'calendar', id: 'a', startsAt: '2026-10-04T00:30:00.000Z', emailReminder: '1d' },
    { ...base, kind: 'calendar', id: 'b', startsAt: '2026-10-05T00:30:00.000Z', emailReminder: '2d' },
    { ...base, kind: 'calendar', id: 'c', startsAt: '2026-10-04T00:30:00.000Z', emailReminder: 'none' },
    // Weekly on Saturday evenings since August: the Oct 3 (local) occurrence is due.
    { ...base, kind: 'public', id: 'd', startsAt: '2026-08-02T00:30:00.000Z', recurring: 'weekly', emailReminder: 'both' },
    // Same series, but it ended in September.
    { ...base, kind: 'calendar', id: 'e', startsAt: '2026-08-02T00:30:00.000Z', recurring: 'weekly', recurrenceEndsOn: '2026-09-30', emailReminder: '1d' },
  ]
  const due = dueReminders(events, window)
  const keys = due.map((d) => `${d.event.id}:${d.type}:${d.occurrenceStart}`).sort()
  assert.deepEqual(keys, [
    'a:1d:2026-10-04T00:30:00.000Z',
    'b:2d:2026-10-05T00:30:00.000Z',
    'd:1d:2026-10-04T00:30:00.000Z',
  ])
  // The series' two-day reminder for Oct 4 went out Oct 2, and the one for
  // Oct 11 goes out Oct 9: neither is in this window.
  assert.ok(!due.some((d) => d.event.id === 'd' && d.type === '2d'))
})

const member = (id, extra = {}) => ({ id, email: `${id}@example.com`, fullName: id.toUpperCase(), role: 'member', approved: true, gender: null, emailOptIn: true, ...extra })
const people = [
  member('ann', { gender: 'female' }),
  member('bob', { gender: 'male' }),
  member('cal', { role: 'editor', gender: 'male' }),
  member('dee', { role: 'admin', gender: 'female', emailOptIn: false }),
  member('eve', { approved: false }),
]
const ids = (list) => list.map((m) => m.id)

test('calendar audiences: everyone, leaders, and a group plus leaders', () => {
  assert.deepEqual(ids(reminderRecipients(calendarAudience('members', null), people)), ['ann', 'bob', 'cal', 'dee'])
  assert.deepEqual(ids(reminderRecipients(calendarAudience('leaders', null), people)), ['cal', 'dee'])
  const speakers = { id: 'g', kind: 'custom', isPublic: false, archived: false, memberIds: ['bob'] }
  assert.deepEqual(ids(reminderRecipients(calendarAudience('group', speakers), people)), ['bob', 'cal', 'dee'])
  const ladies = { id: 'w', kind: 'women', isPublic: true, archived: false, memberIds: [] }
  assert.deepEqual(ids(reminderRecipients(calendarAudience('group', ladies), people)), ['ann', 'cal', 'dee'])
  const archived = { ...speakers, archived: true }
  assert.deepEqual(ids(reminderRecipients(calendarAudience('group', archived), people)), ['cal', 'dee'])
  // A missing group falls back to leaders only.
  assert.deepEqual(ids(reminderRecipients(calendarAudience('group', null), people)), ['cal', 'dee'])
})

test('special events remind yes and maybe plus the organizer; without RSVPs, every participant', () => {
  const rsvps = [
    { memberId: 'ann', response: 'yes' },
    { memberId: 'bob', response: 'no' },
    { memberId: 'dee', response: 'maybe' },
  ]
  const spec = { kind: 'special', audience: 'everyone', createdBy: 'cal', rsvpEnabled: true, excludedIds: [], rsvps }
  assert.deepEqual(ids(reminderRecipients(spec, people)), ['ann', 'cal', 'dee'])
  assert.deepEqual(ids(reminderRecipients({ ...spec, rsvpEnabled: false, audience: 'women' }, people)), ['ann', 'cal', 'dee'])
  assert.deepEqual(ids(reminderRecipients({ ...spec, rsvpEnabled: false, excludedIds: ['bob'] }, people)), ['ann', 'cal', 'dee'])
})

test('email goes only to members who kept reminder emails on and have an address', () => {
  const list = reminderRecipients({ kind: 'all' }, [...people, member('fay', { email: '' })])
  assert.deepEqual(ids(emailableRecipients(list)), ['ann', 'bob', 'cal'])
})

test('reminder links and notification keys', () => {
  assert.equal(reminderPath({ kind: 'special', id: 'x' }, '2026-10-04T00:30:00Z'), '/members/events/x')
  assert.equal(reminderPath({ kind: 'public', id: 'x', slug: 'gospel-meeting' }, '2026-10-04T00:30:00Z'), '/events/gospel-meeting')
  assert.equal(reminderPath({ kind: 'calendar', id: 'x' }, '2026-10-04T00:30:00Z'), '/members/calendar?date=2026-10-03')
  assert.equal(reminderNotificationKey('calendar', 'x', '2026-10-04T00:30:00Z', '1d'), 'calendar:x:2026-10-04T00:30:00.000Z:1d')
})

test('reminder email: church time, building address fallback, escaped title', () => {
  const { subject, html, text } = renderEventReminderEmail({
    title: 'Singing <at> the building',
    startsAt: '2026-10-04T00:30:00.000Z',
    endsAt: null,
    allDay: false,
    location: null,
    path: '/members/calendar?date=2026-10-03',
    type: '1d',
    recipientName: 'Ada Lovelace',
  })
  assert.equal(subject, 'Tomorrow: Singing <at> the building')
  assert.match(html, /Singing &lt;at&gt; the building/)
  assert.match(text, /Saturday, October 3, 2026 at 7:30 PM/)
  assert.match(text, /1203 Outlook Drive/)
  assert.match(text, /Hello Ada,/)
  assert.match(text, /\/members\/calendar\?date=2026-10-03/)
})

test('generic senders: single and batch, never throwing', async () => {
  const calls = []
  const fetchImpl = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) })
    return new Response(JSON.stringify({ id: 'm1' }), { status: 200 })
  }
  const msg = { to: 'a@b.com', subject: 's', html: '<p>h</p>', text: 't' }
  assert.deepEqual(await sendEmail(msg, { fetchImpl, apiKey: 'k', from: 'f@x.com' }), { status: 'sent', messageId: 'm1' })
  assert.equal((await sendEmail(msg, { fetchImpl, apiKey: '', from: '' })).status, 'not_configured')

  calls.length = 0
  const many = Array.from({ length: 150 }, (_, i) => ({ ...msg, to: i === 3 ? 'bad' : `p${i}@x.com` }))
  const statuses = await sendEmailBatch(many, { fetchImpl, apiKey: 'k', from: 'f@x.com' })
  assert.equal(calls.length, 2)
  assert.ok(calls.every((c) => c.url.endsWith('/emails/batch')))
  assert.equal(calls[0].body.length, 100)
  assert.equal(statuses[3], 'invalid_recipient')
  assert.equal(statuses.filter((s) => s === 'sent').length, 149)
  const failed = await sendEmailBatch([msg], { fetchImpl: async () => { throw new Error('down') }, apiKey: 'k', from: 'f@x.com' })
  assert.deepEqual(failed, ['network_error'])
})
