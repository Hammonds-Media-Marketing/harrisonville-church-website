'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { PageHero } from '@/components/blocks/PageHero'
import { PageSectionView, heroWaveFill } from '@/components/pages/PageRenderer'
import { SECTION_LABELS, previewSection, type PageSection } from '@/lib/page-sections'
import {
  CANVAS_SOURCE,
  isToCanvas,
  type BuilderHero,
  type BuilderSelection,
  type FromBuilderCanvas,
  type SectionAction,
} from '@/lib/builder-protocol'

/**
 * The page builder's live preview. Rendered inside a same-origin frame so the
 * site's own breakpoints apply at the width the editor picks, it draws the
 * page the builder sends it through the same components the public page uses
 * and reports clicks back: a section or element to select, a "+" slot to add
 * a section, or a toolbar action (move, copy, delete).
 *
 * Nothing here saves anything. The frame only mirrors the builder's state,
 * and every link inside the preview is inert so a click never navigates away.
 */

const FRAME_CSS = `
  /* The preview shows the page, not the members and admin bars above it. */
  .members-shell-bar, [data-admin-nav] { display: none !important; }
  .members-shell-content { padding-bottom: 0 !important; }

  [data-builder-block] { position: relative; }
  [data-builder-block]::after {
    content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 20;
    outline: 2px solid transparent; outline-offset: -2px; transition: outline-color .12s;
  }
  [data-builder-block]:hover::after { outline-color: color-mix(in srgb, var(--color-primary-strong) 45%, transparent); }
  [data-builder-block][data-selected]::after { outline: 3px solid var(--color-primary-strong); }
  [data-builder-block] [data-builder-toolbar] { opacity: 0; transition: opacity .12s; }
  [data-builder-block]:hover [data-builder-toolbar],
  [data-builder-block][data-selected] [data-builder-toolbar],
  [data-builder-toolbar]:focus-within { opacity: 1; }

  [data-el] { cursor: pointer; }
  [data-el]:hover { outline: 2px dashed color-mix(in srgb, var(--color-primary-strong) 55%, transparent); outline-offset: 4px; }
  [data-el][data-el-selected] { outline: 2px solid var(--color-secondary-active); outline-offset: 4px; }
`

type Outgoing = FromBuilderCanvas extends infer M ? (M extends FromBuilderCanvas ? Omit<M, 'source'> : never) : never

function post(message: Outgoing) {
  window.parent?.postMessage({ source: CANVAS_SOURCE, ...message }, window.location.origin)
}

const toolbarButton =
  'grid h-[2rem] min-w-[2rem] place-items-center rounded-md px-2 text-sm font-semibold text-on-primary hover:bg-on-primary/15 focus-visible:bg-on-primary/15 disabled:opacity-40'

function Toolbar({ section, index, count }: { section: PageSection; index: number; count: number }) {
  const label = SECTION_LABELS[section.type].label
  const act = (action: SectionAction) => post({ type: 'action', id: section.id, action })
  return (
    <div
      data-builder-toolbar=""
      className="absolute right-3 top-3 z-30 flex items-center gap-0.5 rounded-lg bg-primary-strong p-1 shadow-lg"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="px-2 text-xs font-semibold uppercase tracking-wide text-on-primary">{label}</span>
      <button type="button" className={toolbarButton} aria-label={`Move ${label} up`} title="Move up" disabled={index === 0} onClick={() => act('up')}>
        <span aria-hidden="true">↑</span>
      </button>
      <button type="button" className={toolbarButton} aria-label={`Move ${label} down`} title="Move down" disabled={index === count - 1} onClick={() => act('down')}>
        <span aria-hidden="true">↓</span>
      </button>
      <button type="button" className={toolbarButton} title="Make a copy" onClick={() => act('duplicate')}>
        Copy
      </button>
      <button type="button" className={toolbarButton} title="Delete this section" onClick={() => act('delete')}>
        Delete
      </button>
    </div>
  )
}

function InsertSlot({ index, active, prominent }: { index: number; active: boolean; prominent?: boolean }) {
  return (
    <div className={`relative flex justify-center ${prominent ? 'py-10' : 'h-0'}`}>
      <button
        type="button"
        onClick={() => post({ type: 'insert', index })}
        className={`z-30 inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold shadow-md transition-colors ${
          prominent ? '' : 'absolute top-0 -translate-y-1/2'
        } ${
          active
            ? 'border-secondary-active bg-secondary text-on-secondary'
            : 'border-border-strong bg-bg text-primary-strong hover:border-primary-strong hover:bg-surface'
        }`}
      >
        <span aria-hidden="true">+</span> {active ? 'New section goes here' : 'Add a section here'}
      </button>
    </div>
  )
}

export function BuilderCanvas() {
  const [hero, setHero] = useState<BuilderHero | null>(null)
  const [sections, setSections] = useState<PageSection[]>([])
  const [selection, setSelection] = useState<BuilderSelection>(null)
  const [insertAt, setInsertAt] = useState<number | null>(null)
  const revealRef = useRef<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  // Receive the builder's state.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || !isToCanvas(event.data)) return
      const data = event.data
      setHero(data.hero)
      setSections(Array.isArray(data.sections) ? data.sections : [])
      setSelection(data.selection)
      setInsertAt(data.insertAt)
      if (data.reveal) revealRef.current = data.reveal
    }
    window.addEventListener('message', onMessage)
    post({ type: 'ready' })
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // Scroll a newly selected or added block into view once it has rendered.
  useEffect(() => {
    const id = revealRef.current
    if (!id) return
    revealRef.current = null
    const node = document.querySelector(`[data-builder-block="${CSS.escape(id)}"]`)
    node?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  })

  // Links in the preview never navigate; the editor is only pointing at things.
  useEffect(() => {
    const stop = (event: MouseEvent) => {
      const link = (event.target as HTMLElement | null)?.closest('a')
      if (link && rootRef.current?.contains(link)) event.preventDefault()
    }
    const noDrag = (event: DragEvent) => {
      if (rootRef.current?.contains(event.target as Node)) event.preventDefault()
    }
    document.addEventListener('click', stop, true)
    document.addEventListener('dragstart', noDrag, true)
    return () => {
      document.removeEventListener('click', stop, true)
      document.removeEventListener('dragstart', noDrag, true)
    }
  }, [])

  const onBlockClick = useCallback((event: React.MouseEvent, sectionId: string) => {
    const el = (event.target as HTMLElement).closest<HTMLElement>('[data-el]')
    if (el?.dataset.el) {
      post({ type: 'select', selection: { kind: 'element', sectionId, elementId: el.dataset.el } })
      return
    }
    post({ type: 'select', selection: { kind: 'section', id: sectionId } })
  }, [])

  // Mark the selected element (inside a free layout) for its outline.
  useEffect(() => {
    document.querySelectorAll('[data-el-selected]').forEach((n) => n.removeAttribute('data-el-selected'))
    if (selection?.kind === 'element') {
      document.querySelector(`[data-el="${CSS.escape(selection.elementId)}"]`)?.setAttribute('data-el-selected', '')
    }
  })

  if (!hero) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-muted">
        <style>{FRAME_CSS}</style>
        Loading the preview…
      </div>
    )
  }

  const selectedSectionId =
    selection?.kind === 'section' ? selection.id : selection?.kind === 'element' ? selection.sectionId : null

  return (
    <div ref={rootRef}>
      <style>{FRAME_CSS}</style>

      <div
        data-builder-block="hero"
        {...(selection?.kind === 'hero' ? { 'data-selected': '' } : {})}
        onClick={() => post({ type: 'select', selection: { kind: 'hero' } })}
        className="cursor-pointer"
      >
        <PageHero
          eyebrow={hero.eyebrow || 'Harrisonville Church of Christ'}
          title={hero.title || 'Page title'}
          lead={hero.lead || undefined}
          waveFill={heroWaveFill(sections.map(previewSection))}
        />
      </div>

      {sections.length ? (
        <>
          {sections.map((section, index) => (
            <div key={section.id}>
              <InsertSlot index={index} active={insertAt === index} />
              <div
                data-builder-block={section.id}
                {...(selectedSectionId === section.id ? { 'data-selected': '' } : {})}
                onClick={(e) => onBlockClick(e, section.id)}
                className="cursor-pointer"
              >
                <Toolbar section={section} index={index} count={sections.length} />
                <PageSectionView section={previewSection(section)} editing />
              </div>
            </div>
          ))}
          <InsertSlot index={sections.length} active={insertAt === sections.length} prominent />
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
          <p className="m-0 max-w-md text-lg text-muted">
            This page has no sections yet. Pick a starting layout in the panel, or add your first section.
          </p>
          <InsertSlot index={0} active={insertAt === 0} prominent />
        </div>
      )}
    </div>
  )
}
