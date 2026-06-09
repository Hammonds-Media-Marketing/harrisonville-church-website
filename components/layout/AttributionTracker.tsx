'use client'

// Page-level attribution capture (last-touch UTM / gclid / msclkid + external
// referrer) per the HMM form-building skill. Mounted once at the end of <body>
// in app/layout.tsx. Returns null — all work happens in a useEffect during
// browser idle time so it never blocks paint or hydration.

import { useEffect } from 'react'

const STORAGE_KEY = 'hm_attribution'
const TRACKED_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'msclkid',
] as const

type Attribution = Partial<Record<(typeof TRACKED_PARAMS)[number], string>> & {
  original_referrer?: string
  landing_url?: string
  captured_at?: string
}

function captureAttribution() {
  try {
    const params = new URLSearchParams(window.location.search)
    const fromUrl: Attribution = {}

    for (const key of TRACKED_PARAMS) {
      const value = params.get(key)
      if (value) fromUrl[key] = value
    }

    const externalReferrer =
      document.referrer && !document.referrer.startsWith(window.location.origin)
        ? document.referrer
        : ''

    const hasFreshAttribution = Object.keys(fromUrl).length > 0
    const existing = window.localStorage.getItem(STORAGE_KEY)

    if (hasFreshAttribution) {
      const payload: Attribution = {
        ...fromUrl,
        original_referrer: externalReferrer,
        landing_url: window.location.href,
        captured_at: new Date().toISOString(),
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } else if (!existing && externalReferrer) {
      const payload: Attribution = {
        original_referrer: externalReferrer,
        landing_url: window.location.href,
        captured_at: new Date().toISOString(),
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    }
  } catch {
    // localStorage unavailable (private mode, quota, disabled) — silent no-op.
  }
}

export function AttributionTracker() {
  useEffect(() => {
    const idle = (
      window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      }
    ).requestIdleCallback

    if (idle) {
      idle(captureAttribution, { timeout: 2000 })
    } else {
      setTimeout(captureAttribution, 0)
    }
  }, [])

  return null
}
