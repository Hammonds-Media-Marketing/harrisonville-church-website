'use client'

import { useState } from 'react'
import { Button } from '@/components/primitives/Button'
import { FieldShell, SelectField, TextArea, TextField } from '@/components/primitives/Field'
import { CALENDAR_CATEGORIES } from '@/lib/portal/calendar'
import { RECURRENCE_OPTIONS } from '@/lib/recurrence'
import { getDateKey, getTimeInput, type DateKey } from '@/lib/portal/time'
import type { CalendarItem } from '@/lib/portal/types'
import { deleteCalendarEventAction, saveCalendarEventAction } from '@/app/members/calendar/actions'

/** Editor form for members-only calendar events. Times are church time. */
export function CalendarEventForm({ item, defaultDate }: { item: CalendarItem | null; defaultDate: DateKey }) {
  const [allDay, setAllDay] = useState(item?.allDay ?? false)
  const [recurring, setRecurring] = useState(item?.recurring ?? '')
  const startDate = item ? getDateKey(item.startsAt) : defaultDate
  const endDate = item?.endsAt ? getDateKey(item.endsAt) : ''

  return (
    <div className="flex flex-col gap-6">
      <form action={saveCalendarEventAction} className="flex flex-col gap-4">
        {item?.editableId ? <input type="hidden" name="id" value={item.editableId} /> : null}
        <FieldShell id="ce-title" label="Title" required>
          <TextField id="ce-title" name="title" required defaultValue={item?.title ?? ''} />
        </FieldShell>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell id="ce-date" label="Date" required>
            <TextField id="ce-date" name="event_date" type="date" required defaultValue={startDate} />
          </FieldShell>
          <FieldShell id="ce-category" label="Category">
            <SelectField id="ce-category" name="category" options={[...CALENDAR_CATEGORIES]} defaultValue={item?.category && (CALENDAR_CATEGORIES as readonly string[]).includes(item.category) ? item.category : 'Fellowship'} />
          </FieldShell>
        </div>
        <div className="flex items-start gap-3">
          <input id="ce-allday" name="all_day" type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 rounded border-border accent-primary-strong" />
          <label htmlFor="ce-allday" className="font-semibold text-heading">
            All day
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2" hidden={allDay}>
          <FieldShell id="ce-start" label="Start time">
            <TextField id="ce-start" name="start_time" type="time" defaultValue={item && !item.allDay ? getTimeInput(item.startsAt) : '18:00'} />
          </FieldShell>
          <FieldShell id="ce-endtime" label="End time">
            <TextField id="ce-endtime" name="end_time" type="time" defaultValue={item?.endsAt && !item.allDay ? getTimeInput(item.endsAt) : ''} />
          </FieldShell>
        </div>
        <FieldShell id="ce-enddate" label="End date" helper="Leave blank for a single day.">
          <TextField id="ce-enddate" name="end_date" type="date" defaultValue={endDate} />
        </FieldShell>
        <FieldShell id="ce-location" label="Location">
          <TextField id="ce-location" name="location" defaultValue={item?.location ?? ''} />
        </FieldShell>
        <FieldShell id="ce-description" label="Details">
          <TextArea id="ce-description" name="description" rows={3} defaultValue={item?.description ?? ''} />
        </FieldShell>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell id="ce-recurring" label="Repeats">
            <select id="ce-recurring" name="recurring" value={recurring} onChange={(e) => setRecurring(e.target.value)} className="w-full rounded-md border border-border bg-input-bg px-4 py-3 text-ink focus:border-primary-strong">
              {RECURRENCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FieldShell>
          {recurring ? (
            <FieldShell id="ce-until" label="Repeat until" helper="Optional last date.">
              <TextField id="ce-until" name="recurrence_ends_on" type="date" />
            </FieldShell>
          ) : null}
        </div>
        <FieldShell id="ce-visibility" label="Who can see it">
          <SelectField
            id="ce-visibility"
            name="visibility"
            options={[
              { value: 'members', label: 'All approved members' },
              { value: 'leaders', label: 'Editors and admins only' },
            ]}
            defaultValue={item?.visibility === 'leaders' ? 'leaders' : 'members'}
          />
        </FieldShell>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary">
            {item ? 'Save changes' : 'Add to calendar'}
          </Button>
        </div>
      </form>
      {item?.editableId ? (
        <form action={deleteCalendarEventAction} className="border-t border-border/50 pt-4">
          <input type="hidden" name="id" value={item.editableId} />
          <input type="hidden" name="date" value={startDate} />
          <Button type="submit" variant="ghost" size="sm">
            Remove this event
          </Button>
        </form>
      ) : null}
    </div>
  )
}
