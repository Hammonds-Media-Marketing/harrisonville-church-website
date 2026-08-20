import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Container, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Button } from '@/components/primitives/Button'
import { CheckboxField, FieldShell, SelectField, TextArea, TextField } from '@/components/primitives/Field'
import { AdminNotices } from '@/components/members/AdminNotices'
import { getSupabaseServer } from '@/lib/supabase-server'
import { saveAnnouncementAction } from '@/app/members/admin/actions'

export const metadata: Metadata = {
  title: { absolute: 'Edit Announcement | Site Admin' },
  description: 'Post or edit a members-only announcement.',
  robots: { index: false, follow: false },
}

const CATEGORIES = ['General', 'Worship', 'Service', 'Care', 'Facilities', 'Youth']

export default async function EditAnnouncementPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const isNew = id === 'new'

  let item = null
  if (!isNew) {
    const supabase = await getSupabaseServer()
    if (!supabase) notFound()
    const { data } = await supabase.from('announcements').select('*').eq('id', id).maybeSingle()
    if (!data) notFound()
    item = data
  }

  return (
    <>
      <PageHero
        eyebrow="Site admin"
        title={isNew ? 'Post an announcement' : `Edit: ${item?.title}`}
        lead="Announcements go to the members dashboard only. They are never public."
      />

      <Section tone="light">
        <Container className="max-w-2xl">
          <AdminNotices params={await searchParams} />
          <Surface tone="card">
            <form action={saveAnnouncementAction} className="flex flex-col gap-5">
              {item ? <input type="hidden" name="id" value={item.id} /> : null}

              <FieldShell id="ann-title" label="Title" required>
                <TextField id="ann-title" name="title" required defaultValue={item?.title ?? ''} />
              </FieldShell>

              <FieldShell id="ann-body" label="Announcement" required helper="Line breaks are kept as written.">
                <TextArea id="ann-body" name="body" required rows={6} defaultValue={item?.body ?? ''} />
              </FieldShell>

              <div className="grid gap-5 sm:grid-cols-2">
                <FieldShell id="ann-category" label="Category" helper="Optional.">
                  <SelectField id="ann-category" name="category" options={CATEGORIES} defaultValue={item?.category ?? ''} />
                </FieldShell>
                <FieldShell id="ann-publish" label="Post date" required>
                  <TextField
                    id="ann-publish"
                    name="publish_date"
                    type="date"
                    required
                    defaultValue={item?.publish_date ?? new Date().toISOString().slice(0, 10)}
                  />
                </FieldShell>
              </div>

              <FieldShell id="ann-expires" label="Expires" helper="After this date it drops off the dashboard. Optional.">
                <TextField id="ann-expires" name="expires_on" type="date" defaultValue={item?.expires_on ?? ''} />
              </FieldShell>

              <CheckboxField
                id="ann-pinned"
                name="pinned"
                label="Pin to the top"
                defaultChecked={item?.pinned ?? false}
              />
              <CheckboxField
                id="ann-published"
                name="published"
                label="Published"
                helper="Unchecked keeps it as a draft only editors can see."
                defaultChecked={item?.published ?? true}
              />

              <div className="flex items-center gap-3">
                <Button type="submit" variant="primary">
                  {isNew ? 'Post announcement' : 'Save changes'}
                </Button>
                <Button href="/members/admin/announcements" variant="ghost">
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
