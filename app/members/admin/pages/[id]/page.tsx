import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Container, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Button } from '@/components/primitives/Button'
import { CheckboxField, FieldShell, TextArea, TextField } from '@/components/primitives/Field'
import { AdminNotices } from '@/components/members/AdminNotices'
import { ImageUploadField } from '@/components/members/ImageUploadField'
import { PageBuilder } from '@/components/members/PageBuilder'
import { getSupabaseServer } from '@/lib/supabase-server'
import { loadBuilderSections } from '@/lib/page-sections'
import { savePageAction } from '@/app/members/admin/actions'

export const metadata: Metadata = {
  title: { absolute: 'Edit Page | Site Admin' },
  description: 'Build or edit a website page with the section builder.',
  robots: { index: false, follow: false },
}

export default async function EditPagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const isNew = id === 'new'
  const query = await searchParams

  let page = null
  if (!isNew) {
    const supabase = await getSupabaseServer()
    if (!supabase) notFound()
    const { data } = await supabase.from('pages').select('*').eq('id', id).maybeSingle()
    if (!data) notFound()
    page = data
  }

  return (
    <>
      <PageHero
        eyebrow="Site admin"
        title={isNew ? 'Build a page' : `Edit: ${page?.title}`}
        lead="Build the page on the live preview: pick a starting layout, click any part to edit it, and add sections exactly where you want them. Everything renders with the site's own design, at desktop, tablet, and phone widths."
      >
        {page ? (
          <div className="flex flex-wrap gap-3">
            <Button href={`/members/admin/pages/${page.id}/preview`} variant="ghost" size="sm">
              Preview draft
            </Button>
            <Button href={`/members/admin/history?page=${page.id}`} variant="ghost" size="sm">
              Version history
            </Button>
            {page.published ? (
              <Button href={`/${page.slug}`} variant="ghost" size="sm">
                View live page
              </Button>
            ) : null}
          </div>
        ) : null}
      </PageHero>

      <form action={savePageAction}>
        {page ? <input type="hidden" name="id" value={page.id} /> : null}

        {query.error ? (
          <Container className="pt-5">
            <AdminNotices params={query} />
          </Container>
        ) : null}

        <div className="border-y border-border">
          <PageBuilder
            name="sections"
            defaultSections={loadBuilderSections(page?.sections ?? [])}
            defaultHero={{ title: page?.title ?? '', eyebrow: page?.hero_eyebrow ?? '', lead: page?.hero_lead ?? '' }}
            draftKey={`page-builder:${page?.id ?? 'new'}`}
            restoreDraft={Boolean(query.error)}
          />
        </div>

        <Section tone="light">
          <Container className="flex max-w-4xl flex-col gap-8">
            <Surface tone="card" className="flex flex-col gap-5">
              <h2 className="text-2xl">Web address</h2>

              <FieldShell
                id="page-slug"
                label="Web address"
                helper="Leave blank to generate it from the title. Nested paths like ministries/youth are allowed."
                tip="The path after the site name, like /our-story. Lowercase letters and hyphens only. Addresses used by the built-in pages (about, events, blog, and so on) are reserved."
              >
                <TextField id="page-slug" name="slug" defaultValue={page?.slug ?? ''} />
              </FieldShell>
            </Surface>

            <Surface tone="card" className="flex flex-col gap-5">
              <h2 className="text-2xl">Search and sharing</h2>

              <div className="grid gap-5 sm:grid-cols-2">
                <FieldShell
                  id="page-meta-title"
                  label="Search title"
                  helper="Blank uses the page title."
                  tip="The headline shown in search results. Around 60 characters fits without being cut off."
                >
                  <TextField id="page-meta-title" name="meta_title" defaultValue={page?.meta_title ?? ''} />
                </FieldShell>
                <FieldShell
                  id="page-meta-description"
                  label="Search description"
                  required
                  helper="50 to 160 characters."
                  tip="The sentence under the headline in search results. Describe what a visitor finds on this page."
                >
                  <TextArea
                    id="page-meta-description"
                    name="meta_description"
                    required
                    rows={2}
                    defaultValue={page?.meta_description ?? ''}
                  />
                </FieldShell>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <FieldShell
                  id="page-og-title"
                  label="Share title"
                  required
                  helper="Must differ from the search title."
                  tip="The headline shown when the page is shared on social media or in messages."
                >
                  <TextField id="page-og-title" name="og_title" required defaultValue={page?.og_title ?? ''} />
                </FieldShell>
                <FieldShell
                  id="page-og-description"
                  label="Share description"
                  required
                  helper="Must differ from the search description."
                  tip="The text under the share headline. Write it as an invitation rather than a summary."
                >
                  <TextArea
                    id="page-og-description"
                    name="og_description"
                    required
                    rows={2}
                    defaultValue={page?.og_description ?? ''}
                  />
                </FieldShell>
              </div>

              <ImageUploadField
                id="page-og-image"
                name="og_image"
                label="Share image"
                folder="pages"
                defaultValue={page?.og_image ?? ''}
                helper="Optional. Shown in link previews; 1200 by 630 pixels looks best. Blank uses the church's default."
                tip="The picture shown when someone shares this page's link. A photo specific to the page performs better than the default."
              />

              <FieldShell
                id="page-og-image-alt"
                label="Share image description"
                helper="Needed only when a share image is set."
                tip="A short description of what the share image shows, for screen readers."
              >
                <TextField id="page-og-image-alt" name="og_image_alt" defaultValue={page?.og_image_alt ?? ''} />
              </FieldShell>
            </Surface>

            <Surface tone="card" className="flex flex-col gap-5">
              <CheckboxField
                id="page-published"
                name="published"
                label="Published"
                helper="Unchecked keeps the page as a private draft you can preview from the pages list."
                defaultChecked={page?.published ?? false}
              />

              <div className="flex items-center gap-3">
                <Button type="submit" variant="primary">
                  {isNew ? 'Create page' : 'Save changes'}
                </Button>
                <Button href="/members/admin/pages" variant="ghost">
                  Cancel
                </Button>
              </div>
            </Surface>
          </Container>
        </Section>
      </form>
    </>
  )
}
