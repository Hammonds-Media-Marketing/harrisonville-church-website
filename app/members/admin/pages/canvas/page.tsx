import type { Metadata } from 'next'
import { BuilderCanvas } from '@/components/members/BuilderCanvas'

export const metadata: Metadata = {
  title: { absolute: 'Page Builder Preview | Site Admin' },
  description: 'The live preview frame inside the page builder.',
  robots: { index: false, follow: false },
}

/**
 * The page builder's preview frame. It renders nothing of its own: the
 * builder posts the page it is editing and the canvas draws it with the
 * site's components. Behind the admin layout's editor gate like every other
 * admin screen, and framed only by this same site (X-Frame-Options).
 */
export default function PageBuilderCanvasPage() {
  return <BuilderCanvas />
}
