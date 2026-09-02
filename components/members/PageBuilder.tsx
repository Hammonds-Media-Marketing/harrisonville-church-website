'use client'

import { useState, type ReactNode } from 'react'
import { Button } from '@/components/primitives/Button'
import { RichTextBodyEditor } from '@/components/members/RichTextBodyEditor'
import { ImageUploadField } from '@/components/members/ImageUploadField'
import {
  SECTION_LABELS,
  SECTION_TYPES,
  sectionSummary,
  type CardGridSection,
  type CtaSection,
  type FaqSection,
  type ImageTextSection,
  type PageSection,
  type RichTextSection,
  type SectionTone,
  type SectionType,
} from '@/lib/page-sections'

/**
 * Drag-and-drop page builder. Editors compose a page from typed sections:
 * add from the palette, reorder by dragging the handle or with the move
 * buttons (the keyboard path — every reorder is announced to screen
 * readers), and edit each section's fields in place. The section list
 * serializes to a hidden input, so the surrounding server-component form
 * submits it like any other field and the server action validates it with
 * the same parser the public renderer uses.
 */

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
  }
  return Math.random().toString(36).slice(2, 14)
}

function newSection(type: SectionType): PageSection {
  const id = uid()
  switch (type) {
    case 'richText':
      return { id, type, tone: 'light', blocks: [] }
    case 'imageText':
      return { id, type, tone: 'light', title: '', body: '', image: '', imageAlt: '', imageSide: 'right' }
    case 'cardGrid':
      return { id, type, tone: 'surface', title: '', columns: 3, cards: [{ title: '', body: '' }] }
    case 'faq':
      return { id, type, tone: 'light', title: '', items: [{ question: '', answer: '' }] }
    case 'cta':
      return { id, type, title: '', primaryLabel: '', primaryHref: '' }
  }
}

// ---------------------------------------------------------------------------
// Small controlled inputs (the shared Field primitives are uncontrolled)
// ---------------------------------------------------------------------------

const inputClass =
  'w-full rounded-md border border-border bg-input-bg px-3 py-2 text-ink placeholder:text-placeholder focus:border-primary-strong'

function Labeled({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-heading">
        {label}
      </label>
      {children}
    </div>
  )
}

function TextInput({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <Labeled id={id} label={label}>
      <input id={id} type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputClass} />
    </Labeled>
  )
}

function TextAreaInput({
  id,
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
}) {
  return (
    <Labeled id={id} label={label}>
      <textarea id={id} value={value} rows={rows} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={`${inputClass} resize-y`} />
    </Labeled>
  )
}

function SelectInput({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <Labeled id={id} label={label}>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Labeled>
  )
}

const TONE_OPTIONS = [
  { value: 'light', label: 'White band' },
  { value: 'surface', label: 'Sea-mist band' },
  { value: 'deep', label: 'Deep navy band' },
]

function ToneSelect({ id, value, onChange }: { id: string; value: SectionTone; onChange: (tone: SectionTone) => void }) {
  return <SelectInput id={id} label="Background" value={value} onChange={(v) => onChange(v as SectionTone)} options={TONE_OPTIONS} />
}

// ---------------------------------------------------------------------------
// Repeating sub-lists (cards, questions) with their own move and remove
// ---------------------------------------------------------------------------

function SubItemFrame({
  label,
  index,
  count,
  onMove,
  onRemove,
  children,
}: {
  label: string
  index: number
  count: number
  onMove: (from: number, to: number) => void
  onRemove: () => void
  children: ReactNode
}) {
  return (
    <li className="flex flex-col gap-3 rounded-md border border-border bg-bg p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold uppercase tracking-wide text-muted">
          {label} {index + 1} of {count}
        </span>
        <span className="flex items-center gap-1">
          <button
            type="button"
            aria-label={`Move ${label} ${index + 1} up`}
            disabled={index === 0}
            onClick={() => onMove(index, index - 1)}
            className="grid h-8 w-8 place-items-center rounded-md border border-border-strong text-primary-strong hover:bg-surface disabled:cursor-not-allowed disabled:border-border disabled:text-muted"
          >
            <span aria-hidden="true">↑</span>
          </button>
          <button
            type="button"
            aria-label={`Move ${label} ${index + 1} down`}
            disabled={index === count - 1}
            onClick={() => onMove(index, index + 1)}
            className="grid h-8 w-8 place-items-center rounded-md border border-border-strong text-primary-strong hover:bg-surface disabled:cursor-not-allowed disabled:border-border disabled:text-muted"
          >
            <span aria-hidden="true">↓</span>
          </button>
          <button
            type="button"
            aria-label={`Remove ${label} ${index + 1}`}
            disabled={count === 1}
            onClick={onRemove}
            className="grid h-8 w-8 place-items-center rounded-md border border-border-strong text-primary-strong hover:bg-surface disabled:cursor-not-allowed disabled:border-border disabled:text-muted"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </span>
      </div>
      {children}
    </li>
  )
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = items.slice()
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

// ---------------------------------------------------------------------------
// Per-type section editors
// ---------------------------------------------------------------------------

function RichTextFields({ section, onChange }: { section: RichTextSection; onChange: (s: RichTextSection) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <TextInput id={`${section.id}-eyebrow`} label="Eyebrow (optional)" value={section.eyebrow ?? ''} onChange={(eyebrow) => onChange({ ...section, eyebrow })} />
        <TextInput id={`${section.id}-title`} label="Section heading (optional)" value={section.title ?? ''} onChange={(title) => onChange({ ...section, title })} />
        <ToneSelect id={`${section.id}-tone`} value={section.tone} onChange={(tone) => onChange({ ...section, tone })} />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-heading">Body</span>
        <RichTextBodyEditor
          id={`${section.id}-body`}
          label="Section body"
          minHeightClass="min-h-[10rem]"
          defaultBlocks={section.blocks}
          onBlocksChange={(blocks) => onChange({ ...section, blocks })}
        />
      </div>
    </div>
  )
}

function ImageTextFields({ section, onChange }: { section: ImageTextSection; onChange: (s: ImageTextSection) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <TextInput id={`${section.id}-eyebrow`} label="Eyebrow (optional)" value={section.eyebrow ?? ''} onChange={(eyebrow) => onChange({ ...section, eyebrow })} />
        <TextInput id={`${section.id}-title`} label="Section heading" value={section.title} onChange={(title) => onChange({ ...section, title })} />
      </div>
      <TextAreaInput
        id={`${section.id}-body`}
        label="Body"
        value={section.body}
        onChange={(body) => onChange({ ...section, body })}
        placeholder="Blank lines start new paragraphs."
      />
      <ImageUploadField
        id={`${section.id}-image`}
        label="Photo"
        folder="pages"
        defaultValue={section.image}
        onChange={(image) => onChange({ ...section, image })}
        helper="Shown beside the text. Landscape photos around 1200 by 900 pixels look best."
      />
      <div className="flex flex-wrap gap-4">
        <TextInput id={`${section.id}-image-alt`} label="Photo description" value={section.imageAlt} onChange={(imageAlt) => onChange({ ...section, imageAlt })} placeholder="What the photo shows, for screen readers." />
        <SelectInput
          id={`${section.id}-side`}
          label="Photo position"
          value={section.imageSide}
          onChange={(v) => onChange({ ...section, imageSide: v === 'left' ? 'left' : 'right' })}
          options={[
            { value: 'right', label: 'Right of the text' },
            { value: 'left', label: 'Left of the text' },
          ]}
        />
        <ToneSelect id={`${section.id}-tone`} value={section.tone} onChange={(tone) => onChange({ ...section, tone })} />
      </div>
      <div className="flex flex-wrap gap-4">
        <TextInput id={`${section.id}-cta-label`} label="Button label (optional)" value={section.ctaLabel ?? ''} onChange={(ctaLabel) => onChange({ ...section, ctaLabel })} />
        <TextInput id={`${section.id}-cta-href`} label="Button link (optional)" value={section.ctaHref ?? ''} onChange={(ctaHref) => onChange({ ...section, ctaHref })} placeholder="/contact" />
      </div>
    </div>
  )
}

function CardGridFields({ section, onChange }: { section: CardGridSection; onChange: (s: CardGridSection) => void }) {
  const setCard = (index: number, patch: Partial<CardGridSection['cards'][number]>) => {
    const cards = section.cards.map((c, i) => (i === index ? { ...c, ...patch } : c))
    onChange({ ...section, cards })
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <TextInput id={`${section.id}-eyebrow`} label="Eyebrow (optional)" value={section.eyebrow ?? ''} onChange={(eyebrow) => onChange({ ...section, eyebrow })} />
        <TextInput id={`${section.id}-title`} label="Section heading" value={section.title} onChange={(title) => onChange({ ...section, title })} />
      </div>
      <div className="flex flex-wrap gap-4">
        <TextInput id={`${section.id}-lead`} label="Lead sentence (optional)" value={section.lead ?? ''} onChange={(lead) => onChange({ ...section, lead })} />
        <SelectInput
          id={`${section.id}-columns`}
          label="Columns"
          value={String(section.columns)}
          onChange={(v) => onChange({ ...section, columns: v === '2' ? 2 : 3 })}
          options={[
            { value: '3', label: 'Three across' },
            { value: '2', label: 'Two across' },
          ]}
        />
        <ToneSelect id={`${section.id}-tone`} value={section.tone} onChange={(tone) => onChange({ ...section, tone })} />
      </div>
      <ul className="flex list-none flex-col gap-3 p-0">
        {section.cards.map((card, i) => (
          <SubItemFrame
            key={i}
            label="Card"
            index={i}
            count={section.cards.length}
            onMove={(from, to) => onChange({ ...section, cards: moveItem(section.cards, from, to) })}
            onRemove={() => onChange({ ...section, cards: section.cards.filter((_, j) => j !== i) })}
          >
            <div className="flex flex-wrap gap-4">
              <TextInput id={`${section.id}-card-${i}-title`} label="Card heading" value={card.title} onChange={(title) => setCard(i, { title })} />
            </div>
            <TextAreaInput id={`${section.id}-card-${i}-body`} label="Card text" rows={2} value={card.body} onChange={(body) => setCard(i, { body })} />
            <div className="flex flex-wrap gap-4">
              <TextInput id={`${section.id}-card-${i}-link-label`} label="Link label (optional)" value={card.linkLabel ?? ''} onChange={(linkLabel) => setCard(i, { linkLabel })} />
              <TextInput id={`${section.id}-card-${i}-link-href`} label="Link (optional)" value={card.linkHref ?? ''} onChange={(linkHref) => setCard(i, { linkHref })} placeholder="/events" />
            </div>
          </SubItemFrame>
        ))}
      </ul>
      <div>
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ ...section, cards: [...section.cards, { title: '', body: '' }] })}>
          Add a card
        </Button>
      </div>
    </div>
  )
}

function FaqFields({ section, onChange }: { section: FaqSection; onChange: (s: FaqSection) => void }) {
  const setItem = (index: number, patch: Partial<FaqSection['items'][number]>) => {
    const items = section.items.map((it, i) => (i === index ? { ...it, ...patch } : it))
    onChange({ ...section, items })
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <TextInput id={`${section.id}-eyebrow`} label="Eyebrow (optional)" value={section.eyebrow ?? ''} onChange={(eyebrow) => onChange({ ...section, eyebrow })} />
        <TextInput id={`${section.id}-title`} label="Section heading" value={section.title} onChange={(title) => onChange({ ...section, title })} />
      </div>
      <div className="flex flex-wrap gap-4">
        <TextInput id={`${section.id}-lead`} label="Lead sentence (optional)" value={section.lead ?? ''} onChange={(lead) => onChange({ ...section, lead })} />
        <ToneSelect id={`${section.id}-tone`} value={section.tone} onChange={(tone) => onChange({ ...section, tone })} />
      </div>
      <ul className="flex list-none flex-col gap-3 p-0">
        {section.items.map((item, i) => (
          <SubItemFrame
            key={i}
            label="Question"
            index={i}
            count={section.items.length}
            onMove={(from, to) => onChange({ ...section, items: moveItem(section.items, from, to) })}
            onRemove={() => onChange({ ...section, items: section.items.filter((_, j) => j !== i) })}
          >
            <TextInput id={`${section.id}-item-${i}-q`} label="Question" value={item.question} onChange={(question) => setItem(i, { question })} />
            <TextAreaInput id={`${section.id}-item-${i}-a`} label="Answer" rows={2} value={item.answer} onChange={(answer) => setItem(i, { answer })} />
          </SubItemFrame>
        ))}
      </ul>
      <div>
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ ...section, items: [...section.items, { question: '', answer: '' }] })}>
          Add a question
        </Button>
      </div>
    </div>
  )
}

function CtaFields({ section, onChange }: { section: CtaSection; onChange: (s: CtaSection) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <TextInput id={`${section.id}-title`} label="Headline" value={section.title} onChange={(title) => onChange({ ...section, title })} />
      <TextAreaInput id={`${section.id}-body`} label="Supporting sentence (optional)" rows={2} value={section.body ?? ''} onChange={(body) => onChange({ ...section, body })} />
      <div className="flex flex-wrap gap-4">
        <TextInput id={`${section.id}-primary-label`} label="Main button label" value={section.primaryLabel} onChange={(primaryLabel) => onChange({ ...section, primaryLabel })} />
        <TextInput id={`${section.id}-primary-href`} label="Main button link" value={section.primaryHref} onChange={(primaryHref) => onChange({ ...section, primaryHref })} placeholder="/about/what-to-expect" />
      </div>
      <div className="flex flex-wrap gap-4">
        <TextInput id={`${section.id}-secondary-label`} label="Second button label (optional)" value={section.secondaryLabel ?? ''} onChange={(secondaryLabel) => onChange({ ...section, secondaryLabel })} />
        <TextInput id={`${section.id}-secondary-href`} label="Second button link (optional)" value={section.secondaryHref ?? ''} onChange={(secondaryHref) => onChange({ ...section, secondaryHref })} placeholder="/contact" />
      </div>
    </div>
  )
}

function SectionFields({ section, onChange }: { section: PageSection; onChange: (s: PageSection) => void }) {
  switch (section.type) {
    case 'richText':
      return <RichTextFields section={section} onChange={onChange} />
    case 'imageText':
      return <ImageTextFields section={section} onChange={onChange} />
    case 'cardGrid':
      return <CardGridFields section={section} onChange={onChange} />
    case 'faq':
      return <FaqFields section={section} onChange={onChange} />
    case 'cta':
      return <CtaFields section={section} onChange={onChange} />
  }
}

// ---------------------------------------------------------------------------
// The builder
// ---------------------------------------------------------------------------

export function PageBuilder({ name, defaultSections }: { name: string; defaultSections: PageSection[] }) {
  const [sections, setSections] = useState<PageSection[]>(defaultSections)
  const [openId, setOpenId] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  // The list item is only draggable while the pointer is on its handle, so
  // selecting text inside an open section never starts a drag.
  const [armedId, setArmedId] = useState<string | null>(null)

  const announce = (message: string) => setAnnouncement(message)

  const move = (from: number, to: number) => {
    if (to < 0 || to >= sections.length || from === to) return
    const next = moveItem(sections, from, to)
    setSections(next)
    announce(`Moved ${SECTION_LABELS[next[to].type].label} section to position ${to + 1} of ${next.length}.`)
  }

  const add = (type: SectionType) => {
    const section = newSection(type)
    setSections([...sections, section])
    setOpenId(section.id)
    announce(`Added ${SECTION_LABELS[type].label} section at position ${sections.length + 1}.`)
  }

  const remove = (index: number) => {
    const section = sections[index]
    setSections(sections.filter((_, i) => i !== index))
    if (openId === section.id) setOpenId(null)
    announce(`Removed ${SECTION_LABELS[section.type].label} section.`)
  }

  const replace = (index: number, section: PageSection) => {
    setSections(sections.map((s, i) => (i === index ? section : s)))
  }

  const endDrag = () => {
    setDragId(null)
    setOverIndex(null)
    setArmedId(null)
  }

  const drop = (targetIndex: number) => {
    if (dragId === null) return
    const from = sections.findIndex((s) => s.id === dragId)
    if (from >= 0) move(from, targetIndex)
    endDrag()
  }

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name={name} value={JSON.stringify(sections)} />
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {sections.length ? (
        <ol className="flex list-none flex-col gap-3 p-0">
          {sections.map((section, index) => {
            const open = openId === section.id
            const meta = SECTION_LABELS[section.type]
            return (
              <li
                key={section.id}
                draggable={armedId === section.id}
                onDragStart={(e) => {
                  setDragId(section.id)
                  e.dataTransfer.effectAllowed = 'move'
                  e.dataTransfer.setData('text/plain', section.id)
                }}
                onDragOver={(e) => {
                  if (dragId === null) return
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                  if (overIndex !== index) setOverIndex(index)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  drop(index)
                }}
                onDragEnd={endDrag}
                className={`rounded-lg border bg-bg transition-colors ${
                  overIndex === index && dragId !== section.id
                    ? 'border-primary-strong'
                    : 'border-border-strong/40'
                } ${dragId === section.id ? 'opacity-60' : ''}`}
              >
                <div className="flex flex-wrap items-center gap-2 px-4 py-3">
                  {/* Pointer-only affordance; the move buttons are the accessible path. */}
                  <span
                    aria-hidden="true"
                    title="Drag to reorder"
                    onPointerDown={() => setArmedId(section.id)}
                    onPointerUp={() => setArmedId(null)}
                    className="cursor-grab select-none rounded px-1 text-lg leading-none text-muted active:cursor-grabbing"
                  >
                    ⠿
                  </span>
                  <span className="inline-flex items-center rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink">
                    {meta.label}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-muted">{sectionSummary(section)}</span>
                  <span className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Move section ${index + 1} (${meta.label}) up`}
                      disabled={index === 0}
                      onClick={() => move(index, index - 1)}
                      className="grid h-8 w-8 place-items-center rounded-md border border-border-strong text-primary-strong hover:bg-surface disabled:cursor-not-allowed disabled:border-border disabled:text-muted"
                    >
                      <span aria-hidden="true">↑</span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Move section ${index + 1} (${meta.label}) down`}
                      disabled={index === sections.length - 1}
                      onClick={() => move(index, index + 1)}
                      className="grid h-8 w-8 place-items-center rounded-md border border-border-strong text-primary-strong hover:bg-surface disabled:cursor-not-allowed disabled:border-border disabled:text-muted"
                    >
                      <span aria-hidden="true">↓</span>
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-expanded={open}
                      onClick={() => setOpenId(open ? null : section.id)}
                    >
                      {open ? 'Close' : 'Edit'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Remove section ${index + 1} (${meta.label})`}
                      onClick={() => remove(index)}
                    >
                      Remove
                    </Button>
                  </span>
                </div>
                {open ? (
                  <div className="border-t border-border px-4 py-4">
                    <SectionFields section={section} onChange={(s) => replace(index, s)} />
                  </div>
                ) : null}
              </li>
            )
          })}
        </ol>
      ) : (
        <p className="rounded-md border border-dashed border-border-strong px-4 py-6 text-center text-muted">
          No sections yet. Add the first one below — drag the ⠿ handle or use the arrow buttons to change the order later.
        </p>
      )}

      <fieldset className="rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-semibold uppercase tracking-wide text-muted">Add a section</legend>
        <ul className="grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {SECTION_TYPES.map((type) => (
            <li key={type}>
              <button
                type="button"
                onClick={() => add(type)}
                className="flex h-full w-full flex-col items-start gap-1 rounded-md border border-border-strong bg-input-bg px-4 py-3 text-left transition-colors hover:border-primary-strong hover:bg-surface"
              >
                <span className="font-semibold text-heading">{SECTION_LABELS[type].label}</span>
                <span className="text-sm text-muted">{SECTION_LABELS[type].hint}</span>
              </button>
            </li>
          ))}
        </ul>
      </fieldset>
    </div>
  )
}
