import { isoToLocalInput, localInputToIso } from '@/lib/format'

/**
 * Event recurrence. The editor stores one of four machine rules in the
 * `recurring` column; this module turns a rule plus the event's first start
 * time into the actual upcoming dates shown on the public calendar. All date
 * math happens on church-local wall-clock time (via the format.ts converters)
 * so a 7 p.m. event stays at 7 p.m. across daylight-saving changes.
 */

export type RecurrenceRule = 'weekly' | 'biweekly' | 'monthly-weekday' | 'monthly-date'

export const RECURRENCE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Does not repeat' },
  { value: 'weekly', label: 'Weekly — same weekday and time' },
  { value: 'biweekly', label: 'Every two weeks — same weekday and time' },
  { value: 'monthly-weekday', label: 'Monthly — same weekday (for example, first Sunday)' },
  { value: 'monthly-date', label: 'Monthly — same date each month' },
]

const RULES: RecurrenceRule[] = ['weekly', 'biweekly', 'monthly-weekday', 'monthly-date']

export function isRecurrenceRule(value: string | null | undefined): value is RecurrenceRule {
  return !!value && (RULES as string[]).includes(value)
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const ORDINALS = ['First', 'Second', 'Third', 'Fourth', 'Last']

/** Wall-clock parts of an ISO instant, in church time. */
type Wall = { y: number; m: number; d: number; hm: string }

function toWall(iso: string): Wall {
  const local = isoToLocalInput(iso) // YYYY-MM-DDTHH:MM
  return {
    y: Number(local.slice(0, 4)),
    m: Number(local.slice(5, 7)),
    d: Number(local.slice(8, 10)),
    hm: local.slice(11, 16),
  }
}

function wallToIso(w: Wall): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return localInputToIso(`${w.y}-${pad(w.m)}-${pad(w.d)}T${w.hm}`)
}

/** Calendar-day arithmetic on wall dates, immune to timezone shifts. */
function addDays(w: Wall, days: number): Wall {
  const d = new Date(Date.UTC(w.y, w.m - 1, w.d + days, 12))
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), hm: w.hm }
}

function weekdayOf(w: Wall): number {
  return new Date(Date.UTC(w.y, w.m - 1, w.d, 12)).getUTCDay()
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0, 12)).getUTCDate()
}

/** The nth (1-4, or 5 = last) `weekday` of a month, as a day number. */
function nthWeekdayOfMonth(y: number, m: number, weekday: number, nth: number): number {
  const firstWeekday = weekdayOf({ y, m, d: 1, hm: '00:00' })
  const firstMatch = 1 + ((weekday - firstWeekday + 7) % 7)
  if (nth <= 4) {
    const day = firstMatch + (nth - 1) * 7
    return day <= daysInMonth(y, m) ? day : firstMatch + 21
  }
  let day = firstMatch
  while (day + 7 <= daysInMonth(y, m)) day += 7
  return day
}

/** Human label for a rule, derived from the event's first start time —
 *  "Every Sunday", "First Sunday monthly", "Monthly on the 5th". */
export function recurrenceLabel(rule: RecurrenceRule, startIso: string): string {
  const w = toWall(startIso)
  const weekday = WEEKDAYS[weekdayOf(w)]
  switch (rule) {
    case 'weekly':
      return `Every ${weekday}`
    case 'biweekly':
      return `Every other ${weekday}`
    case 'monthly-weekday': {
      const nth = Math.min(Math.ceil(w.d / 7), 5)
      return `${ORDINALS[nth - 1]} ${weekday} monthly`
    }
    case 'monthly-date': {
      const suffix = w.d % 10 === 1 && w.d !== 11 ? 'st' : w.d % 10 === 2 && w.d !== 12 ? 'nd' : w.d % 10 === 3 && w.d !== 13 ? 'rd' : 'th'
      return `Monthly on the ${w.d}${suffix}`
    }
  }
}

/** Recognize the legacy free-text values ("Weekly", "First Sunday monthly")
 *  that predate the dropdown, so existing rows keep repeating correctly. */
export function ruleFromStored(stored: string | null | undefined): RecurrenceRule | null {
  if (!stored) return null
  if (isRecurrenceRule(stored)) return stored
  const t = stored.trim().toLowerCase()
  if (/^every other |^biweekly|^every two weeks/.test(t)) return 'biweekly'
  if (/^weekly|^every (sun|mon|tues|wednes|thurs|fri|satur)day/.test(t)) return 'weekly'
  if (/^(first|second|third|fourth|last) (sun|mon|tues|wednes|thurs|fri|satur)day/.test(t)) return 'monthly-weekday'
  if (/^monthly on/.test(t)) return 'monthly-date'
  return null
}

function nextWall(rule: RecurrenceRule, current: Wall, first: Wall): Wall {
  switch (rule) {
    case 'weekly':
      return addDays(current, 7)
    case 'biweekly':
      return addDays(current, 14)
    case 'monthly-date': {
      let y = current.y
      let m = current.m
      do {
        m += 1
        if (m > 12) {
          m = 1
          y += 1
        }
      } while (daysInMonth(y, m) < first.d)
      return { y, m, d: first.d, hm: first.hm }
    }
    case 'monthly-weekday': {
      const weekday = weekdayOf(first)
      const nth = Math.min(Math.ceil(first.d / 7), 5)
      let y = current.y
      let m = current.m + 1
      if (m > 12) {
        m = 1
        y += 1
      }
      return { y, m, d: nthWeekdayOfMonth(y, m, weekday, nth), hm: first.hm }
    }
  }
}

export type Occurrence = { startDate: string; endDate?: string }

/**
 * Upcoming occurrences of an event, soonest first. Rolls forward from the
 * stored first date, so a weekly event created months ago still shows its
 * next dates. Each occurrence keeps the original duration.
 */
export function upcomingOccurrences(
  event: { startDate: string; endDate?: string | null; recurring?: string | null },
  opts: { from?: Date; max?: number; horizonDays?: number } = {}
): Occurrence[] {
  const { from = new Date(), max = 6, horizonDays = 120 } = opts
  const rule = ruleFromStored(event.recurring)
  const durationMs = event.endDate ? new Date(event.endDate).getTime() - new Date(event.startDate).getTime() : 0

  const occurrence = (startIso: string): Occurrence => ({
    startDate: startIso,
    endDate: durationMs > 0 ? new Date(new Date(startIso).getTime() + durationMs).toISOString() : undefined,
  })

  if (!rule) {
    const endsAt = new Date(event.endDate ?? event.startDate)
    return endsAt.getTime() >= from.getTime() ? [occurrence(event.startDate)] : []
  }

  const first = toWall(event.startDate)
  const horizon = from.getTime() + horizonDays * 86_400_000
  const results: Occurrence[] = []
  let wall = first
  // Safety bound: at most ~5 years of rolling forward from the stored date.
  for (let i = 0; i < 300 && results.length < max; i++) {
    const iso = wallToIso(wall)
    const startsAt = new Date(iso).getTime()
    if (startsAt + durationMs >= from.getTime()) {
      // The next occurrence is always included; the horizon only trims the tail.
      if (results.length > 0 && startsAt > horizon) break
      results.push(occurrence(iso))
    }
    wall = nextWall(rule, wall, first)
  }
  return results
}
