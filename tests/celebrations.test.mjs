import assert from 'node:assert/strict'
import test from 'node:test'
import { buildAnniversaries, buildBirthdays, familyLabel, findInWeek } from '@/lib/portal/celebrations'

const person = (o = {}) => ({ id: 'a1', displayName: 'Ada Member', photo: null, photoPosition: '50% 50%', birthday: null, anniversary: null, familyId: 'f1', familyName: 'Member family', familyPhoto: null, kind: 'adult', ...o })

test('birthdays match on month and day within the Sunday week', () => {
  const list = buildBirthdays([person({ birthday: '1980-09-08' }), person({ id: 'c1', displayName: 'Cal Member', kind: 'child', birthday: '2018-09-07' }), person({ id: 'x', birthday: '1970-09-20' })], '2026-09-06', '2026-09-08')
  assert.deepEqual(list.map((c) => [c.displayName, c.dateKey, c.isToday, c.familyName]), [
    ['Cal Member', '2026-09-07', false, 'Member family'],
    ['Ada Member', '2026-09-08', true, null],
  ])
})

test('same-day birthdays sort alphabetically and blanks produce nothing', () => {
  const list = buildBirthdays([person({ id: 'b', displayName: 'Zed', birthday: '1990-09-07' }), person({ id: 'a', displayName: 'Amy', birthday: '1991-09-07' }), person({ id: 'n' })], '2026-09-06')
  assert.deepEqual(list.map((c) => c.displayName), ['Amy', 'Zed'])
})

test('a couple sharing an anniversary shows once, named for the family', () => {
  const list = buildAnniversaries([person({ id: 'h', anniversary: '2005-09-10' }), person({ id: 'w', displayName: 'Bea Member', anniversary: '2005-09-10' }), person({ id: 's', familyId: null, familyName: null, displayName: 'Solo Member', anniversary: '1999-09-11' })], '2026-09-06')
  assert.deepEqual(list.map((c) => c.displayName), ['The Member family', 'Solo Member'])
})

test('February 29 appears only in weeks that contain it', () => {
  assert.equal(findInWeek('2000-02-29', ['2027-02-28', '2027-03-01']), null)
  assert.equal(findInWeek('2000-02-29', ['2028-02-27', '2028-02-28', '2028-02-29']), '2028-02-29')
  assert.equal(findInWeek('not a date', ['2028-02-29']), null)
})

test('family labels read naturally whatever the family typed', () => {
  assert.equal(familyLabel('Smith'), 'The Smith family')
  assert.equal(familyLabel('The Smith family'), 'The Smith family')
  assert.equal(familyLabel('Smith family'), 'The Smith family')
})
