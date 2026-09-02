'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { Button } from '@/components/primitives/Button'
import { ImageUploadField } from '@/components/members/ImageUploadField'
import { inlineToHtml } from '@/lib/inline-markup'
import { applyCopyTokens, COPY_TOKEN_HINT } from '@/lib/copy-tokens'
import { isInlineEditable, type CopyField, type PageCopySpec } from '@/lib/site-copy'
import { savePageCopyAction, resetPageCopyAction } from '@/app/members/admin/actions'

/**
 * Visual editor for the hand-built pages. The real page loads in a frame
 * beside a panel of its editable fields. Clicking a word in the frame selects
 * its field; plain text can be typed straight onto the page, and everything
 * else (links, images, search wording) is edited in the panel. Either way the
 * frame updates as you type, so an editor sees the finished page rather than a
 * list of boxes.
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
}

const VIEWPORTS = {
  desktop: { label: 'Desktop', width: '100%' },
  tablet: { label: 'Tablet', width: '820px' },
  mobile: { label: 'Phone', width: '414px' },
} as const

type ViewportKey = keyof typeof VIEWPORTS

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
`

export function VisualEditor({ spec, overrides }: Props) {
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
  /** Bumped on reset so uncontrolled fields (the image picker) remount. */
  const [resetToken, setResetToken] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [viewport, setViewport] = useState<ViewportKey>('desktop')
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; message: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const frameRef = useRef<HTMLIFrameElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  /** Read inside frame listeners, which are bound once per frame load. */
  const valuesRef = useRef(values)
  valuesRef.current = values
  /** True while the editor is typing into the frame, so we do not fight the caret. */
  const typingKey = useRef<string | null>(null)

  const dirty = useMemo(
    () => fields.some((f) => (values[f.key] ?? '') !== (baseline[f.key] ?? '')),
    [fields, values, baseline]
  )
  const changedFromCode = useMemo(
    () => fields.filter((f) => (values[f.key] ?? '') !== f.value).length,
    [fields, values]
  )

  // Warn before a reload or a browser-level navigation drops unsaved wording.
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
          if (node instanceof HTMLImageElement) node.src = resolved
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
    const doc = frameRef.current?.contentDocument
    doc?.querySelectorAll<HTMLElement>('[data-copy-selected]').forEach((n) => n.removeAttribute('data-copy-selected'))
    const node = doc?.querySelector<HTMLElement>(`[data-copy="${CSS.escape(key)}"]`)
    node?.setAttribute('data-copy-selected', 'true')
    if (scroll) node?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    return node
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

    // The frame is a preview, not a browsable site: keep clicks and form
    // submissions from navigating it away from the page being edited.
    doc.addEventListener(
      'click',
      (event) => {
        const target = event.target as HTMLElement | null
        if (target?.closest('a')) event.preventDefault()
        const region = target?.closest<HTMLElement>('[data-copy]')
        if (!region) return
        const key = region.dataset.copy
        if (!key) return
        select(key)
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
          panelRef.current?.querySelector<HTMLElement>(`[data-field="${CSS.escape(key)}"]`)?.focus()
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
      if (!region?.isContentEditable) return
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
  }, [fieldByKey, paint, select])

  // A frame that finished loading before React attached its load handler still
  // needs wiring; decorate() ignores a document it has already prepared.
  useEffect(() => {
    if (frameRef.current?.contentDocument?.readyState === 'complete') decorate()
  }, [decorate])

  function onSave() {
    startTransition(async () => {
      const result = await savePageCopyAction(spec.path, values)
      if (result.ok) {
        setBaseline(values)
        setNotice({ tone: 'ok', message: 'Saved. The page is live.' })
      } else {
        setNotice({ tone: 'error', message: result.error ?? 'That did not save.' })
      }
    })
  }

  function onReset() {
    if (!window.confirm('Return every line on this page to the wording in the code? This cannot be undone.')) return
    startTransition(async () => {
      const result = await resetPageCopyAction(spec.path)
      if (!result.ok) {
        setNotice({ tone: 'error', message: result.error ?? 'That did not reset.' })
        return
      }
      setValues(defaults)
      setBaseline(defaults)
      setResetToken((n) => n + 1)
      const doc = frameRef.current?.contentDocument
      if (doc) for (const [key, value] of Object.entries(defaults)) paint(doc, key, value)
      setNotice({ tone: 'ok', message: 'Every line is back to its original wording.' })
    })
  }

  return (
    <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_400px]">
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
            <Button type="button" size="sm" variant="ghost" onClick={onReset} disabled={pending || !changedFromCode}>
              Reset all
            </Button>
          </div>
          <p aria-live="polite" className="m-0 mt-2 text-sm text-muted">
            {notice ? (
              <span className={notice.tone === 'error' ? 'font-semibold text-error' : 'font-semibold text-heading'}>
                {notice.message}
              </span>
            ) : dirty ? (
              'Unsaved changes.'
            ) : changedFromCode ? (
              `${changedFromCode} line${changedFromCode === 1 ? '' : 's'} changed from the original.`
            ) : (
              'Click any highlighted words in the page to edit them.'
            )}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {spec.groups.map((group) => (
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
          ))}
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
