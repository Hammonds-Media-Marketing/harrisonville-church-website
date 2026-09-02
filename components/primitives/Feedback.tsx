import type { ReactNode } from 'react'

/**
 * Feedback primitives: status notices, empty states, stat tiles, and
 * loading skeletons. Each is defined once and reused across the portal.
 */

type NoticeTone = 'info' | 'success' | 'error' | 'warning'

const noticeTones: Record<NoticeTone, string> = {
  info: 'border-primary/40 bg-surface text-ink',
  success: 'border-success/40 bg-success-surface text-ink',
  error: 'border-error/40 bg-error-surface text-ink',
  warning: 'border-warning/50 bg-surface text-ink',
}

export function Notice({
  tone = 'info',
  title,
  children,
  className = '',
}: {
  tone?: NoticeTone
  title?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`notice rounded-md border px-4 py-3 text-sm ${noticeTones[tone]} ${className}`}
    >
      {title ? <p className="m-0 mb-1 font-semibold text-heading">{title}</p> : null}
      <div className="[&>p]:m-0">{children}</div>
    </div>
  )
}

/** Reads ?saved / ?error / ?notice params and renders the matching notice. */
export function ParamNotices({
  params,
  messages = {},
}: {
  params: { saved?: string; deleted?: string; error?: string; notice?: string }
  messages?: Record<string, string>
}) {
  if (params.saved) return <Notice tone="success" className="mb-5">{messages[`saved:${params.saved}`] ?? messages.saved ?? 'Saved.'}</Notice>
  if (params.deleted) return <Notice tone="success" className="mb-5">{messages.deleted ?? 'Removed.'}</Notice>
  if (params.notice) return <Notice tone="info" className="mb-5">{messages[`notice:${params.notice}`] ?? params.notice}</Notice>
  if (params.error) {
    return (
      <Notice tone="error" className="mb-5">
        {messages[`error:${params.error}`] ?? messages.error ?? 'That did not save. Check the form and try again.'}
      </Notice>
    )
  }
  return null
}

export function EmptyState({
  icon,
  title,
  children,
  action,
  className = '',
}: {
  icon?: ReactNode
  title: string
  children?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={`empty-state rounded-lg border border-dashed border-border bg-surface px-5 py-8 text-center ${className}`}>
      {icon ? <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-bg text-primary-strong shadow-sm">{icon}</div> : null}
      <p className="m-0 font-display text-lg font-semibold text-heading">{title}</p>
      {children ? <div className="mx-auto mt-1 max-w-md text-sm text-muted [&>p]:m-0">{children}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function StatTile({
  label,
  value,
  helper,
  tone = 'default',
  href,
}: {
  label: string
  value: ReactNode
  helper?: string
  tone?: 'default' | 'primary' | 'gold'
  href?: string
}) {
  const tones = {
    default: 'bg-bg border-border-strong/40',
    primary: 'bg-surface border-primary/40',
    gold: 'bg-bg border-secondary',
  }
  const body = (
    <>
      <p className="m-0 text-sm font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="m-0 font-display text-3xl text-heading">{value}</p>
      {helper ? <p className="m-0 text-sm text-muted">{helper}</p> : null}
    </>
  )
  const cls = `stat-tile flex flex-col gap-1 rounded-lg border p-4 shadow-sm ${tones[tone]}`
  if (href) {
    return (
      <a href={href} className={`${cls} no-underline transition-shadow hover:shadow-md`}>
        {body}
      </a>
    )
  }
  return <div className={cls}>{body}</div>
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`skeleton block animate-pulse rounded-md bg-surface-2 ${className}`} />
}

/** Small count marker used on nav items and the bell. */
export function CountBadge({ count, label, className = '' }: { count: number; label: string; className?: string }) {
  if (count <= 0) return null
  return (
    <span
      aria-label={label}
      className={`count-badge inline-grid min-w-5 place-items-center rounded-full bg-error px-1.5 py-0.5 text-center text-xs font-bold leading-none text-on-status ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
