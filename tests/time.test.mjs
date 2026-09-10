import assert from 'node:assert/strict'
import test from 'node:test'
import { addDays, chicagoToIso, formatDaySeparator, formatKey, formatTime, formatWeekRange, formatWhen, getDateKey, isValidDateKey, monthGridKeys, startOfWeek, weekKeys } from '@/lib/portal/time'

test('church wall time converts to UTC across daylight saving', () => {
  assert.equal(chicagoToIso('2026-08-15', '18:00'), '2026-08-15T23:00:00.000Z')
  assert.equal(chicagoToIso('2026-12-15', '18:00'), '2026-12-16T00:00:00.000Z')
  assert.equal(chicagoToIso('2026-03-08', '02:30'), null, 'the skipped hour does not exist')
  assert.equal(chicagoToIso('2026-02-30', '10:00'), null)
})

test('date keys come from Chicago, not UTC', () => {
  assert.equal(getDateKey('2026-09-03T00:30:00.000Z'), '2026-09-02')
  assert.equal(formatTime('2026-09-06T15:00:00.000Z'), '10:00 AM')
})

test('week and month grids start on Sunday', () => {
  assert.equal(startOfWeek('2026-09-09'), '2026-09-06')
  assert.deepEqual(weekKeys('2026-09-06').at(-1), '2026-09-12')
  const grid = monthGridKeys('2026-09-15')
  assert.equal(grid.length, 42)
  assert.equal(grid[0], '2026-08-30')
  assert.equal(addDays('2026-12-31', 1), '2027-01-01')
  assert.ok(isValidDateKey('2028-02-29'))
  assert.ok(!isValidDateKey('2027-02-29'))
})

test('labels read naturally', () => {
  assert.equal(formatWeekRange('2026-09-06'), 'September 6 to 12, 2026')
  assert.equal(formatWeekRange('2026-08-30'), 'August 30 to September 5, 2026')
  assert.equal(formatWeekRange('2027-12-26'), 'December 26, 2027 to January 1, 2028')
  assert.equal(formatKey('2026-09-06', { weekday: true }), 'Sunday, September 6, 2026')
  assert.equal(formatWhen('2026-09-06T15:00:00.000Z', '2026-09-06T16:30:00.000Z', false), 'Sunday, September 6, 2026 at 10:00 AM to 11:30 AM')
  assert.equal(formatWhen('2026-09-06T05:00:00.000Z', null, true), 'Sunday, September 6, 2026')
  assert.equal(formatDaySeparator('2026-09-10', '2026-09-10'), 'Today')
  assert.equal(formatDaySeparator('2026-09-09', '2026-09-10'), 'Yesterday')
  assert.equal(formatDaySeparator('2026-09-06', '2026-09-10'), 'Sunday')
  assert.equal(formatDaySeparator('2026-08-01', '2026-09-10'), 'August 1, 2026')
})
