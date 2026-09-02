import { upcomingOccurrences } from '@/lib/recurrence'
import { addDays, compareKeys, getDateKey, type DateKey } from '@/lib/portal/time'
import type { CalendarItem } from '@/lib/portal/types'

/**
 * Pure calendar helpers: expand recurring rows into the visible range and
 * bucket occurrences by Chicago day so the grid can render them.
 */

export const CALENDAR_CATEGORIES = ['Worship', 'Bible Study', 'Fellowship', 'Outreach', 'Youth', 'Meeting', 'Other'] as const
export type CalendarCategory = (typeof CALENDAR_CATEGORIES)[number]

/** Token-driven color role per category; every pairing is in the contrast gate. */
export function categoryTone(category: string): 'primary' | 'accent' | 'gold' | 'deep' | 'neutral' {
  switch (category) {
    case 'Worship':
      return 'primary'
    case 'Bible Study':
      return 'accent'
    case 'Fellowship':
    case 'Special event':
      return 'gold'
    case 'Outreach':
    case 'Youth':
      return 'deep'
    default:
      return 'neutral'
  }
}

export type CalendarRange = { start: DateKey; end: DateKey } // inclusive

/**
 * Occurrences of one stored event that touch the range. One-time events
 * return themselves when they overlap; recurring events roll forward from
 * their first date up to the range end (and an optional series end date).
 */
export function occurrencesInRange(
  item: Omit<CalendarItem, 'id'> & { id: string; recurrenceEndsOn?: string | null },
  range: CalendarRange
): CalendarItem[] {
  const rangeStartMs = new Date(`${range.start}T00:00:00-06:00`).getTime() - 12 * 3_600_000
  const rangeEndMs = new Date(`${addDays(range.end, 1)}T00:00:00-05:00`).getTime() + 12 * 3_600_000
  if (!item.recurring) {
    const endMs = new Date(item.endsAt ?? item.startsAt).getTime()
    const startMs = new Date(item.startsAt).getTime()
    return endMs >= rangeStartMs && startMs <= rangeEndMs ? [item] : []
  }
  const from = new Date(Math.min(rangeStartMs, new Date(item.startsAt).getTime()))
  const horizonDays = Math.ceil((rangeEndMs - from.getTime()) / 86_400_000) + 1
  const occurrences = upcomingOccurrences(
    { startDate: item.startsAt, endDate: item.endsAt, recurring: item.recurring },
    { from, max: 400, horizonDays }
  )
  const seriesEnd = item.recurrenceEndsOn ?? null
  return occurrences
    .filter((o) => {
      const key = getDateKey(o.startDate)
      if (compareKeys(key, range.end) > 0) return false
      if (seriesEnd && compareKeys(key, seriesEnd) > 0) return false
      const endMs = new Date(o.endDate ?? o.startDate).getTime()
      return endMs >= rangeStartMs
    })
    .map((o) => ({ ...item, id: `${item.id}:${getDateKey(o.startDate)}`, startsAt: o.startDate, endsAt: o.endDate ?? null }))
}

/** Every day key an item spans, clipped to the range. */
export function daysSpanned(item: Pick<CalendarItem, 'startsAt' | 'endsAt'>, range: CalendarRange): DateKey[] {
  const startKey = getDateKey(item.startsAt)
  const endKey = item.endsAt ? getDateKey(item.endsAt) : startKey
  const out: DateKey[] = []
  let key = compareKeys(startKey, range.start) < 0 ? range.start : startKey
  const last = compareKeys(endKey, range.end) > 0 ? range.end : endKey
  let guard = 0
  while (compareKeys(key, last) <= 0 && guard++ < 62) {
    out.push(key)
    key = addDays(key, 1)
  }
  return out
}

/** Map of day key to the items on that day, sorted all-day first then by start. */
export function bucketByDay(items: CalendarItem[], range: CalendarRange): Map<DateKey, CalendarItem[]> {
  const map = new Map<DateKey, CalendarItem[]>()
  for (const item of items) {
    for (const key of daysSpanned(item, range)) {
      const list = map.get(key) ?? []
      list.push(item)
      map.set(key, list)
    }
  }
  for (const list of map.values()) {
    list.sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.startsAt.localeCompare(b.startsAt) || a.title.localeCompare(b.title))
  }
  return map
}

export function sortItems(items: CalendarItem[]): CalendarItem[] {
  return [...items].sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.title.localeCompare(b.title))
}
