import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { buildMetadata } from '@/lib/seo'
import { VisualEditor } from '@/components/members/VisualEditor'
import { getSupabaseServer } from '@/lib/supabase-server'
import { getCopySpec } from '@/content/site-copy'
import { parseOverrides } from '@/lib/site-copy'

/**
 * The visual editor for one hand-built page. The route mirrors the page's own
 * path ("/members/admin/editor/about/leadership" edits "/about/leadership"),
 * with "home" standing in for the site root because a catch-all cannot match
 * an empty segment.
 *
 * Stored overrides are read through the signed-in editor's own client rather
 * than the cached public one, so opening the editor always shows what was last
 * saved — never a cached copy of it.
 */

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ path: string[] }> }

const sitePath = (segments: string[]): string =>
  segments.length === 1 && segments[0] === 'home' ? '/' : `/${segments.join('/')}`

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { path } = await params
  const spec = getCopySpec(sitePath(path))
  return buildMetadata({
    title: spec ? `Editing ${spec.name}` : 'Visual Page Editor',
    description:
      'Rewrite the words and photographs on this page of the Harrisonville Church of Christ website, seeing the result as you type.',
    path: `/members/admin/editor/${path.join('/')}`,
    ogTitle: 'Visual Page Editor',
    ogDescription: 'Edit a page of the site directly on the page itself.',
    noindex: true,
  })
}

export default async function VisualEditorPage({ params }: Params) {
  const { path } = await params
  const spec = getCopySpec(sitePath(path))
  if (!spec) notFound()

  const supabase = await getSupabaseServer()
  const { data } = supabase
    ? await supabase.from('page_content').select('values').eq('path', spec.path).maybeSingle()
    : { data: null }

  return (
    <>
      <h1 className="sr-only">Editing {spec.name}</h1>
      <VisualEditor spec={spec} overrides={parseOverrides(data?.values)} />
    </>
  )
}
