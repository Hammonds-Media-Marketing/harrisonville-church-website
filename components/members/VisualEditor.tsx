'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type DragEvent } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/primitives/Button'
import { ImageUploadField } from '@/components/members/ImageUploadField'
import {
  AddElementsPanel,
  ElementInspector,
  EmptyInspector,
  type Zone,
} from '@/components/members/ElementPanels'
import { ZoneElements } from '@/components/pages/PageElements'
import { inlineToHtml } from '@/lib/inline-markup'
import { applyCopyTokens, COPY_TOKEN_HINT } from '@/lib/copy-tokens'
import { isInlineEditable, type CopyField, type PageCopySpec } from '@/lib/site-copy'
import {
  ELEMENT_LABELS,
  canDropInto,
  cloneElement,
  countElements,
  findElement,
  insertElement,
  isContainer,
  newElement,
  removeElement,
  replaceElement,
  updateList,
  type ElementType,
  type PageElement,
  type PageElementMap,
} from '@/lib/page-elements'
import { savePageCopyAction, resetPageCopyAction } from '@/app/members/admin/actions'

/**
 * Visual editor for the hand-built pages. The real page loads in a frame
 * beside a side panel. Clicking a word in the frame selects its field; plain
 * text can be typed straight onto the page, and everything else (links,
 * images, search wording) is edited in the panel. Either way the frame
 * updates as you type, so an editor sees the finished page rather than a list
 * of boxes.
 *
 * The panel's "Add elements" tab adds a drag-and-drop layer on top: tiles
 * (image, title, paragraph, button, container, section, and so on) drag onto
 * the page and land in the open slots the page's code leaves between its
 * bands. Dropped elements render into the frame through the same component
 * the public page uses, via React portals into hosts this editor adds to each
 * slot, and can be dragged again to reorder or move them into a container.
 * Every drag has a click path too (click a tile to add it, arrow buttons to
 * move), so the layer works from the keyboard.
 *
 * The frame is the live route, not a mock, so what an editor sees is exactly
 * what a visitor gets: same components, same type, same colors. Links and
 * forms inside it are disabled while editing so a click cannot navigate the
 * preview away from the page being edited.
 */

type Props = {
  spec: PageCopySpec
  /** Stored overrides, sparse: only fields an editor has already changed. */
  overrides: Record<string, string>
  /** Stored dropped-in elements, by zone. */
  elements: PageElementMap
}

const VIEWPORTS = {
  desktop: { label: 'Desktop', width: '100%' },
  tablet: { label: 'Tablet', width: '820px' },
  mobile: { label: 'Phone', width: '414px' },
} as const

type ViewportKey = keyof typeof VIEWPORTS
type Tab = 'add' | 'element' | 'text'

/** What is being dragged: a new element from the palette, or one already on the page. */
type Drag = { kind: 'new'; type: ElementType } | { kind: 'move'; id: string }
type Drop = { zone: string; parentId: string | null; index: number }
type ZoneHost = Zone & { host: HTMLElement }

/** Styling injected into the frame to make editable regions discoverable. */
const FRAME_STYLES = `
  [data-copy] {
    outline: 1px dashed rgba(11, 79, 108, 0.35);
    outline-offset: 3px;
    border-radius: 2px;
    cursor: text;
    transition: outline-color 120ms ease-out, background-color 120ms ease-out;
  }
  [data-copy]:hover {
    outline: 2px solid rgba(11, 79, 108, 0.75);
    background-color: rgba(240, 180, 41, 0.12);
  }
  [data-copy][data-copy-selected='true'] {
    outline: 2px solid #0b4f6c;
    background-color: rgba(240, 180, 41, 0.2);
  }
  [data-copy][contenteditable] {
    cursor: text;
  }
  [data-copy-kind='image'] { cursor: pointer; }

  /* Drop slots: the served copy of a slot's elements is hidden, and the
     editor's live copy renders in the host it appends. */
  [data-element-zone] { position: relative; }
  [data-element-zone] > :not([data-zone-editor]):not([data-zone-add]) { display: none !important; }
  html[data-el-dragging] [data-zone-editor]:empty,
  [data-element-zone][data-zone-target] [data-zone-editor]:empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 56px;
    margin: 10px auto;
    max-width: 1180px;
    border: 2px dashed rgba(11, 79, 108, 0.4);
    border-radius: 12px;
    background: rgba(240, 180, 41, 0.06);
  }
  html[data-el-dragging] [data-zone-editor]:empty::before,
  [data-element-zone][data-zone-target] [data-zone-editor]:empty::before {
    content: 'New elements go here';
    font: 600 14px/1.2 system-ui, sans-serif;
    color: #0b4f6c;
  }
  [data-zone-editor][data-el-drop-target]:empty,
  [data-el-list][data-el-drop-target] > [data-el-empty] {
    border-color: #0b4f6c !important;
    background: rgba(240, 180, 41, 0.22) !important;
  }

  /* "+ Add section" on each spot between bands: a thin strip on the
     boundary that shows a line and a button on hover, while the Add panel
     is open, or when it is the spot new elements go. */
  [data-zone-add] {
    position: absolute; left: 0; right: 0; top: -18px; height: 36px; z-index: 60;
    display: flex; align-items: center; justify-content: center;
  }
  [data-zone-add]::before {
    content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 2px;
    background: #0b4f6c; opacity: 0; transition: opacity .12s;
  }
  [data-zone-add] button {
    position: relative; display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 16px; border: 0; border-radius: 999px; cursor: pointer;
    background: #0b4f6c; color: #fff; font: 600 14px/1 system-ui, sans-serif;
    box-shadow: 0 2px 8px rgba(11, 36, 56, 0.25);
    opacity: 0; transform: scale(.96); transition: opacity .12s, transform .12s;
  }
  [data-zone-add]:hover::before, [data-zone-add]:focus-within::before,
  [data-element-zone][data-zone-target] > [data-zone-add]::before { opacity: 1; }
  [data-zone-add]:hover button, [data-zone-add]:focus-within button,
  html[data-el-show-zones] [data-zone-add] button,
  [data-element-zone][data-zone-target] > [data-zone-add] button { opacity: 1; transform: none; }
  [data-element-zone][data-zone-target] > [data-zone-add] button { background: #f0b429; color: #0b2438; }
  html[data-el-dragging] [data-zone-add] { display: none; }

  /* Added elements: grab to move, click to select. */
  [data-zone-editor] [data-el] { position: relative; cursor: grab; }
  [data-zone-editor] [data-el]:hover { outline: 2px dashed rgba(11, 79, 108, 0.5); outline-offset: 4px; }
  [data-zone-editor] [data-el][data-el-selected='true'] { outline: 2px solid #0b4f6c; outline-offset: 4px; }
  [data-zone-editor] [data-el][data-el-selected='true']::after {
    content: attr(data-el-name);
    position: absolute;
    top: -28px;
    left: -4px;
    z-index: 30;
    padding: 5px 9px;
    border-radius: 4px 4px 0 0;
    background: #0b4f6c;
    color: #fff;
    font: 600 12px/1 system-ui, sans-serif;
  }
  [data-zone-editor] [data-el-type='band'][data-el-selected='true']::after { top: 0; left: 0; border-radius: 0 0 4px 0; }
  [data-zone-editor] [data-el][data-el-moving] { opacity: 0.4; }
  .ve-drop-line {
    position: absolute;
    z-index: 9999;
    pointer-events: none;
    border-radius: 3px;
    background: #f0b429;
    box-shadow: 0 0 0 2px #0b4f6c;
  }
`

/** Elements inside `list` that belong to it directly, not to a container inside it. */
function listItems(list: HTMLElement): HTMLElement[] {
  return Array.from(list.querySelectorAll<HTMLElement>('[data-el]')).filter(
    (node) => node.parentElement?.closest('[data-el-list]') === list
  )
}

/** Type of the container that owns a list, or null for a slot's top level. */
function listOwnerType(list: HTMLElement): ElementType | null {
  if (!list.dataset.elList) return null
  return (list.closest<HTMLElement>('[data-el]')?.dataset.elType as ElementType | undefined) ?? null
}

/**
 * Work out where a drag at (x, y) would land. Over an element list, the
 * pointer's position among the list's elements decides the index; a list that
 * cannot take this type hands the drop to the list around it; and anywhere
 * else on the page snaps to the nearest slot.
 */
function locateDrop(
  doc: Document,
  x: number,
  y: number,
  target: EventTarget | null,
  type: ElementType,
  movingId: string | null
): { drop: Drop; list: HTMLElement; items: HTMLElement[]; index: number } | null {
  const node = target instanceof doc.defaultView!.Element ? (target as Element) : null
  let list = node?.closest<HTMLElement>('[data-el-list]') ?? null
  if (list && !list.closest('[data-zone-editor]')) list = null

  // An element cannot be dropped inside itself.
  const moving = movingId ? doc.querySelector<HTMLElement>(`[data-zone-editor] [data-el="${CSS.escape(movingId)}"]`) : null
  if (list && moving?.contains(list)) list = moving.parentElement?.closest<HTMLElement>('[data-el-list]') ?? null

  while (list && !canDropInto(type, listOwnerType(list))) {
    list = list.closest<HTMLElement>('[data-el]')?.parentElement?.closest<HTMLElement>('[data-el-list]') ?? null
  }

  if (!list) {
    let best: { host: HTMLElement; distance: number } | null = null
    doc.querySelectorAll<HTMLElement>('[data-zone-editor]').forEach((host) => {
      const zone = host.parentElement?.getBoundingClientRect()
      if (!zone) return
      const rect = host.getBoundingClientRect()
      const top = Math.min(rect.top, zone.top)
      const bottom = Math.max(rect.bottom, zone.bottom)
      const distance = y < top ? top - y : y > bottom ? y - bottom : 0
      if (!best || distance < best.distance) best = { host, distance }
    })
    list = (best as { host: HTMLElement } | null)?.host ?? null
  }
  if (!list) return null

  const zone = list.closest<HTMLElement>('[data-element-zone]')?.dataset.elementZone
  if (!zone) return null

  const items = listItems(list)
  const style = doc.defaultView?.getComputedStyle(list)
  const sideBySide = style?.display === 'grid' && (style.gridTemplateColumns.split(' ').filter(Boolean).length ?? 1) > 1

  let index = items.length
  for (let i = 0; i < items.length; i++) {
    const rect = items[i].getBoundingClientRect()
    if (y < rect.top) {
      index = i
      break
    }
    if (y <= rect.bottom) {
      const before = sideBySide ? x < rect.left + rect.width / 2 : y < rect.top + rect.height / 2
      if (before) {
        index = i
        break
      }
    }
  }

  return { drop: { zone, parentId: list.dataset.elList || null, index }, list, items, index }
}

/** Draw the gold insertion line (or highlight an empty list) for a drop. */
function paintDrop(doc: Document, found: ReturnType<typeof locateDrop>) {
  doc.querySelectorAll('[data-el-drop-target]').forEach((n) => n.removeAttribute('data-el-drop-target'))
  let line = doc.querySelector<HTMLElement>('.ve-drop-line')
  if (!found) {
    line?.remove()
    return
  }
  const { list, items, index } = found
  if (!items.length) {
    list.setAttribute('data-el-drop-target', '')
    line?.remove()
    return
  }
  if (!line) {
    line = doc.createElement('div')
    line.className = 've-drop-line'
    doc.body.appendChild(line)
  }
  const win = doc.defaultView!
  const style = win.getComputedStyle(list)
  const sideBySide = style.display === 'grid' && style.gridTemplateColumns.split(' ').filter(Boolean).length > 1
  const ref = items[Math.min(index, items.length - 1)].getBoundingClientRect()
  const listRect = list.getBoundingClientRect()

  if (sideBySide) {
    const x = index < items.length ? ref.left - 10 : ref.right + 6
    Object.assign(line.style, { left: `${x + win.scrollX}px`, top: `${ref.top + win.scrollY}px`, width: '4px', height: `${ref.height}px` })
  } else {
    let y: number
    if (index === 0) y = ref.top - 8
    else if (index >= items.length) y = ref.bottom + 6
    else y = (items[index - 1].getBoundingClientRect().bottom + ref.top) / 2 - 2
    const left = Math.max(listRect.left, ref.left - 8)
    const width = Math.min(listRect.width, Math.max(ref.width + 16, 120))
    Object.assign(line.style, { left: `${left + win.scrollX}px`, top: `${y + win.scrollY}px`, width: `${width}px`, height: '4px' })
  }
}

export function VisualEditor({ spec, overrides, elements: storedElements }: Props) {
  const fields = useMemo(() => spec.groups.flatMap((g) => g.fields), [spec])
  const fieldByKey = useMemo(() => new Map(fields.map((f) => [f.key, f])), [fields])
  const defaults = useMemo(() => {
    const map: Record<string, string> = {}
    for (const f of fields) map[f.key] = f.value
    return map
  }, [fields])

  const initial = useMemo(() => ({ ...defaults, ...overrides }), [defaults, overrides])

  const [values, setValues] = useState<Record<string, string>>(initial)
  /** What is currently stored. Saving moves the baseline; nothing reloads. */
  const [baseline, setBaseline] = useState<Record<string, string>>(initial)
  const [elements, setElements] = useState<PageElementMap>(storedElements)
  const [elementsBaseline, setElementsBaseline] = useState<PageElementMap>(storedElements)
  /** Bumped on reset so uncontrolled fields (the image picker) remount. */
  const [resetToken, setResetToken] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [selectedEl, setSelectedEl] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('add')
  const [zones, setZones] = useState<ZoneHost[]>([])
  const [placement, setPlacement] = useState<string>('selected')
  const [viewport, setViewport] = useState<ViewportKey>('desktop')
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; message: string } | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [pending, startTransition] = useTransition()

  const frameRef = useRef<HTMLIFrameElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  /** Read inside frame listeners, which are bound once per frame load. */
  const valuesRef = useRef(values)
  valuesRef.current = values
  const elementsRef = useRef(elements)
  elementsRef.current = elements
  const selectedElRef = useRef(selectedEl)
  selectedElRef.current = selectedEl
  /** True while the editor is typing into the frame, so we do not fight the caret. */
  const typingKey = useRef<string | null>(null)
  const dragRef = useRef<Drag | null>(null)
  const dropRef = useRef<Drop | null>(null)
  /** The preview host appended to each slot in the frame, by zone id. */
  const hostsRef = useRef(new Map<string, HTMLElement>())
  /** An element to scroll into view once it has rendered in the frame. */
  const revealRef = useRef<string | null>(null)

  const elementsDirty = useMemo(
    () => JSON.stringify(elements) !== JSON.stringify(elementsBaseline),
    [elements, elementsBaseline]
  )
  const dirty = useMemo(
    () => elementsDirty || fields.some((f) => (values[f.key] ?? '') !== (baseline[f.key] ?? '')),
    [elementsDirty, fields, values, baseline]
  )
  const changedFromCode = useMemo(
    () => fields.filter((f) => (values[f.key] ?? '') !== f.value).length,
    [fields, values]
  )
  const addedCount = useMemo(() => countElements(elements), [elements])

  // Warn before a reload or a browser-level navigation drops unsaved work.
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  /** Write one field's current value into every element carrying its key. */
  const paint = useCallback(
    (doc: Document, key: string, value: string) => {
      const kind = fieldByKey.get(key)?.kind ?? 'text'
      const resolved = applyCopyTokens(value)
      doc.querySelectorAll<HTMLElement>(`[data-copy="${CSS.escape(key)}"]`).forEach((node) => {
        if (kind === 'image') {
          if (node instanceof doc.defaultView!.HTMLImageElement) (node as HTMLImageElement).src = resolved
          return
        }
        if (node === doc.activeElement && typingKey.current === key) return
        if (kind === 'rich') node.innerHTML = inlineToHtml(resolved)
        else node.textContent = resolved
      })
    },
    [fieldByKey]
  )

  const setValue = useCallback(
    (key: string, value: string) => {
      setNotice(null)
      setValues((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }))
      const doc = frameRef.current?.contentDocument
      if (doc) paint(doc, key, value)
    },
    [paint]
  )

  /** Highlight a field's place in the page, optionally scrolling it into view. */
  const select = useCallback((key: string, scroll = false) => {
    setSelected(key)
    setSelectedEl(null)
    const doc = frameRef.current?.contentDocument
    doc?.querySelectorAll<HTMLElement>('[data-copy-selected]').forEach((n) => n.removeAttribute('data-copy-selected'))
    const node = doc?.querySelector<HTMLElement>(`[data-copy="${CSS.escape(key)}"]`)
    node?.setAttribute('data-copy-selected', 'true')
    if (scroll) node?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    return node
  }, [])

  /** Select an added element and open its settings. */
  const selectElement = useCallback((id: string | null, reveal = false) => {
    setSelectedEl(id)
    if (!id) return
    setSelected(null)
    setTab('element')
    setPlacement('selected')
    frameRef.current?.contentDocument
      ?.querySelectorAll<HTMLElement>('[data-copy-selected]')
      .forEach((n) => n.removeAttribute('data-copy-selected'))
    if (reveal) revealRef.current = id
  }, [])

  /** Make a spot between bands the place clicked elements land, and open the palette. */
  const chooseZone = useCallback((zone: string) => {
    setPlacement(zone)
    setSelectedEl(null)
    setTab('add')
    const label = hostsRef.current.get(zone)?.dataset.zoneLabel ?? 'there'
    setAnnouncement(`New elements go ${label.toLowerCase()}. Choose one from the panel.`)
  }, [])

  const updateElements = useCallback((next: PageElementMap) => {
    setNotice(null)
    setElements(next)
  }, [])

  // ------------------------------------------------------------ Drag and drop

  const endDrag = useCallback(() => {
    dragRef.current = null
    dropRef.current = null
    const doc = frameRef.current?.contentDocument
    if (!doc) return
    doc.documentElement.removeAttribute('data-el-dragging')
    doc.querySelectorAll('[data-el-moving]').forEach((n) => n.removeAttribute('data-el-moving'))
    paintDrop(doc, null)
  }, [])

  const beginDrag = useCallback((drag: Drag) => {
    dragRef.current = drag
    const doc = frameRef.current?.contentDocument
    doc?.documentElement.setAttribute('data-el-dragging', '')
    if (drag.kind === 'move') {
      doc?.querySelector(`[data-zone-editor] [data-el="${CSS.escape(drag.id)}"]`)?.setAttribute('data-el-moving', '')
    }
  }, [])

  /** Land the current drag at the last computed drop spot. */
  const commitDrop = useCallback(() => {
    const drag = dragRef.current
    const drop = dropRef.current
    endDrag()
    if (!drag || !drop) return
    const map = elementsRef.current
    const element = drag.kind === 'new' ? newElement(drag.type) : findElement(map, drag.id)?.element
    if (!element) return
    const next = insertElement(map, element, drop)
    if (next === map) return
    updateElements(next)
    selectElement(element.id)
    setAnnouncement(`${drag.kind === 'new' ? 'Added' : 'Moved'} ${ELEMENT_LABELS[element.type]}.`)
  }, [endDrag, selectElement, updateElements])

  const onPaletteDragStart = useCallback(
    (type: ElementType, event: DragEvent) => {
      event.dataTransfer.effectAllowed = 'copy'
      event.dataTransfer.setData('text/plain', ELEMENT_LABELS[type])
      beginDrag({ kind: 'new', type })
    },
    [beginDrag]
  )

  // --------------------------------------------------------- Frame decoration

  /**
   * Give every slot in the frame a host for the live element preview. The
   * frame's own React can re-render a slot (hydration, a refresh) and drop a
   * host, so this is re-run whenever the frame's DOM changes; it only touches
   * the DOM when a host is actually missing.
   */
  const attachZones = useCallback((doc: Document) => {
    const hosts = hostsRef.current
    const next: ZoneHost[] = []
    doc.querySelectorAll<HTMLElement>('[data-element-zone]').forEach((zoneNode) => {
      const id = zoneNode.dataset.elementZone ?? ''
      const label = zoneNode.dataset.zoneLabel ?? id
      let host = hosts.get(id)
      if (!host || host.ownerDocument !== doc) {
        host = doc.createElement('div')
        host.dataset.zoneEditor = ''
        host.dataset.elList = ''
        host.dataset.zoneLabel = label
        hosts.set(id, host)
      }
      if (host.parentElement !== zoneNode) zoneNode.appendChild(host)
      if (!zoneNode.querySelector(':scope > [data-zone-add]')) {
        const bar = doc.createElement('div')
        bar.dataset.zoneAdd = id
        const button = doc.createElement('button')
        button.type = 'button'
        button.textContent = '+ Add section'
        button.title = `Add elements ${label.toLowerCase()}`
        button.setAttribute('aria-label', `Add elements ${label.toLowerCase()}`)
        bar.appendChild(button)
        zoneNode.insertBefore(bar, zoneNode.firstChild)
      }
      next.push({ id, label, host })
    })
    setZones((prev) =>
      next.length === prev.length && next.every((z, i) => z.host === prev[i].host) ? prev : next
    )
  }, [])

  /** Prepare a freshly loaded frame: paint current values, wire interaction. */
  const decorate = useCallback(() => {
    const frame = frameRef.current
    const doc = frame?.contentDocument
    if (!doc) return
    // Idempotent per loaded document, so the load handler and the mount-time
    // fallback below cannot both wire the same frame twice.
    if (doc.documentElement.dataset.copyEditor === 'on') return
    doc.documentElement.dataset.copyEditor = 'on'

    const style = doc.createElement('style')
    style.textContent = FRAME_STYLES
    doc.head.appendChild(style)

    for (const [key, value] of Object.entries(valuesRef.current)) paint(doc, key, value)

    attachZones(doc)
    new MutationObserver(() => {
      const missing = Array.from(doc.querySelectorAll<HTMLElement>('[data-element-zone]')).some(
        (zone) => !zone.querySelector(':scope > [data-zone-editor]')
      )
      if (missing) attachZones(doc)
    }).observe(doc.body, { childList: true, subtree: true })

    // The frame is a preview, not a browsable site: keep clicks and form
    // submissions from navigating it away from the page being edited.
    doc.addEventListener(
      'click',
      (event) => {
        const target = event.target as HTMLElement | null
        if (target?.closest('a')) event.preventDefault()

        // "+ Add section": that spot is where clicked elements now land.
        const addBar = target?.closest<HTMLElement>('[data-zone-add]')
        if (addBar?.dataset.zoneAdd) {
          event.preventDefault()
          chooseZone(addBar.dataset.zoneAdd)
          return
        }

        const added = target?.closest<HTMLElement>('[data-zone-editor] [data-el]')
        if (added?.dataset.el) {
          event.preventDefault()
          selectElement(added.dataset.el)
          return
        }

        const region = target?.closest<HTMLElement>('[data-copy]')
        if (!region) return
        const key = region.dataset.copy
        if (!key) return
        select(key)
        setTab('text')
        const kind = fieldByKey.get(key)?.kind ?? 'text'
        if (isInlineEditable(kind) && kind !== 'rich') {
          // plaintext-only keeps pasted formatting out. Where a browser does
          // not support it the property does not take, so fall back to plain
          // contenteditable and strip formatting on paste instead.
          region.contentEditable = 'plaintext-only'
          if (!region.isContentEditable) region.contentEditable = 'true'
          typingKey.current = key
          region.focus()
        } else {
          // Links, images, and search wording are edited in the panel.
          requestAnimationFrame(() =>
            panelRef.current?.querySelector<HTMLElement>(`[data-field="${CSS.escape(key)}"]`)?.focus()
          )
        }
      },
      true
    )

    doc.addEventListener('submit', (event) => event.preventDefault(), true)

    doc.addEventListener('paste', (event) => {
      const region = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-copy]')
      if (!region?.isContentEditable) return
      event.preventDefault()
      const text = event.clipboardData?.getData('text/plain') ?? ''
      doc.getSelection()?.getRangeAt(0).insertNode(doc.createTextNode(text))
      doc.getSelection()?.collapseToEnd()
      region.dispatchEvent(new Event('input', { bubbles: true }))
    })

    doc.addEventListener('keydown', (event) => {
      const region = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-copy]')
      if (!region?.isContentEditable) {
        // With an added element selected, Delete removes it and Escape lets go.
        const id = selectedElRef.current
        if (!id) return
        if (event.key === 'Delete' || event.key === 'Backspace') {
          event.preventDefault()
          updateElements(removeElement(elementsRef.current, id))
          setSelectedEl(null)
          setAnnouncement('Element deleted.')
        } else if (event.key === 'Escape') {
          setSelectedEl(null)
        }
        return
      }
      // A heading or a button label is one line; Enter finishes it rather than
      // breaking it in two. Escape leaves the text as typed.
      if (event.key === 'Enter' && fieldByKey.get(region.dataset.copy ?? '')?.kind === 'text') {
        event.preventDefault()
        region.blur()
      } else if (event.key === 'Escape') {
        region.blur()
      }
    })

    doc.addEventListener('input', (event) => {
      const region = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-copy]')
      const key = region?.dataset.copy
      if (!region?.isContentEditable || !key) return
      // Stored verbatim while typing so a trailing space survives; the save
      // action is what trims.
      setValues((prev) => ({ ...prev, [key]: region.innerText }))
      setNotice(null)
    })

    doc.addEventListener(
      'blur',
      (event) => {
        const region = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-copy]')
        if (!region) return
        region.removeAttribute('contenteditable')
        typingKey.current = null
      },
      true
    )

    // Dragging added elements around the page. Nothing else in the frame is
    // draggable while editing, so a stray drag of a link or a photo cannot
    // drop page furniture into a slot.
    doc.addEventListener('dragstart', (event) => {
      const node = (event.target as HTMLElement | null)?.closest?.<HTMLElement>('[data-zone-editor] [data-el]')
      if (!node?.dataset.el) {
        event.preventDefault()
        return
      }
      event.stopPropagation()
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', node.dataset.elName ?? 'Element')
      }
      beginDrag({ kind: 'move', id: node.dataset.el })
    })

    doc.addEventListener('dragover', (event) => {
      const drag = dragRef.current
      if (!drag) return
      event.preventDefault()
      const type = drag.kind === 'new' ? drag.type : findElement(elementsRef.current, drag.id)?.element.type
      if (!type) return
      if (event.dataTransfer) event.dataTransfer.dropEffect = drag.kind === 'new' ? 'copy' : 'move'
      const found = locateDrop(doc, event.clientX, event.clientY, event.target, type, drag.kind === 'move' ? drag.id : null)
      dropRef.current = found?.drop ?? null
      paintDrop(doc, found)

      // Scroll the preview when a drag nears its top or bottom edge.
      const win = doc.defaultView
      if (win) {
        if (event.clientY < 60) win.scrollBy(0, -18)
        else if (event.clientY > win.innerHeight - 60) win.scrollBy(0, 18)
      }
    })

    doc.addEventListener('drop', (event) => {
      if (!dragRef.current) return
      event.preventDefault()
      commitDrop()
    })

    doc.addEventListener('dragend', endDrag)
  }, [attachZones, beginDrag, chooseZone, commitDrop, endDrag, fieldByKey, paint, select, selectElement, updateElements])

  // A frame that finished loading before React attached its load handler still
  // needs wiring; decorate() ignores a document it has already prepared.
  useEffect(() => {
    if (frameRef.current?.contentDocument?.readyState === 'complete') decorate()
  }, [decorate])

  // Mark the selected element in the frame, and bring a new one into view.
  useEffect(() => {
    const doc = frameRef.current?.contentDocument
    if (!doc) return
    doc.querySelectorAll('[data-el-selected]').forEach((n) => n.removeAttribute('data-el-selected'))
    if (!selectedEl) return
    const node = doc.querySelector<HTMLElement>(`[data-zone-editor] [data-el="${CSS.escape(selectedEl)}"]`)
    node?.setAttribute('data-el-selected', 'true')
    if (node && revealRef.current === selectedEl) {
      revealRef.current = null
      node.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [selectedEl, elements, zones])

  // While the palette is open every "+ Add section" button shows, so it is
  // clear where elements can go, and the chosen spot is marked.
  const targetZone = placement !== 'selected' && zones.some((z) => z.id === placement) ? placement : zones[0]?.id
  const addingAfterSelected = placement === 'selected' && Boolean(selectedEl)
  useEffect(() => {
    const doc = frameRef.current?.contentDocument
    if (!doc) return
    doc.documentElement.toggleAttribute('data-el-show-zones', tab === 'add')
    doc.querySelectorAll('[data-zone-target]').forEach((n) => n.removeAttribute('data-zone-target'))
    if (tab === 'add' && !addingAfterSelected && targetZone) {
      doc.querySelector(`[data-element-zone="${CSS.escape(targetZone)}"]`)?.setAttribute('data-zone-target', '')
    }
  }, [tab, zones, targetZone, addingAfterSelected])

  // Dropping a selection that no longer exists (deleted, or dropped on save).
  useEffect(() => {
    if (selectedEl && !findElement(elements, selectedEl)) setSelectedEl(null)
  }, [elements, selectedEl])

  // ----------------------------------------------------------- Panel actions

  /** Add an element by clicking its tile: next to (or into) the selection, or at the end of a slot. */
  function addByClick(type: ElementType) {
    const map = elementsRef.current
    const element = newElement(type)
    let drop: Drop | null = null

    const found = placement === 'selected' && selectedEl ? findElement(map, selectedEl) : null
    if (found) {
      const { element: current, location } = found
      if (isContainer(current) && canDropInto(type, current.type)) {
        drop = { zone: location.zone, parentId: current.id, index: current.children.length }
      } else {
        // After the selection, climbing out of any container that cannot hold this type.
        let loc = location
        for (;;) {
          const parentType = loc.parentId ? findElement(map, loc.parentId)?.element.type ?? null : null
          if (canDropInto(type, parentType) || !loc.parentId) {
            drop = { zone: loc.zone, parentId: loc.parentId, index: loc.index + 1 }
            break
          }
          const parent = findElement(map, loc.parentId)
          if (!parent) break
          loc = parent.location
        }
      }
    }
    if (!drop) {
      const zone = placement !== 'selected' && zones.some((z) => z.id === placement) ? placement : zones[0]?.id
      if (!zone) {
        setNotice({ tone: 'error', message: 'This page has no spots for new elements yet.' })
        return
      }
      drop = { zone, parentId: null, index: map[zone]?.length ?? 0 }
    }

    const next = insertElement(map, element, drop)
    if (next === map) return
    updateElements(next)
    selectElement(element.id, true)
    setAnnouncement(`Added ${ELEMENT_LABELS[type]}.`)
  }

  const selectedFound = selectedEl ? findElement(elements, selectedEl) : null
  const siblings = selectedFound
    ? selectedFound.location.parentId
      ? ((findElement(elements, selectedFound.location.parentId)?.element as { children?: PageElement[] })?.children ?? [])
      : (elements[selectedFound.location.zone] ?? [])
    : []

  function moveSelected(direction: -1 | 1) {
    if (!selectedFound) return
    const { zone, parentId, index } = selectedFound.location
    const to = index + direction
    updateElements(
      updateList(elements, zone, parentId, (list) => {
        if (to < 0 || to >= list.length) return list
        const copy = list.slice()
        const [moved] = copy.splice(index, 1)
        copy.splice(to, 0, moved)
        return copy
      })
    )
    revealRef.current = selectedFound.element.id
    setAnnouncement(`Moved ${ELEMENT_LABELS[selectedFound.element.type]} to position ${to + 1} of ${siblings.length}.`)
  }

  function duplicateSelected() {
    if (!selectedFound) return
    const copy = cloneElement(selectedFound.element)
    const { zone, parentId, index } = selectedFound.location
    updateElements(insertElement(elements, copy, { zone, parentId, index: index + 1 }))
    selectElement(copy.id, true)
    setAnnouncement(`Copied ${ELEMENT_LABELS[copy.type]}.`)
  }

  function removeSelected() {
    if (!selectedFound) return
    updateElements(removeElement(elements, selectedFound.element.id))
    setSelectedEl(null)
    setAnnouncement(`Deleted ${ELEMENT_LABELS[selectedFound.element.type]}.`)
  }

  function onSave() {
    startTransition(async () => {
      const result = await savePageCopyAction(spec.path, values, elements)
      if (result.ok) {
        const cleaned = result.elements ?? {}
        const dropped = countElements(elements) - countElements(cleaned)
        setBaseline(values)
        setElements(cleaned)
        setElementsBaseline(cleaned)
        setNotice({
          tone: 'ok',
          message: dropped
            ? `Saved. The page is live. ${dropped} unfinished element${dropped === 1 ? ' was' : 's were'} left off (a photo, video, or button with nothing filled in).`
            : 'Saved. The page is live.',
        })
      } else {
        setNotice({ tone: 'error', message: result.error ?? 'That did not save.' })
      }
    })
  }

  function onReset() {
    if (!window.confirm('Return every line on this page to its original wording and remove every added element? The current version is kept in Version history, so this can be undone from there.')) return
    startTransition(async () => {
      const result = await resetPageCopyAction(spec.path)
      if (!result.ok) {
        setNotice({ tone: 'error', message: result.error ?? 'That did not reset.' })
        return
      }
      setValues(defaults)
      setBaseline(defaults)
      setElements({})
      setElementsBaseline({})
      setSelectedEl(null)
      setResetToken((n) => n + 1)
      const doc = frameRef.current?.contentDocument
      if (doc) for (const [key, value] of Object.entries(defaults)) paint(doc, key, value)
      setNotice({ tone: 'ok', message: 'The page is back to its original wording, with nothing added.' })
    })
  }

  /** Throw away unsaved edits and go back to what is published. */
  function onDiscard() {
    if (!window.confirm('Discard your unsaved changes and go back to the last saved version?')) return
    setValues(baseline)
    setElements(elementsBaseline)
    setSelectedEl(null)
    setResetToken((n) => n + 1)
    const doc = frameRef.current?.contentDocument
    if (doc) for (const [key, value] of Object.entries(baseline)) paint(doc, key, value)
    setNotice({ tone: 'ok', message: 'Unsaved changes discarded. The page matches the last save.' })
  }

  const targetText = addingAfterSelected && selectedFound
    ? `after the selected ${ELEMENT_LABELS[selectedFound.element.type].toLowerCase()}`
    : (zones.find((z) => z.id === targetZone)?.label.toLowerCase() ?? 'on the page')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'add', label: 'Add elements' },
    { id: 'element', label: 'Selected' },
    { id: 'text', label: 'Page text' },
  ]

  return (
    <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_400px]">
      {/* The live element preview, rendered into the frame's slots. */}
      {zones.map((zone) => createPortal(<ZoneElements elements={elements[zone.id] ?? []} editing />, zone.host, zone.id))}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {/* ------------------------------------------------------------ Preview */}
      <div className="flex min-w-0 flex-col bg-surface-2">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-bg px-4 py-3">
          <p className="m-0 mr-auto text-sm text-muted">
            Editing <span className="font-semibold text-heading">{spec.name}</span>{' '}
            <span className="whitespace-nowrap">({spec.path})</span>
          </p>
          <div role="group" aria-label="Preview width" className="flex items-center gap-1">
            {(Object.keys(VIEWPORTS) as ViewportKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setViewport(key)}
                aria-pressed={viewport === key}
                className={`rounded-full border px-3 py-1 text-sm font-semibold transition-colors ${
                  viewport === key
                    ? 'border-primary-strong bg-primary-strong text-on-primary'
                    : 'border-border text-ink hover:bg-surface'
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
            src={spec.path}
            title={`Live preview of ${spec.name}`}
            onLoad={decorate}
            style={{ width: VIEWPORTS[viewport].width }}
            className="h-[calc(100vh-13rem)] min-h-[30rem] max-w-full rounded-lg border border-border bg-bg shadow-sm"
          />
        </div>
      </div>

      {/* -------------------------------------------------------------- Panel */}
      <div ref={panelRef} className="flex max-h-[calc(100vh-4rem)] flex-col border-l border-border bg-bg">
        <div className="border-b border-border px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={onSave} disabled={pending || !dirty}>
              {pending ? 'Saving…' : 'Save and publish'}
            </Button>
            <Button size="sm" variant="ghost" href={spec.path} target="_blank" rel="noopener noreferrer">
              Open the page
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={onDiscard} disabled={pending || !dirty}>
              Discard changes
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={onReset} disabled={pending || (!changedFromCode && !addedCount)}>
              Reset all
            </Button>
            <Button size="sm" variant="link" href={`/members/admin/history?path=${encodeURIComponent(spec.path)}`}>
              Version history
            </Button>
          </div>
          <p aria-live="polite" className="m-0 mt-2 text-sm text-muted">
            {notice ? (
              <span className={notice.tone === 'error' ? 'font-semibold text-error' : 'font-semibold text-heading'}>
                {notice.message}
              </span>
            ) : dirty ? (
              'Unsaved changes.'
            ) : changedFromCode || addedCount ? (
              [
                changedFromCode ? `${changedFromCode} line${changedFromCode === 1 ? '' : 's'} changed` : '',
                addedCount ? `${addedCount} element${addedCount === 1 ? '' : 's'} added` : '',
              ]
                .filter(Boolean)
                .join(', ') + '.'
            ) : (
              'Drag elements onto the page, or click any highlighted words to edit them.'
            )}
          </p>
        </div>

        <div role="tablist" aria-label="Editor panels" className="flex gap-1 border-b border-border px-3">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
                tab === t.id ? 'border-primary-strong text-heading' : 'border-transparent text-muted hover:text-heading'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="flex-1 overflow-y-auto px-5 py-4">
          {tab === 'add' ? (
            <AddElementsPanel target={targetText} onAdd={addByClick} onDragStart={onPaletteDragStart} onDragEnd={endDrag} />
          ) : tab === 'element' ? (
            selectedFound ? (
              <ElementInspector
                key={selectedFound.element.id}
                element={selectedFound.element}
                canMoveUp={selectedFound.location.index > 0}
                canMoveDown={selectedFound.location.index < siblings.length - 1}
                onChange={(next) => updateElements(replaceElement(elements, next))}
                onMove={moveSelected}
                onDuplicate={duplicateSelected}
                onRemove={removeSelected}
                onSelectParent={
                  selectedFound.location.parentId
                    ? () => selectElement(selectedFound.location.parentId, true)
                    : undefined
                }
              />
            ) : (
              <EmptyInspector onBrowse={() => setTab('add')} />
            )
          ) : (
            spec.groups.map((group) => (
              <section key={group.id} aria-labelledby={`group-${group.id}`} className="mb-7 last:mb-0">
                <h2 id={`group-${group.id}`} className="text-lg">
                  {group.label}
                </h2>
                {group.hint ? <p className="mb-3 mt-1 text-sm text-muted">{group.hint}</p> : null}
                <div className="flex flex-col gap-4">
                  {group.fields.map((field) => (
                    <FieldEditor
                      key={field.key}
                      field={field}
                      value={values[field.key] ?? ''}
                      selected={selected === field.key}
                      resetToken={resetToken}
                      onChange={(value) => setValue(field.key, value)}
                      onFocus={() => select(field.key, true)}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

const inputClass =
  'w-full rounded-md border border-border bg-input-bg px-3 py-2 text-ink placeholder:text-placeholder focus:border-primary-strong'

function FieldEditor({
  field,
  value,
  selected,
  resetToken,
  onChange,
  onFocus,
}: {
  field: CopyField
  value: string
  selected: boolean
  /** Changes when the page is reset, remounting the uncontrolled image picker. */
  resetToken: number
  onChange: (value: string) => void
  onFocus: () => void
}) {
  const id = `copy-${field.key.replace(/\./g, '-')}`
  const changed = value !== field.value
  const help =
    field.help ?? (field.kind === 'rich' ? `Links are written as [the words](/the-page). Placeholders: ${COPY_TOKEN_HINT}.` : undefined)

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        selected ? 'border-primary-strong bg-surface' : 'border-border/60 bg-bg'
      }`}
    >
      {/* The image picker carries its own label, so only the plain fields get
          one here — two labels for one control reads twice to a screen reader. */}
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        {field.kind === 'image' ? (
          <span aria-hidden="true" />
        ) : (
          <label htmlFor={id} className="text-sm font-semibold text-heading">
            {field.label}
          </label>
        )}
        {changed ? (
          <button
            type="button"
            onClick={() => onChange(field.value)}
            className="text-xs font-semibold text-link underline underline-offset-2 hover:text-link-hover"
          >
            Undo
          </button>
        ) : null}
      </div>

      {field.kind === 'image' ? (
        /* Uncontrolled inside, so it is remounted whenever the value changes
           from outside it — an Undo, or a reset of the whole page. */
        <ImageUploadField
          key={`${resetToken}:${value}`}
          id={id}
          label={field.label}
          folder="pages"
          defaultValue={value}
          onChange={onChange}
        />
      ) : field.kind === 'text' || field.kind === 'href' || field.kind === 'alt' ? (
        <input
          id={id}
          data-field={field.key}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          className={inputClass}
        />
      ) : (
        <textarea
          id={id}
          data-field={field.key}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          rows={field.kind === 'meta' ? 3 : 4}
          className={inputClass}
        />
      )}

      {help ? (
        <p className="m-0 mt-1.5 text-sm text-muted">{help}</p>
      ) : null}
      {field.kind === 'meta' ? (
        <p className="m-0 mt-1 text-xs text-muted">{value.length} characters</p>
      ) : null}
    </div>
  )
}
