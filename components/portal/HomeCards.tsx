import Link from 'next/link'
import { Surface } from '@/components/primitives/Surface'
import { Badge } from '@/components/primitives/Badge'
import { Button } from '@/components/primitives/Button'
import { EmptyState } from '@/components/primitives/Feedback'
import { CalendarIcon, CheckIcon, ClipboardIcon } from '@/components/ui/icons'
import type { OnboardingStatus } from '@/lib/portal/onboarding'
import type { PrintDay } from '@/lib/portal/service-schedule'
import { dutyLabel } from '@/lib/portal/service-schedule'
import { formatTimeRange, formatKey, getDateKey } from '@/lib/portal/time'
import type { CalendarItem } from '@/lib/portal/types'
import { categoryTone } from '@/lib/portal/calendar'

/** Members home building blocks: setup checklist, upcoming, service assignments. */

export function SetupChecklist({ status }: { status: OnboardingStatus }) {
  if (status.isComplete) return null
  return (
    <Surface tone="panel" as="section" aria-labelledby="setup-checklist-heading" className="setup-checklist">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="m-0 text-sm font-semibold uppercase tracking-wide text-primary-strong">Getting started</p>
          <h2 id="setup-checklist-heading" className="m-0 text-xl">
            {status.completedCount} of {status.totalCount} steps done
          </h2>
        </div>
        <Badge tone={status.percentComplete >= 66 ? 'primary' : 'neutral'}>{status.percentComplete}%</Badge>
      </div>
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {status.items.map((item) => (
          <li key={item.key} className="flex items-start gap-3 rounded-md bg-bg px-3 py-2">
            <span
              aria-hidden="true"
              className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border ${item.complete ? 'border-success bg-success text-on-status' : 'border-border-strong'}`}
            >
              {item.complete ? <CheckIcon className="h-4 w-4" /> : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-heading">
                {item.title}
                {item.complete ? <span className="sr-only"> (done)</span> : null}
              </span>
              <span className="block text-sm text-muted">{item.description}</span>
            </span>
            {!item.complete ? (
              <Link href={item.href} className="shrink-0 text-sm font-semibold">
                {item.actionLabel}
              </Link>
            ) : null}
          </li>
        ))}
      </ol>
      <p className="m-0 mt-3 text-xs text-muted">None of this blocks anything. The full guide is at the getting started page whenever you want it.</p>
    </Surface>
  )
}

const toneClass: Record<ReturnType<typeof categoryTone>, string> = {
  primary: 'bg-primary-strong',
  accent: 'bg-accent-strong',
  gold: 'bg-secondary',
  deep: 'bg-surface-deep',
  neutral: 'bg-border-strong',
}

export function UpcomingList({ items }: { items: CalendarItem[] }) {
  if (!items.length) {
    return (
      <EmptyState icon={<CalendarIcon className="h-6 w-6" />} title="Nothing scheduled in the next month">
        <p>Events added by the church office or by members appear here.</p>
      </EmptyState>
    )
  }
  return (
    <ul className="upcoming-list m-0 flex list-none flex-col divide-y divide-border/40 p-0">
      {items.map((item) => {
        const key = getDateKey(item.startsAt)
        const inner = (
          <>
            <span aria-hidden="true" className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${toneClass[categoryTone(item.category)]}`} />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-heading">{item.title}</span>
              <span className="block text-sm text-muted">
                {formatKey(key, { weekday: true, year: false })} · {formatTimeRange(item.startsAt, item.endsAt, item.allDay)}
                {item.location ? ` · ${item.location}` : ''}
              </span>
            </span>
          </>
        )
        return (
          <li key={item.id}>
            {item.href ? (
              <Link href={item.href} className="flex items-start gap-3 py-3 no-underline hover:bg-surface">
                {inner}
              </Link>
            ) : (
              <Link href={`/members/calendar?date=${key}`} className="flex items-start gap-3 py-3 no-underline hover:bg-surface">
                {inner}
              </Link>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function ServiceAssignmentsCard({ days, arranger }: { days: PrintDay[]; arranger: string | null }) {
  return (
    <Surface tone="card" as="section" aria-labelledby="service-assignments-heading" className="service-assignments-card">
      <div className="mb-3 flex items-center gap-2">
        <ClipboardIcon className="h-5 w-5 text-primary-strong" />
        <h2 id="service-assignments-heading" className="m-0 text-xl">
          Who is serving next
        </h2>
      </div>
      {arranger ? <p className="m-0 mb-3 text-sm text-muted">This month arranged by {arranger}.</p> : null}
      {days.length ? (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {days.map((day) => (
            <li key={day.dateKey}>
              <p className="m-0 text-sm font-semibold uppercase tracking-wide text-muted">{day.dayLabel}</p>
              {day.blocks.map((block) => (
                <dl key={block.slot} className="m-0 mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
                  <dt className="font-semibold text-heading">{block.label}</dt>
                  <dd className="m-0">
                    {block.assignments.map((a) => (
                      <span key={a.id} className="block">
                        <span className="text-muted">{dutyLabel(a.duty)}:</span> {a.name}
                      </span>
                    ))}
                  </dd>
                </dl>
              ))}
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 text-sm text-muted">No assignments have been entered for the coming assemblies yet.</p>
      )}
      <div className="mt-4">
        <Button href="/members/schedule" variant="ghost" size="sm">
          Full schedule
        </Button>
      </div>
    </Surface>
  )
}
