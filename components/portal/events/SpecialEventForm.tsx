'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/primitives/Button'
import { Avatar } from '@/components/primitives/Avatar'
import { CheckboxField, FieldShell, SelectField, TextArea, TextField } from '@/components/primitives/Field'
import { Notice } from '@/components/primitives/Feedback'
import { CloseIcon, PlusIcon, TrashIcon } from '@/components/ui/icons'
import { AUDIENCES, SPECIAL_EVENT_CATEGORIES, isAudienceEligible } from '@/lib/portal/special-events'
import { getDateKey, getTimeInput } from '@/lib/portal/time'
import type { Gender, PersonSummary, SignupItemRow, SpecialEventAudience, SpecialEventRow } from '@/lib/portal/types'
import { saveSpecialEventAction } from '@/app/members/events/actions'

type Member = PersonSummary & { gender: Gender | null }

type ItemDraft = { key: string; id?: string; title: string; description: string; volunteersNeeded: number; neededAt: string }

/**
 * Create or edit a special event. Only a title is required to save a draft;
 * publishing needs a date. Sign-up needs and exclusions travel as JSON in
 * hidden fields so the whole event saves in one request.
 */
export function SpecialEventForm({
  event,
  items,
  excludedIds,
  members,
  currentUserId,
  error,
}: {
  event: SpecialEventRow | null
  items: SignupItemRow[]
  excludedIds: string[]
  members: Member[]
  currentUserId: string
  error?: string
}) {
  const [title, setTitle] = useState(event?.title ?? '')
  const [status, setStatus] = useState<'draft' | 'published'>((event?.status as 'draft' | 'published') ?? 'draft')
  const [audience, setAudience] = useState<SpecialEventAudience>((event?.audience as SpecialEventAudience) ?? 'everyone')
  const [allDay, setAllDay] = useState(event?.all_day ?? false)
  const [excluded, setExcluded] = useState<string[]>(excludedIds)
  const [search, setSearch] = useState('')
  const [drafts, setDrafts] = useState<ItemDraft[]>(
    items.map((i) => ({ key: i.id, id: i.id, title: i.title, description: i.description ?? '', volunteersNeeded: i.volunteers_needed, neededAt: i.needed_at ? `${getDateKey(i.needed_at)}T${getTimeInput(i.needed_at)}` : '' }))
  )

  const eligible = useMemo(() => members.filter((m) => isAudienceEligible({ id: m.id, approved: true, gender: m.gender }, audience, [])).length, [members, audience])
  const excludedSet = new Set(excluded)
  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return members.filter((m) => m.id !== currentUserId && !excludedSet.has(m.id) && m.fullName.toLowerCase().includes(q)).slice(0, 8)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, members, excluded, currentUserId])

  const errors: Record<string, string> = {
    title: 'Give the event a title.',
    audience: 'Choose who the event is for.',
    date: 'That date or time is not valid.',
    end: 'The end has to come after the start.',
    publish_date: 'Add a date before publishing. You can save a draft without one.',
    items: 'Each sign-up need requires a title and a number of volunteers from 1 to 500.',
    capacity: 'You cannot lower a sign-up below the number of people already signed up.',
    save: 'That did not save. Try again.',
  }

  const updateDraft = (key: string, patch: Partial<ItemDraft>) => setDrafts((d) => d.map((x) => (x.key === key ? { ...x, ...patch } : x)))
  const moveDraft = (key: string, dir: -1 | 1) =>
    setDrafts((d) => {
      const i = d.findIndex((x) => x.key === key)
      const j = i + dir
      if (i < 0 || j < 0 || j >= d.length) return d
      const next = [...d]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })

  return (
    <form action={saveSpecialEventAction} className="flex flex-col gap-8">
      {event ? <input type="hidden" name="id" value={event.id} /> : null}
      <input type="hidden" name="exclusion_ids" value={excluded.join(',')} />
      <input type="hidden" name="signup_items" value={JSON.stringify(drafts.map(({ id, title, description, volunteersNeeded, neededAt }) => ({ id, title, description, volunteersNeeded, neededAt: neededAt || null })))} />

      {error ? <Notice tone="error">{errors[error] ?? errors.save}</Notice> : null}

      <section aria-labelledby="ev-details" className="flex flex-col gap-4">
        <h2 id="ev-details" className="m-0 text-xl">
          Event details
        </h2>
        <FieldShell id="ev-title" label="Title" required>
          <input id="ev-title" name="title" required maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-md border border-border bg-input-bg px-4 py-3 text-ink focus:border-primary-strong" />
        </FieldShell>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell id="ev-category" label="Kind of event">
            <SelectField id="ev-category" name="category" options={[{ value: '', label: 'Not specified' }, ...SPECIAL_EVENT_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))]} defaultValue={event?.category ?? ''} />
          </FieldShell>
          <FieldShell id="ev-location" label="Location">
            <TextField id="ev-location" name="location" defaultValue={event?.location ?? ''} placeholder="Fellowship hall, a home, a park" />
          </FieldShell>
        </div>
        <FieldShell id="ev-description" label="Details" helper="What it is, what to bring, who to ask.">
          <TextArea id="ev-description" name="description" rows={5} defaultValue={event?.description ?? ''} />
        </FieldShell>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell id="ev-date" label="Date" helper={status === 'published' ? 'Required to publish.' : 'Optional while it is a draft.'}>
            <TextField id="ev-date" name="event_date" type="date" defaultValue={event?.starts_at ? getDateKey(event.starts_at) : ''} required={status === 'published'} />
          </FieldShell>
          <div className="flex items-end pb-3">
            <div className="flex items-start gap-3">
              <input id="ev-allday" name="all_day" type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="mt-1 h-5 w-5 rounded border-border accent-primary-strong" />
              <label htmlFor="ev-allday" className="font-semibold text-heading">
                All day
              </label>
            </div>
          </div>
          <div hidden={allDay} className="contents">
            <FieldShell id="ev-start" label="Start time">
              <TextField id="ev-start" name="start_time" type="time" defaultValue={event?.starts_at && !event.all_day ? getTimeInput(event.starts_at) : '18:00'} />
            </FieldShell>
            <FieldShell id="ev-endtime" label="End time">
              <TextField id="ev-endtime" name="end_time" type="time" defaultValue={event?.ends_at && !event.all_day ? getTimeInput(event.ends_at) : ''} />
            </FieldShell>
          </div>
          <FieldShell id="ev-enddate" label="End date" helper="Only for events that span more than one day.">
            <TextField id="ev-enddate" name="end_date" type="date" defaultValue={event?.ends_at ? getDateKey(event.ends_at) : ''} />
          </FieldShell>
        </div>
      </section>

      <section aria-labelledby="ev-people" className="flex flex-col gap-4">
        <h2 id="ev-people" className="m-0 text-xl">
          Who is invited
        </h2>
        <fieldset className="flex flex-col gap-2 border-0 p-0">
          <legend className="mb-1 font-semibold text-heading">Audience</legend>
          {AUDIENCES.map((a) => (
            <label key={a.value} className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-bg px-4 py-3 has-[:checked]:border-primary-strong has-[:checked]:bg-surface">
              <input type="radio" name="audience" value={a.value} checked={audience === a.value} onChange={() => setAudience(a.value)} className="mt-1 h-5 w-5 accent-primary-strong" />
              <span>
                <span className="block font-semibold text-heading">{a.label}</span>
                <span className="block text-sm text-muted">{a.helper}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <p className="m-0 text-sm text-muted">
          {eligible - excluded.length} eligible member{eligible - excluded.length === 1 ? '' : 's'}
          {excluded.length ? ` · ${excluded.length} left off` : ''}
        </p>
        <FieldShell id="ev-exclude" label="Leave someone off" helper="For a surprise, or anyone this event is not for. You cannot leave yourself off.">
          <input id="ev-exclude" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search members" className="w-full rounded-md border border-border bg-input-bg px-4 py-3 text-ink placeholder:text-placeholder focus:border-primary-strong" />
        </FieldShell>
        {searchResults.length ? (
          <ul className="m-0 flex list-none flex-col divide-y divide-border/40 rounded-md border border-border p-0">
            {searchResults.map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => { setExcluded((x) => [...x, m.id]); setSearch('') }} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-surface">
                  <Avatar name={m.fullName} photo={m.photo} photoPosition={m.photoPosition} size="xs" />
                  <span className="font-semibold text-heading">{m.fullName}</span>
                  <span className="ml-auto text-sm text-primary-strong">Leave off</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {excluded.length ? (
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Members left off this event">
            {excluded.map((id) => {
              const m = members.find((x) => x.id === id)
              return (
                <li key={id} className="inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-2 text-sm">
                  <Avatar name={m?.fullName ?? 'Member'} photo={m?.photo} photoPosition={m?.photoPosition} size="xs" />
                  {m?.fullName ?? 'Member'}
                  <button type="button" onClick={() => setExcluded((x) => x.filter((y) => y !== id))} aria-label={`Include ${m?.fullName ?? 'this member'} again`} className="grid h-6 w-6 place-items-center rounded-full hover:bg-bg">
                    <CloseIcon className="h-3.5 w-3.5" />
                  </button>
                </li>
              )
            })}
          </ul>
        ) : null}
        <CheckboxField id="ev-rsvp" name="rsvp_enabled" label="Ask for RSVPs" helper="Invited members can say yes, maybe, or no, and how many they are bringing." defaultChecked={event?.rsvp_enabled ?? true} />
      </section>

      <section aria-labelledby="ev-signups" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="ev-signups" className="m-0 text-xl">
            Sign-up needs
          </h2>
          <Button type="button" variant="ghost" size="sm" onClick={() => setDrafts((d) => [...d, { key: crypto.randomUUID(), title: '', description: '', volunteersNeeded: 1, neededAt: '' }])}>
            <PlusIcon className="h-4 w-4" /> Add a need
          </Button>
        </div>
        <p className="m-0 text-sm text-muted">Dishes to bring, set-up and clean-up crews, rides, meals for a family. Each need has a number of spots; members claim one at a time.</p>
        {drafts.length ? (
          <ol className="m-0 flex list-none flex-col gap-3 p-0">
            {drafts.map((d, i) => (
              <li key={d.key} className="rounded-md border border-border bg-bg p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold uppercase tracking-wide text-muted">Need {i + 1}</span>
                  <span className="flex gap-1">
                    <button type="button" onClick={() => moveDraft(d.key, -1)} disabled={i === 0} aria-label="Move up" className="grid h-9 w-9 place-items-center rounded-full text-primary-strong hover:bg-surface disabled:opacity-40">↑</button>
                    <button type="button" onClick={() => moveDraft(d.key, 1)} disabled={i === drafts.length - 1} aria-label="Move down" className="grid h-9 w-9 place-items-center rounded-full text-primary-strong hover:bg-surface disabled:opacity-40">↓</button>
                    <button type="button" onClick={() => setDrafts((x) => x.filter((y) => y.key !== d.key))} aria-label={`Remove need ${i + 1}`} className="grid h-9 w-9 place-items-center rounded-full text-error hover:bg-error-surface">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
                  <FieldShell id={`need-title-${d.key}`} label="What is needed" required>
                    <input id={`need-title-${d.key}`} required maxLength={160} value={d.title} onChange={(e) => updateDraft(d.key, { title: e.target.value })} className="w-full rounded-md border border-border bg-input-bg px-4 py-3 text-ink focus:border-primary-strong" />
                  </FieldShell>
                  <FieldShell id={`need-count-${d.key}`} label="Spots" required>
                    <input id={`need-count-${d.key}`} type="number" min={1} max={500} required value={d.volunteersNeeded} onChange={(e) => updateDraft(d.key, { volunteersNeeded: Number(e.target.value) })} className="w-full rounded-md border border-border bg-input-bg px-4 py-3 text-ink focus:border-primary-strong" />
                  </FieldShell>
                  <FieldShell id={`need-desc-${d.key}`} label="Notes">
                    <input id={`need-desc-${d.key}`} value={d.description} onChange={(e) => updateDraft(d.key, { description: e.target.value })} className="w-full rounded-md border border-border bg-input-bg px-4 py-3 text-ink focus:border-primary-strong" />
                  </FieldShell>
                  <FieldShell id={`need-when-${d.key}`} label="Needed by">
                    <input id={`need-when-${d.key}`} type="datetime-local" value={d.neededAt} onChange={(e) => updateDraft(d.key, { neededAt: e.target.value })} className="w-full rounded-md border border-border bg-input-bg px-4 py-3 text-ink focus:border-primary-strong" />
                  </FieldShell>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="m-0 rounded-md border border-dashed border-border bg-surface px-4 py-3 text-sm text-muted">No sign-up needs yet. Events without needs still take RSVPs and have a chat.</p>
        )}
      </section>

      <section aria-labelledby="ev-publish" className="flex flex-col gap-4 border-t border-border/50 pt-6">
        <h2 id="ev-publish" className="m-0 text-xl">
          Publish
        </h2>
        <FieldShell id="ev-status" label="Status" helper="A draft is visible only to you and the editors. Publishing sends an invitation to everyone in the audience.">
          <select id="ev-status" name="status" value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')} className="w-full rounded-md border border-border bg-input-bg px-4 py-3 text-ink focus:border-primary-strong">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </FieldShell>
        <div>
          <Button type="submit" variant="primary" disabled={!title.trim()}>
            {status === 'published' ? (event?.status === 'published' ? 'Save changes' : 'Publish event') : 'Save draft'}
          </Button>
        </div>
      </section>
    </form>
  )
}
