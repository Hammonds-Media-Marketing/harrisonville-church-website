import type { BlogPost } from '@/content/types'

type Block = BlogPost['body'][number]

/**
 * Plain-text editing format for article bodies, so the admin can edit the
 * structured JSONB blocks in one textarea:
 *
 *   ## Heading            -> h2 block (seeds the table of contents)
 *   ### Subheading        -> h3 block
 *   - item                -> consecutive "- " lines fold into one list block
 *   > Reference | text    -> scripture block (reference before the pipe)
 *   anything else         -> paragraph block (blank lines separate blocks)
 */

export function blocksToText(blocks: Block[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case 'h2':
          return `## ${b.text ?? ''}`
        case 'h3':
          return `### ${b.text ?? ''}`
        case 'list':
          return (b.items ?? []).map((i) => `- ${i}`).join('\n')
        case 'scripture':
          return `> ${b.ref ?? ''} | ${b.text ?? ''}`
        default:
          return b.text ?? ''
      }
    })
    .join('\n\n')
}

/**
 * Parse the block JSON posted by the rich text editor. Returns null when the
 * payload is not valid block JSON, so callers can fall back to the plain-text
 * format. Unknown block types and stray fields are dropped.
 */
export function parseBlocksJson(raw: string): Block[] | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (!Array.isArray(parsed)) return null

  const blocks: Block[] = []
  for (const item of parsed) {
    if (!item || typeof item !== 'object') return null
    const b = item as Record<string, unknown>
    switch (b.type) {
      case 'h2':
      case 'h3':
      case 'p':
        if (typeof b.text === 'string' && b.text.trim()) blocks.push({ type: b.type, text: b.text.trim() })
        break
      case 'scripture':
        if (typeof b.text === 'string' && b.text.trim()) {
          blocks.push({
            type: 'scripture',
            text: b.text.trim(),
            ...(typeof b.ref === 'string' && b.ref.trim() ? { ref: b.ref.trim() } : {}),
          })
        }
        break
      case 'list': {
        const items = Array.isArray(b.items) ? b.items.filter((i): i is string => typeof i === 'string' && !!i.trim()) : []
        if (items.length) blocks.push({ type: 'list', items: items.map((i) => i.trim()) })
        break
      }
      default:
        return null
    }
  }
  return blocks
}

export function textToBlocks(text: string): Block[] {
  const blocks: Block[] = []
  const chunks = text.replace(/\r\n/g, '\n').split(/\n{2,}/)

  for (const chunk of chunks) {
    const trimmed = chunk.trim()
    if (!trimmed) continue

    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', text: trimmed.slice(4).trim() })
      continue
    }
    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'h2', text: trimmed.slice(3).trim() })
      continue
    }
    if (trimmed.startsWith('> ')) {
      const inner = trimmed.slice(2)
      const pipe = inner.indexOf('|')
      if (pipe >= 0) {
        blocks.push({ type: 'scripture', ref: inner.slice(0, pipe).trim(), text: inner.slice(pipe + 1).trim() })
      } else {
        blocks.push({ type: 'scripture', text: inner.trim() })
      }
      continue
    }
    const lines = trimmed.split('\n').map((l) => l.trim())
    if (lines.every((l) => l.startsWith('- '))) {
      blocks.push({ type: 'list', items: lines.map((l) => l.slice(2).trim()) })
      continue
    }
    blocks.push({ type: 'p', text: lines.join(' ') })
  }

  return blocks
}
