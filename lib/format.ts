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

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}
