import { getDateKey } from '@/lib/portal/time'
import type { ChatCursor, ChatMessage, ChatUnreadSummary } from '@/lib/portal/types'

/**
 * Pure chat helpers shared by the server data layer, the live thread, and
 * the tests: keyset pagination, message merging, bubble grouping, previews,
 * and unread-count shaping.
 */

export const CHAT_PAGE_SIZE = 50
export const CHAT_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'] as const
export const CHAT_IMAGE_MAX_BYTES = 8 * 1024 * 1024
export const CHAT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID.test(value)
}

/** A cursor is only trusted when both halves have a strict shape; it is
 *  interpolated into a PostgREST filter, so this blocks filter injection. */
export function isValidCursor(cursor: unknown): cursor is ChatCursor {
  if (!cursor || typeof cursor !== 'object') return false
  const c = cursor as Record<string, unknown>
  return (
    isUuid(c.id) &&
    typeof c.createdAt === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(c.createdAt) &&
    Number.isFinite(Date.parse(c.createdAt))
  )
}

/** Merge pages or realtime rows by id; existing rows win; chronological order. */
export function mergeMessages(current: ChatMessage[], incoming: ChatMessage[], opts: { replace?: boolean } = {}): ChatMessage[] {
  const byId = new Map(current.map((m) => [m.id, m]))
  for (const m of incoming) {
    if (opts.replace || !byId.has(m.id)) byId.set(m.id, m)
  }
  return Array.from(byId.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
}

/** Scroll position that keeps the viewport still after older rows prepend. */
export function scrollTopAfterPrepend(previousScrollTop: number, previousScrollHeight: number, nextScrollHeight: number): number {
  return previousScrollTop + Math.max(0, nextScrollHeight - previousScrollHeight)
}

/** Ids of the last message in each same-sender, same-day run (bubble tails). */
export function tailMessageIds(messages: Array<Pick<ChatMessage, 'id' | 'senderId' | 'createdAt'>>): Set<string> {
  const tails = new Set<string>()
  messages.forEach((m, i) => {
    const next = messages[i + 1]
    const continues = next && next.senderId === m.senderId && getDateKey(next.createdAt) === getDateKey(m.createdAt)
    if (!continues) tails.add(m.id)
  })
  return tails
}

/** Group messages into day sections, in order. */
export function groupByDay<T extends Pick<ChatMessage, 'createdAt'>>(messages: T[]): Array<{ dateKey: string; messages: T[] }> {
  const out: Array<{ dateKey: string; messages: T[] }> = []
  for (const m of messages) {
    const key = getDateKey(m.createdAt)
    const last = out[out.length - 1]
    if (last && last.dateKey === key) last.messages.push(m)
    else out.push({ dateKey: key, messages: [m] })
  }
  return out
}

export function conversationPreview(message: Pick<ChatMessage, 'body' | 'messageType' | 'deletedAt'> | null, max = 56): string {
  if (!message) return 'No messages yet'
  if (message.deletedAt) return 'Message deleted'
  if (message.messageType === 'image') return message.body ? `Photo: ${truncate(message.body, max - 7)}` : 'Photo'
  return truncate(message.body, max)
}

function truncate(text: string, max: number): string {
  const single = text.replace(/\s+/g, ' ').trim()
  return single.length > max ? `${single.slice(0, max - 1).trimEnd()}…` : single
}

export function formatUnreadCount(count: number): string {
  return count > 99 ? '99+' : String(Math.max(0, count))
}

/** Coerce the RPC's jsonb into a clean summary; bad shapes become zeros. */
export function normalizeUnreadSummary(raw: unknown): ChatUnreadSummary {
  const empty: ChatUnreadSummary = { total: 0, groups: {}, direct: {} }
  if (!raw || typeof raw !== 'object') return empty
  const r = raw as Record<string, unknown>
  const clean = (v: unknown): Record<string, number> => {
    if (!v || typeof v !== 'object') return {}
    const out: Record<string, number> = {}
    for (const [k, n] of Object.entries(v as Record<string, unknown>)) {
      const num = Math.floor(Number(n))
      if (Number.isFinite(num) && num > 0) out[k] = num
    }
    return out
  }
  const groups = clean(r.groups)
  const direct = clean(r.direct)
  const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0)
  const total = Math.floor(Number(r.total))
  return { total: Number.isFinite(total) && total >= 0 ? total : sum(groups) + sum(direct), groups, direct }
}

/** Edits are allowed on your own live text messages, for a day. */
export const CHAT_EDIT_WINDOW_MS = 24 * 60 * 60 * 1000

export function canEditMessage(message: Pick<ChatMessage, 'senderId' | 'messageType' | 'deletedAt' | 'createdAt'>, userId: string, now = Date.now()): boolean {
  return (
    message.senderId === userId &&
    !message.deletedAt &&
    message.messageType === 'text' &&
    now - new Date(message.createdAt).getTime() <= CHAT_EDIT_WINDOW_MS
  )
}

export function canDeleteMessage(message: Pick<ChatMessage, 'senderId' | 'deletedAt'>, userId: string, isAdmin: boolean): boolean {
  return !message.deletedAt && (message.senderId === userId || isAdmin)
}

/** Validate a picked image before upload; returns a member-facing error or null. */
export function validateChatImage(file: { type: string; size: number; name: string }): string | null {
  const name = file.name.toLowerCase()
  if (/\.(heic|heif)$/.test(name) || /hei[cf]/.test(file.type)) {
    return 'HEIC photos are not supported yet. Choose a JPG, PNG, or WebP image, or change the camera format in your phone settings.'
  }
  if (!(CHAT_IMAGE_TYPES as readonly string[]).includes(file.type)) return 'Choose a JPG, PNG, or WebP image.'
  if (file.size > CHAT_IMAGE_MAX_BYTES) return 'That photo is larger than 8 MB. Choose a smaller one.'
  return null
}
