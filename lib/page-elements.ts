/**
 * Element model for the drag-and-drop layer of the visual editor.
 *
 * The hand-built pages are designed in code, so their own bands cannot be
 * rearranged. What an editor can do is drop new elements into the open slots
 * ("zones") each page leaves between its bands: a heading, a paragraph, a
 * photo, a button, a video, a band of their own with elements inside it. The
 * elements render through the same primitives as the rest of the site, so an
 * editor adds to a page without being able to put it off-brand.
 *
 * Stored as page_content.elements: a map of zone id to an ordered element
 * list. parsePageElements is the single validating gate on both save and
 * read: unknown types, unsafe links, and malformed fields are dropped, so a
 * bad payload degrades to a missing element, never a broken page.
 *
 * Nesting is one level deep for boxes and two for bands: a Section band may
 * hold boxes and columns, and those hold plain elements. That keeps every
 * layout an editor can build one the site's type and spacing already cover.
 *
 * Dependency-free, so the editor (client) and the renderer (server) share it.
 */

export type Align = 'left' | 'center'
export type BandTone = 'light' | 'surface' | 'deep'

type Base = { id: string }

export type HeadingElement = Base & { type: 'heading'; text: string; level: 2 | 3; align: Align }
export type ParagraphElement = Base & { type: 'paragraph'; text: string; size: 'body' | 'lead'; align: Align }
export type ButtonElement = Base & {
  type: 'button'
  label: string
  href: string
  style: 'primary' | 'secondary' | 'ghost'
  align: Align
}
export type ImageElement = Base & {
  type: 'image'
  src: string
  alt: string
  caption?: string
  width: 'small' | 'medium' | 'full'
}
export type GalleryElement = Base & { type: 'gallery'; columns: 2 | 3 | 4; images: { src: string; alt: string }[] }
export type VideoElement = Base & { type: 'video'; url: string; title: string }
export type QuoteElement = Base & { type: 'quote'; text: string; cite?: string }
export type LineElement = Base & { type: 'line' }
export type SpacerElement = Base & { type: 'spacer'; size: 'sm' | 'md' | 'lg' }

export type LeafElement =
  | HeadingElement
  | ParagraphElement
  | ButtonElement
  | ImageElement
  | GalleryElement
  | VideoElement
  | QuoteElement
  | LineElement
  | SpacerElement

/** A card-like box that groups a few elements. */
export type BoxElement = Base & { type: 'box'; tone: 'card' | 'panel'; children: LeafElement[] }
/** Side-by-side columns; each child fills one cell and wraps on phones. */
export type ColumnsElement = Base & { type: 'columns'; columns: 2 | 3; children: LeafElement[] }
/** A full-width band with its own background, holding anything but another band. */
export type BandElement = Base & { type: 'band'; tone: BandTone; children: InnerElement[] }

export type InnerElement = LeafElement | BoxElement | ColumnsElement
export type PageElement = InnerElement | BandElement
export type ElementType = PageElement['type']

/** Element types that hold other elements. */
export const CONTAINER_TYPES = new Set<ElementType>(['box', 'columns', 'band'])

export const isContainer = (el: PageElement): el is BoxElement | ColumnsElement | BandElement =>
  CONTAINER_TYPES.has(el.type)

/**
 * Whether an element of `type` may be dropped into a list owned by `parent`
 * (null for a page zone). Bands only sit at the top of a zone, and boxes and
 * columns never nest in each other.
 */
export function canDropInto(type: ElementType, parent: ElementType | null): boolean {
  if (parent === null) return true
  if (parent === 'band') return type !== 'band'
  return !CONTAINER_TYPES.has(type)
}

/** Palette entries in the order the "Add elements" panel shows them. */
export const ELEMENT_PALETTE: { type: ElementType; label: string; hint: string }[] = [
  { type: 'image', label: 'Image', hint: 'A photo, with a description and an optional caption.' },
  { type: 'heading', label: 'Title', hint: 'A heading that introduces what follows.' },
  { type: 'paragraph', label: 'Paragraph', hint: 'A few sentences. Links are written as [words](/page).' },
  { type: 'button', label: 'Button', hint: 'A button that links to a page or a site.' },
  { type: 'box', label: 'Container', hint: 'A card that groups a few elements together.' },
  { type: 'band', label: 'Section', hint: 'A full-width band with its own background.' },
  { type: 'columns', label: 'Columns', hint: 'Two or three elements side by side.' },
  { type: 'line', label: 'Line', hint: 'A thin divider between two pieces.' },
  { type: 'spacer', label: 'Spacer', hint: 'Extra breathing room.' },
  { type: 'gallery', label: 'Gallery', hint: 'A grid of photos.' },
  { type: 'video', label: 'Video', hint: 'A YouTube or Vimeo video.' },
  { type: 'quote', label: 'Quote', hint: 'A Scripture passage or a quotation.' },
]

export const ELEMENT_LABELS = Object.fromEntries(ELEMENT_PALETTE.map((p) => [p.type, p.label])) as Record<
  ElementType,
  string
>

export function elementId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `el-${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`
  }
  return `el-${Math.random().toString(36).slice(2, 12)}`
}

/** A fresh element with starter wording, so it is visible the moment it lands. */
export function newElement(type: ElementType): PageElement {
  const id = elementId()
  switch (type) {
    case 'heading':
      return { id, type, text: 'A new heading', level: 2, align: 'left' }
    case 'paragraph':
      return { id, type, text: 'Write a few sentences here.', size: 'body', align: 'left' }
    case 'button':
      return { id, type, label: 'Learn more', href: '/contact', style: 'secondary', align: 'left' }
    case 'image':
      return { id, type, src: '', alt: '', width: 'full' }
    case 'gallery':
      return { id, type, columns: 3, images: [] }
    case 'video':
      return { id, type, url: '', title: 'Video' }
    case 'quote':
      return { id, type, text: 'Your word is a lamp to my feet and a light to my path.', cite: 'Psalm 119:105' }
    case 'line':
      return { id, type }
    case 'spacer':
      return { id, type, size: 'md' }
    case 'box':
      return { id, type, tone: 'card', children: [] }
    case 'columns':
      return { id, type, columns: 2, children: [] }
    case 'band':
      return { id, type, tone: 'surface', children: [] }
  }
}

/** Copy an element (and anything inside it) with fresh ids. */
export function cloneElement<T extends PageElement>(el: T): T {
  const copy = { ...el, id: elementId() } as T
  if ('children' in copy) {
    ;(copy as { children: PageElement[] }).children = (copy.children as PageElement[]).map(cloneElement)
  }
  return copy
}

// ---------------------------------------------------------------------------
// Video links
// ---------------------------------------------------------------------------

/**
 * Turn a YouTube or Vimeo page link into its embed address. Anything else
 * returns null, so an editor cannot embed an arbitrary site in the page.
 * YouTube embeds use the no-cookie host.
 */
export function videoEmbedUrl(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    return null
  }
  const host = parsed.hostname.replace(/^www\./, '').replace(/^m\./, '')
  const ytId = /^[\w-]{11}$/
  if (host === 'youtu.be') {
    const id = parsed.pathname.slice(1).split('/')[0]
    return ytId.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null
  }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const fromQuery = parsed.searchParams.get('v')
    const fromPath = parsed.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/)?.[1]
    const id = fromQuery ?? fromPath
    return id && ytId.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = parsed.pathname.match(/(\d{6,})/)?.[1]
    return id ? `https://player.vimeo.com/video/${id}` : null
  }
  return null
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Link targets an editor may point a button at. Mirrors lib/inline-markup. */
const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/|#)/i
/** Image sources: site assets and uploads over https only. */
const SAFE_SRC = /^(https:\/\/|\/(?!\/))/i

const MAX_PER_LIST = 40
const MAX_GALLERY = 24
const MAX_TEXT = 4000

const str = (v: unknown, max = MAX_TEXT): string =>
  typeof v === 'string' ? v.replace(/\r\n/g, '\n').trim().slice(0, max) : ''
const optional = (v: unknown): string | undefined => str(v) || undefined
const pick = <T extends string | number>(v: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(v as T) ? (v as T) : fallback
const safeHref = (v: unknown): string => {
  const href = str(v, 500)
  return SAFE_HREF.test(href) ? href : ''
}
const safeSrc = (v: unknown): string => {
  const src = str(v, 1000)
  return SAFE_SRC.test(src) ? src : ''
}
const cleanId = (v: unknown): string => {
  const id = typeof v === 'string' ? v.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 40) : ''
  return id || elementId()
}

function parseLeaf(raw: Record<string, unknown>, id: string): LeafElement | null {
  const align = pick(raw.align, ['left', 'center'] as const, 'left')
  switch (raw.type) {
    case 'heading': {
      const text = str(raw.text, 300)
      return text ? { id, type: 'heading', text, level: pick(raw.level, [2, 3] as const, 2), align } : null
    }
    case 'paragraph': {
      const text = str(raw.text)
      return text ? { id, type: 'paragraph', text, size: pick(raw.size, ['body', 'lead'] as const, 'body'), align } : null
    }
    case 'button': {
      const label = str(raw.label, 80)
      const href = safeHref(raw.href)
      return label && href
        ? { id, type: 'button', label, href, style: pick(raw.style, ['primary', 'secondary', 'ghost'] as const, 'secondary'), align }
        : null
    }
    case 'image': {
      const src = safeSrc(raw.src)
      return src
        ? {
            id,
            type: 'image',
            src,
            alt: str(raw.alt, 300),
            caption: optional(raw.caption),
            width: pick(raw.width, ['small', 'medium', 'full'] as const, 'full'),
          }
        : null
    }
    case 'gallery': {
      const images = (Array.isArray(raw.images) ? raw.images : [])
        .flatMap((item) => {
          if (!item || typeof item !== 'object') return []
          const img = item as Record<string, unknown>
          const src = safeSrc(img.src)
          return src ? [{ src, alt: str(img.alt, 300) }] : []
        })
        .slice(0, MAX_GALLERY)
      return images.length ? { id, type: 'gallery', columns: pick(raw.columns, [2, 3, 4] as const, 3), images } : null
    }
    case 'video': {
      const url = str(raw.url, 500)
      return videoEmbedUrl(url) ? { id, type: 'video', url, title: str(raw.title, 200) || 'Video' } : null
    }
    case 'quote': {
      const text = str(raw.text)
      return text ? { id, type: 'quote', text, cite: optional(raw.cite) } : null
    }
    case 'line':
      return { id, type: 'line' }
    case 'spacer':
      return { id, type: 'spacer', size: pick(raw.size, ['sm', 'md', 'lg'] as const, 'md') }
    default:
      return null
  }
}

function parseList(value: unknown, parent: ElementType | null): PageElement[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const out: PageElement[] = []
  for (const item of value.slice(0, MAX_PER_LIST)) {
    const el = parseElement(item, parent)
    if (!el) continue
    // Duplicate ids would make selection and drag targets ambiguous.
    if (seen.has(el.id)) el.id = elementId()
    seen.add(el.id)
    out.push(el)
  }
  return out
}

function parseElement(item: unknown, parent: ElementType | null): PageElement | null {
  if (!item || typeof item !== 'object') return null
  const raw = item as Record<string, unknown>
  const type = raw.type as ElementType
  if (typeof raw.type !== 'string' || !canDropInto(type, parent)) return null
  const id = cleanId(raw.id)

  switch (type) {
    case 'box':
      return {
        id,
        type,
        tone: pick(raw.tone, ['card', 'panel'] as const, 'card'),
        children: parseList(raw.children, 'box') as LeafElement[],
      }
    case 'columns':
      return {
        id,
        type,
        columns: pick(raw.columns, [2, 3] as const, 2),
        children: parseList(raw.children, 'columns') as LeafElement[],
      }
    case 'band':
      return {
        id,
        type,
        tone: pick(raw.tone, ['light', 'surface', 'deep'] as const, 'surface'),
        children: parseList(raw.children, 'band') as InnerElement[],
      }
    default:
      return parseLeaf(raw, id)
  }
}

/** Zone ids are written in the page code: short, lowercase, hyphenated. */
export const ZONE_ID = /^[a-z0-9][a-z0-9-]{0,39}$/

export type PageElementMap = Record<string, PageElement[]>

/**
 * Validate an unknown value (a JSONB read or a posted payload) into a clean
 * zone map. Empty zones are dropped so the stored row stays small.
 */
export function parsePageElements(raw: unknown): PageElementMap {
  let value = raw
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return {}
    }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const map: PageElementMap = {}
  for (const [zone, list] of Object.entries(value as Record<string, unknown>).slice(0, 60)) {
    if (!ZONE_ID.test(zone)) continue
    const elements = parseList(list, null)
    if (elements.length) map[zone] = elements
  }
  return map
}

// ---------------------------------------------------------------------------
// Tree helpers for the editor
// ---------------------------------------------------------------------------

/** Where an element lives: its zone, the container holding it (null at the top), and its index. */
export type ElementLocation = { zone: string; parentId: string | null; index: number }

export function findElement(
  map: PageElementMap,
  id: string
): { element: PageElement; location: ElementLocation } | null {
  const walk = (list: PageElement[], zone: string, parentId: string | null): ReturnType<typeof findElement> => {
    for (let i = 0; i < list.length; i++) {
      const el = list[i]
      if (el.id === id) return { element: el, location: { zone, parentId, index: i } }
      if (isContainer(el)) {
        const found = walk(el.children, zone, el.id)
        if (found) return found
      }
    }
    return null
  }
  for (const [zone, list] of Object.entries(map)) {
    const found = walk(list, zone, null)
    if (found) return found
  }
  return null
}

/** Rebuild one list (a zone's top level, or a container's children) immutably. */
export function updateList(
  map: PageElementMap,
  zone: string,
  parentId: string | null,
  fn: (list: PageElement[]) => PageElement[]
): PageElementMap {
  if (parentId === null) {
    const next = fn(map[zone] ?? [])
    const copy = { ...map }
    if (next.length) copy[zone] = next
    else delete copy[zone]
    return copy
  }
  const mapChildren = (list: PageElement[]): PageElement[] =>
    list.map((el) => {
      if (!isContainer(el)) return el
      if (el.id === parentId) return { ...el, children: fn(el.children) } as PageElement
      return { ...el, children: mapChildren(el.children) } as PageElement
    })
  return { ...map, [zone]: mapChildren(map[zone] ?? []) }
}

/** Replace one element wherever it lives. */
export function replaceElement(map: PageElementMap, next: PageElement): PageElementMap {
  const found = findElement(map, next.id)
  if (!found) return map
  const { zone, parentId, index } = found.location
  return updateList(map, zone, parentId, (list) => list.map((el, i) => (i === index ? next : el)))
}

export function removeElement(map: PageElementMap, id: string): PageElementMap {
  const found = findElement(map, id)
  if (!found) return map
  const { zone, parentId, index } = found.location
  return updateList(map, zone, parentId, (list) => list.filter((_, i) => i !== index))
}

/**
 * Put `element` at `index` in the target list, taking it out of wherever it
 * was first (a move) or adding it (a new element). Returns the map unchanged
 * when the drop is not allowed — a band inside a box, or a container into
 * itself.
 */
export function insertElement(
  map: PageElementMap,
  element: PageElement,
  target: { zone: string; parentId: string | null; index: number }
): PageElementMap {
  const parent = target.parentId ? findElement(map, target.parentId)?.element : null
  if (target.parentId && !parent) return map
  if (!canDropInto(element.type, parent ? parent.type : null)) return map
  if (target.parentId === element.id) return map
  if (parent && isContainer(element) && findElement({ z: [element] }, parent.id)) return map

  let index = target.index
  let next = map
  const existing = findElement(map, element.id)
  if (existing) {
    const { location } = existing
    // Removing an earlier sibling shifts the target one place up.
    if (location.zone === target.zone && location.parentId === target.parentId && location.index < index) index -= 1
    next = removeElement(map, element.id)
  }
  return updateList(next, target.zone, target.parentId, (list) => {
    const copy = list.slice()
    copy.splice(Math.max(0, Math.min(index, copy.length)), 0, element)
    return copy
  })
}

/** Count every element on a page, containers included. */
export function countElements(map: PageElementMap): number {
  const count = (list: PageElement[]): number =>
    list.reduce((n, el) => n + 1 + (isContainer(el) ? count(el.children) : 0), 0)
  return Object.values(map).reduce((n, list) => n + count(list), 0)
}

/** One-line description of an element for the editor's panel. */
export function elementSummary(el: PageElement): string {
  switch (el.type) {
    case 'heading':
    case 'paragraph':
    case 'quote':
      return el.text.split('\n')[0].slice(0, 60)
    case 'button':
      return el.label
    case 'image':
      return el.alt || (el.src ? 'Photo' : 'No photo chosen yet')
    case 'gallery':
      return `${el.images.length} photo${el.images.length === 1 ? '' : 's'}`
    case 'video':
      return el.title
    case 'box':
    case 'columns':
    case 'band':
      return `${el.children.length} element${el.children.length === 1 ? '' : 's'} inside`
    default:
      return ELEMENT_LABELS[el.type]
  }
}
