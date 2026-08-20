/** Shared formatting helpers. */

export function formatDate(iso: string): string {
  // Parse as a date-only value in a stable way (avoid TZ drift for YYYY-MM-DD).
  const d = iso.length <= 10 ? new Date(`${iso}T12:00:00`) : new Date(iso)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function formatDateRange(startIso: string, endIso?: string): string {
  const start = new Date(startIso)
  const startStr = start.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const timeStr = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (!endIso) return `${startStr} at ${timeStr}`
  const end = new Date(endIso)
  const sameDay = start.toDateString() === end.toDateString()
  if (sameDay) {
    return `${startStr} at ${timeStr}`
  }
  const endStr = end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  return `${startStr} – ${endStr}`
}

export function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}

/** The congregation's timezone; event times are entered and shown as local
 *  church time regardless of where the server runs. */
const CHURCH_TZ = 'America/Chicago'

/** ISO instant -> value for a datetime-local input, in church time. */
export function isoToLocalInput(iso: string): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: CHURCH_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = Object.fromEntries(fmt.formatToParts(new Date(iso)).map((p) => [p.type, p.value]))
  const hour = parts.hour === '24' ? '00' : parts.hour
  return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}`
}

/** datetime-local value (naive church time) -> ISO instant. Tries both the
 *  CST and CDT offsets and keeps the one that round-trips. */
export function localInputToIso(naive: string): string {
  for (const offset of ['-05:00', '-06:00']) {
    const candidate = new Date(`${naive}:00${offset}`)
    if (!Number.isNaN(candidate.getTime()) && isoToLocalInput(candidate.toISOString()) === naive) {
      return candidate.toISOString()
    }
  }
  return new Date(`${naive}:00-06:00`).toISOString()
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}
