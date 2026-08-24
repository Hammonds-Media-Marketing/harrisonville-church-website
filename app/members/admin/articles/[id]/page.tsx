import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Container, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Button } from '@/components/primitives/Button'
import { CheckboxField, FieldShell, SelectField, TextArea, TextField } from '@/components/primitives/Field'
import { AdminNotices } from '@/components/members/AdminNotices'
import { ImageUploadField } from '@/components/members/ImageUploadField'
import { RichTextBodyEditor } from '@/components/members/RichTextBodyEditor'
import { getSupabaseServer } from '@/lib/supabase-server'
import type { BlogPost } from '@/content/types'
import { saveArticleAction } from '@/app/members/admin/actions'

export const metadata: Metadata = {
  title: { absolute: 'Edit Article | Site Admin' },
  description: 'Write or edit a Bible study article for the public blog.',
  robots: { index: false, follow: false },
}

export default async function EditArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const isNew = id === 'new'
  const supabase = await getSupabaseServer()
  if (!supabase) notFound()

  let post = null
  if (!isNew) {
    const { data } = await supabase.from('blog_posts').select('*').eq('id', id).maybeSingle()
    if (!data) notFound()
    post = data
  }

  const [{ data: authors }, { data: categories }] = await Promise.all([
    supabase.from('authors').select('slug, name').order('name'),
    supabase.from('blog_categories').select('name').order('sort_order'),
  ])

  const bodyBlocks = (post?.body ?? []) as BlogPost['body']

  return (
    <>
      <PageHero
        eyebrow="Site admin"
        title={isNew ? 'Write an article' : `Edit: ${post?.title}`}
        lead="Articles publish to the blog with full search metadata. Write the body with the formatting toolbar; what you see is what publishes."
      />

      <Section tone="light">
        <Container className="max-w-3xl">
          <AdminNotices params={await searchParams} />
          <Surface tone="card">
            <form action={saveArticleAction} className="flex flex-col gap-5">
              {post ? <input type="hidden" name="id" value={post.id} /> : null}

              <FieldShell
                id="post-title"
                label="Title"
                required
                tip="The article headline. It appears at the top of the page, in the browser tab, and in search results."
              >
                <TextField id="post-title" name="title" required defaultValue={post?.title ?? ''} />
              </FieldShell>

              <FieldShell
                id="post-slug"
                label="Slug"
                helper="Leave blank to generate it from the title."
                tip="The last part of the article's web address, like /blog/what-is-baptism. Lowercase letters and hyphens only."
              >
                <TextField id="post-slug" name="slug" defaultValue={post?.slug ?? ''} />
              </FieldShell>

              <div className="grid gap-5 sm:grid-cols-2">
                <FieldShell
                  id="post-author"
                  label="Author"
                  required
                  tip="Who wrote the article. The byline links to the author's page, which builds trust with readers and search engines."
                >
                  <SelectField
                    id="post-author"
                    name="author_slug"
                    required
                    options={(authors ?? []).map((a) => ({ value: a.slug, label: a.name }))}
                    defaultValue={post?.author_slug ?? ''}
                  />
                </FieldShell>
                <FieldShell
                  id="post-category"
                  label="Category"
                  required
                  tip="The blog section this article belongs to. Readers browse by category, so pick the closest fit."
                >
                  <SelectField
                    id="post-category"
                    name="category"
                    required
                    options={(categories ?? []).map((c) => c.name)}
                    defaultValue={post?.category ?? ''}
                  />
                </FieldShell>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <FieldShell
                  id="post-date"
                  label="Publish date"
                  required
                  tip="The date shown on the article. Future dates do not delay publishing — use the Published checkbox for drafts."
                >
                  <TextField id="post-date" name="date_published" type="date" required defaultValue={post?.date_published ?? ''} />
                </FieldShell>
                <FieldShell
                  id="post-read"
                  label="Read time in minutes"
                  required
                  tip="A rough reading time shown next to the article. Around 200 words per minute is a good estimate."
                >
                  <TextField id="post-read" name="read_minutes" type="number" required defaultValue={String(post?.read_minutes ?? 5)} />
                </FieldShell>
              </div>

              <FieldShell
                id="post-excerpt"
                label="Excerpt"
                required
                helper="Shown on the article card in the blog list."
                tip="One or two sentences that sell the article on the blog page. Different from the meta description, which is written for search engines."
              >
                <TextArea id="post-excerpt" name="excerpt" required rows={2} defaultValue={post?.excerpt ?? ''} />
              </FieldShell>

              <FieldShell
                id="post-meta-desc"
                label="Meta description"
                required
                helper="For search engines: 50 to 160 characters."
                tip="The snippet Google shows under the article's title in search results. Summarize the article and give a reason to click."
              >
                <TextArea id="post-meta-desc" name="meta_description" required rows={2} defaultValue={post?.meta_description ?? ''} />
              </FieldShell>

              <div className="grid gap-5 sm:grid-cols-2">
                <FieldShell
                  id="post-og-title"
                  label="Share title"
                  required
                  helper="Must differ from the title."
                  tip="The headline shown when the article is shared on Facebook or in a text message. Word it differently from the page title."
                >
                  <TextField id="post-og-title" name="og_title" required defaultValue={post?.og_title ?? ''} />
                </FieldShell>
                <FieldShell
                  id="post-og-desc"
                  label="Share description"
                  required
                  helper="Must differ from the meta description."
                  tip="The short text under the share title when the link is posted on social media."
                >
                  <TextField id="post-og-desc" name="og_description" required defaultValue={post?.og_description ?? ''} />
                </FieldShell>
              </div>

              <ImageUploadField
                id="post-image"
                name="feature_image"
                label="Feature image"
                folder="articles"
                required
                defaultValue={post?.feature_image ?? ''}
                helper="Shown at the top of the article and when the link is shared."
                tip="Upload a photo from your device; it is stored with the site automatically. Landscape photos around 1200 by 630 pixels look best."
              />

              <FieldShell
                id="post-image-alt"
                label="Feature image description"
                required
                tip="A short description of what the photo shows, read aloud by screen readers and used when the image cannot load."
              >
                <TextField id="post-image-alt" name="feature_image_alt" required defaultValue={post?.feature_image_alt ?? ''} />
              </FieldShell>

              <FieldShell
                id="post-body"
                label="Body"
                required
                helper='Use the toolbar to format: section headings build the table of contents, and Scripture quotes are written as "Acts 2:38 | verse text".'
                tip="The article itself. Select text and use the toolbar to turn it into headings, lists, or Scripture quotes — it publishes exactly as it looks here."
              >
                <RichTextBodyEditor id="post-body" name="body" defaultBlocks={bodyBlocks} describedBy="post-body-helper" />
              </FieldShell>

              <div className="grid gap-5 sm:grid-cols-2">
                <FieldShell
                  id="post-tags"
                  label="Tags"
                  helper="Separate with commas."
                  tip="Keywords that describe the article's topics. They help related articles find each other."
                >
                  <TextField id="post-tags" name="tags" defaultValue={(post?.tags ?? []).join(', ')} />
                </FieldShell>
                <FieldShell
                  id="post-related"
                  label="Related article slugs"
                  helper="Separate with commas."
                  tip="Slugs of other articles to feature at the bottom of this one, like what-is-baptism. Keeps readers reading."
                >
                  <TextField id="post-related" name="related_slugs" defaultValue={(post?.related_slugs ?? []).join(', ')} />
                </FieldShell>
              </div>

              <CheckboxField
                id="post-published"
                name="published"
                label="Published"
                helper="Unchecked keeps the article as a draft."
                defaultChecked={post?.published ?? false}
              />

              <div className="flex items-center gap-3">
                <Button type="submit" variant="primary">
                  {isNew ? 'Create article' : 'Save changes'}
                </Button>
                <Button href="/members/admin/articles" variant="ghost">
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
