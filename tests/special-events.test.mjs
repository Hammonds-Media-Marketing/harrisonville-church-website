import assert from 'node:assert/strict'
import test from 'node:test'
import { canParticipate, eventSections, isAudienceEligible, shouldNotifyPublish, sortInvitees, summarizeRsvps } from '@/lib/portal/special-events'

const m = (id, gender, approved = true) => ({ id, gender, approved })

test('audience eligibility follows gender, approval, and exclusions', () => {
  assert.ok(isAudienceEligible(m('a', 'female'), 'women'))
  assert.ok(!isAudienceEligible(m('a', 'male'), 'women'))
  assert.ok(!isAudienceEligible(m('a', null), 'men'))
  assert.ok(isAudienceEligible(m('a', null), 'everyone'))
  assert.ok(!isAudienceEligible(m('a', 'male', false), 'everyone'))
  assert.ok(!isAudienceEligible(m('a', 'male'), 'everyone', ['a']))
})

test('drafts and archived events never take participants', () => {
  assert.ok(canParticipate({ status: 'published', archivedAt: null, audience: 'everyone' }, m('a', 'male')))
  assert.ok(!canParticipate({ status: 'draft', archivedAt: null, audience: 'everyone' }, m('a', 'male')))
  assert.ok(!canParticipate({ status: 'published', archivedAt: '2026-01-01', audience: 'everyone' }, m('a', 'male')))
})

test('RSVP summary counts guests and sorts going first', () => {
  const invitees = [
    { full_name: 'Zed', response: 'no' },
    { full_name: 'Amy', response: null },
    { full_name: 'Bea', response: 'yes', guest_count: 3 },
    { full_name: 'Cal', response: 'maybe' },
  ]
  assert.deepEqual(summarizeRsvps(invitees), { invited: 4, yes: 1, maybe: 1, no: 1, noResponse: 1, guests: 3 })
  assert.deepEqual(sortInvitees(invitees).map((i) => i.full_name), ['Bea', 'Cal', 'Amy', 'Zed'])
})

test('section tabs appear only for what exists; publish notifies once', () => {
  assert.deepEqual(eventSections({ description: '  ', signupItemCount: 0, hasChat: false }), [])
  assert.deepEqual(eventSections({ description: 'x', signupItemCount: 2, hasChat: true }), ['details', 'signups', 'chat'])
  assert.ok(shouldNotifyPublish('draft', 'published'))
  assert.ok(shouldNotifyPublish(null, 'published'))
  assert.ok(!shouldNotifyPublish('published', 'published'))
})
