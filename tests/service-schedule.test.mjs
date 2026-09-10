import assert from 'node:assert/strict'
import test from 'node:test'
import { assemblyDates, assemblyStartsAt, buildPrintModel, normalizeAssignment, upcomingAssignments } from '@/lib/portal/service-schedule'

const row = (o) => ({ id: o.id ?? Math.random().toString(36).slice(2), service_date: o.date, service_slot: o.slot ?? 'sunday-am', duty: o.duty ?? 'speaker', member_id: o.memberId ?? null, assignee_name: o.name ?? null, member_name: o.memberName ?? null })

test('assembly dates follow the church service pattern', () => {
  const dates = assemblyDates(2026, 9)
  assert.deepEqual(dates[0], { dateKey: '2026-09-02', slots: ['wednesday'] })
  assert.deepEqual(dates[1], { dateKey: '2026-09-06', slots: ['sunday-am', 'sunday-pm'] })
  assert.equal(assemblyStartsAt('2026-09-06', 'sunday-am'), '2026-09-06T15:00:00.000Z')
  assert.equal(assemblyStartsAt('2026-09-06', 'sunday-pm'), '2026-09-06T19:00:00.000Z')
  assert.equal(assemblyStartsAt('2026-09-02', 'wednesday'), '2026-09-03T00:00:00.000Z')
})

test('the linked member name wins over a typed name and blanks are dropped', () => {
  assert.equal(normalizeAssignment(row({ date: '2026-09-06', name: '  Jeff   Harris ' })).name, 'Jeff Harris')
  assert.equal(normalizeAssignment(row({ date: '2026-09-06', name: 'Typed', memberName: 'Linked Member' })).name, 'Linked Member')
  assert.equal(normalizeAssignment(row({ date: '2026-09-06', name: '   ' })), null)
  assert.equal(normalizeAssignment(row({ date: '2026-09-06', duty: 'juggling', name: 'X' })), null)
})

test('print model groups by day and assembly with communion first', () => {
  const model = buildPrintModel({
    year: 2026,
    month: 9,
    arrangerName: '  Jeremy H ',
    rows: [
      row({ date: '2026-09-06', slot: 'sunday-am', duty: 'speaker', name: 'Matt' }),
      row({ date: '2026-09-06', slot: 'sunday-am', duty: 'communion', name: 'Hollis' }),
      row({ date: '2026-09-06', slot: 'sunday-pm', duty: 'speaker', name: 'Matt' }),
      row({ date: '2026-09-02', slot: 'wednesday', duty: 'short_talk', name: 'Jeff' }),
      row({ date: '2026-10-04', slot: 'sunday-am', duty: 'speaker', name: 'Outside' }),
    ],
  })
  assert.equal(model.arrangerName, 'Jeremy H')
  assert.deepEqual(model.days.map((d) => d.dateKey), ['2026-09-02', '2026-09-06'])
  const sunday = model.days[1]
  assert.deepEqual(sunday.blocks.map((b) => b.label), ['Sun AM', 'Sun PM'])
  assert.deepEqual(sunday.blocks[0].assignments.map((a) => `${a.duty}:${a.name}`), ['communion:Hollis', 'speaker:Matt'])
  assert.equal(buildPrintModel({ year: 2026, month: 2, rows: [], arrangerName: '  ' }).arrangerName, null)
})

test('home card shows the next few assemblies, speaker first', () => {
  const days = upcomingAssignments(
    [
      row({ date: '2026-09-01', name: 'Past' }),
      row({ date: '2026-09-06', slot: 'sunday-am', duty: 'communion', name: 'Hollis' }),
      row({ date: '2026-09-06', slot: 'sunday-am', duty: 'speaker', name: 'Matt' }),
      row({ date: '2026-09-06', slot: 'sunday-pm', duty: 'speaker', name: 'Jeff' }),
      row({ date: '2026-09-09', slot: 'wednesday', duty: 'speaker', name: 'Ed' }),
      row({ date: '2026-09-13', slot: 'sunday-am', duty: 'speaker', name: 'Later' }),
    ],
    { todayKey: '2026-09-03', maxServices: 3 }
  )
  assert.deepEqual(days.map((d) => d.dateKey), ['2026-09-06', '2026-09-09'])
  assert.deepEqual(days[0].blocks[0].assignments.map((a) => a.name), ['Matt', 'Hollis'])
  assert.equal(days.flatMap((d) => d.blocks).length, 3)
})
