'use client'

import { useState } from 'react'
import { FacebookIcon, ShareIcon } from '@/components/ui/icons'

/** Share controls. Uses the native share sheet where available, with explicit
 *  links and a copy-link fallback. Each control has an accessible name. */
export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const onNativeShare = async () => {
    const nav = navigator as Navigator & { share?: (data: { title: string; url: string }) => Promise<void> }
    if (nav.share) {
      try {
        await nav.share({ title, url })
      } catch {
        /* user dismissed — no-op */
      }
    } else {
      onCopy()
    }
  }

  const btn =
    'inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface'

  return (
    <div className="flex flex-col gap-2">
      <p className="font-body text-sm font-semibold uppercase tracking-wide text-muted">Share this</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onNativeShare} className={btn}>
          <ShareIcon className="h-4 w-4 text-primary-strong" />
          Share
        </button>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={btn}
        >
          <FacebookIcon className="h-4 w-4 text-primary-strong" />
          Facebook
        </a>
        <button type="button" onClick={onCopy} className={btn} aria-live="polite">
          {copied ? 'Link copied' : 'Copy link'}
        </button>
      </div>
    </div>
  )
}
