'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getSupabaseServer, getAuthContext, isEditorRole, isAdminRole } from '@/lib/supabase-server'
import { pingIndexNow } from '@/lib/indexnow'
import { parseBlocksJson, textToBlocks } from '@/lib/article-blocks'
import { parsePageSections } from '@/lib/page-sections'
import { normalizePageSlug } from '@/lib/pages'
import { localInputToIso, slugify } from '@/lib/format'
import { isRecurrenceRule } from '@/lib/recurrence'
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
  const slug = text(formData, 'slug') || slugify(title)
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
    slug: text(formData, 'slug') || slugify(title),
    title,
    speaker: text(formData, 'speaker'),
    date: text(formData, 'date'),
    scripture: text(formData, 'scripture'),
    series: text(formData, 'series') || null,
    summary: text(formData, 'summary'),
    video_url: text(formData, 'video_url'),
    duration_minutes: Number(text(formData, 'duration_minutes')) || 30,
    thumbnail: text(formData, 'thumbnail') || '/assets/images/video-placeholder.png',
    thumbnail_alt: text(formData, 'thumbnail_alt') || `Sermon thumbnail for ${title}`,
    published: flag(formData, 'published'),
    sample: false,
  }

  const { error } = id
    ? await supabase.from('sermons').update(values).eq('id', id)
    : await supabase.from('sermons').insert(values)

  if (error) {
    console.warn('[admin] sermon save failed:', error.message)
    redirect(`/members/admin/sermons/${id || 'new'}?error=save`)
  }

  await publishRefresh(['/resources/sermons', '/'])
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
  const slug = text(formData, 'slug') || slugify(title)

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
