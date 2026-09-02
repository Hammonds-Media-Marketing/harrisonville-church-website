import { cache } from 'react'
import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { ReactNode } from 'react'
import type { Database } from '@/lib/database.types'
import { buildMetadata } from '@/lib/seo'
import { renderInline } from '@/lib/inline-markup'
import { applyCopyTokens } from '@/lib/copy-tokens'
import { getCopySpec } from '@/content/site-copy'
import {
  PAGE_CONTENT_TAG,
  copyDefaults,
  copyFieldMap,
  parseOverrides,
  type CopyField,
  type PageCopySpec,
} from '@/lib/site-copy'

/**
 * Server-side resolver for hand-built page copy. A page asks for its copy once
 * and renders through the returned helpers:
 *
 *   const copy = await pageCopy('/about')
 *   <PageHero title={copy.t('hero.title')} lead={copy.t('hero.lead')} />
 *   <Image src={copy.s('welcome.photo')} alt={copy.s('welcome.photoAlt')} {...copy.mark('welcome.photo')} />
 *
 * `s` returns the plain string (metadata, alt text, link targets), `t` returns
 * the value wrapped in a marked span so the visual editor can find it in the
 * rendered page, and `mark` returns the same marking attributes to spread onto
 * an element the editor should be able to select — an image, or a button whose
 * label comes from a field.
 *
 * Reads run through the anon key like every other public read. The request is
 * tagged so publishing an edit revalidates it directly, which keeps statically
 * rendered pages (most of the site) from serving stale copy after a save.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let client: ReturnType<typeof createClient<Database>> | null = null

function getTaggedClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  if (!client) {
    client = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) =>
          fetch(input, { ...init, cache: 'force-cache', next: { tags: [PAGE_CONTENT_TAG] } }),
      },
    })
  }
  return client
}

/** Stored overrides for every page, read once per render pass. */
const getAllOverrides = cache(async (): Promise<Record<string, Record<string, string>>> => {
  const supabase = getTaggedClient()
  if (!supabase) return {}

  const { data, error } = await supabase.from('page_content').select('path, values')
  if (error || !data) {
    if (error) console.warn('[page-copy] read failed:', error.message)
    return {}
  }

  const byPath: Record<string, Record<string, string>> = {}
  for (const row of data) byPath[row.path] = parseOverrides(row.values)
  return byPath
})

/** Stored overrides for one page path. */
export async function getPageOverrides(path: string): Promise<Record<string, string>> {
  return (await getAllOverrides())[path] ?? {}
}

export type PageCopy = {
  path: string
  spec: PageCopySpec
  /** Resolved value of a field: the editor's override, else the code default. */
  s(key: string): string
  /** The value wrapped in a span the visual editor can select and rewrite. */
  t(key: string): ReactNode
  /** Marking attributes to spread onto an element that carries a field. */
  mark(key: string): { 'data-copy': string; 'data-copy-kind': string }
  /** True when a field resolves to nothing, so its element can be skipped. */
  blank(key: string): boolean
}

/**
 * Resolve a page's copy. An unknown key returns an empty string rather than
 * throwing, so a typo degrades to a missing line instead of a broken page; the
 * same lookup logs once in development to make the typo obvious.
 */
export async function pageCopy(path: string): Promise<PageCopy> {
  const spec = getCopySpec(path)
  if (!spec) throw new Error(`[page-copy] no copy spec declared for ${path}`)

  const defaults = copyDefaults(spec)
  const fields = copyFieldMap(spec)
  const overrides = await getPageOverrides(path)

  const field = (key: string): CopyField | undefined => {
    const found = fields.get(key)
    if (!found && process.env.NODE_ENV !== 'production') {
      console.warn(`[page-copy] ${path} has no field "${key}"`)
    }
    return found
  }

  const s = (key: string): string => applyCopyTokens(overrides[key] ?? defaults[key] ?? '')

  // A cleared field renders nothing at all rather than an empty element.
  const blank = (key: string): boolean => s(key).trim() === ''

  const mark = (key: string) => ({
    'data-copy': key,
    'data-copy-kind': field(key)?.kind ?? 'text',
  })

  const t = (key: string): ReactNode => {
    const kind = field(key)?.kind ?? 'text'
    const value = s(key)
    if (!value) return null
    return (
      <span data-copy={key} data-copy-kind={kind}>
        {kind === 'rich' ? renderInline(value) : value}
      </span>
    )
  }

  return { path, spec, s, t, mark, blank }
}

/**
 * Per-page metadata built from the page's own "Search and sharing" fields, so
 * an editor's change to a search title or share image reaches the served HTML
 * on the next request. Pages call this from `generateMetadata`.
 */
export async function copyMetadata(
  path: string,
  extra?: { rawTitle?: boolean; noindex?: boolean }
): Promise<Metadata> {
  const copy = await pageCopy(path)
  return buildMetadata({
    title: copy.s('seo.title'),
    description: copy.s('seo.description'),
    path,
    ogTitle: copy.s('seo.ogTitle'),
    ogDescription: copy.s('seo.ogDescription'),
    ogImage: copy.s('seo.ogImage') || undefined,
    ogImageAlt: copy.s('seo.ogImageAlt') || undefined,
    ...extra,
  })
}
