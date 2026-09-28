import type { PageSection } from '@/lib/page-sections'

/**
 * Messages between the page builder and its live preview frame
 * (/members/admin/pages/canvas). The frame is a same-origin page that renders
 * whatever the builder sends it through the site's real components, which is
 * what makes the preview honest at every screen width: the frame has its own
 * viewport, so the site's phone and tablet layouts apply inside it.
 *
 * Both sides check the message origin and the `source` tag, so nothing but
 * the builder in this same site can drive the frame, and the builder ignores
 * anything but its own frame.
 */

export const BUILDER_SOURCE = 'hcc-page-builder'
export const CANVAS_SOURCE = 'hcc-page-canvas'

export type BuilderHero = { title: string; eyebrow: string; lead: string }

/** What is selected: the page top, a section, or an element inside a free-layout section. */
export type BuilderSelection =
  | { kind: 'hero' }
  | { kind: 'section'; id: string }
  | { kind: 'element'; sectionId: string; elementId: string }
  | null

export type ToBuilderCanvas = {
  source: typeof BUILDER_SOURCE
  type: 'render'
  hero: BuilderHero
  sections: PageSection[]
  selection: BuilderSelection
  /** Where a new section will go, highlighted in the frame. */
  insertAt: number | null
  /** Scroll this section (or "hero") into view after rendering. */
  reveal?: string
}

export type SectionAction = 'up' | 'down' | 'duplicate' | 'delete'

export type FromBuilderCanvas =
  | { source: typeof CANVAS_SOURCE; type: 'ready' }
  | { source: typeof CANVAS_SOURCE; type: 'select'; selection: BuilderSelection }
  | { source: typeof CANVAS_SOURCE; type: 'insert'; index: number }
  | { source: typeof CANVAS_SOURCE; type: 'action'; id: string; action: SectionAction }

export function isFromCanvas(data: unknown): data is FromBuilderCanvas {
  return Boolean(data) && typeof data === 'object' && (data as { source?: unknown }).source === CANVAS_SOURCE
}

export function isToCanvas(data: unknown): data is ToBuilderCanvas {
  return (
    Boolean(data) &&
    typeof data === 'object' &&
    (data as { source?: unknown }).source === BUILDER_SOURCE &&
    (data as { type?: unknown }).type === 'render'
  )
}
