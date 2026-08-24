import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Container, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Button } from '@/components/primitives/Button'
import { CheckboxField, FieldShell, TextArea, TextField } from '@/components/primitives/Field'
import { AdminNotices } from '@/components/members/AdminNotices'
import { ImageUploadField } from '@/components/members/ImageUploadField'
import { getSupabaseServer } from '@/lib/supabase-server'
import { saveSermonAction } from '@/app/members/admin/actions'

export const metadata: Metadata = {
  title: { absolute: 'Edit Sermon | Site Admin' },
  description: 'Create or edit a sermon in the public library.',
  robots: { index: false, follow: false },
}

export default async function EditSermonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const isNew = id === 'new'

  let sermon = null
  if (!isNew) {
    const supabase = await getSupabaseServer()
    if (!supabase) notFound()
    const { data } = await supabase.from('sermons').select('*').eq('id', id).maybeSingle()
    if (!data) notFound()
    sermon = data
  }

  return (
    <>
      <PageHero
        eyebrow="Site admin"
        title={isNew ? 'Add a sermon' : `Edit: ${sermon?.title}`}
        lead="Sermons publish to the video library, and the newest one is featured on the homepage."
      />

      <Section tone="light">
        <Container className="max-w-2xl">
          <AdminNotices params={await searchParams} />
          <Surface tone="card">
            <form action={saveSermonAction} className="flex flex-col gap-5">
              {sermon ? <input type="hidden" name="id" value={sermon.id} /> : null}

              <FieldShell
                id="sermon-title"
                label="Title"
                required
                tip="The sermon name shown in the video library and on the homepage when it is the newest lesson."
              >
                <TextField id="sermon-title" name="title" required defaultValue={sermon?.title ?? ''} />
              </FieldShell>

              <FieldShell
                id="sermon-slug"
                label="Slug"
                helper="Leave blank to generate it from the title."
                tip="The last part of the sermon's web address. Lowercase letters and hyphens only."
              >
                <TextField id="sermon-slug" name="slug" defaultValue={sermon?.slug ?? ''} />
              </FieldShell>

              <div className="grid gap-5 sm:grid-cols-2">
                <FieldShell id="sermon-speaker" label="Speaker" required tip="Who preached the lesson. Shown with the video.">
                  <TextField id="sermon-speaker" name="speaker" required defaultValue={sermon?.speaker ?? ''} />
                </FieldShell>
                <FieldShell id="sermon-date" label="Date preached" required tip="The Sunday or Wednesday the lesson was delivered. The library sorts by this date.">
                  <TextField id="sermon-date" name="date" type="date" required defaultValue={sermon?.date ?? ''} />
                </FieldShell>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <FieldShell
                  id="sermon-scripture"
                  label="Scripture"
                  required
                  helper='For example "Acts 2:36-47".'
                  tip="The main passage the lesson works through. Shown under the title so visitors can open their Bible to it."
                >
                  <TextField id="sermon-scripture" name="scripture" required defaultValue={sermon?.scripture ?? ''} />
                </FieldShell>
                <FieldShell
                  id="sermon-series"
                  label="Series"
                  helper="Optional."
                  tip="If the lesson belongs to a multi-week series, name it here and the library groups them with a badge."
                >
                  <TextField id="sermon-series" name="series" defaultValue={sermon?.series ?? ''} />
                </FieldShell>
              </div>

              <FieldShell
                id="sermon-summary"
                label="Summary"
                required
                helper="Two or three sentences shown with the video."
                tip="What the lesson covers and why it matters, written for someone deciding whether to press play."
              >
                <TextArea id="sermon-summary" name="summary" required rows={3} defaultValue={sermon?.summary ?? ''} />
              </FieldShell>

              <div className="grid gap-5 sm:grid-cols-2">
                <FieldShell
                  id="sermon-video"
                  label="Video URL"
                  helper="YouTube or file link. Blank shows the placeholder."
                  tip="Paste the full YouTube link for the recording. Copy it from the address bar or YouTube's Share button."
                >
                  <TextField id="sermon-video" name="video_url" type="url" defaultValue={sermon?.video_url ?? ''} />
                </FieldShell>
                <FieldShell id="sermon-duration" label="Length in minutes" required tip="How long the recording runs. Shown on the video card so visitors know what to expect.">
                  <TextField
                    id="sermon-duration"
                    name="duration_minutes"
                    type="number"
                    required
                    defaultValue={String(sermon?.duration_minutes ?? 30)}
                  />
                </FieldShell>
              </div>

              <ImageUploadField
                id="sermon-thumb"
                name="thumbnail"
                label="Thumbnail"
                folder="sermons"
                defaultValue={sermon?.thumbnail ?? ''}
                helper="Optional. Blank uses the placeholder image."
                tip="The preview picture on the video card. A still frame from the recording or a photo of the speaker works well."
              />

              <FieldShell
                id="sermon-thumb-alt"
                label="Thumbnail description"
                helper="Describe the image for screen readers."
                tip="A short description of what the thumbnail shows, read aloud by screen readers and used when the image cannot load."
              >
                <TextField id="sermon-thumb-alt" name="thumbnail_alt" defaultValue={sermon?.thumbnail_alt ?? ''} />
              </FieldShell>

              <CheckboxField
                id="sermon-published"
                name="published"
                label="Published"
                helper="Unchecked keeps the sermon out of the public library."
                defaultChecked={sermon?.published ?? true}
              />

              <div className="flex items-center gap-3">
                <Button type="submit" variant="primary">
                  {isNew ? 'Create sermon' : 'Save changes'}
                </Button>
                <Button href="/members/admin/sermons" variant="ghost">
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
