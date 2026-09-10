import assert from 'node:assert/strict'
import test from 'node:test'
import { formatNotificationCount, notificationIconKind, popoverPosition } from '@/lib/portal/notifications'
import { getOnboardingStatus, getProfileCompletion } from '@/lib/portal/onboarding'
import { bucketByDay, categoryTone, daysSpanned, occurrencesInRange } from '@/lib/portal/calendar'

test('counts cap at 99+ and icons group by kind', () => {
  assert.equal(formatNotificationCount(0), '0')
  assert.equal(formatNotificationCount(150), '99+')
  assert.equal(notificationIconKind('group_message'), 'message')
  assert.equal(notificationIconKind('special_event_rsvp'), 'event')
  assert.equal(notificationIconKind('member_pending'), 'member')
  assert.equal(notificationIconKind('communion_reminder'), 'calendar')
  assert.equal(notificationIconKind('mystery'), 'bell')
})

test('popover stays inside the visual viewport', () => {
  const wide = popoverPosition({ anchor: { right: 1200, bottom: 60 }, viewport: { left: 0, top: 0, width: 1280, height: 800 } })
  assert.deepEqual(wide, { left: 832, top: 72, width: 368, maxHeight: 544 })
  const phone = popoverPosition({ anchor: { right: 380, bottom: 60 }, viewport: { left: 0, top: 0, width: 390, height: 500 } })
  assert.equal(phone.width, 366)
  assert.equal(phone.left, 12)
  assert.equal(phone.maxHeight, 416)
})

test('onboarding tracks three essentials', () => {
  const profile = { full_name: 'Ada', phone: '', birthday: null, gender: null, photo: null, family_id: null, anniversary: null, about: null }
  const c = getProfileCompletion(profile)
  assert.equal(c.complete, false)
  assert.deepEqual(c.required.filter((f) => !f.complete).map((f) => f.key), ['phone', 'birthday', 'gender'])
  const status = getOnboardingStatus({ profile: { ...profile, phone: '1', birthday: '2000-01-01', gender: 'male', photo: 'x' }, hasInstalledApp: false })
  assert.equal(status.completedCount, 2)
  assert.equal(status.percentComplete, 67)
  assert.ok(!status.isComplete)
})

test('calendar expansion and bucketing', () => {
  const base = { id: 'e', source: 'members', title: 'Class', startsAt: '2026-09-03T00:00:00.000Z', endsAt: '2026-09-03T01:00:00.000Z', allDay: false, category: 'Bible Study', location: null, description: null, href: null, editableId: 'e', recurring: 'weekly', visibility: 'members' }
  const range = { start: '2026-09-13', end: '2026-09-26' }
  const occ = occurrencesInRange(base, range)
  assert.deepEqual(occ.map((o) => o.id), ['e:2026-09-16', 'e:2026-09-23'])
  assert.equal(occ[0].startsAt, '2026-09-17T00:00:00.000Z', 'stays at 7 p.m. Chicago')
  assert.deepEqual(occurrencesInRange({ ...base, recurrenceEndsOn: '2026-09-20' }, range).map((o) => o.id), ['e:2026-09-16'])
  const multi = { ...base, id: 'm', recurring: null, startsAt: '2026-09-25T05:00:00.000Z', endsAt: '2026-09-28T04:59:00.000Z', allDay: true }
  assert.deepEqual(daysSpanned(multi, range), ['2026-09-25', '2026-09-26'])
  const buckets = bucketByDay([...occ, multi], range)
  assert.equal(buckets.get('2026-09-25')[0].id, 'm')
  assert.equal(categoryTone('Worship'), 'primary')
  assert.equal(categoryTone('Special event'), 'gold')
})
