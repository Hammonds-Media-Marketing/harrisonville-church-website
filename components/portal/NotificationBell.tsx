'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { BellIcon, CalendarIcon, CheckIcon, CloseIcon, MegaphoneIcon, MessageIcon, UserIcon, UsersIcon } from '@/components/ui/icons'
import { Skeleton } from '@/components/primitives/Feedback'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { formatNotificationCount, notificationIconKind, popoverPosition, type PopoverPosition } from '@/lib/portal/notifications'
import { formatRelative } from '@/lib/portal/time'
import type { InAppNotification } from '@/lib/portal/types'
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
  notificationCenterAction,
  unreadNotificationCountAction,
} from '@/app/members/notifications/actions'

/**
 * Notification bell with an anchored popover. The unread count arrives from
 * the server, then stays current through a realtime subscription on the
 * member's own rows plus a refresh whenever the tab regains focus.
 */

function KindIcon({ type }: { type: string }) {
  const cls = 'h-5 w-5'
  switch (notificationIconKind(type)) {
    case 'message':
      return <MessageIcon className={cls} />
    case 'announcement':
      return <MegaphoneIcon className={cls} />
    case 'calendar':
      return <CalendarIcon className={cls} />
    case 'event':
      return <UsersIcon className={cls} />
    case 'member':
      return <UserIcon className={cls} />
    default:
      return <BellIcon className={cls} />
  }
}

export function NotificationBell({ userId, initialUnread }: { userId: string; initialUnread: number }) {
  const router = useRouter()
  const bellRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(initialUnread)
  const [items, setItems] = useState<InAppNotification[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')
  const [position, setPosition] = useState<PopoverPosition | null>(null)
  const [pending, startTransition] = useTransition()

  const applyBadge = useCallback((count: number) => {
    setUnread(count)
    try {
      const nav = navigator as Navigator & { setAppBadge?: (n: number) => Promise<void>; clearAppBadge?: () => Promise<void> }
      if (count > 0) void nav.setAppBadge?.(count)
      else void nav.clearAppBadge?.()
    } catch {
      /* unsupported */
    }
  }, [])

  useEffect(() => applyBadge(initialUnread), [applyBadge, initialUnread])

  const refreshCount = useCallback(async () => {
    try {
      applyBadge(await unreadNotificationCountAction())
    } catch {
      /* keep last count */
    }
  }, [applyBadge])

  const load = useCallback(async () => {
    setLoading(true)
    const result = await notificationCenterAction(0)
    setItems(result.notifications)
    applyBadge(result.unreadCount)
    setHasMore(result.hasMore)
    setError(result.error)
    setLoaded(true)
    setLoading(false)
  }, [applyBadge])

  // Realtime: any change to my notifications refreshes the count (and list if open).
  useEffect(() => {
    const supabase = getSupabaseBrowser()
    if (!supabase) return
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'in_app_notifications', filter: `recipient_id=eq.${userId}` }, () => {
        void refreshCount()
        if (open) void load()
      })
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, open, refreshCount, load])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refreshCount()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [refreshCount])

  // Position under the bell, clamped to the visual viewport.
  const place = useCallback(() => {
    const rect = bellRef.current?.getBoundingClientRect()
    if (!rect) return
    const vv = window.visualViewport
    setPosition(
      popoverPosition({
        anchor: { right: rect.right, bottom: rect.bottom },
        viewport: { left: vv?.offsetLeft ?? 0, top: vv?.offsetTop ?? 0, width: vv?.width ?? window.innerWidth, height: vv?.height ?? window.innerHeight },
      })
    )
  }, [])

  useEffect(() => {
    if (!open) return
    place()
    if (!loaded) void load()
    const raf = requestAnimationFrame(place)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    window.visualViewport?.addEventListener('resize', place)
    window.visualViewport?.addEventListener('scroll', place)
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t) || bellRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        bellRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
      window.visualViewport?.removeEventListener('resize', place)
      window.visualViewport?.removeEventListener('scroll', place)
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, place, load, loaded])

  async function openItem(n: InAppNotification) {
    if (!n.read_at) {
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)))
      applyBadge(Math.max(0, unread - 1))
    }
    setOpen(false)
    try {
      if (!n.read_at) await markNotificationReadAction(n.id)
    } finally {
      router.push(n.destination_url)
    }
  }

  function markAll() {
    startTransition(async () => {
      setItems((list) => list.map((x) => ({ ...x, read_at: x.read_at ?? new Date().toISOString() })))
      applyBadge(0)
      const result = await markAllNotificationsReadAction()
      if (result.error) {
        setError(result.error)
        await load()
      }
    })
  }

  async function loadMore() {
    const result = await notificationCenterAction(items.length)
    if (result.error) return setError(result.error)
    setItems((list) => [...list, ...result.notifications.filter((n) => !list.some((x) => x.id === n.id))])
    setHasMore(result.hasMore)
  }

  return (
    <>
      <button
        ref={bellRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Notifications, ${unread} unread`}
        className="notification-bell relative grid h-11 w-11 place-items-center rounded-full text-heading transition-colors hover:bg-surface-2"
      >
        <BellIcon className="h-6 w-6" />
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 min-w-5 rounded-full bg-error px-1.5 py-0.5 text-center text-xs font-bold leading-none text-on-status ring-2 ring-bg transition-opacity"
          style={{ opacity: unread > 0 ? 1 : 0 }}
        >
          {formatNotificationCount(unread)}
        </span>
      </button>

      {open && position && typeof document !== 'undefined'
        ? createPortal(
            <section
              ref={panelRef}
              role="dialog"
              aria-label="Notifications"
              style={{ left: position.left, top: position.top, width: position.width, maxHeight: position.maxHeight }}
              className="notification-popover fixed z-overlay flex flex-col overflow-hidden rounded-lg border border-border-strong/40 bg-bg shadow-lg"
            >
              <header className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <h2 className="m-0 text-lg">Notifications</h2>
                  <p className="m-0 text-xs text-muted">{unread > 0 ? `${unread} unread` : 'You are all caught up'}</p>
                </div>
                <button
                  type="button"
                  onClick={markAll}
                  disabled={unread === 0 || pending}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-primary-strong hover:bg-surface disabled:text-muted"
                >
                  <CheckIcon className="h-4 w-4" /> Mark all read
                </button>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close notifications" className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface hover:text-heading">
                  <CloseIcon className="h-5 w-5" />
                </button>
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {loading && !loaded ? (
                  <div className="flex flex-col gap-3 p-4">
                    <Skeleton className="h-12" />
                    <Skeleton className="h-12" />
                    <Skeleton className="h-12" />
                  </div>
                ) : error ? (
                  <p role="alert" className="m-0 p-4 text-sm font-semibold text-error">
                    {error}
                  </p>
                ) : items.length === 0 ? (
                  <p className="m-0 p-6 text-center text-sm text-muted">Nothing here yet. Announcements, messages, and event invitations will appear in this list.</p>
                ) : (
                  <ul className="m-0 list-none p-0">
                    {items.map((n) => (
                      <li key={n.id} className="border-b border-border/40 last:border-0">
                        <button
                          type="button"
                          onClick={() => openItem(n)}
                          className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface ${n.read_at ? '' : 'bg-surface/60'}`}
                        >
                          <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${n.read_at ? 'bg-surface-2 text-muted' : 'bg-primary-strong text-on-primary'}`}>
                            <KindIcon type={n.notification_type} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={`block text-sm ${n.read_at ? 'text-ink' : 'font-semibold text-heading'}`}>{n.title}</span>
                            {n.body ? <span className="block truncate text-sm text-muted">{n.body}</span> : null}
                            <span className="block text-xs text-muted">{formatRelative(n.created_at)}</span>
                          </span>
                          {!n.read_at ? <span aria-hidden="true" className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-secondary" /> : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {hasMore ? (
                  <button type="button" onClick={loadMore} className="block w-full px-4 py-3 text-center text-sm font-semibold text-primary-strong hover:bg-surface">
                    Load older notifications
                  </button>
                ) : null}
              </div>
            </section>,
            document.body
          )
        : null}
    </>
  )
}
