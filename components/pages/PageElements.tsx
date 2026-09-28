import type { ReactNode } from 'react'
import { Container, Section } from '@/components/primitives/Layout'
import { Surface } from '@/components/primitives/Surface'
import { Button } from '@/components/primitives/Button'
import { inlineToHtml, renderInline } from '@/lib/inline-markup'
import {
  ELEMENT_LABELS,
  isContainer,
  videoEmbedUrl,
  type BandElement,
  type InnerElement,
  type LeafElement,
  type PageElement,
} from '@/lib/page-elements'

/**
 * Renders the elements an editor dropped into a page zone. The same component
 * serves both sides: the public page renders it on the server, and the visual
 * editor renders it into its preview frame (with `editing`) as elements are
 * dragged in and changed, so the preview is the published result.
 *
 * In editing mode links become inert buttons (a click in the preview must not
 * navigate the editor), embeds stop taking the pointer (so a video can be
 * selected and dragged), and empty spots show where elements can land.
 *
 * Every element carries `data-el` and every list that accepts drops carries
 * `data-el-list`, which is how the editor finds drop targets in the frame.
 */

type Ctx = { editing: boolean; onDeep: boolean }

const alignClass = (align: 'left' | 'center') => (align === 'center' ? 'text-center' : '')

function paragraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

/** Inline markup: live links on the site, inert escaped HTML in the editor. */
function Inline({ text, editing }: { text: string; editing: boolean }) {
  if (editing) return <span dangerouslySetInnerHTML={{ __html: inlineToHtml(text) }} />
  return <>{renderInline(text)}</>
}

function Placeholder({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-[8rem] place-items-center rounded-lg border-2 border-dashed border-border-strong bg-surface-2 px-4 py-6 text-center text-sm font-semibold text-muted">
      {children}
    </div>
  )
}

function Leaf({ el, ctx }: { el: LeafElement; ctx: Ctx }) {
  const { editing, onDeep } = ctx
  switch (el.type) {
    case 'heading': {
      const Tag = el.level === 3 ? 'h3' : 'h2'
      return (
        <Tag className={`${el.level === 3 ? 'text-2xl' : 'text-3xl md:text-4xl'} ${onDeep ? 'text-on-deep' : ''} ${alignClass(el.align)}`}>
          {el.text}
        </Tag>
      )
    }
    case 'paragraph':
      return (
        <div className={`flex flex-col gap-4 ${alignClass(el.align)} ${el.align === 'center' ? 'mx-auto' : ''} max-w-prose`}>
          {paragraphs(el.text).map((p, i) => (
            <p
              key={i}
              className={`${el.size === 'lead' ? 'text-lg' : ''} ${onDeep ? 'text-on-deep-muted' : el.size === 'lead' ? 'text-muted' : 'text-ink'}`}
            >
              <Inline text={p} editing={editing} />
            </p>
          ))}
        </div>
      )
    case 'button': {
      const variant = el.style === 'primary' ? 'primary' : el.style === 'ghost' ? (onDeep ? 'ghostOnDeep' : 'ghost') : 'secondary'
      return (
        <div className={`flex ${el.align === 'center' ? 'justify-center' : ''}`}>
          {editing ? (
            <Button type="button" variant={variant} tabIndex={-1}>
              {el.label}
            </Button>
          ) : (
            <Button href={el.href} variant={variant}>
              {el.label}
            </Button>
          )}
        </div>
      )
    }
    case 'image': {
      if (!el.src) return editing ? <Placeholder>Choose a photo in the panel</Placeholder> : null
      const width = el.width === 'small' ? 'max-w-xs' : el.width === 'medium' ? 'max-w-xl' : 'w-full'
      return (
        <figure className={`mx-auto ${width} w-full`}>
          {/* Editor photos have no known size, so a plain lazy image keeps
              their own proportions instead of cropping them to a guess. */}
          <img src={el.src} alt={el.alt} loading="lazy" decoding="async" className="photo-grade h-auto w-full rounded-xl shadow-md" />
          {el.caption ? (
            <figcaption className={`mt-3 text-center text-sm ${onDeep ? 'text-on-deep-muted' : 'text-muted'}`}>{el.caption}</figcaption>
          ) : null}
        </figure>
      )
    }
    case 'gallery': {
      if (!el.images.length) return editing ? <Placeholder>Add photos to the gallery in the panel</Placeholder> : null
      const cols = el.columns === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : el.columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'
      return (
        <ul className={`grid list-none grid-cols-1 gap-4 p-0 ${cols}`}>
          {el.images.map((img, i) => (
            <li key={`${img.src}-${i}`} className="aspect-[4/3] overflow-hidden rounded-lg shadow-sm">
              <img src={img.src} alt={img.alt} loading="lazy" decoding="async" className="photo-grade h-full w-full object-cover" />
            </li>
          ))}
        </ul>
      )
    }
    case 'video': {
      const src = videoEmbedUrl(el.url)
      if (!src) return editing ? <Placeholder>Paste a YouTube or Vimeo link in the panel</Placeholder> : null
      return (
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-surface-deep shadow-md">
          <iframe
            src={src}
            title={el.title}
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className={`h-full w-full border-0 ${editing ? 'pointer-events-none' : ''}`}
          />
        </div>
      )
    }
    case 'quote':
      return (
        <blockquote className="max-w-prose rounded-r-md border-l-4 border-primary bg-surface px-5 py-4 text-ink">
          <p className="text-lg italic">{el.text}</p>
          {el.cite ? (
            <cite className="mt-2 block font-body text-sm font-semibold not-italic text-primary-strong">{el.cite}</cite>
          ) : null}
        </blockquote>
      )
    case 'line':
      return <hr className={`my-2 border-0 border-t ${onDeep ? 'border-on-deep-muted/40' : 'border-border-strong/50'}`} />
    case 'spacer':
      return <div aria-hidden="true" className={el.size === 'sm' ? 'h-5' : el.size === 'lg' ? 'h-9' : 'h-7'} />
  }
}

/** Editor-only hooks on an element's wrapper: draggable, and named for its tag. */
const editAttrs = (el: PageElement, editing: boolean) =>
  editing ? { draggable: true, 'data-el-name': ELEMENT_LABELS[el.type] } : {}

/** The children of a container, or the drop placeholder while it is empty. */
function List({ elements, parentId, ctx, className }: { elements: PageElement[]; parentId: string; ctx: Ctx; className: string }) {
  return (
    <div data-el-list={parentId} className={className}>
      {elements.length ? (
        elements.map((child) => <Item key={child.id} el={child} ctx={ctx} />)
      ) : ctx.editing ? (
        <p data-el-empty="" className="m-0 rounded-md border-2 border-dashed border-border-strong/60 px-4 py-6 text-center text-sm text-muted">
          Drag elements here
        </p>
      ) : null}
    </div>
  )
}

function Item({ el, ctx }: { el: InnerElement | PageElement; ctx: Ctx }) {
  if (isContainer(el) && !el.children.length && !ctx.editing) return null
  let body: ReactNode
  switch (el.type) {
    case 'box':
      body = (
        <Surface tone={ctx.onDeep ? 'deep' : el.tone}>
          <List elements={el.children} parentId={el.id} ctx={ctx} className="flex flex-col gap-4" />
        </Surface>
      )
      break
    case 'columns':
      body = (
        <List
          elements={el.children}
          parentId={el.id}
          ctx={ctx}
          className={`grid items-start gap-6 ${el.columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'} ${el.children.length ? '' : 'md:grid-cols-1'}`}
        />
      )
      break
    case 'band':
      // Bands only sit at the top of a zone; ZoneElements renders them.
      return null
    default:
      body = <Leaf el={el} ctx={ctx} />
  }
  return (
    <div data-el={el.id} data-el-type={el.type} className="min-w-0" {...editAttrs(el, ctx.editing)}>
      {body}
    </div>
  )
}

function Band({ el, editing }: { el: BandElement; editing: boolean }) {
  if (!el.children.length && !editing) return null
  const ctx: Ctx = { editing, onDeep: el.tone === 'deep' }
  return (
    <div data-el={el.id} data-el-type="band" {...editAttrs(el, editing)}>
      <Section tone={el.tone}>
        <Container>
          <List elements={el.children} parentId={el.id} ctx={ctx} className="flex flex-col gap-5" />
        </Container>
      </Section>
    </div>
  )
}

/**
 * A zone's elements. Bands render as their own full-width sections; any run of
 * other elements between them shares one plain band, so a heading and the
 * paragraph under it sit together with the site's normal spacing.
 */
export function ZoneElements({ elements, editing = false }: { elements: PageElement[]; editing?: boolean }) {
  const groups: ({ band: BandElement } | { loose: InnerElement[] })[] = []
  for (const el of elements) {
    if (el.type === 'band') groups.push({ band: el })
    else {
      const last = groups[groups.length - 1]
      if (last && 'loose' in last) last.loose.push(el)
      else groups.push({ loose: [el] })
    }
  }
  const ctx: Ctx = { editing, onDeep: false }
  return (
    <>
      {groups.map((group) =>
        'band' in group ? (
          <Band key={group.band.id} el={group.band} editing={editing} />
        ) : (
          <Section key={group.loose[0].id} tone="light">
            <Container className="flex flex-col gap-5">
              {group.loose.map((el) => (
                <Item key={el.id} el={el} ctx={ctx} />
              ))}
            </Container>
          </Section>
        )
      )}
    </>
  )
}

/**
 * The slot a hand-built page leaves between two of its bands. Renders nothing
 * visible until an editor drops something into it; the wrapper stays in the
 * page so the visual editor can find the slot and show it as a drop target.
 */
export function ElementZone({ id, label, elements }: { id: string; label: string; elements: PageElement[] }) {
  return (
    <div data-element-zone={id} data-zone-label={label}>
      {elements.length ? <ZoneElements elements={elements} /> : null}
    </div>
  )
}
