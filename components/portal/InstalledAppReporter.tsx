'use client'

import { useEffect } from 'react'
import { recordInstalledAppAction } from '@/app/members/actions'
import type { PlatformCategory } from '@/lib/portal/types'

/**
 * When the members area is running as an installed app (standalone display
 * mode), record it once per session so the admin readiness dashboard and
 * the member's own checklist can reflect it. Browsers never report whether
 * an app is installed, so an observed standalone launch is the signal.
 */

const SESSION_KEY = 'hcoc.installedAppReported'

function isStandalone(): boolean {
  const media = window.matchMedia?.('(display-mode: standalone)').matches ?? false
  const nav = navigator as Navigator & { standalone?: boolean }
  return media || nav.standalone === true
}

function platform(): PlatformCategory {
  const ua = navigator.userAgent.toLowerCase()
  const plat = (navigator.platform ?? '').toLowerCase()
  if (/iphone|ipad|ipod/.test(ua) || (/mac/.test(plat) && navigator.maxTouchPoints > 1)) return 'iOS'
  if (/android/.test(ua)) return 'Android'
  if (/win/.test(plat)) return 'Windows'
  if (/mac/.test(plat)) return 'macOS'
  return 'Other'
}

export function InstalledAppReporter() {
  useEffect(() => {
    if (!isStandalone()) return
    try {
      if (sessionStorage.getItem(SESSION_KEY) === '1') return
    } catch {
      /* storage unavailable: still report */
    }
    recordInstalledAppAction({ platformCategory: platform(), standaloneDetected: true })
      .then((r) => {
        if (!r.ok) return
        try {
          sessionStorage.setItem(SESSION_KEY, '1')
        } catch {
          /* ignore */
        }
      })
      .catch(() => {})
  }, [])
  return null
}
