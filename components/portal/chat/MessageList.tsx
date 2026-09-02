'use client'

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Avatar } from '@/components/primitives/Avatar'
import { Dialog } from '@/components/primitives/Dialog'
import { Button } from '@/components/primitives/Button'
import { CHAT_REACTIONS, canDeleteMessage, canEditMessage, groupByDay, scrollTopAfterPrepend, tailMessageIds } from '@/lib/portal/chat'
import { formatDaySeparator, formatTime } from '@/lib/portal/time'
import type { ChatMessage } from '@/lib/portal/types'

/**
 * The scrolling message list. Handles day separators, bubble grouping,
 * scroll anchoring when older pages load or images arrive, a "new messages"
 * pill when the reader is scrolled up, and a per-message action sheet
 * (react, edit, delete) opened by a button, long-press, or context menu.
 */

export function MessageList({
  messages,
  currentUserId,
  isAdmin,
  isGroup,
  conversationKey,
  hasMore,
  loadingEarlier,
  onLoadEarlier,
  onReact,
  onEdit,
  onDelete,
}: {
  messages: ChatMessage[]
  currentUserId: string
  isAdmin: boolean
  isGroup: boolean
  conversationKey: string
  hasMore: boolean
  loadingEarlier: boolean
  onLoadEarlier: () => Promise<boolean>
  onReact: (id: string, emoji: string) => Promise<void>
  onEdit: (id: string, body: string) => Promise<string>
  onDelete: (id: string) => Promise<string>
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const nearBottomRef = useRef(true)
  const prependRef = useRef<{ scrollTop: number; scrollHeight: number } | null>(null)
  const lastCountRef = useRef(messages.length)
  const [showNewPill, setShowNewPill] = useState(false)
  const [active, setActive] = useState<ChatMessage | null>(null)
  const [editing, setEditing] = useState<ChatMessage | null>(null)
  const [editText, setEditText] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<ChatMessage | null>(null)
  const [reactorList, setReactorList] = useState<{ emoji: string; names: string[] } | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const longPress = useRef<number | null>(null)

  const tails = tailMessageIds(messages)
  const days = groupByDay(messages)

  const isNearBottom = () => {
    const el = scrollerRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 96
  }

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    bottomRef.current?.scrollIntoView({ block: 'end', behavior })
  }, [])

  // New conversation: jump to the newest message.
  useLayoutEffect(() => {
    scrollToBottom()
    const raf = requestAnimationFrame(() => scrollToBottom())
    lastCountRef.current = messages.length
    setShowNewPill(false)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationKey])

  // Messages changed: keep the viewport still after a prepend, follow the
  // tail when near the bottom, otherwise offer the pill.
  useLayoutEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    if (prependRef.current) {
      el.scrollTop = scrollTopAfterPrepend(prependRef.current.scrollTop, prependRef.current.scrollHeight, el.scrollHeight)
      prependRef.current = null
      lastCountRef.current = messages.length
      return
    }
    if (messages.length > lastCountRef.current) {
      const newest = messages[messages.length - 1]
      if (nearBottomRef.current || newest?.senderId === currentUserId) scrollToBottom('smooth')
      else setShowNewPill(true)
    }
    lastCountRef.current = messages.length
  }, [messages, currentUserId, scrollToBottom])

  // Images loading or the keyboard opening change the height; stay pinned.
  useEffect(() => {
    const el = scrollerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => {
      if (nearBottomRef.current) scrollToBottom()
    })
    ro.observe(el)
    if (el.firstElementChild) ro.observe(el.firstElementChild)
    return () => ro.disconnect()
  }, [scrollToBottom])

  async function handleScroll() {
    const el = scrollerRef.current
    if (!el) return
    nearBottomRef.current = isNearBottom()
    if (nearBottomRef.current) setShowNewPill(false)
    if (el.scrollTop < 120 && hasMore && !loadingEarlier) {
      prependRef.current = { scrollTop: el.scrollTop, scrollHeight: el.scrollHeight }
      const ok = await onLoadEarlier()
      if (!ok) prependRef.current = null
    }
  }

  function openActions(m: ChatMessage) {
    if (m.deletedAt) return
    setError('')
    setActive(m)
  }

  async function submitEdit() {
    if (!editing) return
    const err = await onEdit(editing.id, editText)
    if (err) return setError(err)
    setEditing(null)
  }

  return (
    <div className="message-list relative flex min-h-0 flex-1 flex-col">
      <div ref={scrollerRef} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-4 sm:px-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-1">
          {hasMore ? (
            <div className="flex justify-center py-2">
              <Button type="button" variant="ghost" size="sm" loading={loadingEarlier} onClick={() => void handleScroll()}>
                Load earlier messages
              </Button>
            </div>
          ) : messages.length ? (
            <p className="m-0 py-2 text-center text-xs text-muted">This is the start of the conversation.</p>
          ) : null}

          {days.map((day) => (
            <section key={day.dateKey} aria-label={formatDaySeparator(day.dateKey)}>
              <div className="flex justify-center py-2">
                <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-ink">{formatDaySeparator(day.dateKey)}</span>
              </div>
              <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
                {day.messages.map((m, i) => {
                  const mine = m.senderId === currentUserId
                  const prev = day.messages[i - 1]
                  const showSender = isGroup && !mine && prev?.senderId !== m.senderId
                  const tail = tails.has(m.id)
                  return (
                    <li key={m.id} className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                      {!mine ? (
                        tail ? (
                          <Avatar name={m.senderName} photo={m.senderPhoto} photoPosition={m.senderPhotoPosition} size="sm" />
                        ) : (
                          <span aria-hidden="true" className="w-9 shrink-0" />
                        )
                      ) : null}
                      <div className={`flex max-w-[86%] flex-col sm:max-w-[72%] ${mine ? 'items-end' : 'items-start'}`}>
                        {showSender ? <span className="mb-0.5 ml-3 text-xs font-semibold text-muted">{m.senderName}</span> : null}
                        <div className="group relative">
                          <div
                            data-message-bubble
                            onContextMenu={(e) => {
                              e.preventDefault()
                              openActions(m)
                            }}
                            onTouchStart={() => {
                              longPress.current = window.setTimeout(() => openActions(m), 500)
                            }}
                            onTouchEnd={() => {
                              if (longPress.current) window.clearTimeout(longPress.current)
                            }}
                            onTouchMove={() => {
                              if (longPress.current) window.clearTimeout(longPress.current)
                            }}
                            className={`chat-bubble rounded-2xl px-4 py-2.5 text-md leading-snug shadow-sm ${
                              m.deletedAt
                                ? 'border border-dashed border-border bg-transparent italic text-muted'
                                : mine
                                  ? `bg-primary-strong text-on-primary ${tail ? 'rounded-br-md' : ''}`
                                  : `bg-surface-2 text-ink ${tail ? 'rounded-bl-md' : ''}`
                            }`}
                          >
                            {m.deletedAt ? (
                              'Message deleted'
                            ) : (
                              <>
                                {m.imageUrl ? (
                                  <button type="button" onClick={() => setPreview(m.imageUrl)} className="mb-1 block overflow-hidden rounded-lg" aria-label="Open photo full size">
                                    <img
                                      src={m.imageUrl}
                                      alt={m.body ? m.body : `Photo from ${m.senderName}`}
                                      width={m.imageWidth ?? undefined}
                                      height={m.imageHeight ?? undefined}
                                      loading="lazy"
                                      className="max-h-72 w-56 object-cover sm:w-72"
                                    />
                                  </button>
                                ) : null}
                                {m.body ? <span className="whitespace-pre-wrap break-words">{m.body}</span> : null}
                              </>
                            )}
                          </div>
                          {!m.deletedAt ? (
                            <button
                              type="button"
                              onClick={() => openActions(m)}
                              aria-label={`Message options for ${mine ? 'your message' : `${m.senderName}'s message`}`}
                              className={`absolute top-1/2 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-bg text-muted shadow-sm group-hover:grid group-focus-within:grid ${mine ? '-left-10' : '-right-10'}`}
                            >
                              ⋯
                            </button>
                          ) : null}
                        </div>
                        <span className={`mt-0.5 flex flex-wrap items-center gap-1 px-1 text-xs text-muted ${mine ? 'justify-end' : ''}`}>
                          {m.reactions.map((r) => (
                            <button
                              key={r.emoji}
                              type="button"
                              onClick={() => setReactorList({ emoji: r.emoji, names: r.names })}
                              aria-label={`${r.count} ${r.emoji} reaction${r.count === 1 ? '' : 's'}, see who`}
                              className={`rounded-full border px-2 py-0.5 ${r.reactedByMe ? 'border-primary-strong bg-surface text-primary-strong' : 'border-border/60 bg-bg text-ink'}`}
                            >
                              {r.emoji} {r.count}
                            </button>
                          ))}
                          {tail || m.editedAt ? (
                            <span>
                              {formatTime(m.createdAt)}
                              {m.editedAt && !m.deletedAt ? ' · edited' : ''}
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {showNewPill ? (
        <button
          type="button"
          onClick={() => {
            scrollToBottom('smooth')
            setShowNewPill(false)
          }}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-on-secondary shadow-md"
        >
          New message
        </button>
      ) : null}

      <Dialog open={Boolean(active)} onClose={() => setActive(null)} title="Message options" size="sm">
        {active ? (
          <div className="flex flex-col gap-4">
            <div>
              <p className="m-0 mb-2 text-sm font-semibold text-heading">React</p>
              <div className="flex flex-wrap gap-2">
                {CHAT_REACTIONS.map((emoji) => {
                  const mineReaction = active.reactions.find((r) => r.emoji === emoji)?.reactedByMe
                  return (
                    <button
                      key={emoji}
                      type="button"
                      aria-label={`React with ${emoji}`}
                      aria-pressed={Boolean(mineReaction)}
                      onClick={async () => {
                        const m = active
                        setActive(null)
                        await onReact(m.id, emoji)
                      }}
                      className={`grid h-11 w-11 place-items-center rounded-full border text-xl ${mineReaction ? 'border-primary-strong bg-surface' : 'border-border/60 bg-bg hover:bg-surface'}`}
                    >
                      {emoji}
                    </button>
                  )
                })}
              </div>
            </div>
            {canEditMessage(active, currentUserId) ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditing(active)
                  setEditText(active.body)
                  setActive(null)
                }}
              >
                Edit message
              </Button>
            ) : null}
            {canDeleteMessage(active, currentUserId, isAdmin) ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setConfirmDelete(active)
                  setActive(null)
                }}
              >
                Delete message
              </Button>
            ) : null}
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit message"
        size="sm"
        footer={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={() => void submitEdit()}>
              Save
            </Button>
          </>
        }
      >
        <label htmlFor="edit-message" className="sr-only">
          Message text
        </label>
        <textarea
          id="edit-message"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void submitEdit()
            }
          }}
          rows={4}
          className="w-full rounded-md border border-border bg-input-bg px-4 py-3 text-ink focus:border-primary-strong"
        />
        {error ? (
          <p role="alert" className="m-0 mt-2 text-sm font-semibold text-error">
            {error}
          </p>
        ) : null}
      </Dialog>

      <Dialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete this message?"
        description="It will show as deleted for everyone in the conversation."
        size="sm"
        footer={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(null)}>
              Keep it
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={async () => {
                if (!confirmDelete) return
                const err = await onDelete(confirmDelete.id)
                if (err) setError(err)
                setConfirmDelete(null)
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        {confirmDelete?.body ? <p className="m-0 rounded-md bg-surface px-3 py-2 text-sm text-muted">{confirmDelete.body}</p> : null}
      </Dialog>

      <Dialog open={Boolean(reactorList)} onClose={() => setReactorList(null)} title={`${reactorList?.emoji ?? ''} Reactions`} size="sm">
        <ul className="m-0 list-none p-0">
          {reactorList?.names.map((n, i) => (
            <li key={`${n}-${i}`} className="border-b border-border/40 py-2 last:border-0">
              {n}
            </li>
          ))}
        </ul>
      </Dialog>

      <Dialog open={Boolean(preview)} onClose={() => setPreview(null)} title="Photo" size="xl">
        {preview ? <img src={preview} alt="Full size photo from the conversation" className="mx-auto max-h-[70dvh] w-auto rounded-lg" /> : null}
      </Dialog>

      {error && !editing ? (
        <p role="alert" className="absolute bottom-3 left-3 right-3 m-0 rounded-md bg-error-surface px-3 py-2 text-sm font-semibold text-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}
