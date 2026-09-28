'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/primitives/Button'
import { RichTextBodyEditor } from '@/components/members/RichTextBodyEditor'
import { ImageUploadField } from '@/components/members/ImageUploadField'
import { ElementIcon, ElementInspector, ElementOutline } from '@/components/members/ElementPanels'
import {
  SECTION_LABELS,
  SECTION_TYPES,
  sectionSummary,
  type CardGridSection,
  type CtaSection,
  type ElementsSection,
  type FaqSection,
  type ImageTextSection,
  type PageSection,
  type RichTextSection,
  type SectionTone,
  type SectionType,
} from '@/lib/page-sections'
import {
  ELEMENT_LABELS,
  ELEMENT_PALETTE,
  cloneElement,
  findElement,
  insertElement,
  newElement,
  removeElement,
  replaceElement,
  updateList,
  type ElementType,
  type PageElement,
  type PageElementMap,
} from '@/lib/page-elements'
import { PAGE_TEMPLATES } from '@/lib/page-templates'
import {
  BUILDER_SOURCE,
  isFromCanvas,
  type BuilderHero,
  type BuilderSelection,
  type SectionAction,
  type ToBuilderCanvas,
} from '@/lib/builder-protocol'

/**
 * Visual page builder. The left side is a live preview of the page, drawn by
 * the site's own components in a frame at desktop, tablet, or phone width;
 * the right side is a panel for whatever is selected. Editors click a
 * section in the preview to edit it, use the "+" between sections to add one
 * right there, and move, copy, or delete from the toolbar on each section.
 * A new page can start from a template. "Free layout" sections hold the same
 * elements as the visual editor for the hand-built pages (titles, photos,
 * buttons, columns, galleries, video), for layouts the fixed sections do not
 * cover.
 *
 * Everything the editor builds serializes into hidden inputs, so the
 * surrounding server-component form submits it like any other field and the
 * server action validates it with the same parser the public page renders
 * with. Every action has a keyboard path in the panel (the Outline tab's move
 * buttons, the Add tab's position picker), and changes are announced.
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
      return { id, type, tone: 'surface', title: '', columns: 3, cards: [{ title: '', body: '' }, { title: '', body: '' }, { title: '', body: '' }] }
    case 'faq':
      return { id, type, tone: 'light', title: '', items: [{ question: '', answer: '' }] }
    case 'cta':
      return { id, type, title: '', primaryLabel: '', primaryHref: '' }
    case 'elements':
      return { id, type, elements: [] }
  }
}

/** A copy of a section with fresh ids, for "Copy". */
function copySection(section: PageSection): PageSection {
  const copy = { ...structuredClone(section), id: uid() } as PageSection
  if (copy.type === 'elements') copy.elements = copy.elements.map(cloneElement)
  return copy
}

// ---------------------------------------------------------------------------

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
            className="grid h-[2.25rem] w-[2.25rem] place-items-center rounded-md border border-border-strong text-primary-strong hover:bg-surface disabled:cursor-not-allowed disabled:border-border disabled:text-muted"
          >
            <span aria-hidden="true">↑</span>
          </button>
          <button
            type="button"
            aria-label={`Move ${label} ${index + 1} down`}
            disabled={index === count - 1}
            onClick={() => onMove(index, index + 1)}
            className="grid h-[2.25rem] w-[2.25rem] place-items-center rounded-md border border-border-strong text-primary-strong hover:bg-surface disabled:cursor-not-allowed disabled:border-border disabled:text-muted"
          >
            <span aria-hidden="true">↓</span>
          </button>
          <button
            type="button"
            aria-label={`Remove ${label} ${index + 1}`}
            disabled={count === 1}
            onClick={onRemove}
            className="grid h-[2.25rem] w-[2.25rem] place-items-center rounded-md border border-border-strong text-primary-strong hover:bg-surface disabled:cursor-not-allowed disabled:border-border disabled:text-muted"
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


// ---------------------------------------------------------------------------
// Free layout: the visual editor's elements inside one section
// ---------------------------------------------------------------------------

const MAIN = 'main'

function ElementsFields({
  section,
  selectedId,
  onChange,
  onSelect,
  announce,
}: {
  section: ElementsSection
  selectedId: string | null
  onChange: (s: ElementsSection) => void
  onSelect: (id: string | null) => void
  announce: (message: string) => void
}) {
  const map: PageElementMap = { [MAIN]: section.elements }
  const commit = (next: PageElementMap) => onChange({ ...section, elements: next[MAIN] ?? [] })
  const found = selectedId ? findElement(map, selectedId) : null

  const add = (type: ElementType) => {
    const element = newElement(type)
    let next = map
    // After the selected element (inside it when it is an empty container
    // that takes this type), else at the end of the section.
    if (found) {
      const { location, element: current } = found
      if ('children' in current && !current.children.length) {
        next = insertElement(map, element, { zone: MAIN, parentId: current.id, index: 0 })
      }
      if (next === map) next = insertElement(map, element, { ...location, index: location.index + 1 })
    }
    if (next === map) next = insertElement(map, element, { zone: MAIN, parentId: null, index: section.elements.length })
    commit(next)
    onSelect(element.id)
    announce(`Added ${ELEMENT_LABELS[type]}.`)
  }

  const siblings = found
    ? found.location.parentId
      ? ((findElement(map, found.location.parentId)?.element as { children?: PageElement[] })?.children ?? [])
      : section.elements
    : []

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="m-0 text-sm font-semibold text-heading">
          Add an element {found ? `after the selected ${ELEMENT_LABELS[found.element.type].toLowerCase()}` : 'to this section'}
        </p>
        <ul className="grid list-none grid-cols-4 gap-2 p-0">
          {ELEMENT_PALETTE.map((item) => (
            <li key={item.type}>
              <button
                type="button"
                title={item.hint}
                onClick={() => add(item.type)}
                className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-md border border-border-strong/60 bg-bg px-1 text-xs text-heading transition-colors hover:border-primary-strong hover:bg-surface"
              >
                <ElementIcon type={item.type} className="h-[1.5rem] w-[1.5rem]" />
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {found ? (
        <div className="rounded-lg border border-border p-4">
          <ElementInspector
            key={found.element.id}
            element={found.element}
            canMoveUp={found.location.index > 0}
            canMoveDown={found.location.index < siblings.length - 1}
            onChange={(next) => commit(replaceElement(map, next))}
            onMove={(direction) => {
              const { parentId, index } = found.location
              const to = index + direction
              commit(
                updateList(map, MAIN, parentId, (list) => {
                  if (to < 0 || to >= list.length) return list
                  const copy = list.slice()
                  const [moved] = copy.splice(index, 1)
                  copy.splice(to, 0, moved)
                  return copy
                })
              )
              announce(`Moved ${ELEMENT_LABELS[found.element.type]} to position ${to + 1}.`)
            }}
            onDuplicate={() => {
              const copy = cloneElement(found.element)
              commit(insertElement(map, copy, { ...found.location, index: found.location.index + 1 }))
              onSelect(copy.id)
              announce(`Copied ${ELEMENT_LABELS[copy.type]}.`)
            }}
            onRemove={() => {
              commit(removeElement(map, found.element.id))
              onSelect(null)
              announce(`Deleted ${ELEMENT_LABELS[found.element.type]}.`)
            }}
            onSelectParent={found.location.parentId ? () => onSelect(found.location.parentId) : undefined}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <p className="m-0 text-sm font-semibold text-heading">In this section</p>
        <ElementOutline zones={[{ id: MAIN, label: 'Elements' }]} elements={map} selectedId={selectedId} onSelect={onSelect} />
      </div>
    </div>
  )
}

function SectionFields({ section, onChange }: { section: Exclude<PageSection, ElementsSection>; onChange: (s: PageSection) => void }) {
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
// Thumbnails for the palette and templates
// ---------------------------------------------------------------------------

/** A small wireframe of each section type, so the palette shows what it adds. */
function SectionThumb({ type }: { type: SectionType }) {
  const line = 'fill-border-strong/70'
  const soft = 'fill-border-strong/40'
  const body = (() => {
    switch (type) {
      case 'richText':
        return (
          <>
            <rect x="30" y="12" width="44" height="6" rx="2" className={line} />
            <rect x="30" y="24" width="60" height="3" rx="1.5" className={soft} />
            <rect x="30" y="31" width="56" height="3" rx="1.5" className={soft} />
            <rect x="30" y="38" width="60" height="3" rx="1.5" className={soft} />
            <rect x="30" y="48" width="40" height="3" rx="1.5" className={soft} />
            <rect x="30" y="55" width="52" height="3" rx="1.5" className={soft} />
          </>
        )
      case 'imageText':
        return (
          <>
            <rect x="12" y="18" width="40" height="5" rx="2" className={line} />
            <rect x="12" y="28" width="44" height="3" rx="1.5" className={soft} />
            <rect x="12" y="35" width="40" height="3" rx="1.5" className={soft} />
            <rect x="12" y="45" width="22" height="7" rx="3.5" className="fill-primary-strong/70" />
            <rect x="66" y="12" width="42" height="46" rx="4" className="fill-primary/40" />
          </>
        )
      case 'cardGrid':
        return (
          <>
            <rect x="38" y="8" width="44" height="5" rx="2" className={line} />
            {[10, 45, 80].map((x) => (
              <g key={x}>
                <rect x={x} y="20" width="30" height="42" rx="3" className="fill-bg stroke-border-strong/60" strokeWidth="1" />
                <rect x={x + 5} y="27" width="18" height="4" rx="2" className={line} />
                <rect x={x + 5} y="36" width="20" height="3" rx="1.5" className={soft} />
                <rect x={x + 5} y="42" width="16" height="3" rx="1.5" className={soft} />
              </g>
            ))}
          </>
        )
      case 'faq':
        return (
          <>
            <rect x="30" y="8" width="44" height="5" rx="2" className={line} />
            {[20, 34, 48].map((y) => (
              <g key={y}>
                <rect x="20" y={y} width="80" height="10" rx="2" className="fill-bg stroke-border-strong/60" strokeWidth="1" />
                <rect x="25" y={y + 3.5} width="46" height="3" rx="1.5" className={line} />
                <path d={`M92 ${y + 3.5} l2.5 3 l2.5 -3`} className="stroke-border-strong" fill="none" strokeWidth="1.2" />
              </g>
            ))}
          </>
        )
      case 'cta':
        return (
          <>
            <rect x="0" y="0" width="120" height="70" rx="6" className="fill-surface-deep" />
            <rect x="30" y="18" width="60" height="6" rx="2" className="fill-on-deep/80" />
            <rect x="36" y="30" width="48" height="3" rx="1.5" className="fill-on-deep/50" />
            <rect x="32" y="42" width="26" height="9" rx="4.5" className="fill-secondary" />
            <rect x="62" y="42" width="26" height="9" rx="4.5" className="fill-none stroke-on-deep/60" strokeWidth="1" />
          </>
        )
      case 'elements':
        return (
          <>
            <rect x="12" y="10" width="44" height="22" rx="3" className="fill-primary/40" />
            <rect x="64" y="12" width="40" height="5" rx="2" className={line} />
            <rect x="64" y="22" width="44" height="3" rx="1.5" className={soft} />
            <rect x="12" y="40" width="96" height="1" className={soft} />
            <rect x="12" y="48" width="28" height="14" rx="2" className="fill-none stroke-border-strong/60" strokeDasharray="3 2" strokeWidth="1" />
            <rect x="46" y="48" width="28" height="14" rx="2" className="fill-none stroke-border-strong/60" strokeDasharray="3 2" strokeWidth="1" />
            <rect x="80" y="48" width="28" height="14" rx="2" className="fill-none stroke-border-strong/60" strokeDasharray="3 2" strokeWidth="1" />
          </>
        )
    }
  })()
  return (
    <svg viewBox="0 0 120 70" aria-hidden="true" focusable="false" className="h-auto w-full rounded-md bg-surface">
      {body}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// The builder
// ---------------------------------------------------------------------------

type Tab = 'add' | 'edit' | 'outline'

const VIEWPORTS = {
  desktop: { label: 'Desktop', width: '100%' },
  tablet: { label: 'Tablet', width: '820px' },
  phone: { label: 'Phone', width: '390px' },
} as const
type Viewport = keyof typeof VIEWPORTS

const iconButton =
  'grid h-[2.25rem] min-w-[2.25rem] place-items-center rounded-md border border-border-strong px-2 text-sm font-semibold text-primary-strong hover:bg-surface disabled:cursor-not-allowed disabled:border-border disabled:text-muted'

/** What the builder keeps in the browser tab so a rejected save loses nothing. */
type Draft = { hero: BuilderHero; sections: PageSection[]; fields: Record<string, string> }

export function PageBuilder({
  name,
  defaultSections,
  defaultHero,
  draftKey,
  restoreDraft = false,
  canvasSrc = '/members/admin/pages/canvas',
}: {
  name: string
  defaultSections: PageSection[]
  defaultHero: BuilderHero
  /** sessionStorage key for this page's unsaved work (per page id, or "new"). */
  draftKey: string
  /** True when the server sent the form back with an error: restore the work. */
  restoreDraft?: boolean
  /** The preview frame's address; the admin canvas route unless overridden. */
  canvasSrc?: string
}) {
  const [sections, setSections] = useState<PageSection[]>(defaultSections)
  const [hero, setHero] = useState<BuilderHero>(defaultHero)
  const [selection, setSelection] = useState<BuilderSelection>(defaultSections.length ? null : { kind: 'hero' })
  const [insertAt, setInsertAt] = useState<number | null>(null)
  const [tab, setTab] = useState<Tab>(defaultSections.length ? 'outline' : 'add')
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [frameReady, setFrameReady] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const [titleMissing, setTitleMissing] = useState(false)
  /** Bumped when state is replaced wholesale, so uncontrolled editors remount. */
  const [restoreToken, setRestoreToken] = useState(0)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [armedId, setArmedId] = useState<string | null>(null)

  const frameRef = useRef<HTMLIFrameElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const revealRef = useRef<string | null>(null)

  const announce = (message: string) => setAnnouncement(message)

  // ------------------------------------------------ Keep a draft in this tab

  useEffect(() => {
    let raw: string | null = null
    try {
      raw = sessionStorage.getItem(draftKey)
      if (!restoreDraft) sessionStorage.removeItem(draftKey)
    } catch {
      return
    }
    if (!restoreDraft || !raw) return
    try {
      const draft = JSON.parse(raw) as Draft
      if (Array.isArray(draft.sections)) setSections(draft.sections)
      if (draft.hero) setHero(draft.hero)
      const form = rootRef.current?.closest('form')
      for (const [field, value] of Object.entries(draft.fields ?? {})) {
        const input = form?.elements.namedItem(field)
        if (input instanceof HTMLInputElement && input.type === 'checkbox') input.checked = value === 'on'
        else if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
          if (input.type !== 'hidden') input.value = value
        }
      }
      setRestoreToken((n) => n + 1)
      announce('Your unsaved work was restored.')
    } catch {
      /* A damaged draft is simply ignored. */
    }
  }, [draftKey, restoreDraft])

  // On submit: stop if the title is missing, else stash everything in case
  // the server sends the form back with an error.
  useEffect(() => {
    const form = rootRef.current?.closest('form')
    if (!form) return
    const onSubmit = (event: SubmitEvent) => {
      if (!hero.title.trim()) {
        event.preventDefault()
        setTitleMissing(true)
        setSelection({ kind: 'hero' })
        setTab('edit')
        revealRef.current = 'hero'
        announce('The page needs a title before it can be saved.')
        return
      }
      const fields: Record<string, string> = {}
      for (const el of Array.from(form.elements)) {
        if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) || !el.name || el.type === 'hidden' || el.type === 'file') continue
        fields[el.name] = el instanceof HTMLInputElement && el.type === 'checkbox' ? (el.checked ? 'on' : '') : el.value
      }
      try {
        sessionStorage.setItem(draftKey, JSON.stringify({ hero, sections, fields } satisfies Draft))
      } catch {
        /* Storage full or blocked: the save still goes ahead. */
      }
    }
    form.addEventListener('submit', onSubmit)
    return () => form.removeEventListener('submit', onSubmit)
  }, [draftKey, hero, sections])

  // Warn before leaving with unsaved changes.
  const initial = useRef(JSON.stringify({ defaultHero, defaultSections }))
  const dirty = JSON.stringify({ defaultHero: hero, defaultSections: sections }) !== initial.current
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    const form = rootRef.current?.closest('form')
    const clear = () => window.removeEventListener('beforeunload', warn)
    window.addEventListener('beforeunload', warn)
    form?.addEventListener('submit', clear)
    return () => {
      clear()
      form?.removeEventListener('submit', clear)
    }
  }, [dirty])

  // ------------------------------------------------ Mirror state to the frame

  useEffect(() => {
    if (!frameReady) return
    const message: ToBuilderCanvas = {
      source: BUILDER_SOURCE,
      type: 'render',
      hero,
      sections,
      selection,
      insertAt,
      reveal: revealRef.current ?? undefined,
    }
    revealRef.current = null
    frameRef.current?.contentWindow?.postMessage(message, window.location.origin)
  }, [frameReady, hero, sections, selection, insertAt])

  // ------------------------------------------------ Section operations

  const indexOf = useCallback((id: string) => sections.findIndex((s) => s.id === id), [sections])

  const selectSection = (id: string, reveal = true) => {
    setSelection({ kind: 'section', id })
    setTab('edit')
    setInsertAt(null)
    if (reveal) revealRef.current = id
  }

  const addSection = (type: SectionType) => {
    const section = newSection(type)
    const selectedIndex =
      selection?.kind === 'section' ? indexOf(selection.id) : selection?.kind === 'element' ? indexOf(selection.sectionId) : -1
    const at = insertAt ?? (selectedIndex >= 0 ? selectedIndex + 1 : sections.length)
    const next = sections.slice()
    next.splice(at, 0, section)
    setSections(next)
    selectSection(section.id)
    announce(`Added ${SECTION_LABELS[type].label} section at position ${at + 1} of ${next.length}.`)
  }

  const applyTemplate = (templateId: string) => {
    const template = PAGE_TEMPLATES.find((t) => t.id === templateId)
    if (!template) return
    if (sections.length && !window.confirm('Replace the sections on this page with this layout?')) return
    const next = template.build().map((s) => ({ ...s, id: uid() }) as PageSection)
    setSections(next)
    setRestoreToken((n) => n + 1)
    if (next[0]) selectSection(next[0].id)
    announce(`Started from the ${template.label} layout with ${next.length} sections.`)
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= sections.length || from === to) return
    const next = sections.slice()
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setSections(next)
    revealRef.current = moved.id
    announce(`Moved ${SECTION_LABELS[moved.type].label} section to position ${to + 1} of ${next.length}.`)
  }

  const act = (id: string, action: SectionAction) => {
    const index = indexOf(id)
    if (index < 0) return
    const section = sections[index]
    const label = SECTION_LABELS[section.type].label
    switch (action) {
      case 'up':
        move(index, index - 1)
        break
      case 'down':
        move(index, index + 1)
        break
      case 'duplicate': {
        const copy = copySection(section)
        const next = sections.slice()
        next.splice(index + 1, 0, copy)
        setSections(next)
        setRestoreToken((n) => n + 1)
        selectSection(copy.id)
        announce(`Copied the ${label} section.`)
        break
      }
      case 'delete':
        if (!window.confirm(`Delete this ${label.toLowerCase()} section?`)) return
        setSections(sections.filter((s) => s.id !== id))
        if (selection && selection.kind !== 'hero' && (selection.kind === 'section' ? selection.id : selection.sectionId) === id) {
          setSelection(null)
        }
        announce(`Deleted the ${label} section.`)
        break
    }
  }

  const replace = (next: PageSection) => setSections((list) => list.map((s) => (s.id === next.id ? next : s)))

  // ------------------------------------------------ Messages from the frame

  // Held in a ref so the listener is bound once and always sees fresh state.
  const handlers = useRef({ act, setSelection, setTab, setInsertAt })
  handlers.current = { act, setSelection, setTab, setInsertAt }

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return
      if (!isFromCanvas(event.data)) return
      const data = event.data
      const h = handlers.current
      switch (data.type) {
        case 'ready':
          setFrameReady(true)
          break
        case 'select':
          h.setSelection(data.selection)
          h.setInsertAt(null)
          h.setTab('edit')
          break
        case 'insert':
          h.setInsertAt(data.index)
          h.setTab('add')
          announce(`Choose a section to add at position ${data.index + 1}.`)
          break
        case 'action':
          h.act(data.id, data.action)
          break
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // ------------------------------------------------ Panel content

  const selectedSection =
    selection?.kind === 'section'
      ? sections.find((s) => s.id === selection.id)
      : selection?.kind === 'element'
        ? sections.find((s) => s.id === selection.sectionId)
        : undefined
  const selectedIndex = selectedSection ? indexOf(selectedSection.id) : -1

  const heroEditor = (
    <div className="flex flex-col gap-4">
      <h3 className="m-0 text-lg">Top of the page</h3>
      <p className="m-0 text-sm text-muted">The large heading band every page opens with. The title is the page&apos;s main heading.</p>
      <div className="flex flex-col gap-1">
        <label htmlFor="builder-title" className="text-sm font-semibold text-heading">
          Page title <span className="text-error" aria-hidden="true">*</span>
        </label>
        <input
          id="builder-title"
          type="text"
          value={hero.title}
          required
          aria-invalid={titleMissing && !hero.title.trim() ? true : undefined}
          aria-describedby={titleMissing && !hero.title.trim() ? 'builder-title-error' : undefined}
          onChange={(e) => {
            setHero({ ...hero, title: e.target.value })
            setTitleMissing(false)
          }}
          className={inputClass}
        />
        {titleMissing && !hero.title.trim() ? (
          <p id="builder-title-error" role="alert" className="m-0 text-sm font-semibold text-error">
            Give the page a title before saving.
          </p>
        ) : null}
      </div>
      <TextInput id="builder-eyebrow" label="Small label above the title (optional)" value={hero.eyebrow} onChange={(eyebrow) => setHero({ ...hero, eyebrow })} placeholder="Blank shows the church name" />
      <TextAreaInput id="builder-lead" label="Welcome sentence under the title (optional)" rows={3} value={hero.lead} onChange={(lead) => setHero({ ...hero, lead })} />
    </div>
  )

  const sectionEditor = selectedSection ? (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="m-0 mr-auto text-lg">{SECTION_LABELS[selectedSection.type].label}</h3>
        <button type="button" className={iconButton} aria-label="Move this section up" title="Move up" disabled={selectedIndex === 0} onClick={() => act(selectedSection.id, 'up')}>
          <span aria-hidden="true">↑</span>
        </button>
        <button type="button" className={iconButton} aria-label="Move this section down" title="Move down" disabled={selectedIndex === sections.length - 1} onClick={() => act(selectedSection.id, 'down')}>
          <span aria-hidden="true">↓</span>
        </button>
        <button type="button" className={iconButton} onClick={() => act(selectedSection.id, 'duplicate')}>
          Copy
        </button>
        <button type="button" className={iconButton} onClick={() => act(selectedSection.id, 'delete')}>
          Delete
        </button>
      </div>
      {selectedSection.type === 'elements' ? (
        <ElementsFields
          section={selectedSection}
          selectedId={selection?.kind === 'element' ? selection.elementId : null}
          onChange={replace}
          onSelect={(elementId) => {
            setSelection(elementId ? { kind: 'element', sectionId: selectedSection.id, elementId } : { kind: 'section', id: selectedSection.id })
          }}
          announce={announce}
        />
      ) : (
        <SectionFields key={`${selectedSection.id}:${restoreToken}`} section={selectedSection} onChange={replace} />
      )}
    </div>
  ) : null

  const palette = (
    <div className="flex flex-col gap-5">
      {!sections.length ? (
        <div className="flex flex-col gap-2">
          <p className="m-0 text-sm font-semibold text-heading">Start from a layout</p>
          <ul className="grid list-none grid-cols-2 gap-2.5 p-0">
            {PAGE_TEMPLATES.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => applyTemplate(t.id)}
                  className="flex h-full w-full flex-col gap-2 rounded-md border border-border-strong/60 bg-bg p-2.5 text-left transition-colors hover:border-primary-strong hover:bg-surface"
                >
                  <span className="flex flex-col gap-1">
                    {t
                      .build()
                      .slice(0, 3)
                      .map((s, i) => (
                        <SectionThumb key={i} type={s.type} />
                      ))}
                  </span>
                  <span className="text-sm font-semibold text-heading">{t.label}</span>
                  <span className="text-xs text-muted">{t.hint}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="m-0 mt-2 text-sm font-semibold text-heading">Or add one section at a time</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-1">
        <label htmlFor="builder-insert-at" className="text-sm font-semibold text-heading">
          Adds the new section
        </label>
        <select
          id="builder-insert-at"
          value={insertAt === null ? 'auto' : String(insertAt)}
          onChange={(e) => setInsertAt(e.target.value === 'auto' ? null : Number(e.target.value))}
          className={inputClass}
        >
          <option value="auto">{selectedIndex >= 0 ? 'After the selected section' : 'At the end of the page'}</option>
          {sections.map((s, i) => (
            <option key={s.id} value={i}>
              Before section {i + 1}: {SECTION_LABELS[s.type].label}
            </option>
          ))}
          {sections.length ? <option value={sections.length}>At the end of the page</option> : null}
        </select>
      </div>

      <ul className="grid list-none grid-cols-2 gap-2.5 p-0">
        {SECTION_TYPES.map((type) => (
          <li key={type}>
            <button
              type="button"
              onClick={() => addSection(type)}
              className="flex h-full w-full flex-col gap-2 rounded-md border border-border-strong/60 bg-bg p-2.5 text-left transition-colors hover:border-primary-strong hover:bg-surface"
            >
              <SectionThumb type={type} />
              <span className="text-sm font-semibold text-heading">{SECTION_LABELS[type].label}</span>
              <span className="text-xs text-muted">{SECTION_LABELS[type].hint}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )

  const outline = (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => {
          setSelection({ kind: 'hero' })
          setTab('edit')
          revealRef.current = 'hero'
        }}
        className="rounded-md border border-border-strong/40 bg-bg px-3 py-2 text-left text-sm hover:bg-surface"
      >
        <span className="font-semibold text-heading">Top of the page</span>
        <span className="block truncate text-muted">{hero.title || 'No title yet'}</span>
      </button>
      {sections.length ? (
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {sections.map((section, index) => {
            const meta = SECTION_LABELS[section.type]
            const active = selectedSection?.id === section.id
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
                  if (overIndex !== index) setOverIndex(index)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const from = dragId ? indexOf(dragId) : -1
                  if (from >= 0) move(from, index)
                  setDragId(null)
                  setOverIndex(null)
                  setArmedId(null)
                }}
                onDragEnd={() => {
                  setDragId(null)
                  setOverIndex(null)
                  setArmedId(null)
                }}
                className={`flex items-center gap-2 rounded-md border px-2 py-2 ${
                  overIndex === index && dragId !== section.id ? 'border-primary-strong' : active ? 'border-primary-strong bg-surface' : 'border-border-strong/40 bg-bg'
                } ${dragId === section.id ? 'opacity-60' : ''}`}
              >
                {/* Pointer-only affordance; the move buttons are the accessible path. */}
                <span
                  aria-hidden="true"
                  title="Drag to reorder"
                  onPointerDown={() => setArmedId(section.id)}
                  onPointerUp={() => setArmedId(null)}
                  className="cursor-grab select-none px-1 text-lg leading-none text-muted active:cursor-grabbing"
                >
                  ⠿
                </span>
                <button type="button" onClick={() => selectSection(section.id)} className="min-w-0 flex-1 text-left text-sm">
                  <span className="font-semibold text-heading">
                    {index + 1}. {meta.label}
                  </span>
                  <span className="block truncate text-muted">{sectionSummary(section) || 'Not filled in yet'}</span>
                </button>
                <button type="button" className={iconButton} aria-label={`Move section ${index + 1} (${meta.label}) up`} disabled={index === 0} onClick={() => move(index, index - 1)}>
                  <span aria-hidden="true">↑</span>
                </button>
                <button type="button" className={iconButton} aria-label={`Move section ${index + 1} (${meta.label}) down`} disabled={index === sections.length - 1} onClick={() => move(index, index + 1)}>
                  <span aria-hidden="true">↓</span>
                </button>
              </li>
            )
          })}
        </ol>
      ) : (
        <p className="m-0 text-sm text-muted">No sections yet.</p>
      )}
      <div>
        <Button type="button" variant="ghost" size="sm" onClick={() => setTab('add')}>
          Add a section
        </Button>
      </div>
    </div>
  )

  const editPanel =
    selection?.kind === 'hero' ? (
      heroEditor
    ) : sectionEditor ? (
      sectionEditor
    ) : (
      <p className="m-0 text-sm text-muted">
        Click any part of the preview to edit it, or pick a section from the Outline tab.
      </p>
    )

  const tabs: { id: Tab; label: string }[] = [
    { id: 'add', label: 'Add' },
    { id: 'edit', label: selection?.kind === 'hero' ? 'Page top' : selectedSection ? 'Selected' : 'Edit' },
    { id: 'outline', label: 'Outline' },
  ]

  const serialized = useMemo(() => JSON.stringify(sections), [sections])

  return (
    <div ref={rootRef} className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_420px]">
      <input type="hidden" name={name} value={serialized} />
      <input type="hidden" name="title" value={hero.title} />
      <input type="hidden" name="hero_eyebrow" value={hero.eyebrow} />
      <input type="hidden" name="hero_lead" value={hero.lead} />
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {/* ------------------------------------------------------------ Preview */}
      <div className="flex min-w-0 flex-col bg-surface-2">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-bg px-4 py-3">
          <p className="m-0 mr-auto text-sm text-muted">
            Live preview. Click a section to edit it; use <span className="font-semibold text-heading">+</span> to add one in between.
          </p>
          <div role="group" aria-label="Preview width" className="flex items-center gap-1">
            {(Object.keys(VIEWPORTS) as Viewport[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setViewport(key)}
                aria-pressed={viewport === key}
                className={`rounded-full border px-3 py-1 text-sm font-semibold transition-colors ${
                  viewport === key ? 'border-primary-strong bg-primary-strong text-on-primary' : 'border-border text-ink hover:bg-surface'
                }`}
              >
                {VIEWPORTS[key].label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-center overflow-auto p-4">
          <iframe
            ref={frameRef}
            src={canvasSrc}
            title="Live preview of the page you are building"
            style={{ width: VIEWPORTS[viewport].width }}
            className="h-[calc(100vh-12rem)] min-h-[32rem] max-w-full rounded-lg border border-border bg-bg shadow-sm"
          />
        </div>
      </div>

      {/* -------------------------------------------------------------- Panel */}
      <div className="flex max-h-[calc(100vh-4rem)] flex-col border-l border-border bg-bg">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
          <Button type="submit" size="sm">
            Save page
          </Button>
          <p className="m-0 text-sm text-muted">{dirty ? 'Unsaved changes.' : 'No changes yet.'}</p>
        </div>
        <div role="tablist" aria-label="Builder panels" className="flex gap-1 border-b border-border px-3">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`builder-tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`builder-panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
                tab === t.id ? 'border-primary-strong text-heading' : 'border-transparent text-muted hover:text-heading'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div id={`builder-panel-${tab}`} role="tabpanel" aria-labelledby={`builder-tab-${tab}`} className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {tab === 'add' ? palette : tab === 'edit' ? editPanel : outline}
        </div>
      </div>
    </div>
  )
}
