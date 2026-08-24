import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isoToLocalInput } from '@/lib/format'
import { Container, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Button } from '@/components/primitives/Button'
import { CheckboxField, FieldShell, SelectField, TextArea, TextField } from '@/components/primitives/Field'
import { AdminNotices } from '@/components/members/AdminNotices'
import { ImageUploadField } from '@/components/members/ImageUploadField'
import { getSupabaseServer } from '@/lib/supabase-server'
import { RECURRENCE_OPTIONS, ruleFromStored } from '@/lib/recurrence'
import { saveEventAction } from '@/app/members/admin/actions'

export const metadata: Metadata = {
  title: { absolute: 'Edit Event | Site Admin' },
  description: 'Create or edit an event on the public calendar.',
  robots: { index: false, follow: false },
}

const CATEGORIES = ['Worship', 'Bible Study', 'Fellowship', 'Outreach', 'Youth']

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const isNew = id === 'new'

  let event = null
  if (!isNew) {
    const supabase = await getSupabaseServer()
    if (!supabase) notFound()
    const { data } = await supabase.from('events').select('*').eq('id', id).maybeSingle()
    if (!data) notFound()
    event = data
  }

  return (
    <>
      <PageHero
        eyebrow="Site admin"
        title={isNew ? 'Add an event' : `Edit: ${event?.title}`}
        lead="Events publish to the public calendar with their own page. Times are entered as local church time."
      />

      <Section tone="light">
        <Container className="max-w-2xl">
          <AdminNotices params={await searchParams} />
          <Surface tone="card">
            <form action={saveEventAction} className="flex flex-col gap-5">
              {event ? <input type="hidden" name="id" value={event.id} /> : null}

              <FieldShell
                id="event-title"
                label="Title"
                required
                tip="The event name shown everywhere: the calendar, the event page, and search results."
              >
                <TextField id="event-title" name="title" required defaultValue={event?.title ?? ''} />
              </FieldShell>

              <FieldShell
                id="event-slug"
                label="Slug"
                helper="Leave blank to generate it from the title."
                tip="The last part of the event's web address, like /events/fall-gospel-meeting. Lowercase letters and hyphens only."
              >
                <TextField id="event-slug" name="slug" defaultValue={event?.slug ?? ''} />
              </FieldShell>

              <FieldShell
                id="event-summary"
                label="Summary"
                required
                helper="One sentence shown on the event card."
                tip="A short teaser for the calendar listing. Keep it to one sentence; the full details go in the description."
              >
                <TextArea id="event-summary" name="summary" required rows={2} defaultValue={event?.summary ?? ''} />
              </FieldShell>

              <FieldShell
                id="event-description"
                label="Description"
                required
                helper="The full explanation, written for a first-time visitor."
                tip="Shown on the event's own page. Explain what happens, who it is for, and what a visitor should expect. Blank lines start new paragraphs."
              >
                <TextArea id="event-description" name="description" required rows={5} defaultValue={event?.description ?? ''} />
              </FieldShell>

              <ImageUploadField
                id="event-image"
                name="image"
                label="Event image"
                folder="events"
                defaultValue={event?.image ?? ''}
                helper="Optional. Shown on the event card and at the top of the event page."
                tip="A photo makes the event stand out on the calendar. Landscape photos around 1200 by 630 pixels look best."
              />

              <FieldShell
                id="event-image-alt"
                label="Image description"
                helper="Needed only when an image is set."
                tip="A short description of what the photo shows, read aloud by screen readers and used when the image cannot load."
              >
                <TextField id="event-image-alt" name="image_alt" defaultValue={event?.image_alt ?? ''} />
              </FieldShell>

              <div className="grid gap-5 sm:grid-cols-2">
                <FieldShell
                  id="event-start"
                  label="Starts"
                  required
                  tip="The date and time the event begins, in church-local time. For a repeating event this is the first date of the series."
                >
                  <TextField
                    id="event-start"
                    name="start_date"
                    type="datetime-local"
                    required
                    defaultValue={event ? isoToLocalInput(event.start_date) : ''}
                  />
                </FieldShell>
                <FieldShell
                  id="event-end"
                  label="Ends"
                  helper="Optional."
                  tip="When the event wraps up. Leave blank for open-ended gatherings; use a later date for multi-day events."
                >
                  <TextField
                    id="event-end"
                    name="end_date"
                    type="datetime-local"
                    defaultValue={event?.end_date ? isoToLocalInput(event.end_date) : ''}
                  />
                </FieldShell>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <FieldShell
                  id="event-category"
                  label="Category"
                  required
                  tip="Groups the event on the calendar so visitors can tell worship, studies, and fellowship apart at a glance."
                >
                  <SelectField
                    id="event-category"
                    name="category"
                    required
                    options={CATEGORIES}
                    defaultValue={event?.category ?? ''}
                  />
                </FieldShell>
                <FieldShell
                  id="event-recurring"
                  label="Repeats"
                  tip="Pick a schedule and the calendar fills in every upcoming date automatically, based on the start date. Pick 'Does not repeat' for one-time events."
                >
                  <SelectField
                    id="event-recurring"
                    name="recurring"
                    options={RECURRENCE_OPTIONS}
                    defaultValue={ruleFromStored(event?.recurring) ?? ''}
                  />
                </FieldShell>
              </div>

              <FieldShell
                id="event-location"
                label="Location"
                helper="Blank means the church building."
                tip="Only fill this in when the event happens somewhere other than the church building — a park, a home, a community center."
              >
                <TextField id="event-location" name="location_name" defaultValue={event?.location_name ?? ''} />
              </FieldShell>

              <CheckboxField
                id="event-published"
                name="published"
                label="Published"
                helper="Unchecked keeps the event hidden from the public calendar."
                defaultChecked={event?.published ?? true}
              />

              <div className="flex items-center gap-3">
                <Button type="submit" variant="primary">
                  {isNew ? 'Create event' : 'Save changes'}
                </Button>
                <Button href="/members/admin/events" variant="ghost">
                  Cancel
                </Button>
              </div>
            </form>
          </Surface>
        </Container>
      </Section>
    </>
  )
}
