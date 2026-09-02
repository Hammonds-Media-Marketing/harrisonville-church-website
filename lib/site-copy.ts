/**
 * Copy model for the hand-built pages.
 *
 * Each core page declares its editable words and images as a flat list of
 * fields grouped by the band they appear in (content/site-copy/*.ts). The
 * declaration is the single source of truth for the default value: the page
 * renders `copy.s('hero.title')` rather than a literal, and the visual editor
 * renders the same list as its side panel. Adding a field to a page is one
 * edit in the spec plus one call site.
 *
 * An editor's changes are stored as a sparse override map (page_content.values)
 * keyed by field key. A key with no override falls back to the default here, so
 * the site keeps rendering correctly when Supabase is unreachable, when a field
 * is newly added, or when a stored key no longer exists.
 *
 * This module is dependency-free so the builder (client) and the renderer
 * (server) can both import it.
 */

/** Next.js cache tag every page-copy read is filed under. */
export const PAGE_CONTENT_TAG = 'page-content'

export type CopyFieldKind =
  /** One line of plain text: a heading, an eyebrow, a button label. */
  | 'text'
  /** Several sentences of plain text. Blank lines are not meaningful. */
  | 'longText'
  /** Plain text with inline links and bold, written as [label](/path) and **bold**. */
  | 'rich'
  /** An image URL, edited by uploading a photo or pasting a link. */
  | 'image'
  /** Alternative text describing an image for screen readers and search. */
  | 'alt'
  /** A link target: a site path such as /contact, or a full https:// URL. */
  | 'href'
  /** Search and social metadata, which never appears on the page itself. */
  | 'meta'

export type CopyField = {
  /** Stable identifier, unique within the page. Dots group related fields. */
  key: string
  label: string
  kind: CopyFieldKind
  /** The wording shipped in the code — what an editor sees before any change. */
  value: string
  /** Plain-language note shown under the field in the editor. */
  help?: string
}

export type CopyGroup = {
  id: string
  label: string
  hint?: string
  fields: CopyField[]
}

export type PageCopySpec = {
  /** Site path with its leading slash, matching page_content.path. */
  path: string
  /** Page name as editors know it. */
  name: string
  /** One line describing what the page is for, shown in the editor index. */
  summary: string
  groups: CopyGroup[]
}

/** Kinds an editor can type directly onto the page in the visual editor. */
const INLINE_KINDS = new Set<CopyFieldKind>(['text', 'longText', 'rich'])

export const isInlineEditable = (kind: CopyFieldKind): boolean => INLINE_KINDS.has(kind)

/** Every field on a page, flattened out of its groups. */
export function copyFields(spec: PageCopySpec): CopyField[] {
  return spec.groups.flatMap((g) => g.fields)
}

/** Field key to its declared default, for one page. */
export function copyDefaults(spec: PageCopySpec): Record<string, string> {
  const defaults: Record<string, string> = {}
  for (const field of copyFields(spec)) defaults[field.key] = field.value
  return defaults
}

/** Field key to its declaration, for one page. */
export function copyFieldMap(spec: PageCopySpec): Map<string, CopyField> {
  return new Map(copyFields(spec).map((f) => [f.key, f]))
}

/**
 * Keep only overrides the page still declares, and only where the wording
 * actually differs from the code. Storing a value identical to the default
 * would silently freeze that line the next time the code copy is revised, so
 * the save action drops it instead.
 *
 * An empty string is kept rather than dropped: it is how an editor removes a
 * line entirely — a placeholder notice, an optional caption — and it has to
 * outrank the default for that to work.
 */
export function pruneOverrides(spec: PageCopySpec, values: Record<string, unknown>): Record<string, string> {
  const defaults = copyDefaults(spec)
  const kept: Record<string, string> = {}
  for (const [key, raw] of Object.entries(values)) {
    if (!(key in defaults)) continue
    if (typeof raw !== 'string') continue
    const value = raw.replace(/\r\n/g, '\n').trim()
    if (value === defaults[key].trim()) continue
    kept[key] = value
  }
  return kept
}

/** Only string values survive a read of the stored JSONB. */
export function parseOverrides(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const values: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'string') values[key] = value
  }
  return values
}
