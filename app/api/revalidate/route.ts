import { revalidatePath } from 'next/cache'
import { pingIndexNow } from '@/lib/indexnow'

/**
 * Revalidation webhook. The future Supabase/CMS publish hook POSTs here with a
 * shared secret and the changed paths. We revalidate the ISR pages and then
 * ping IndexNow for the same URLs — the single place IndexNow is triggered, per
 * the IndexNow reference (ping from the revalidation path).
 *
 * Body: { secret: string, paths: string[] }
 */
export async function POST(request: Request) {
  let body: { secret?: string; paths?: string[] }
  try {
    body = await request.json()
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const secret = process.env.REVALIDATE_SECRET
  if (!secret || body.secret !== secret) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const paths = Array.isArray(body.paths) ? body.paths.filter((p) => typeof p === 'string') : []
  if (!paths.length) {
    return Response.json({ ok: false, error: 'No paths provided' }, { status: 400 })
  }

  for (const path of paths) revalidatePath(path)
  await pingIndexNow(paths)

  return Response.json({ ok: true, revalidated: paths })
}
