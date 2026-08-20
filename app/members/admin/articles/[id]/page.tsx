import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Container, Section } from '@/components/primitives/Layout'
import { PageHero } from '@/components/blocks/PageHero'
import { Surface } from '@/components/primitives/Surface'
import { Button } from '@/components/primitives/Button'
import { CheckboxField, FieldShell, SelectField, TextArea, TextField } from '@/components/primitives/Field'
import { AdminNotices } from '@/components/members/AdminNotices'
import { getSupabaseServer } from '@/lib/supabase-server'
import { blocksToText } from '@/lib/article-blocks'
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

  const bodyText = post ? blocksToText((post.body ?? []) as BlogPost['body']) : ''

  return (
    <>
      <PageHero
        eyebrow="Site admin"
        title={isNew ? 'Write an article' : `Edit: ${post?.title}`}
        lead="Articles publish to the blog with full search metadata. The body uses a simple text format explained under the body field."
      />

      <Section tone="light">
        <Container className="max-w-3xl">
          <AdminNotices params={await searchParams} />
          <Surface tone="card">
            <form action={saveArticleAction} className="flex flex-col gap-5">
              {post ? <input type="hidden" name="id" value={post.id} /> : null}

              <FieldShell id="post-title" label="Title" required>
                <TextField id="post-title" name="title" required defaultValue={post?.title ?? ''} />
              </FieldShell>

              <FieldShell id="post-slug" label="Slug" helper="Leave blank to generate it from the title.">
                <TextField id="post-slug" name="slug" defaultValue={post?.slug ?? ''} />
              </FieldShell>

              <div className="grid gap-5 sm:grid-cols-2">
                <FieldShell id="post-author" label="Author" required>
                  <SelectField
                    id="post-author"
                    name="author_slug"
                    required
                    options={(authors ?? []).map((a) => a.slug)}
                    defaultValue={post?.author_slug ?? ''}
                  />
                </FieldShell>
                <FieldShell id="post-category" label="Category" required>
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
                <FieldShell id="post-date" label="Publish date" required>
                  <TextField id="post-date" name="date_published" type="date" required defaultValue={post?.date_published ?? ''} />
                </FieldShell>
                <FieldShell id="post-read" label="Read time in minutes" required>
                  <TextField id="post-read" name="read_minutes" type="number" required defaultValue={String(post?.read_minutes ?? 5)} />
                </FieldShell>
              </div>

              <FieldShell id="post-excerpt" label="Excerpt" required helper="Shown on the article card in the blog list.">
                <TextArea id="post-excerpt" name="excerpt" required rows={2} defaultValue={post?.excerpt ?? ''} />
              </FieldShell>

              <FieldShell
                id="post-meta-desc"
                label="Meta description"
                required
                helper="For search engines: 50 to 160 characters."
              >
                <TextArea id="post-meta-desc" name="meta_description" required rows={2} defaultValue={post?.meta_description ?? ''} />
              </FieldShell>

              <div className="grid gap-5 sm:grid-cols-2">
                <FieldShell id="post-og-title" label="Share title" required helper="Shown when the link is shared. Must differ from the title.">
                  <TextField id="post-og-title" name="og_title" required defaultValue={post?.og_title ?? ''} />
                </FieldShell>
                <FieldShell id="post-og-desc" label="Share description" required helper="Must differ from the meta description.">
                  <TextField id="post-og-desc" name="og_description" required defaultValue={post?.og_description ?? ''} />
                </FieldShell>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <FieldShell id="post-image" label="Feature image path" required>
                  <TextField id="post-image" name="feature_image" required defaultValue={post?.feature_image ?? ''} />
                </FieldShell>
                <FieldShell id="post-image-alt" label="Feature image alt text" required>
                  <TextField id="post-image-alt" name="feature_image_alt" required defaultValue={post?.feature_image_alt ?? ''} />
                </FieldShell>
              </div>

              <FieldShell
                id="post-body"
                label="Body"
                required
                helper='Blank lines separate blocks. "## " starts a section heading, "### " a subheading, "- " a list item, and "> Acts 2:38 | verse text" a Scripture quote. Everything else is a paragraph.'
              >
                <TextArea id="post-body" name="body" required rows={18} defaultValue={bodyText} />
              </FieldShell>

              <div className="grid gap-5 sm:grid-cols-2">
                <FieldShell id="post-tags" label="Tags" helper="Separate with commas.">
                  <TextField id="post-tags" name="tags" defaultValue={(post?.tags ?? []).join(', ')} />
                </FieldShell>
                <FieldShell id="post-related" label="Related article slugs" helper="Separate with commas.">
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
