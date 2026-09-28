'use server'

import { redirect } from 'next/navigation'
import { revalidatePath, updateTag } from 'next/cache'
import { getSupabaseServer, getAuthContext, isEditorRole, isAdminRole } from '@/lib/supabase-server'
import { pingIndexNow } from '@/lib/indexnow'
import { parseBlocksJson, textToBlocks } from '@/lib/article-blocks'
import { parsePageSections } from '@/lib/page-sections'
import { parsePageElements, type PageElementMap } from '@/lib/page-elements'
import { PAGE_CONTENT_TAG, parseOverrides, pruneOverrides } from '@/lib/site-copy'
import { getCopySpec } from '@/content/site-copy'
import { normalizePageSlug } from '@/lib/pages'
import { localInputToIso, slugify } from '@/lib/format'
import { isRecurrenceRule } from '@/lib/recurrence'
import { parseEmailReminder } from '@/lib/portal/reminders'
import type { Database, Json } from '@/lib/database.types'

/**
 * Admin server actions. Row Level Security is the real enforcement layer —
 * every mutation runs under the signed-in editor's session — but each action
 * still checks the role up front so a non-editor gets a clean redirect instead
 * of a database error. Public-content saves revalidate the affected pages and
 * ping IndexNow, which is the publish flow the revalidate webhook mirrors.
 */

async function requireEditor() {
  const ctx = await getAuthContext()
  if (!ctx.user) redirect('/members/login')
  if (!isEditorRole(ctx.profile)) redirect('/members')
  const supabase = await getSupabaseServer()
  if (!supabase) redirect('/members')
  return { supabase, ctx }
}

async function requireAdmin() {
  const { supabase, ctx } = await requireEditor()
  if (!isAdminRole(ctx.profile)) redirect('/members/admin')
  return { supabase, ctx }
}

const text = (form: FormData, key: string) => String(form.get(key) ?? '').trim()
const flag = (form: FormData, key: string) => form.get(key) === 'on'

/** A media link an editor may attach: an https address or a site path. Anything else is dropped. */
const safeMediaUrl = (value: string) => (/^(https:\/\/|\/(?!\/))/i.test(value) ? value : '')

async function publishRefresh(paths: string[]) {
  for (const p of paths) revalidatePath(p)
  await pingIndexNow(paths)
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export async function saveEventAction(formData: FormData) {
  const { supabase } = await requireEditor()
  const id = text(formData, 'id')
  const title = text(formData, 'title')
  const slug = slugify(text(formData, 'slug') || title)
  const recurring = text(formData, 'recurring')
  const image = text(formData, 'image')

  const values: Database['public']['Tables']['events']['Insert'] = {
    slug,
    title,
    summary: text(formData, 'summary'),
    description: text(formData, 'description'),
    start_date: localInputToIso(text(formData, 'start_date')),
    end_date: text(formData, 'end_date') ? localInputToIso(text(formData, 'end_date')) : null,
    location_name: text(formData, 'location_name') || null,
    category: text(formData, 'category'),
    recurring: isRecurrenceRule(recurring) ? recurring : null,
    image: image || null,
    image_alt: image ? text(formData, 'image_alt') || title : null,
    published: flag(formData, 'published'),
    sample: false,
    email_reminder: parseEmailReminder(text(formData, 'email_reminder')),
  }

  const { error } = id
    ? await supabase.from('events').update(values).eq('id', id)
    : await supabase.from('events').insert(values)

  if (error) {
    console.warn('[admin] event save failed:', error.message)
    redirect(`/members/admin/events/${id || 'new'}?error=save`)
  }

  await publishRefresh(['/events', `/events/${slug}`])
  revalidatePath('/members/admin/events')
  redirect('/members/admin/events?saved=1')
}

export async function deleteEventAction(formData: FormData) {
  const { supabase } = await requireEditor()
  const slug = text(formData, 'slug')
  const { error } = await supabase.from('events').delete().eq('id', text(formData, 'id'))
  if (error) {
    console.warn('[admin] event delete failed:', error.message)
    redirect('/members/admin/events?error=delete')
  }
  await publishRefresh(slug ? ['/events', `/events/${slug}`] : ['/events'])
  revalidatePath('/members/admin/events')
  redirect('/members/admin/events?deleted=1')
}

// ---------------------------------------------------------------------------
// Sermons
// ---------------------------------------------------------------------------

export async function saveSermonAction(formData: FormData) {
  const { supabase } = await requireEditor()
  const id = text(formData, 'id')
  const title = text(formData, 'title')

  const values: Database['public']['Tables']['sermons']['Insert'] = {
    slug: slugify(text(formData, 'slug') || title),
    title,
    speaker: text(formData, 'speaker'),
    date: text(formData, 'date'),
    scripture: text(formData, 'scripture'),
    series: text(formData, 'series') || null,
    summary: text(formData, 'summary'),
    video_url: text(formData, 'video_url'),
    audio_url: safeMediaUrl(text(formData, 'audio_url')),
    duration_minutes: Number(text(formData, 'duration_minutes')) || 30,
    thumbnail: text(formData, 'thumbnail') || '/assets/images/video-placeholder.png',
    thumbnail_alt: text(formData, 'thumbnail_alt') || `Sermon thumbnail for ${title}`,
    published: flag(formData, 'published'),
    sample: false,
  }

  const write = (row: typeof values) =>
    id ? supabase.from('sermons').update(row).eq('id', id) : supabase.from('sermons').insert(row)
  let { error } = await write(values)

  // A database without the audio column yet still takes a video-only save;
  // an uploaded recording needs the migration first.
  if (error && /audio_url/.test(error.message) && !values.audio_url) {
    const { audio_url: _unused, ...rest } = values
    ;({ error } = await write(rest))
  }

  if (error) {
    console.warn('[admin] sermon save failed:', error.message)
    redirect(`/members/admin/sermons/${id || 'new'}?error=save`)
  }

  await publishRefresh(['/resources/sermons', `/resources/sermons/${values.slug}`, '/'])
  revalidatePath('/members/admin/sermons')
  redirect('/members/admin/sermons?saved=1')
}

export async function deleteSermonAction(formData: FormData) {
  const { supabase } = await requireEditor()
  const { error } = await supabase.from('sermons').delete().eq('id', text(formData, 'id'))
  if (error) {
    console.warn('[admin] sermon delete failed:', error.message)
    redirect('/members/admin/sermons?error=delete')
  }
  await publishRefresh(['/resources/sermons', '/'])
  revalidatePath('/members/admin/sermons')
  redirect('/members/admin/sermons?deleted=1')
}

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

export async function saveArticleAction(formData: FormData) {
  const { supabase } = await requireEditor()
  const id = text(formData, 'id')
  const title = text(formData, 'title')
  const slug = slugify(text(formData, 'slug') || title)

  const values: Database['public']['Tables']['blog_posts']['Insert'] = {
    slug,
    title,
    excerpt: text(formData, 'excerpt'),
    meta_description: text(formData, 'meta_description'),
    og_title: text(formData, 'og_title'),
    og_description: text(formData, 'og_description'),
    category: text(formData, 'category'),
    tags: text(formData, 'tags')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    author_slug: text(formData, 'author_slug'),
    date_published: text(formData, 'date_published'),
    date_modified: id ? new Date().toISOString().slice(0, 10) : null,
    feature_image: text(formData, 'feature_image'),
    feature_image_alt: text(formData, 'feature_image_alt'),
    read_minutes: Number(text(formData, 'read_minutes')) || 5,
    // The rich text editor posts block JSON; the plain-text format remains a
    // fallback so older clients (or a script) can still submit text.
    body:
      parseBlocksJson(String(formData.get('body') ?? '')) ?? textToBlocks(String(formData.get('body') ?? '')),
    related_slugs: text(formData, 'related_slugs')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    published: flag(formData, 'published'),
    sample: false,
  }

  const { error } = id
    ? await supabase.from('blog_posts').update(values).eq('id', id)
    : await supabase.from('blog_posts').insert(values)

  if (error) {
    console.warn('[admin] article save failed:', error.message)
    redirect(`/members/admin/articles/${id || 'new'}?error=save`)
  }

  await publishRefresh(['/blog', `/blog/${slug}`, '/feed.xml'])
  revalidatePath('/members/admin/articles')
  redirect('/members/admin/articles?saved=1')
}

export async function deleteArticleAction(formData: FormData) {
  const { supabase } = await requireEditor()
  const slug = text(formData, 'slug')
  const { error } = await supabase.from('blog_posts').delete().eq('id', text(formData, 'id'))
  if (error) {
    console.warn('[admin] article delete failed:', error.message)
    redirect('/members/admin/articles?error=delete')
  }
  await publishRefresh(['/blog', `/blog/${slug}`, '/feed.xml'])
  revalidatePath('/members/admin/articles')
  redirect('/members/admin/articles?deleted=1')
}

// ---------------------------------------------------------------------------
// Pages (the drag-and-drop page builder)
// ---------------------------------------------------------------------------

export async function savePageAction(formData: FormData) {
  const { supabase } = await requireEditor()
  const id = text(formData, 'id')
  const backTo = `/members/admin/pages/${id || 'new'}`

  const title = text(formData, 'title')
  if (!title) redirect(`${backTo}?error=save`)

  const slug = normalizePageSlug(text(formData, 'slug') || slugify(title))
  if (!slug) redirect(`${backTo}?error=slug`)

  // Save-time SEO checks mirror what the build gates enforce for hand-built
  // pages, since editor content never passes through those gates.
  const metaTitle = text(formData, 'meta_title') || title
  const metaDescription = text(formData, 'meta_description')
  if (metaDescription.length < 50 || metaDescription.length > 160) redirect(`${backTo}?error=meta`)

  const ogTitle = text(formData, 'og_title')
  const ogDescription = text(formData, 'og_description')
  if (!ogTitle || !ogDescription || ogTitle === metaTitle || ogDescription === metaDescription) {
    redirect(`${backTo}?error=og`)
  }

  const ogImage = text(formData, 'og_image')

  // The stored list is the builder's own payload, so a half-finished section
  // survives a draft save; the validating parser gates every render, and a
  // page cannot publish until at least one section parses clean.
  const rawSections = String(formData.get('sections') ?? '[]')
  let sectionsPayload: unknown = []
  try {
    sectionsPayload = JSON.parse(rawSections)
  } catch {
    redirect(`${backTo}?error=save`)
  }
  if (!Array.isArray(sectionsPayload) || rawSections.length > 200_000) redirect(`${backTo}?error=save`)
  const published = flag(formData, 'published')
  if (published && !parsePageSections(sectionsPayload).length) redirect(`${backTo}?error=sections`)

  const values: Database['public']['Tables']['pages']['Insert'] = {
    slug,
    title,
    hero_eyebrow: text(formData, 'hero_eyebrow'),
    hero_lead: text(formData, 'hero_lead') || null,
    meta_title: metaTitle,
    meta_description: metaDescription,
    og_title: ogTitle,
    og_description: ogDescription,
    og_image: ogImage || null,
    og_image_alt: ogImage ? text(formData, 'og_image_alt') || ogTitle : null,
    sections: sectionsPayload as Json,
    published,
    sample: false,
  }

  // A renamed page must also refresh its old address, so the previous URL
  // stops serving stale content.
  let previousSlug = ''
  if (id) {
    const { data: existing } = await supabase.from('pages').select('slug').eq('id', id).maybeSingle()
    previousSlug = existing?.slug ?? ''
  }

  const { error } = id
    ? await supabase.from('pages').update(values).eq('id', id)
    : await supabase.from('pages').insert(values)

  if (error) {
    console.warn('[admin] page save failed:', error.message)
    redirect(`${backTo}?error=${error.message.includes('pages_slug_key') ? 'slug' : 'save'}`)
  }

  const paths = [`/${slug}`, ...(previousSlug && previousSlug !== slug ? [`/${previousSlug}`] : [])]
  await publishRefresh(paths)
  revalidatePath('/members/admin/pages')
  redirect('/members/admin/pages?saved=1')
}

export async function deletePageAction(formData: FormData) {
  const { supabase } = await requireEditor()
  const slug = text(formData, 'slug')
  const { error } = await supabase.from('pages').delete().eq('id', text(formData, 'id'))
  if (error) {
    console.warn('[admin] page delete failed:', error.message)
    redirect('/members/admin/pages?error=delete')
  }
  if (slug) await publishRefresh([`/${slug}`])
  revalidatePath('/members/admin/pages')
  redirect('/members/admin/pages?deleted=1')
}

// ---------------------------------------------------------------------------
// Announcements (members-only content: no IndexNow, private revalidate only)
// ---------------------------------------------------------------------------

export async function saveAnnouncementAction(formData: FormData) {
  const { supabase, ctx } = await requireEditor()
  const id = text(formData, 'id')

  const values: Database['public']['Tables']['announcements']['Insert'] = {
    title: text(formData, 'title'),
    body: text(formData, 'body'),
    category: text(formData, 'category') || null,
    pinned: flag(formData, 'pinned'),
    publish_date: text(formData, 'publish_date') || new Date().toISOString().slice(0, 10),
    expires_on: text(formData, 'expires_on') || null,
    published: flag(formData, 'published'),
    created_by: ctx.user?.id ?? null,
  }

  const { error } = id
    ? await supabase.from('announcements').update(values).eq('id', id)
    : await supabase.from('announcements').insert(values)

  if (error) {
    console.warn('[admin] announcement save failed:', error.message)
    redirect(`/members/admin/announcements/${id || 'new'}?error=save`)
  }

  revalidatePath('/members')
  revalidatePath('/members/admin/announcements')
  redirect('/members/admin/announcements?saved=1')
}

export async function deleteAnnouncementAction(formData: FormData) {
  const { supabase } = await requireEditor()
  const { error } = await supabase.from('announcements').delete().eq('id', text(formData, 'id'))
  if (error) {
    console.warn('[admin] announcement delete failed:', error.message)
    redirect('/members/admin/announcements?error=delete')
  }
  revalidatePath('/members')
  revalidatePath('/members/admin/announcements')
  redirect('/members/admin/announcements?deleted=1')
}

// ---------------------------------------------------------------------------
// Members (admin only)
// ---------------------------------------------------------------------------

export async function setMemberStatusAction(formData: FormData) {
  const { supabase, ctx } = await requireAdmin()
  const id = text(formData, 'id')
  const role = text(formData, 'role') as Database['public']['Enums']['member_role']

  // An admin cannot demote or un-approve themselves; that path locks the
  // congregation out of member management.
  if (id === ctx.user?.id && (role !== 'admin' || !flag(formData, 'approved'))) {
    redirect('/members/admin/members?error=self')
  }

  const { error } = await supabase
    .from('member_profiles')
    .update({ role, approved: flag(formData, 'approved') })
    .eq('id', id)

  if (error) {
    console.warn('[admin] member status update failed:', error.message)
    redirect('/members/admin/members?error=save')
  }
  revalidatePath('/members/admin/members')
  redirect('/members/admin/members?saved=1')
}

export async function removeMemberAction(formData: FormData) {
  const { supabase, ctx } = await requireAdmin()
  const id = text(formData, 'id')
  if (id === ctx.user?.id) redirect('/members/admin/members?error=self')

  // Removes the profile (directory + access). The auth account itself is
  // deleted from the Supabase dashboard; without an approved profile the
  // account can no longer see member content.
  const { error } = await supabase.from('member_profiles').delete().eq('id', id)
  if (error) {
    console.warn('[admin] member remove failed:', error.message)
    redirect('/members/admin/members?error=delete')
  }
  revalidatePath('/members/admin/members')
  redirect('/members/admin/members?deleted=1')
}

// ---------------------------------------------------------------------------
// Page copy (the visual editor for the hand-built pages)
// ---------------------------------------------------------------------------

/**
 * Save an editor's rewrite of a hand-built page. The editor posts every field
 * it knows about; pruneOverrides keeps only the ones that actually differ from
 * the wording in the code, so the stored row stays a small diff rather than a
 * frozen copy of the page. Dropped-in elements travel with the wording and go
 * through the same parser the page renders with, and the cleaned list comes
 * back so the editor shows exactly what was published. Publishing revalidates
 * the copy tag (every page reads its words through it), the page's own path,
 * and IndexNow.
 */
export async function savePageCopyAction(
  path: string,
  values: Record<string, string>,
  rawElements?: unknown
): Promise<{ ok: boolean; error?: string; elements?: PageElementMap }> {
  const { supabase, ctx } = await requireEditor()
  const spec = getCopySpec(path)
  if (!spec) return { ok: false, error: 'That page is not editable.' }

  const overrides = pruneOverrides(spec, values)
  const elements = parsePageElements(rawElements ?? {})
  const row = { path, values: overrides as Json, updated_by: ctx.user?.id ?? null }

  let { error } = await supabase
    .from('page_content')
    .upsert({ ...row, elements: elements as Json }, { onConflict: 'path' })

  // A database that has not had the elements column added yet can still take
  // a wording-only save; elements need the migration first.
  if (error && /elements/.test(error.message)) {
    if (Object.keys(elements).length) {
      console.warn('[admin] page elements save failed:', error.message)
      return {
        ok: false,
        error: 'Added elements cannot be saved until the site database is updated. Ask the site administrator to apply the latest migration.',
      }
    }
    ;({ error } = await supabase.from('page_content').upsert(row, { onConflict: 'path' }))
  }

  if (error) {
    console.warn('[admin] page copy save failed:', error.message)
    return { ok: false, error: 'That did not save. Check your connection and try again.' }
  }

  // updateTag (not revalidateTag) so the editor's next read sees its own write.
  updateTag(PAGE_CONTENT_TAG)
  await publishRefresh([path])
  revalidatePath('/members/admin/editor')
  revalidatePath('/members/admin/pages')
  return { ok: true, elements }
}

/** Drop every override and added element on a page, returning it to the code. */
export async function resetPageCopyAction(path: string): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await requireEditor()
  if (!getCopySpec(path)) return { ok: false, error: 'That page is not editable.' }

  const { error } = await supabase.from('page_content').delete().eq('path', path)
  if (error) {
    console.warn('[admin] page copy reset failed:', error.message)
    return { ok: false, error: 'That did not reset. Check your connection and try again.' }
  }

  // updateTag (not revalidateTag) so the editor's next read sees its own write.
  updateTag(PAGE_CONTENT_TAG)
  await publishRefresh([path])
  revalidatePath('/members/admin/editor')
  revalidatePath('/members/admin/pages')
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Version history
// ---------------------------------------------------------------------------

/**
 * Put a page back the way it was in an earlier version. Database triggers
 * keep the version each save replaces (content_revisions), so restoring is
 * just another save: the current version is kept in turn, and a restore can
 * be undone the same way.
 *
 * A built page gets its wording, sections, and search fields back, but keeps
 * its current web address and published state, so a restore never moves a
 * page or takes it live by surprise. A hand-built page gets its wording and
 * added elements back; restoring the version from before a "Reset all"
 * brings back everything that reset removed.
 */
export async function restoreRevisionAction(formData: FormData) {
  const { supabase, ctx } = await requireEditor()
  const id = Number(text(formData, 'id'))
  const { data: revision } = Number.isFinite(id)
    ? await supabase.from('content_revisions').select('*').eq('id', id).maybeSingle()
    : { data: null }
  if (!revision || !revision.snapshot || typeof revision.snapshot !== 'object') redirect('/members/admin?error=restore')

  const snap = revision.snapshot as Record<string, unknown>
  const str = (key: string) => (typeof snap[key] === 'string' ? (snap[key] as string) : '')

  if (revision.entity === 'page') {
    const pageId = revision.entity_key
    const back = `/members/admin/history?page=${encodeURIComponent(pageId)}`
    const { data: current } = await supabase.from('pages').select('slug').eq('id', pageId).maybeSingle()
    if (!current) redirect(`${back}&error=gone`)
    const { error } = await supabase
      .from('pages')
      .update({
        title: str('title'),
        hero_eyebrow: str('hero_eyebrow'),
        hero_lead: str('hero_lead') || null,
        meta_title: str('meta_title'),
        meta_description: str('meta_description'),
        og_title: str('og_title'),
        og_description: str('og_description'),
        og_image: str('og_image') || null,
        og_image_alt: str('og_image_alt') || null,
        sections: (Array.isArray(snap.sections) ? snap.sections : []) as Json,
      })
      .eq('id', pageId)
    if (error) {
      console.warn('[admin] page restore failed:', error.message)
      redirect(`${back}&error=save`)
    }
    await publishRefresh([`/${current.slug}`])
    revalidatePath('/members/admin/pages')
    redirect(`${back}&restored=1`)
  }

  const path = revision.entity_key
  const back = `/members/admin/history?path=${encodeURIComponent(path)}`
  if (!getCopySpec(path)) redirect(`${back}&error=gone`)
  const { error } = await supabase.from('page_content').upsert(
    {
      path,
      values: pruneOverrides(getCopySpec(path)!, parseOverrides(snap.values)) as Json,
      elements: parsePageElements(snap.elements ?? {}) as Json,
      updated_by: ctx.user?.id ?? null,
    },
    { onConflict: 'path' }
  )
  if (error) {
    console.warn('[admin] page copy restore failed:', error.message)
    redirect(`${back}&error=save`)
  }
  updateTag(PAGE_CONTENT_TAG)
  await publishRefresh([path])
  revalidatePath('/members/admin/editor')
  revalidatePath('/members/admin/pages')
  redirect(`${back}&restored=1`)
}

