import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isoToLocalInput } from '@/lib/format'
import { Container, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Button } from '@/components/primitives/Button'
import { CheckboxField, FieldShell, SelectField, TextArea, TextField } from '@/components/primitives/Field'
import { AdminNotices } from '@/components/members/AdminNotices'
import { getSupabaseServer } from '@/lib/supabase-server'
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
        lead="Events publish to the public calendar. Times are entered as local church time."
      />

      <Section tone="light">
        <Container className="max-w-2xl">
          <AdminNotices params={await searchParams} />
          <Surface tone="card">
            <form action={saveEventAction} className="flex flex-col gap-5">
              {event ? <input type="hidden" name="id" value={event.id} /> : null}

              <FieldShell id="event-title" label="Title" required>
                <TextField id="event-title" name="title" required defaultValue={event?.title ?? ''} />
              </FieldShell>

              <FieldShell
                id="event-slug"
                label="Slug"
                helper="Web address for the event. Leave blank to generate it from the title."
              >
                <TextField id="event-slug" name="slug" defaultValue={event?.slug ?? ''} />
              </FieldShell>

              <FieldShell id="event-summary" label="Summary" required helper="One sentence shown on the event card.">
                <TextArea id="event-summary" name="summary" required rows={2} defaultValue={event?.summary ?? ''} />
              </FieldShell>

              <FieldShell
                id="event-description"
                label="Description"
                required
                helper="The full explanation, written for a first-time visitor."
              >
                <TextArea id="event-description" name="description" required rows={5} defaultValue={event?.description ?? ''} />
              </FieldShell>

              <div className="grid gap-5 sm:grid-cols-2">
                <FieldShell id="event-start" label="Starts" required>
                  <TextField
                    id="event-start"
                    name="start_date"
                    type="datetime-local"
                    required
                    defaultValue={event ? isoToLocalInput(event.start_date) : ''}
                  />
                </FieldShell>
                <FieldShell id="event-end" label="Ends" helper="Optional.">
                  <TextField
                    id="event-end"
                    name="end_date"
                    type="datetime-local"
                    defaultValue={event?.end_date ? isoToLocalInput(event.end_date) : ''}
                  />
                </FieldShell>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <FieldShell id="event-category" label="Category" required>
                  <SelectField
                    id="event-category"
                    name="category"
                    required
                    options={CATEGORIES}
                    defaultValue={event?.category ?? ''}
                  />
                </FieldShell>
                <FieldShell id="event-recurring" label="Repeats" helper='For example "First Sunday monthly". Optional.'>
                  <TextField id="event-recurring" name="recurring" defaultValue={event?.recurring ?? ''} />
                </FieldShell>
              </div>

              <FieldShell id="event-location" label="Location" helper="Blank means the church building.">
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
