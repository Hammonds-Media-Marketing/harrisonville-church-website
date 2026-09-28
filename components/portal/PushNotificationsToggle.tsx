'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/primitives/Button'
import { removePushSubscriptionAction, savePushSubscriptionAction } from '@/app/members/actions'

/**
 * Turns phone (web push) notifications on or off for THIS device. Registers
 * the service worker at /sw.js, asks the browser for permission, subscribes
 * with the church's public VAPID key, and saves the subscription to the
 * member's account. Every device is separate: a phone and a laptop are each
 * turned on here once.
 *
 * Renders nothing when push is not set up for the site
 * (NEXT_PUBLIC_VAPID_PUBLIC_KEY unset). On an iPhone or iPad opened in
 * Safari (not from the Home Screen), explains that the members area has to
 * be added to the Home Screen first, which is Apple's requirement.
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

type State = 'checking' | 'unsupported' | 'ios-install' | 'denied' | 'off' | 'on' | 'working'

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(padded)
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

function isAppleMobile(): boolean {
  const ua = navigator.userAgent
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

function pushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration('/')
  return registration ? registration.pushManager.getSubscription() : null
}

export function PushNotificationsToggle() {
  const [state, setState] = useState<State>('checking')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!VAPID_PUBLIC_KEY) return
    let cancelled = false
    ;(async () => {
      if (!pushSupported()) {
        setState(isAppleMobile() && !isStandalone() ? 'ios-install' : 'unsupported')
        return
      }
      if (Notification.permission === 'denied') {
        setState('denied')
        return
      }
      try {
        const subscription = await currentSubscription()
        if (!cancelled) setState(subscription ? 'on' : 'off')
      } catch {
        if (!cancelled) setState('off')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!VAPID_PUBLIC_KEY) return null

  async function turnOn() {
    setState('working')
    setMessage('')
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      await navigator.serviceWorker.ready
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'off')
        return
      }
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) }))
      const json = subscription.toJSON()
      const result = await savePushSubscriptionAction({
        endpoint: subscription.endpoint,
        p256dh: json.keys?.p256dh ?? '',
        auth: json.keys?.auth ?? '',
        userAgent: navigator.userAgent,
      })
      if (!result.ok) {
        await subscription.unsubscribe().catch(() => undefined)
        setState('off')
        setMessage('That did not save. Try again in a moment.')
        return
      }
      setState('on')
      setMessage('Notifications are on for this device.')
    } catch {
      setState('off')
      setMessage('This device could not turn on notifications. Try again, or use a different browser.')
    }
  }

  async function turnOff() {
    setState('working')
    setMessage('')
    try {
      const subscription = await currentSubscription()
      if (subscription) {
        await removePushSubscriptionAction(subscription.endpoint)
        await subscription.unsubscribe().catch(() => undefined)
      }
      setState('off')
      setMessage('Notifications are off for this device.')
    } catch {
      setState('on')
      setMessage('That did not work. Try again in a moment.')
    }
  }

  return (
    <div className="rounded-md border border-border bg-bg p-4">
      <p className="m-0 font-semibold text-heading">This device</p>
      {state === 'checking' ? <p className="m-0 mt-1 text-sm text-muted">Checking this device…</p> : null}
      {state === 'unsupported' ? (
        <p className="m-0 mt-1 text-sm text-muted">This browser cannot show notifications from the members area. Try Chrome, Edge, Firefox, or Safari on a recent version.</p>
      ) : null}
      {state === 'ios-install' ? (
        <p className="m-0 mt-1 text-sm text-muted">
          On an iPhone or iPad, first add the members area to your Home Screen: tap the Share button in Safari, then Add to Home Screen. Open it from that
          new icon, come back to this page, and turn notifications on.
        </p>
      ) : null}
      {state === 'denied' ? (
        <p className="m-0 mt-1 text-sm text-muted">
          Notifications are blocked for this site in your browser or phone settings. Allow notifications for the church website there, then reload this page.
        </p>
      ) : null}
      {state === 'off' || state === 'on' || state === 'working' ? (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted">{state === 'on' ? 'On for this device.' : state === 'off' ? 'Off for this device.' : 'One moment…'}</span>
          {state === 'on' ? (
            <Button type="button" variant="ghost" size="sm" onClick={turnOff}>
              Turn off on this device
            </Button>
          ) : (
            <Button type="button" variant="secondary" size="sm" onClick={turnOn} disabled={state === 'working'}>
              Turn on for this device
            </Button>
          )}
        </div>
      ) : null}
      <p role="status" aria-live="polite" className="m-0 mt-2 text-sm text-ink empty:hidden">
        {message}
      </p>
    </div>
  )
}
