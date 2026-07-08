import { cache } from 'react'
import { getSupabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import type { Author, BlogCategory, BlogPost } from '@/content/types'
import {
  authors as seedAuthors,
  blogCategories as seedBlogCategories,
  posts as seedPosts,
} from '@/content/blog'

/**
 * Blog data-access layer. Reads come from Supabase (Row Level Security limits
 * the public anon key to published posts, all authors and categories, and
 * approved comments). When Supabase is not configured, or a query fails, the
 * same shapes are served from the local seed content so the site never breaks.
 *
 * DB rows are snake_case; the app types are camelCase. Mapping happens here so
 * every page and component keeps consuming the existing BlogPost/Author types.
 */

type PostRow = Database['public']['Tables']['blog_posts']['Row']
type AuthorRow = Database['public']['Tables']['authors']['Row']

function mapPost(row: PostRow): BlogPost {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    metaDescription: row.meta_description,
    ogTitle: row.og_title,
    ogDescription: row.og_description,
    category: row.category as BlogCategory,
    tags: row.tags ?? [],
    authorSlug: row.author_slug,
    datePublished: row.date_published,
    dateModified: row.date_modified ?? undefined,
    featureImage: row.feature_image,
    featureImageAlt: row.feature_image_alt,
    readMinutes: row.read_minutes,
    views: row.views,
    body: (row.body ?? []) as BlogPost['body'],
    relatedSlugs: row.related_slugs ?? [],
    sample: row.sample,
  }
}

function mapAuthor(row: AuthorRow): Author {
  return {
    slug: row.slug,
    name: row.name,
    role: row.role,
    bio: row.bio,
    longBio: row.long_bio,
    photo: row.photo,
    photoAlt: row.photo_alt,
    linkedin: row.linkedin ?? '',
    sample: row.sample,
  }
}

const seedPostsByDate = () =>
  [...seedPosts].sort((a, b) => b.datePublished.localeCompare(a.datePublished))

/** All published posts, newest first. Cached per render pass. */
const fetchPosts = cache(async (): Promise<BlogPost[]> => {
  const supabase = getSupabase()
  if (!supabase) return seedPostsByDate()

  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .order('date_published', { ascending: false })

  if (error || !data) {
    console.warn('[blog] blog_posts read failed, falling back to seed content:', error?.message)
    return seedPostsByDate()
  }
  return data.map(mapPost)
})

/** All authors. Cached per render pass. */
const fetchAuthors = cache(async (): Promise<Author[]> => {
  const supabase = getSupabase()
  if (!supabase) return seedAuthors

  const { data, error } = await supabase.from('authors').select('*').order('name', { ascending: true })

  if (error || !data) {
    console.warn('[blog] authors read failed, falling back to seed content:', error?.message)
    return seedAuthors
  }
  return data.map(mapAuthor)
})

/** Category names in display order. Drives the /blog filter chips. */
const fetchCategories = cache(async (): Promise<string[]> => {
  const supabase = getSupabase()
  if (!supabase) return [...seedBlogCategories]

  const { data, error } = await supabase
    .from('blog_categories')
    .select('name')
    .order('sort_order', { ascending: true })

  if (error || !data || !data.length) {
    if (error) console.warn('[blog] blog_categories read failed, falling back to seed:', error.message)
    return [...seedBlogCategories]
  }
  return data.map((c) => c.name)
})

// ---------------------------------------------------------------------------
// Public API — mirrors the former content/blog.ts helpers, now async.
// ---------------------------------------------------------------------------

export function getAllPosts(): Promise<BlogPost[]> {
  return fetchPosts()
}

export function recentPosts(): Promise<BlogPost[]> {
  return fetchPosts()
}

export async function getPost(slug: string): Promise<BlogPost | undefined> {
  return (await fetchPosts()).find((p) => p.slug === slug)
}

export async function postsByCategory(category: string): Promise<BlogPost[]> {
  return (await fetchPosts()).filter((p) => p.category === category)
}

export async function postsByAuthor(slug: string): Promise<BlogPost[]> {
  return (await fetchPosts()).filter((p) => p.authorSlug === slug)
}

export async function relatedPosts(post: BlogPost): Promise<BlogPost[]> {
  const all = await fetchPosts()
  return post.relatedSlugs
    .map((s) => all.find((p) => p.slug === s))
    .filter((p): p is BlogPost => Boolean(p))
}

export function getAllAuthors(): Promise<Author[]> {
  return fetchAuthors()
}

export async function getAuthor(slug: string): Promise<Author | undefined> {
  return (await fetchAuthors()).find((a) => a.slug === slug)
}

export function getBlogCategories(): Promise<string[]> {
  return fetchCategories()
}

// ---------------------------------------------------------------------------
// Comments — approved reads (email-free by column grant), moderated inserts.
// ---------------------------------------------------------------------------

export type PublicComment = {
  id: string
  authorName: string
  body: string
  createdAt: string
}

export async function getApprovedComments(postSlug: string): Promise<PublicComment[]> {
  const supabase = getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('blog_comments')
    .select('id, author_name, body, created_at')
    .eq('post_slug', postSlug)
    .order('created_at', { ascending: true })

  if (error || !data) {
    if (error) console.warn('[blog] comments read failed:', error.message)
    return []
  }
  return data.map((c) => ({
    id: c.id,
    authorName: c.author_name,
    body: c.body,
    createdAt: c.created_at,
  }))
}
