import Link from 'next/link'
import { Avatar } from '@/components/primitives/Avatar'
import { Surface } from '@/components/primitives/Surface'
import { Badge } from '@/components/primitives/Badge'
import { MailIcon, MapPinIcon, MessageIcon, PhoneIcon } from '@/components/ui/icons'
import { formatMonthDay } from '@/lib/portal/time'

/** Shared layout for a member or child page: photo, name, actions, facts. */

export function telHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '')
  return `tel:${digits.startsWith('+') ? digits : digits.replace(/^1?/, '+1')}`
}

export function mapsHref(lines: string[]): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lines.join(', '))}`
}

export function PersonHeader({
  name,
  photo,
  photoPosition,
  subtitle,
  badges,
  actions,
}: {
  name: string
  photo: string | null
  photoPosition: string
  subtitle?: string | null
  badges?: Array<{ label: string; tone?: 'neutral' | 'primary' | 'gold' }>
  actions?: Array<{ href: string; label: string; icon: 'phone' | 'mail' | 'message' | 'map' }>
}) {
  const icon = (kind: 'phone' | 'mail' | 'message' | 'map') => {
    const cls = 'h-5 w-5'
    if (kind === 'phone') return <PhoneIcon className={cls} />
    if (kind === 'mail') return <MailIcon className={cls} />
    if (kind === 'map') return <MapPinIcon className={cls} />
    return <MessageIcon className={cls} />
  }
  return (
    <Surface tone="card" as="header" className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
      <Avatar name={name} photo={photo} photoPosition={photoPosition} size="xl" priority />
      <div className="min-w-0 flex-1">
        <h2 className="m-0 text-2xl">{name}</h2>
        {subtitle ? <p className="m-0 mt-1 text-muted">{subtitle}</p> : null}
        {badges?.length ? (
          <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
            {badges.map((b) => (
              <Badge key={b.label} tone={b.tone ?? 'neutral'}>
                {b.label}
              </Badge>
            ))}
          </div>
        ) : null}
        {actions?.length ? (
          <ul className="m-0 mt-4 flex list-none flex-wrap justify-center gap-2 p-0 sm:justify-start">
            {actions.map((a) => (
              <li key={a.href}>
                <Link
                  href={a.href}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border-strong px-4 py-2 text-sm font-semibold text-primary-strong no-underline transition-colors hover:bg-surface"
                >
                  {icon(a.icon)}
                  {a.label}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Surface>
  )
}

export function FactList({ facts }: { facts: Array<{ label: string; value: string | null; href?: string }> }) {
  return (
    <dl className="m-0 grid gap-3 sm:grid-cols-2">
      {facts.map((f) => (
        <div key={f.label} className="rounded-md border border-border/60 bg-bg p-4">
          <dt className="text-sm font-semibold uppercase tracking-wide text-muted">{f.label}</dt>
          <dd className="m-0 mt-1 text-ink">{f.value ? f.href ? <a href={f.href}>{f.value}</a> : f.value : <span className="text-muted">Not listed</span>}</dd>
        </div>
      ))}
    </dl>
  )
}

export function birthdayFact(value: string | null): string | null {
  return value ? formatMonthDay(value) : null
}
