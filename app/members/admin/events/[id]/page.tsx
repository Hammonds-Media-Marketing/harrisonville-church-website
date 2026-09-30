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
import { RepeaterField } from '@/components/members/RepeaterField'
import { getSupabaseServer } from '@/lib/supabase-server'
import { RECURRENCE_OPTIONS, ruleFromStored } from '@/lib/recurrence'
import { parseFaqs, parseInfoSections, parseSessions, parseSpeakers } from '@/lib/event-details'
import { EMAIL_REMINDER_OPTIONS, parseEmailReminder } from '@/lib/portal/reminders'
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

  // Each date of the event: its stored sessions, or the single start/end.
  const storedSessions = parseSessions(event?.sessions)
  const sessionRows = storedSessions.length
    ? storedSessions.map((x) => ({ start: isoToLocalInput(x.startDate), end: x.endDate ? isoToLocalInput(x.endDate) : '' }))
    : event
      ? [{ start: isoToLocalInput(event.start_date), end: event.end_date ? isoToLocalInput(event.end_date) : '' }]
      : []
  const speakerRows = parseSpeakers(event?.speakers).map((x) => ({
    name: x.name,
    role: x.role ?? '',
    bio: x.bio ?? '',
    image: x.image ?? '',
    image_alt: x.imageAlt ?? '',
  }))
  const faqRows = parseFaqs(event?.faqs).map((x) => ({ question: x.question, answer: x.answer }))
  const infoRows = parseInfoSections(event?.info_sections).map((x) => ({ heading: x.heading, body: x.body }))

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

              <RepeaterField
                id="event-sessions"
                prefix="session"
                label="Dates and times"
                itemLabel="Date"
                addLabel="Add another date"
                minRows={1}
                initialRows={sessionRows}
                helper="Add one entry per day for events that run over several days, like a Friday–Sunday meeting. Each date is listed on the event page."
                tip="Times are church-local. A one-day event needs just one entry. For a multi-day event, add each day with its own start and end time; the calendar shows the event until the last day ends."
                fields={[
                  { key: 'start', label: 'Starts', type: 'datetime-local', required: true, half: true },
                  { key: 'end', label: 'Ends', type: 'datetime-local', helper: 'Optional.', half: true },
                ]}
              />

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
                  helper="Ignored when the event has more than one date."
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
                label="Location name"
                helper="Blank means the church building."
                tip="The name of the place, like 'Norman Church of Christ' or 'Harrisonville City Park'. Leave blank for events at the church building."
              >
                <TextField id="event-location" name="location_name" defaultValue={event?.location_name ?? ''} />
              </FieldShell>

              <fieldset className="flex flex-col gap-4">
                <legend className="mb-1.5 font-semibold text-heading">Location address</legend>
                <p className="-mt-1 text-sm text-muted">
                  Only for events away from the church building. Used for the map, directions, and search results.
                </p>
                <FieldShell id="event-street" label="Street address">
                  <TextField id="event-street" name="location_street" autoComplete="off" defaultValue={event?.location_street ?? ''} />
                </FieldShell>
                <div className="grid gap-4 sm:grid-cols-[1fr_6rem_8rem]">
                  <FieldShell id="event-city" label="City">
                    <TextField id="event-city" name="location_city" autoComplete="off" defaultValue={event?.location_city ?? ''} />
                  </FieldShell>
                  <FieldShell id="event-region" label="State">
                    <TextField id="event-region" name="location_region" autoComplete="off" placeholder="MO" defaultValue={event?.location_region ?? ''} />
                  </FieldShell>
                  <FieldShell id="event-postal" label="ZIP">
                    <TextField id="event-postal" name="location_postal_code" autoComplete="off" defaultValue={event?.location_postal_code ?? ''} />
                  </FieldShell>
                </div>
              </fieldset>

              <RepeaterField
                id="event-speakers"
                prefix="speaker"
                label="Speakers"
                itemLabel="Speaker"
                addLabel="Add a speaker"
                initialRows={speakerRows}
                helper="Optional. Each speaker gets a short profile on the event page."
                tip="Visiting preachers or teachers for the event. A name is all that's required; a photo, where they're from, and a short bio help visitors know who they'll hear."
                fields={[
                  { key: 'name', label: 'Name', required: true, half: true },
                  { key: 'role', label: 'Role or congregation', helper: 'For example, "Minister, Norman Church of Christ".', half: true },
                  { key: 'bio', label: 'Short bio', type: 'textarea' },
                  { key: 'image', label: 'Photo', type: 'image', folder: 'speakers', helper: 'Optional. A square head-and-shoulders photo works best.' },
                  { key: 'image_alt', label: 'Photo description', helper: 'Optional. Defaults to the speaker\'s name.' },
                ]}
              />

              <RepeaterField
                id="event-faqs"
                prefix="faq"
                label="Frequently asked questions"
                itemLabel="Question"
                addLabel="Add a question"
                initialRows={faqRows}
                helper="Optional. Shown as a questions-and-answers section on the event page."
                tip="Answer what visitors are likely to ask: Is there a cost? Is childcare provided? Where do I park? Is there a meal?"
                fields={[
                  { key: 'question', label: 'Question', required: true },
                  { key: 'answer', label: 'Answer', type: 'textarea', required: true },
                ]}
              />

              <RepeaterField
                id="event-info"
                prefix="info"
                label="Additional information"
                itemLabel="Section"
                addLabel="Add a section"
                initialRows={infoRows}
                helper="Optional. Extra sections with their own heading, for anything else the event needs: what to bring, lodging, meals, a schedule of lessons."
                tip="Each section appears on the event page under its heading. Blank lines in the text start new paragraphs."
                fields={[
                  { key: 'heading', label: 'Heading', required: true },
                  { key: 'body', label: 'Text', type: 'textarea', required: true },
                ]}
              />

              <FieldShell
                id="event-reminder"
                label="Email reminder"
                helper="Emails every approved member before the event. Repeating events get a reminder before each date."
                tip="Members get an email (and a note in their notification bell) ahead of the event, such as 'remember, we have singing at the building.' Members can turn reminder emails off in their own notification settings."
              >
                <SelectField
                  id="event-reminder"
                  name="email_reminder"
                  options={EMAIL_REMINDER_OPTIONS}
                  defaultValue={parseEmailReminder(event?.email_reminder)}
                />
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
