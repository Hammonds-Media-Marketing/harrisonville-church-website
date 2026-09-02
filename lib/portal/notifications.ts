/**
 * Pure helpers for the in-app notification bell: count formatting, popover
 * placement, and the icon family each notification type belongs to.
 */

export function formatNotificationCount(count: number): string {
  return count > 99 ? '99+' : String(Math.max(0, Math.floor(count)))
}

export type NotificationIconKind = 'message' | 'calendar' | 'announcement' | 'member' | 'event' | 'bell'

export function notificationIconKind(type: string): NotificationIconKind {
  if (type === 'direct_message' || type === 'group_message') return 'message'
  if (type === 'announcement') return 'announcement'
  if (type === 'calendar_event' || type === 'communion_reminder' || type === 'communion_signup') return 'calendar'
  if (type.startsWith('special_event')) return 'event'
  if (type === 'member_pending' || type === 'member_approved') return 'member'
  return 'bell'
}

export type PopoverPosition = { left: number; top: number; width: number; maxHeight: number }

/**
 * Place the popover under its anchor, right-aligned, clamped inside the
 * visual viewport so it never runs off a phone screen or under the keyboard.
 */
export function popoverPosition(input: {
  anchor: { right: number; bottom: number }
  viewport: { left: number; top: number; width: number; height: number }
  margin?: number
  gap?: number
  width?: number
  maxHeight?: number
}): PopoverPosition {
  const margin = input.margin ?? 12
  const gap = input.gap ?? 12
  const width = Math.min(input.width ?? 368, Math.max(0, input.viewport.width - margin * 2))
  const minLeft = input.viewport.left + margin
  const maxLeft = input.viewport.left + input.viewport.width - margin - width
  const left = Math.min(Math.max(input.anchor.right - width, minLeft), Math.max(minLeft, maxLeft))
  const top = input.anchor.bottom + gap
  const maxHeight = Math.max(0, Math.min(input.maxHeight ?? 544, input.viewport.top + input.viewport.height - margin - top))
  return { left, top, width, maxHeight }
}
