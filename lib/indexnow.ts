import { SITE_URL } from './site'

/**
 * IndexNow ping — a discovery accelerator (not a ranking signal). Submits
 * changed, canonical URLs to IndexNow so Bing (and engines it shares with) pick
 * them up immediately instead of waiting for passive crawl. Per
 * .claude/references/indexnow.md: key lives in an env var (rotatable), and only
 * canonical, indexable URLs are submitted. No-ops cleanly when no key is set.
 *
 * Host the key verification file at /<key>.txt — when INDEXNOW_KEY is issued,
 * drop a file `public/<key>.txt` whose contents are the key itself.
 */
export async function pingIndexNow(paths: string[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY
  if (!key || !paths.length) return

  const host = new URL(SITE_URL).host
  const urlList = paths.map((p) => (p.startsWith('http') ? p : `${SITE_URL}${p.startsWith('/') ? p : `/${p}`}`))

  try {
    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `${SITE_URL}/${key}.txt`,
        urlList,
      }),
    })
  } catch {
    // Discovery acceleration is best-effort; a failed ping never breaks publish.
  }
}
