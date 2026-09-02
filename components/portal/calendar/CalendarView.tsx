'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/primitives/Button'
import { Dialog } from '@/components/primitives/Dialog'
import { Badge } from '@/components/primitives/Badge'
import { SegmentedControl } from '@/components/primitives/Controls'
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon, MapPinIcon, PlusIcon } from '@/components/ui/icons'
import { categoryTone } from '@/lib/portal/calendar'
import { addDays, addMonths, formatKey, formatTimeRange, formatWeekRange, formatWhen, monthGridKeys, monthName, startOfWeek, weekKeys, weekdayName, type DateKey } from '@/lib/portal/time'
import type { CalendarItem } from '@/lib/portal/types'
import { CalendarEventForm } from '@/components/portal/calendar/CalendarEventForm'

/**
 * Month, week, and day views over one merged list of occurrences. The grid
 * is a real table-like structure with a roving tab stop: arrow keys move
 * between days, Enter opens the day. Tapping a day opens its list; tapping
 * an item opens its detail (or navigates, for public and special events).
 * State lives in the URL (?view, ?date) so a view survives reload and can
 * be shared.
 */

export type CalendarMode = 'month' | 'week' | 'day'

const dot: Record<ReturnType<typeof categoryTone>, string> = {
  primary: 'bg-primary-strong',
  accent: 'bg-accent-strong',
  gold: 'bg-secondary',
  deep: 'bg-surface-deep',
  neutral: 'bg-border-strong',
}

const chip: Record<ReturnType<typeof categoryTone>, string> = {
  primary: 'bg-primary-strong text-on-primary',
  accent: 'bg-accent-strong text-on-accent',
  gold: 'bg-secondary text-on-secondary',
  deep: 'bg-surface-deep text-on-deep',
  neutral: 'bg-surface-2 text-ink',
}

const sourceLabel: Record<CalendarItem['source'], string> = {
  public: 'Public event',
  members: 'Members only',
  special: 'Event with sign-ups',
  service: 'Service assignment',
}

export function CalendarView({
  mode,
  date,
  todayKey,
  items,
  canManage,
}: {
  mode: CalendarMode
  date: DateKey
  todayKey: DateKey
  items: CalendarItem[]
  canManage: boolean
}) {
  const router = useRouter()
  const [selectedDay, setSelectedDay] = useState<DateKey | null>(null)
  const [openItem, setOpenItem] = useState<CalendarItem | null>(null)
  const [editing, setEditing] = useState<{ item: CalendarItem | null; dateKey: DateKey } | null>(null)
  const [focusKey, setFocusKey] = useState<DateKey>(date)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => setFocusKey(date), [date])

  const days = useMemo(() => (mode === 'month' ? monthGridKeys(date) : mode === 'week' ? weekKeys(startOfWeek(date)) : [date]), [mode, date])
  const byDay = useMemo(() => {
    const map = new Map<DateKey, CalendarItem[]>()
    for (const item of items) {
      const key = itemDayKey(item)
      const list = map.get(key) ?? []
      list.push(item)
      map.set(key, list)
    }
    return map
  }, [items])

  function go(nextMode: CalendarMode, nextDate: DateKey) {
    router.replace(`/members/calendar?view=${nextMode}&date=${nextDate}`, { scroll: false })
  }
  function move(delta: number) {
    go(mode, mode === 'month' ? addMonths(date, delta) : mode === 'week' ? addDays(date, 7 * delta) : addDays(date, delta))
  }

  const title = mode === 'month' ? `${monthName(Number(date.slice(5, 7)))} ${date.slice(0, 4)}` : mode === 'week' ? formatWeekRange(startOfWeek(date)) : formatKey(date, { weekday: true })

  function onGridKey(e: React.KeyboardEvent) {
    const step: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 }
    if (e.key in step) {
      e.preventDefault()
      const next = addDays(focusKey, mode === 'day' ? Math.sign(step[e.key]) : step[e.key])
      if (!days.includes(next)) return go(mode, next)
      setFocusKey(next)
      requestAnimationFrame(() => gridRef.current?.querySelector<HTMLElement>(`[data-day="${next}"]`)?.focus())
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openDay(focusKey)
    }
  }

  function openDay(key: DateKey) {
    const list = byDay.get(key) ?? []
    setFocusKey(key)
    if (list.length) setSelectedDay(key)
    else if (canManage) setEditing({ item: null, dateKey: key })
    else setSelectedDay(key)
  }

  function openEntry(item: CalendarItem) {
    if (item.href && item.source !== 'members') return router.push(item.href)
    setSelectedDay(null)
    setOpenItem(item)
  }

  const gridCols = mode === 'month' ? 'grid-cols-7' : mode === 'week' ? 'grid-cols-1 md:grid-cols-7' : 'grid-cols-1'

  return (
    <div className="calendar-view flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => move(-1)} aria-label={`Previous ${mode}`} className="grid h-11 w-11 place-items-center rounded-full border border-border-strong text-primary-strong hover:bg-surface">
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <h2 className="m-0 min-w-[12rem] text-center text-xl md:text-2xl" aria-live="polite">
            {title}
          </h2>
          <button type="button" onClick={() => move(1)} aria-label={`Next ${mode}`} className="grid h-11 w-11 place-items-center rounded-full border border-border-strong text-primary-strong hover:bg-surface">
            <ChevronRightIcon className="h-5 w-5" />
          </button>
          <Button type="button" variant="ghost" size="sm" onClick={() => go(mode, todayKey)}>
            Today
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            label="Calendar view"
            value={mode}
            size="sm"
            segments={[
              { value: 'month', label: 'Month', href: `/members/calendar?view=month&date=${date}` },
              { value: 'week', label: 'Week', href: `/members/calendar?view=week&date=${date}` },
              { value: 'day', label: 'Day', href: `/members/calendar?view=day&date=${date}` },
            ]}
          />
          {canManage ? (
            <Button type="button" variant="primary" size="sm" onClick={() => setEditing({ item: null, dateKey: date })}>
              <PlusIcon className="h-4 w-4" /> Add event
            </Button>
          ) : null}
        </div>
      </div>

      {mode === 'month' ? (
        <div className="grid grid-cols-7 gap-1.5 px-0.5 text-center text-xs font-semibold uppercase tracking-wide text-muted" aria-hidden="true">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
      ) : null}

      <div ref={gridRef} role="grid" aria-label={`${title}, ${mode} view`} onKeyDown={onGridKey} className={`grid gap-1.5 sm:gap-2 ${gridCols}`}>
        {days.map((key) => {
          const list = byDay.get(key) ?? []
          const isToday = key === todayKey
          const outside = mode === 'month' && key.slice(0, 7) !== date.slice(0, 7)
          const focused = key === focusKey
          return (
            <div
              key={key}
              role="gridcell"
              data-day={key}
              tabIndex={focused ? 0 : -1}
              aria-label={`${formatKey(key, { weekday: true })}, ${list.length} ${list.length === 1 ? 'item' : 'items'}`}
              aria-selected={focused}
              onClick={() => openDay(key)}
              className={`calendar-day flex cursor-pointer flex-col rounded-lg border p-1.5 text-left transition-colors sm:p-2 ${
                mode === 'month' ? 'min-h-[4.5rem] md:min-h-28' : 'min-h-28'
              } ${isToday ? 'border-secondary bg-surface' : 'border-border/50 bg-bg hover:bg-surface'} ${outside ? 'opacity-50' : ''} ${focused ? 'ring-2 ring-focus ring-offset-1' : ''}`}
            >
              <div className="mb-1 flex items-baseline justify-between gap-1">
                {mode !== 'month' ? <span className="text-xs font-semibold uppercase tracking-wide text-muted">{weekdayName(key, 'short')}</span> : null}
                <span className={`ml-auto grid h-7 w-7 place-items-center rounded-full text-sm font-semibold ${isToday ? 'bg-secondary text-on-secondary' : 'text-heading'}`}>{Number(key.slice(8, 10))}</span>
              </div>
              {list.length ? (
                <>
                  {/* Phones in month view: a dot and a count keeps 42 cells legible. */}
                  {mode === 'month' ? (
                    <span className="flex items-center gap-1 md:hidden" aria-hidden="true">
                      <span className={`h-2 w-2 rounded-full ${dot[categoryTone(list[0].category)]}`} />
                      <span className="text-xs font-semibold text-primary-strong">{list.length}</span>
                    </span>
                  ) : null}
                  <ul className={`m-0 flex list-none flex-col gap-1 p-0 ${mode === 'month' ? 'hidden md:flex' : ''}`}>
                    {list.slice(0, mode === 'month' ? 3 : 20).map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEntry(item)
                          }}
                          className={`w-full truncate rounded px-1.5 py-0.5 text-left text-xs font-semibold ${chip[categoryTone(item.category)]}`}
                          title={item.title}
                        >
                          {!item.allDay && mode !== 'month' ? <span className="mr-1 font-normal opacity-80">{formatTimeRange(item.startsAt, null, false)}</span> : null}
                          {item.title}
                        </button>
                      </li>
                    ))}
                    {mode === 'month' && list.length > 3 ? <li className="px-1 text-xs text-muted">+{list.length - 3} more</li> : null}
                  </ul>
                </>
              ) : mode === 'day' ? (
                <p className="m-0 mt-4 text-center text-sm text-muted">Nothing on the calendar this day.</p>
              ) : null}
            </div>
          )
        })}
      </div>

      <Legend />

      <Dialog open={Boolean(selectedDay)} onClose={() => setSelectedDay(null)} title={selectedDay ? formatKey(selectedDay, { weekday: true }) : ''} size="md">
        {selectedDay ? (
          <div className="flex flex-col gap-2">
            {(byDay.get(selectedDay) ?? []).map((item) => (
              <button key={item.id} type="button" onClick={() => openEntry(item)} className="flex items-start gap-3 rounded-md border border-border/60 bg-bg p-3 text-left hover:bg-surface">
                <span aria-hidden="true" className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dot[categoryTone(item.category)]}`} />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-heading">{item.title}</span>
                  <span className="block text-sm text-muted">
                    {formatTimeRange(item.startsAt, item.endsAt, item.allDay)}
                    {item.location ? ` · ${item.location}` : ''}
                  </span>
                </span>
              </button>
            ))}
            {!(byDay.get(selectedDay) ?? []).length ? <p className="m-0 text-sm text-muted">Nothing on the calendar this day.</p> : null}
            {canManage ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const key = selectedDay
                  setSelectedDay(null)
                  setEditing({ item: null, dateKey: key })
                }}
              >
                <PlusIcon className="h-4 w-4" /> Add an event on this day
              </Button>
            ) : null}
          </div>
        ) : null}
      </Dialog>

      <Dialog open={Boolean(openItem)} onClose={() => setOpenItem(null)} title={openItem?.title ?? ''} size="md">
        {openItem ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge tone="neutral">{openItem.category}</Badge>
              <Badge tone={openItem.visibility === 'leaders' ? 'gold' : 'primary'}>{openItem.visibility === 'leaders' ? 'Leaders only' : sourceLabel[openItem.source]}</Badge>
              {openItem.recurring ? <Badge tone="neutral">Repeats</Badge> : null}
            </div>
            <p className="m-0 flex items-start gap-2 text-ink">
              <ClockIcon className="mt-1 h-4 w-4 shrink-0 text-primary-strong" /> {formatWhen(openItem.startsAt, openItem.endsAt, openItem.allDay)}
            </p>
            {openItem.location ? (
              <p className="m-0 flex items-start gap-2 text-ink">
                <MapPinIcon className="mt-1 h-4 w-4 shrink-0 text-primary-strong" /> {openItem.location}
              </p>
            ) : null}
            {openItem.description ? <p className="m-0 whitespace-pre-wrap text-muted">{openItem.description}</p> : null}
            {openItem.href ? (
              <Link href={openItem.href} className="font-semibold">
                Open
              </Link>
            ) : null}
            {canManage && openItem.editableId ? (
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const item = openItem
                    setOpenItem(null)
                    setEditing({ item, dateKey: itemDayKey(item) })
                  }}
                >
                  Edit
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Dialog>

      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.item ? 'Edit event' : 'Add a members event'} size="lg">
        {editing ? <CalendarEventForm item={editing.item} defaultDate={editing.dateKey} /> : null}
      </Dialog>
    </div>
  )
}

function itemDayKey(item: CalendarItem): DateKey {
  // Occurrence ids from the expander carry their day; otherwise derive it.
  const fromId = item.id.split(':').pop()
  return fromId && /^\d{4}-\d{2}-\d{2}$/.test(fromId) ? fromId : dayKeyFromIso(item.startsAt)
}

function dayKeyFromIso(iso: string): DateKey {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))
  return parts
}

function Legend() {
  const entries: Array<[string, ReturnType<typeof categoryTone>]> = [
    ['Worship', 'primary'],
    ['Bible Study', 'accent'],
    ['Fellowship and special events', 'gold'],
    ['Outreach and Youth', 'deep'],
    ['Meetings and other', 'neutral'],
  ]
  return (
    <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-muted" aria-label="Color key">
      {entries.map(([label, tone]) => (
        <li key={label} className="flex items-center gap-1.5">
          <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${dot[tone]}`} /> {label}
        </li>
      ))}
    </ul>
  )
}
