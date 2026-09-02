/**
 * Church-time helpers for the member portal. Everything the congregation
 * sees is rendered in America/Chicago no matter where the server or the
 * member's phone happens to be. Two families of helpers live here:
 *
 *  - instant helpers: turn a stored timestamptz into Chicago wall-clock
 *    parts, date keys, and display strings
 *  - date-key helpers: pure YYYY-MM-DD arithmetic anchored at UTC noon so
 *    daylight-saving changes can never shift a day
 */

export const CHURCH_TIME_ZONE = 'America/Chicago'

export type DateKey = string // YYYY-MM-DD

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: CHURCH_TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  weekday: 'short',
})

export type ChicagoParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  weekday: number // 0 = Sunday
}

const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

export function getChicagoParts(value: string | Date): ChicagoParts | null {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const parts = Object.fromEntries(partsFormatter.formatToParts(date).map((p) => [p.type, p.value]))
  const hour = Number(parts.hour) === 24 ? 0 : Number(parts.hour)
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour,
    minute: Number(parts.minute),
    weekday: WEEKDAY_INDEX[parts.weekday] ?? 0,
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Chicago calendar date of an instant, as YYYY-MM-DD. */
export function getDateKey(value: string | Date): DateKey {
  const p = getChicagoParts(value)
  return p ? `${p.year}-${pad(p.month)}-${pad(p.day)}` : ''
}

export function getTodayKey(now: Date = new Date()): DateKey {
  return getDateKey(now)
}

/** Chicago wall-clock time (HH:MM) of an instant. */
export function getTimeInput(value: string | Date): string {
  const p = getChicagoParts(value)
  return p ? `${pad(p.hour)}:${pad(p.minute)}` : ''
}

export function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d, 12))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}

/**
 * Convert a Chicago wall time to a UTC instant. Tries both Central offsets
 * and keeps the one that round-trips, so a 7 p.m. event stays at 7 p.m.
 * across daylight-saving changes. Returns null for a time that does not
 * exist (the skipped hour in March).
 */
export function chicagoToIso(dateKey: DateKey, time = '00:00'): string | null {
  if (!isValidDateKey(dateKey) || !/^\d{2}:\d{2}$/.test(time)) return null
  for (const offset of ['-05:00', '-06:00']) {
    const candidate = new Date(`${dateKey}T${time}:00${offset}`)
    if (Number.isNaN(candidate.getTime())) continue
    const p = getChicagoParts(candidate)
    if (p && `${p.year}-${pad(p.month)}-${pad(p.day)}` === dateKey && `${pad(p.hour)}:${pad(p.minute)}` === time) {
      return candidate.toISOString()
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Date-key arithmetic (no time zone involved; anchored at UTC noon)
// ---------------------------------------------------------------------------

function keyToUtcNoon(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, 12))
}

function utcToKey(date: Date): DateKey {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

export function addDays(key: DateKey, days: number): DateKey {
  const d = keyToUtcNoon(key)
  d.setUTCDate(d.getUTCDate() + days)
  return utcToKey(d)
}

export function addMonths(key: DateKey, months: number): DateKey {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + months, 1, 12))
  return utcToKey(d)
}

export function weekdayOf(key: DateKey): number {
  return keyToUtcNoon(key).getUTCDay()
}

/** Sunday that starts the week containing `key`. */
export function startOfWeek(key: DateKey): DateKey {
  return addDays(key, -weekdayOf(key))
}

export function startOfMonth(key: DateKey): DateKey {
  return `${key.slice(0, 7)}-01`
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0, 12)).getUTCDate()
}

export function weekKeys(weekStart: DateKey): DateKey[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

/** The 42 cells (6 rows x 7) of a month grid, starting on the Sunday on or before the 1st. */
export function monthGridKeys(monthKey: DateKey): DateKey[] {
  const first = startOfWeek(startOfMonth(monthKey))
  return Array.from({ length: 42 }, (_, i) => addDays(first, i))
}

export function compareKeys(a: DateKey, b: DateKey): number {
  return a < b ? -1 : a > b ? 1 : 0
}

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function monthName(month: number): string {
  return MONTHS[month - 1] ?? ''
}

export function weekdayName(key: DateKey, style: 'long' | 'short' = 'long'): string {
  const name = WEEKDAYS[weekdayOf(key)] ?? ''
  return style === 'short' ? name.slice(0, 3) : name
}

/** "September 6, 2026" from a date key. */
export function formatKey(key: DateKey, opts: { weekday?: boolean; year?: boolean } = {}): string {
  if (!isValidDateKey(key)) return ''
  const [y, m, d] = key.split('-').map(Number)
  const base = `${MONTHS[m - 1]} ${d}${opts.year === false ? '' : `, ${y}`}`
  return opts.weekday ? `${WEEKDAYS[weekdayOf(key)]}, ${base}` : base
}

/** "September 6" from a stored date (birthday, anniversary). */
export function formatMonthDay(value: string | null | undefined): string {
  if (!value || !isValidDateKey(value)) return ''
  const [, m, d] = value.split('-').map(Number)
  return `${MONTHS[m - 1]} ${d}`
}

/** "10:00 AM" in Chicago time. */
export function formatTime(value: string | Date): string {
  const p = getChicagoParts(value)
  if (!p) return ''
  const hour12 = p.hour % 12 === 0 ? 12 : p.hour % 12
  return `${hour12}:${pad(p.minute)} ${p.hour < 12 ? 'AM' : 'PM'}`
}

/** "Sunday, September 6 at 10:00 AM", or "All day" variants. */
export function formatWhen(startsAt: string, endsAt: string | null, allDay: boolean): string {
  const startKey = getDateKey(startsAt)
  const endKey = endsAt ? getDateKey(endsAt) : startKey
  const sameDay = startKey === endKey
  if (allDay) {
    return sameDay ? formatKey(startKey, { weekday: true }) : `${formatKey(startKey)} to ${formatKey(endKey)}`
  }
  const start = `${formatKey(startKey, { weekday: true })} at ${formatTime(startsAt)}`
  if (!endsAt) return start
  return sameDay ? `${start} to ${formatTime(endsAt)}` : `${start} to ${formatKey(endKey)} at ${formatTime(endsAt)}`
}

/** Short time range for calendar cells: "10:00 AM" or "10:00 AM to 11:30 AM". */
export function formatTimeRange(startsAt: string, endsAt: string | null, allDay: boolean): string {
  if (allDay) return 'All day'
  const start = formatTime(startsAt)
  if (!endsAt || getDateKey(endsAt) !== getDateKey(startsAt)) return start
  return `${start} to ${formatTime(endsAt)}`
}

/** Week label: "September 6 to 12, 2026", crossing months and years cleanly. */
export function formatWeekRange(weekStart: DateKey): string {
  const end = addDays(weekStart, 6)
  const [sy, sm, sd] = weekStart.split('-').map(Number)
  const [ey, em, ed] = end.split('-').map(Number)
  if (sy === ey && sm === em) return `${MONTHS[sm - 1]} ${sd} to ${ed}, ${sy}`
  if (sy === ey) return `${MONTHS[sm - 1]} ${sd} to ${MONTHS[em - 1]} ${ed}, ${sy}`
  return `${MONTHS[sm - 1]} ${sd}, ${sy} to ${MONTHS[em - 1]} ${ed}, ${ey}`
}

/** Relative label for notification and chat timestamps. */
export function formatRelative(value: string, now: Date = new Date()): string {
  const then = new Date(value).getTime()
  const seconds = Math.max(0, Math.floor((now.getTime() - then) / 1000))
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const key = getDateKey(value)
  const [y, m, d] = key.split('-').map(Number)
  return `${MONTHS[m - 1]?.slice(0, 3)} ${d}${y === getChicagoParts(now)?.year ? '' : `, ${y}`}`
}

/** "Today", "Yesterday", weekday within the week, else the full date. */
export function formatDaySeparator(key: DateKey, todayKey: DateKey = getTodayKey()): string {
  if (key === todayKey) return 'Today'
  if (key === addDays(todayKey, -1)) return 'Yesterday'
  const diff = (keyToUtcNoon(todayKey).getTime() - keyToUtcNoon(key).getTime()) / 86_400_000
  if (diff > 0 && diff < 7) return weekdayName(key)
  return formatKey(key)
}

/** Chat list timestamp: time if today, else a short date. */
export function formatConversationStamp(value: string, now: Date = new Date()): string {
  const key = getDateKey(value)
  if (key === getTodayKey(now)) return formatTime(value)
  const [y, m, d] = key.split('-').map(Number)
  return `${MONTHS[m - 1]?.slice(0, 3)} ${d}${y === getChicagoParts(now)?.year ? '' : `, ${y}`}`
}
