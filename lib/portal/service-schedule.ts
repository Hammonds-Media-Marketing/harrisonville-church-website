import { site } from '@/lib/site'
import { chicagoToIso, compareKeys, formatKey, getTodayKey, monthName, weekdayOf, type DateKey } from '@/lib/portal/time'

/**
 * Service schedule (the "teaching schedule" entered by hand each month).
 * One row per assembly duty per date. The assembly times come from the
 * site's service list so the schedule, the calendar, and the public site
 * never disagree about when the church meets.
 */

export const SERVICE_SLOTS = [
  { id: 'sunday-am', label: 'Sunday Morning', short: 'Sun AM', weekday: 0, time: site.services[0].time },
  { id: 'sunday-pm', label: 'Sunday Afternoon', short: 'Sun PM', weekday: 0, time: site.services[1].time },
  { id: 'wednesday', label: 'Wednesday Evening', short: 'Wed', weekday: 3, time: site.services[2].time },
] as const

export type ServiceSlot = (typeof SERVICE_SLOTS)[number]['id']

export const SERVICE_DUTIES = [
  { id: 'speaker', label: 'Speaker', printOrder: 1 },
  { id: 'short_talk', label: 'Short Talk', printOrder: 2 },
  { id: 'communion', label: 'Communion', printOrder: 0 },
  { id: 'bible_class', label: 'Bible Class', printOrder: 3 },
  { id: 'song_leading', label: 'Song Leader', printOrder: 4 },
  { id: 'opening_prayer', label: 'Opening Prayer', printOrder: 5 },
  { id: 'closing_prayer', label: 'Closing Prayer', printOrder: 6 },
  { id: 'scripture_reading', label: 'Scripture Reading', printOrder: 7 },
  { id: 'announcements', label: 'Announcements', printOrder: 8 },
  { id: 'other', label: 'Other', printOrder: 9 },
] as const

export type ServiceDuty = (typeof SERVICE_DUTIES)[number]['id']

/** Duties shown on the month entry grid, in the order they are entered. */
export const GRID_DUTIES: ServiceDuty[] = ['speaker', 'short_talk', 'communion', 'song_leading', 'opening_prayer', 'closing_prayer']

export function isServiceSlot(value: string): value is ServiceSlot {
  return SERVICE_SLOTS.some((s) => s.id === value)
}

export function isServiceDuty(value: string): value is ServiceDuty {
  return SERVICE_DUTIES.some((d) => d.id === value)
}

export function dutyLabel(duty: string): string {
  return SERVICE_DUTIES.find((d) => d.id === duty)?.label ?? duty
}

export function slotLabel(slot: string, style: 'long' | 'short' = 'long'): string {
  const s = SERVICE_SLOTS.find((x) => x.id === slot)
  return s ? (style === 'short' ? s.short : s.label) : slot
}

/** Every assembly date in a month, with its slots, in order. */
export function assemblyDates(year: number, month: number): Array<{ dateKey: DateKey; slots: ServiceSlot[] }> {
  const out: Array<{ dateKey: DateKey; slots: ServiceSlot[] }> = []
  const last = new Date(Date.UTC(year, month, 0, 12)).getUTCDate()
  for (let day = 1; day <= last; day++) {
    const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const slots = SERVICE_SLOTS.filter((s) => s.weekday === weekdayOf(key)).map((s) => s.id)
    if (slots.length) out.push({ dateKey: key, slots })
  }
  return out
}

/** UTC instant an assembly starts, from its date and slot. */
export function assemblyStartsAt(dateKey: DateKey, slot: ServiceSlot): string | null {
  const s = SERVICE_SLOTS.find((x) => x.id === slot)
  return s ? chicagoToIso(dateKey, s.time) : null
}

export type AssignmentInput = {
  id: string
  service_date: string
  service_slot: string
  duty: string
  member_id: string | null
  assignee_name: string | null
  member_name?: string | null
  notes?: string | null
}

export type Assignment = {
  id: string
  dateKey: DateKey
  slot: ServiceSlot
  duty: ServiceDuty
  memberId: string | null
  name: string
  notes: string | null
}

/** Display name: the linked member wins, else the typed name. */
export function assignmentName(row: Pick<AssignmentInput, 'assignee_name' | 'member_name'>): string {
  return (row.member_name ?? '').trim() || (row.assignee_name ?? '').trim().replace(/\s+/g, ' ')
}

export function normalizeAssignment(row: AssignmentInput): Assignment | null {
  if (!isServiceSlot(row.service_slot) || !isServiceDuty(row.duty)) return null
  const name = assignmentName(row)
  if (!name) return null
  return {
    id: row.id,
    dateKey: row.service_date,
    slot: row.service_slot,
    duty: row.duty,
    memberId: row.member_id,
    name,
    notes: row.notes ?? null,
  }
}

const slotOrder: Record<ServiceSlot, number> = { 'sunday-am': 0, 'sunday-pm': 1, wednesday: 2 }

function printOrder(duty: ServiceDuty): number {
  return SERVICE_DUTIES.find((d) => d.id === duty)?.printOrder ?? 99
}

export type PrintBlock = { slot: ServiceSlot; label: string; assignments: Assignment[] }
export type PrintDay = { dateKey: DateKey; dayLabel: string; blocks: PrintBlock[] }
export type PrintModel = { year: number; month: number; monthName: string; arrangerName: string | null; days: PrintDay[] }

/** Printable month: days, then assemblies, with Communion listed first. */
export function buildPrintModel(input: {
  year: number
  month: number
  rows: AssignmentInput[]
  arrangerName?: string | null
}): PrintModel {
  const prefix = `${input.year}-${String(input.month).padStart(2, '0')}-`
  const byDay = new Map<DateKey, Map<ServiceSlot, Assignment[]>>()
  for (const row of input.rows) {
    const a = normalizeAssignment(row)
    if (!a || !a.dateKey.startsWith(prefix)) continue
    const slots = byDay.get(a.dateKey) ?? new Map<ServiceSlot, Assignment[]>()
    const list = slots.get(a.slot) ?? []
    list.push(a)
    slots.set(a.slot, list)
    byDay.set(a.dateKey, slots)
  }
  const days: PrintDay[] = Array.from(byDay.entries())
    .sort(([a], [b]) => compareKeys(a, b))
    .map(([dateKey, slots]) => ({
      dateKey,
      dayLabel: formatKey(dateKey, { year: false }),
      blocks: Array.from(slots.entries())
        .sort(([a], [b]) => slotOrder[a] - slotOrder[b])
        .map(([slot, assignments]) => ({
          slot,
          label: slotLabel(slot, 'short'),
          assignments: assignments.sort(
            (x, y) => printOrder(x.duty) - printOrder(y.duty) || x.name.localeCompare(y.name)
          ),
        })),
    }))
  const arranger = (input.arrangerName ?? '').trim()
  return { year: input.year, month: input.month, monthName: monthName(input.month), arrangerName: arranger || null, days }
}

/** The next assemblies with anyone assigned, for the home page card. */
export function upcomingAssignments(rows: AssignmentInput[], opts: { todayKey?: DateKey; maxServices?: number } = {}): PrintDay[] {
  const today = opts.todayKey ?? getTodayKey()
  const max = opts.maxServices ?? 3
  const future = rows.filter((r) => compareKeys(r.service_date, today) >= 0)
  const byDay = new Map<DateKey, Map<ServiceSlot, Assignment[]>>()
  for (const row of future) {
    const a = normalizeAssignment(row)
    if (!a) continue
    const slots = byDay.get(a.dateKey) ?? new Map<ServiceSlot, Assignment[]>()
    const list = slots.get(a.slot) ?? []
    list.push(a)
    slots.set(a.slot, list)
    byDay.set(a.dateKey, slots)
  }
  const days: PrintDay[] = []
  let services = 0
  for (const [dateKey, slots] of Array.from(byDay.entries()).sort(([a], [b]) => compareKeys(a, b))) {
    if (services >= max) break
    const blocks: PrintBlock[] = []
    for (const [slot, assignments] of Array.from(slots.entries()).sort(([a], [b]) => slotOrder[a] - slotOrder[b])) {
      if (services >= max) break
      blocks.push({
        slot,
        label: slotLabel(slot, 'short'),
        // Home card order: Speaker, Short Talk, Communion, then the rest.
        assignments: assignments.sort((x, y) => homeOrder(x.duty) - homeOrder(y.duty) || x.name.localeCompare(y.name)),
      })
      services += 1
    }
    days.push({ dateKey, dayLabel: formatKey(dateKey, { weekday: true, year: false }), blocks })
  }
  return days
}

function homeOrder(duty: ServiceDuty): number {
  const order: Partial<Record<ServiceDuty, number>> = { speaker: 0, short_talk: 1, communion: 2 }
  return order[duty] ?? 3 + printOrder(duty)
}
