import { compareKeys, getTodayKey, startOfWeek, weekKeys, type DateKey } from '@/lib/portal/time'

/**
 * Birthdays and anniversaries for a Sunday-to-Saturday week. Matching is on
 * the month-day of the stored date, so a February 29 birthday shows only in
 * a week that actually contains February 29; the page says so.
 */

export type CelebrationPerson = {
  id: string
  displayName: string
  photo: string | null
  photoPosition: string
  birthday: string | null
  anniversary?: string | null
  familyId: string | null
  familyName: string | null
  familyPhoto?: string | null
  kind: 'adult' | 'child'
}

export type Celebration = {
  key: string
  personId: string
  dateKey: DateKey
  displayName: string
  photo: string | null
  photoPosition: string
  familyName: string | null
  kind: 'adult' | 'child'
  isToday: boolean
}

export function weekFor(dateKey: DateKey): DateKey {
  return startOfWeek(dateKey)
}

/** The week key in `keys` whose month-day matches a stored YYYY-MM-DD date. */
export function findInWeek(stored: string | null | undefined, keys: DateKey[]): DateKey | null {
  if (!stored || !/^\d{4}-\d{2}-\d{2}$/.test(stored)) return null
  const monthDay = stored.slice(5)
  return keys.find((k) => k.slice(5) === monthDay) ?? null
}

function compare(a: Celebration, b: Celebration): number {
  return compareKeys(a.dateKey, b.dateKey) || a.displayName.localeCompare(b.displayName)
}

export function buildBirthdays(people: CelebrationPerson[], weekStart: DateKey, todayKey: DateKey = getTodayKey()): Celebration[] {
  const keys = weekKeys(weekStart)
  const out: Celebration[] = []
  for (const p of people) {
    const dateKey = findInWeek(p.birthday, keys)
    if (!dateKey) continue
    out.push({
      key: `birthday-${p.id}`,
      personId: p.id,
      dateKey,
      displayName: p.displayName,
      photo: p.photo,
      photoPosition: p.photoPosition,
      familyName: p.kind === 'child' ? p.familyName : null,
      kind: p.kind,
      isToday: dateKey === todayKey,
    })
  }
  return out.sort(compare)
}

/**
 * Anniversaries are de-duplicated per family: a couple sharing a date shows
 * once, named for the family. Members without a family show individually.
 */
export function buildAnniversaries(people: CelebrationPerson[], weekStart: DateKey, todayKey: DateKey = getTodayKey()): Celebration[] {
  const keys = weekKeys(weekStart)
  const seen = new Map<string, Celebration>()
  for (const p of people) {
    if (p.kind !== 'adult') continue
    const dateKey = findInWeek(p.anniversary, keys)
    if (!dateKey || !p.anniversary) continue
    const dedupe = p.familyId ? `family-${p.familyId}-${p.anniversary.slice(5)}` : `member-${p.id}`
    if (seen.has(dedupe)) continue
    seen.set(dedupe, {
      key: `anniversary-${dedupe}`,
      personId: p.id,
      dateKey,
      displayName: p.familyId && p.familyName ? `The ${p.familyName} family` : p.displayName,
      photo: p.familyId ? p.familyPhoto ?? p.photo : p.photo,
      photoPosition: p.photoPosition,
      familyName: null,
      kind: 'adult',
      isToday: dateKey === todayKey,
    })
  }
  return Array.from(seen.values()).sort(compare)
}
