'use client'

import { useMemo, useState } from 'react'
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import type { BlogPost } from '@/content/types'

type Block = BlogPost['body'][number]

/**
 * Rich text editor for article bodies. The editing surface is TipTap, but it
 * is deliberately constrained to the exact structures the article renderer
 * publishes — headings, paragraphs, bullet lists, and Scripture quotes — so
 * what an editor sees is what the page ships. The document serializes to the
 * existing JSONB block model in a hidden input; the server action stores the
 * same shape it always has.
 */

// ---------------------------------------------------------------------------
// blocks <-> TipTap document
// ---------------------------------------------------------------------------

type PMNode = {
  type: string
  attrs?: Record<string, unknown>
  content?: PMNode[]
  text?: string
}

const textNode = (text: string): PMNode[] => (text ? [{ type: 'text', text }] : [])

export function blocksToDoc(blocks: Block[]): PMNode {
  const content: PMNode[] = blocks.map((b) => {
    switch (b.type) {
      case 'h2':
        return { type: 'heading', attrs: { level: 2 }, content: textNode(b.text ?? '') }
      case 'h3':
        return { type: 'heading', attrs: { level: 3 }, content: textNode(b.text ?? '') }
      case 'list':
        return {
          type: 'bulletList',
          content: (b.items ?? []).map((item) => ({
            type: 'listItem',
            content: [{ type: 'paragraph', content: textNode(item) }],
          })),
        }
      case 'scripture':
        return {
          type: 'blockquote',
          content: [
            { type: 'paragraph', content: textNode(b.ref ? `${b.ref} | ${b.text ?? ''}` : b.text ?? '') },
          ],
        }
      default:
        return { type: 'paragraph', content: textNode(b.text ?? '') }
    }
  })
  return { type: 'doc', content: content.length ? content : [{ type: 'paragraph' }] }
}

function nodeText(node: PMNode): string {
  if (node.text) return node.text
  return (node.content ?? []).map(nodeText).join(' ').replace(/\s+/g, ' ').trim()
}

export function docToBlocks(doc: PMNode): Block[] {
  const blocks: Block[] = []
  for (const node of doc.content ?? []) {
    switch (node.type) {
      case 'heading': {
        const text = nodeText(node)
        if (text) blocks.push({ type: node.attrs?.level === 3 ? 'h3' : 'h2', text })
        break
      }
      case 'bulletList': {
        const items = (node.content ?? []).map(nodeText).filter(Boolean)
        if (items.length) blocks.push({ type: 'list', items })
        break
      }
      case 'blockquote': {
        const raw = (node.content ?? []).map(nodeText).filter(Boolean).join(' ')
        if (!raw) break
        const pipe = raw.indexOf('|')
        if (pipe >= 0) {
          blocks.push({ type: 'scripture', ref: raw.slice(0, pipe).trim(), text: raw.slice(pipe + 1).trim() })
        } else {
          blocks.push({ type: 'scripture', text: raw })
        }
        break
      }
      default: {
        const text = nodeText(node)
        if (text) blocks.push({ type: 'p', text })
      }
    }
  }
  return blocks
}

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active ?? undefined}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:text-muted ${
        active
          ? 'border-primary-strong bg-primary-strong text-on-primary'
          : 'border-border-strong bg-input-bg text-primary-strong hover:bg-surface'
      }`}
    >
      {label}
    </button>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bullets: e.isActive('bulletList'),
      scripture: e.isActive('blockquote'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  })

  return (
    <div role="toolbar" aria-label="Text formatting" className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-3 py-2">
      <ToolbarButton
        label="Section heading"
        active={state.h2}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        label="Subheading"
        active={state.h3}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />
      <ToolbarButton
        label="Bullet list"
        active={state.bullets}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        label="Scripture quote"
        active={state.scripture}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
      <ToolbarButton label="Undo" disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()} />
      <ToolbarButton label="Redo" disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Editor field
// ---------------------------------------------------------------------------

export function RichTextBodyEditor({
  id,
  name,
  defaultBlocks,
  describedBy,
}: {
  id: string
  name: string
  defaultBlocks: Block[]
  describedBy?: string
}) {
  const initialDoc = useMemo(() => blocksToDoc(defaultBlocks), [defaultBlocks])
  const [serialized, setSerialized] = useState(() => JSON.stringify(defaultBlocks))

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // Only the structures the article renderer supports; everything else
      // in the starter kit is switched off so nothing un-publishable exists.
      StarterKit.configure({
        heading: { levels: [2, 3] },
        bold: false,
        italic: false,
        strike: false,
        underline: false,
        link: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        orderedList: false,
      }),
    ],
    content: initialDoc,
    editorProps: {
      attributes: {
        id,
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': 'Article body',
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
        class:
          'tiptap-body min-h-[22rem] px-4 py-3 text-ink focus:outline-none ' +
          '[&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-heading [&_h2]:mt-5 [&_h2]:mb-2 ' +
          '[&_h3]:font-display [&_h3]:text-xl [&_h3]:text-heading [&_h3]:mt-4 [&_h3]:mb-2 ' +
          '[&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-1 ' +
          '[&_blockquote]:my-3 [&_blockquote]:rounded-r-md [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:bg-surface [&_blockquote]:px-5 [&_blockquote]:py-3 [&_blockquote_p]:italic',
      },
    },
    onUpdate: ({ editor: e }) => {
      setSerialized(JSON.stringify(docToBlocks(e.getJSON() as PMNode)))
    },
  })

  return (
    <div className="overflow-hidden rounded-md border border-border bg-input-bg focus-within:border-primary-strong">
      <input type="hidden" name={name} value={serialized} />
      {editor ? <Toolbar editor={editor} /> : null}
      <EditorContent editor={editor} />
    </div>
  )
}
