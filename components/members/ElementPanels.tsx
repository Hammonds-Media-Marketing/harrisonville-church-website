'use client'

import { useState, type DragEvent, type ReactNode } from 'react'
import { Button } from '@/components/primitives/Button'
import { ImageUploadField } from '@/components/members/ImageUploadField'
import {
  ELEMENT_LABELS,
  ELEMENT_PALETTE,
  elementSummary,
  isContainer,
  videoEmbedUrl,
  type ElementType,
  type PageElement,
  type PageElementMap,
} from '@/lib/page-elements'

/**
 * The side-panel pieces of the visual editor's drag-and-drop layer: the
 * "Add elements" palette, the outline of what has been added, and the
 * inspector for the selected element. VisualEditor owns the state and the
 * preview frame; these only render it and report changes.
 */

// ---------------------------------------------------------------------------
// Palette icons, drawn to one 24px stroke grid
// ---------------------------------------------------------------------------

const ICON_PATHS: Record<ElementType, ReactNode> = {
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M4 18l5.5-5 3.5 3 2.5-2 4.5 4" />
    </>
  ),
  heading: <path d="M5 5h14M12 5v14M9.5 19h5" />,
  paragraph: <path d="M4 6h16M4 10h16M4 14h16M4 18h10" />,
  button: (
    <>
      <rect x="3" y="8" width="18" height="8" rx="4" />
      <path d="M8.5 12h7" />
    </>
  ),
  box: <rect x="4" y="6" width="16" height="12" rx="1.5" />,
  band: (
    <>
      <rect x="3.5" y="7" width="17" height="10" rx="1" />
      <path d="M3.5 4.5h17M3.5 19.5h17" />
    </>
  ),
  columns: (
    <>
      <rect x="3.5" y="5" width="7.5" height="14" rx="1" />
      <rect x="13" y="5" width="7.5" height="14" rx="1" />
    </>
  ),
  line: (
    <>
      <path d="M4 12h16" />
      <path d="M4 10v4M20 10v4" />
    </>
  ),
  spacer: <path d="M12 4v16M8.5 7.5L12 4l3.5 3.5M8.5 16.5L12 20l3.5-3.5M4 12h3M17 12h3" />,
  gallery: (
    <>
      <rect x="5" y="6.5" width="14" height="11" rx="1.5" />
      <path d="M3 9v6M21 9v6M6 16l4-3.5 3 2.5 2-1.5 3 2.5" />
    </>
  ),
  video: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M10 8.8v6.4l5.2-3.2z" />
    </>
  ),
  quote: <path d="M6 17c2.5-1 3.5-3 3.5-5.5V7H5v5h4.5M14.5 17c2.5-1 3.5-3 3.5-5.5V7h-4.5v5H18" />,
}

export function ElementIcon({ type, className = 'h-[1.9rem] w-[1.9rem]' }: { type: ElementType; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {ICON_PATHS[type]}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Add elements
// ---------------------------------------------------------------------------

export type Zone = { id: string; label: string }

export function AddElementsPanel({
  target,
  onAdd,
  onDragStart,
  onDragEnd,
}: {
  /** Where a clicked element lands, in words: "below the lighthouse hero". */
  target: string
  onAdd: (type: ElementType) => void
  onDragStart: (type: ElementType, event: DragEvent) => void
  onDragEnd: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-sm text-muted">
        Click an element to add it, or drag it onto the page. To put it somewhere else, use{' '}
        <span className="font-semibold text-heading">+ Add section</span> on the page.
      </p>

      <p className="m-0 rounded-md bg-surface px-3 py-2 text-sm text-ink" aria-live="polite">
        New elements go <span className="font-semibold text-heading">{target}</span>.
      </p>

      <ul className="grid list-none grid-cols-3 gap-2.5 p-0">
        {ELEMENT_PALETTE.map((item) => (
          <li key={item.type}>
            <button
              type="button"
              draggable
              title={item.hint}
              onClick={() => onAdd(item.type)}
              onDragStart={(e) => onDragStart(item.type, e)}
              onDragEnd={onDragEnd}
              className="flex aspect-[5/6] w-full cursor-grab flex-col items-center justify-center gap-2 rounded-md border border-border-strong/60 bg-bg px-1 text-sm text-heading transition-colors hover:border-primary-strong hover:bg-surface active:cursor-grabbing"
            >
              <ElementIcon type={item.type} />
              <span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inspector for the selected element
// ---------------------------------------------------------------------------

const inputClass =
  'w-full rounded-md border border-border bg-input-bg px-3 py-2 text-ink placeholder:text-placeholder focus:border-primary-strong'

function Field({ id, label, help, children }: { id: string; label: string; help?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-heading">
        {label}
      </label>
      {children}
      {help ? <p className="m-0 text-sm text-muted">{help}</p> : null}
    </div>
  )
}

function Text({ id, label, value, onChange, help, placeholder }: { id: string; label: string; value: string; onChange: (v: string) => void; help?: string; placeholder?: string }) {
  return (
    <Field id={id} label={label} help={help}>
      <input id={id} type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputClass} />
    </Field>
  )
}

function Area({ id, label, value, onChange, help, rows = 5 }: { id: string; label: string; value: string; onChange: (v: string) => void; help?: string; rows?: number }) {
  return (
    <Field id={id} label={label} help={help}>
      <textarea id={id} value={value} rows={rows} onChange={(e) => onChange(e.target.value)} className={`${inputClass} resize-y`} />
    </Field>
  )
}

function Choice<T extends string | number>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <Field id={id} label={label}>
      <select
        id={id}
        value={String(value)}
        onChange={(e) => onChange(options.find((o) => String(o.value) === e.target.value)?.value ?? value)}
        className={inputClass}
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

const ALIGN = [
  { value: 'left' as const, label: 'Left' },
  { value: 'center' as const, label: 'Centered' },
]

const actionClass =
  'grid h-[2.25rem] min-w-[2.25rem] place-items-center rounded-md border border-border-strong px-2 text-sm font-semibold text-primary-strong hover:bg-surface disabled:cursor-not-allowed disabled:border-border disabled:text-muted'

export function ElementInspector({
  element,
  canMoveUp,
  canMoveDown,
  onChange,
  onMove,
  onDuplicate,
  onRemove,
  onSelectParent,
}: {
  element: PageElement
  canMoveUp: boolean
  canMoveDown: boolean
  onChange: (next: PageElement) => void
  onMove: (direction: -1 | 1) => void
  onDuplicate: () => void
  onRemove: () => void
  onSelectParent?: () => void
}) {
  const id = `el-field-${element.id}`
  const label = ELEMENT_LABELS[element.type]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <ElementIcon type={element.type} className="h-[1.5rem] w-[1.5rem] text-primary-strong" />
        <h3 className="m-0 mr-auto text-lg">{label}</h3>
        <button type="button" aria-label={`Move ${label} up`} title="Move up" disabled={!canMoveUp} onClick={() => onMove(-1)} className={actionClass}>
          <span aria-hidden="true">↑</span>
        </button>
        <button type="button" aria-label={`Move ${label} down`} title="Move down" disabled={!canMoveDown} onClick={() => onMove(1)} className={actionClass}>
          <span aria-hidden="true">↓</span>
        </button>
        <button type="button" onClick={onDuplicate} className={actionClass}>
          Copy
        </button>
        <button type="button" onClick={onRemove} className={actionClass}>
          Delete
        </button>
      </div>
      {onSelectParent ? (
        <button type="button" onClick={onSelectParent} className="self-start text-sm font-semibold text-link underline underline-offset-2 hover:text-link-hover">
          Select the element around it
        </button>
      ) : null}
      <InspectorFields id={id} element={element} onChange={onChange} />
    </div>
  )
}

function InspectorFields({ id, element: el, onChange }: { id: string; element: PageElement; onChange: (next: PageElement) => void }) {
  const [galleryKey, setGalleryKey] = useState(0)

  switch (el.type) {
    case 'heading':
      return (
        <>
          <Text id={`${id}-text`} label="Heading" value={el.text} onChange={(text) => onChange({ ...el, text })} />
          <div className="grid grid-cols-2 gap-3">
            <Choice id={`${id}-level`} label="Size" value={el.level} onChange={(level) => onChange({ ...el, level })} options={[{ value: 2, label: 'Large' }, { value: 3, label: 'Smaller' }]} />
            <Choice id={`${id}-align`} label="Alignment" value={el.align} onChange={(align) => onChange({ ...el, align })} options={ALIGN} />
          </div>
        </>
      )
    case 'paragraph':
      return (
        <>
          <Area
            id={`${id}-text`}
            label="Text"
            value={el.text}
            rows={7}
            onChange={(text) => onChange({ ...el, text })}
            help="A blank line starts a new paragraph. Links are written as [the words](/the-page), bold as **words**."
          />
          <div className="grid grid-cols-2 gap-3">
            <Choice id={`${id}-size`} label="Size" value={el.size} onChange={(size) => onChange({ ...el, size })} options={[{ value: 'body', label: 'Regular' }, { value: 'lead', label: 'Larger lead-in' }]} />
            <Choice id={`${id}-align`} label="Alignment" value={el.align} onChange={(align) => onChange({ ...el, align })} options={ALIGN} />
          </div>
        </>
      )
    case 'button':
      return (
        <>
          <Text id={`${id}-label`} label="Button label" value={el.label} onChange={(label) => onChange({ ...el, label })} />
          <Text id={`${id}-href`} label="Link" value={el.href} placeholder="/contact" onChange={(href) => onChange({ ...el, href })} help="A page on this site such as /events, or a full https:// address." />
          <div className="grid grid-cols-2 gap-3">
            <Choice
              id={`${id}-style`}
              label="Style"
              value={el.style}
              onChange={(style) => onChange({ ...el, style })}
              options={[
                { value: 'primary', label: 'Gold' },
                { value: 'secondary', label: 'Teal' },
                { value: 'ghost', label: 'Outline' },
              ]}
            />
            <Choice id={`${id}-align`} label="Alignment" value={el.align} onChange={(align) => onChange({ ...el, align })} options={ALIGN} />
          </div>
        </>
      )
    case 'image':
      return (
        <>
          <ImageUploadField key={`${el.id}:${el.src}`} id={`${id}-src`} label="Photo" folder="pages" defaultValue={el.src} onChange={(src) => onChange({ ...el, src })} />
          <Text id={`${id}-alt`} label="Photo description" value={el.alt} onChange={(alt) => onChange({ ...el, alt })} help="What the photo shows, for people using screen readers. Leave it empty only for a purely decorative photo." />
          <Text id={`${id}-caption`} label="Caption (optional)" value={el.caption ?? ''} onChange={(caption) => onChange({ ...el, caption })} />
          <Choice
            id={`${id}-width`}
            label="Width"
            value={el.width}
            onChange={(width) => onChange({ ...el, width })}
            options={[
              { value: 'full', label: 'Full width' },
              { value: 'medium', label: 'Medium' },
              { value: 'small', label: 'Small' },
            ]}
          />
        </>
      )
    case 'gallery':
      return (
        <>
          <Choice
            id={`${id}-columns`}
            label="Photos per row"
            value={el.columns}
            onChange={(columns) => onChange({ ...el, columns })}
            options={[
              { value: 2, label: 'Two' },
              { value: 3, label: 'Three' },
              { value: 4, label: 'Four' },
            ]}
          />
          {el.images.length ? (
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {el.images.map((img, i) => (
                <li key={`${img.src}-${i}`} className="flex items-start gap-3 rounded-md border border-border p-2">
                  <img src={img.src} alt="" className="h-14 w-20 shrink-0 rounded object-cover" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <label htmlFor={`${id}-img-${i}`} className="sr-only">
                      Description of photo {i + 1}
                    </label>
                    <input
                      id={`${id}-img-${i}`}
                      type="text"
                      value={img.alt}
                      placeholder="Photo description"
                      onChange={(e) => onChange({ ...el, images: el.images.map((m, j) => (j === i ? { ...m, alt: e.target.value } : m)) })}
                      className={`${inputClass} py-1.5 text-sm`}
                    />
                    <button
                      type="button"
                      onClick={() => onChange({ ...el, images: el.images.filter((_, j) => j !== i) })}
                      className="self-start text-xs font-semibold text-link underline underline-offset-2 hover:text-link-hover"
                    >
                      Remove photo {i + 1}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
          <ImageUploadField
            key={`${el.id}-add-${galleryKey}`}
            id={`${id}-add`}
            label="Add a photo"
            folder="pages"
            onChange={(src) => {
              if (!src) return
              onChange({ ...el, images: [...el.images, { src, alt: '' }] })
              setGalleryKey((n) => n + 1)
            }}
          />
        </>
      )
    case 'video': {
      const valid = !el.url || Boolean(videoEmbedUrl(el.url))
      return (
        <>
          <Text
            id={`${id}-url`}
            label="Video link"
            value={el.url}
            placeholder="https://www.youtube.com/watch?v=…"
            onChange={(url) => onChange({ ...el, url })}
            help={valid ? 'Paste the link to a YouTube or Vimeo video.' : 'That link is not a YouTube or Vimeo video, so it will not show.'}
          />
          <Text id={`${id}-title`} label="Video title" value={el.title} onChange={(title) => onChange({ ...el, title })} help="Read aloud by screen readers." />
        </>
      )
    }
    case 'quote':
      return (
        <>
          <Area id={`${id}-text`} label="Quotation" value={el.text} rows={4} onChange={(text) => onChange({ ...el, text })} />
          <Text id={`${id}-cite`} label="Reference (optional)" value={el.cite ?? ''} placeholder="John 3:16" onChange={(cite) => onChange({ ...el, cite })} />
        </>
      )
    case 'spacer':
      return (
        <Choice
          id={`${id}-size`}
          label="Height"
          value={el.size}
          onChange={(size) => onChange({ ...el, size })}
          options={[
            { value: 'sm', label: 'Small' },
            { value: 'md', label: 'Medium' },
            { value: 'lg', label: 'Large' },
          ]}
        />
      )
    case 'line':
      return <p className="m-0 text-sm text-muted">A divider has no settings. Drag it to move it.</p>
    case 'box':
      return (
        <>
          <Choice
            id={`${id}-tone`}
            label="Look"
            value={el.tone}
            onChange={(tone) => onChange({ ...el, tone })}
            options={[
              { value: 'card', label: 'White card' },
              { value: 'panel', label: 'Sea-mist panel' },
            ]}
          />
          <ContainerHint />
        </>
      )
    case 'columns':
      return (
        <>
          <Choice
            id={`${id}-columns`}
            label="Columns"
            value={el.columns}
            onChange={(columns) => onChange({ ...el, columns })}
            options={[
              { value: 2, label: 'Two' },
              { value: 3, label: 'Three' },
            ]}
          />
          <ContainerHint extra="Each element takes one column; on phones they stack." />
        </>
      )
    case 'band':
      return (
        <>
          <Choice
            id={`${id}-tone`}
            label="Background"
            value={el.tone}
            onChange={(tone) => onChange({ ...el, tone })}
            options={[
              { value: 'light', label: 'White' },
              { value: 'surface', label: 'Sea mist' },
              { value: 'deep', label: 'Deep navy' },
            ]}
          />
          <ContainerHint />
        </>
      )
  }
}

function ContainerHint({ extra }: { extra?: string }) {
  return (
    <p className="m-0 text-sm text-muted">
      Drag elements into it on the page, or keep it selected and click an element in Add elements.{extra ? ` ${extra}` : ''}
    </p>
  )
}

export function EmptyInspector({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="m-0 text-sm text-muted">Click an element you added on the page to change it, move it, or delete it.</p>
      <Button type="button" size="sm" variant="ghost" onClick={onBrowse}>
        Add elements
      </Button>
    </div>
  )
}
